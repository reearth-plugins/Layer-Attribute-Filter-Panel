import html from "@distui/layer-filter-widget/main/index.html?raw";

import {
  INIT_ACTION,
  type FilterConfig,
  type FilterControl,
  type FilterType,
  type FilterValue,
  type PanelState,
} from "@/shared/messages";
import { GlobalThis } from "@/shared/reearthTypes";

const reearth = (globalThis as unknown as GlobalThis).reearth;

reearth.ui.show(html, { width: 300 });

/** Shape of the inspector configuration this widget reads (see reearth.yml). */
type WidgetProperty = {
  layer_settings?: { layer_name?: string };
  filters?: { property_name?: string; filter_type?: string }[];
};

/** Minimal shape of a ComputedFeature we rely on (core types are opaque). */
type ComputedFeatureLike = { id?: string; properties?: Record<string, unknown> };

const FILTER_TYPES: FilterType[] = ["dropdown", "range", "text"];

/** The layer that currently has a filter override applied, if any. */
let activeFilterLayerId: string | undefined;

function widgetProperty(): WidgetProperty | undefined {
  return reearth.extension.widget?.property as WidgetProperty | undefined;
}

/**
 * Resolve the layer's display name: the inspector's Layer Name overrides,
 * otherwise fall back to the selected layer's own title.
 */
function resolveLayerName(): string | undefined {
  return (
    widgetProperty()?.layer_settings?.layer_name ||
    reearth.layers.selected?.layer?.title
  );
}

/** Parse the repeatable filters list from the inspector into typed configs. */
function parseFilterConfigs(): FilterConfig[] {
  const raw = widgetProperty()?.filters ?? [];
  const configs: FilterConfig[] = [];
  for (const entry of raw) {
    const propertyName = entry?.property_name?.trim();
    const filterType = entry?.filter_type;
    if (
      propertyName &&
      filterType &&
      FILTER_TYPES.includes(filterType as FilterType)
    ) {
      configs.push({ propertyName, filterType: filterType as FilterType });
    }
  }
  return configs;
}

function selectedFeatures(): ComputedFeatureLike[] {
  return (reearth.layers.selected?.features ?? []) as ComputedFeatureLike[];
}

function selectedLayerId(): string | undefined {
  return reearth.layers.selected?.id as string | undefined;
}

/** Collect the non-empty values of one property across all features. */
function valuesFor(propertyName: string): unknown[] {
  const out: unknown[] = [];
  for (const feature of selectedFeatures()) {
    const value = feature.properties?.[propertyName];
    if (value !== undefined && value !== null && value !== "") out.push(value);
  }
  return out;
}

/** Build a UI control descriptor, deriving options/range from the layer data. */
function buildControl(config: FilterConfig): FilterControl {
  if (config.filterType === "dropdown") {
    const options = Array.from(
      new Set(valuesFor(config.propertyName).map((v) => String(v)))
    ).sort();
    return { propertyName: config.propertyName, filterType: "dropdown", options };
  }
  if (config.filterType === "range") {
    const nums = valuesFor(config.propertyName)
      .map((v) => Number(v))
      .filter((n) => !Number.isNaN(n));
    // reduce instead of Math.min(...nums)/Math.max(...nums): spreading a very
    // large feature array can exceed the JS argument limit and throw.
    const min = nums.length ? nums.reduce((a, b) => (b < a ? b : a), Infinity) : 0;
    const max = nums.length
      ? nums.reduce((a, b) => (b > a ? b : a), -Infinity)
      : 0;
    return { propertyName: config.propertyName, filterType: "range", min, max };
  }
  return { propertyName: config.propertyName, filterType: "text" };
}

/** Build the panel snapshot from the current selection + inspector config. */
function computePanelState(): PanelState {
  if (!reearth.layers.selected) return { status: "no-layer" };
  const configs = parseFilterConfigs();
  if (configs.length === 0) {
    return { status: "no-config", layerName: resolveLayerName() };
  }
  return {
    status: "ready",
    layerName: resolveLayerName(),
    controls: configs.map(buildControl),
  };
}

function pushPanelState(): void {
  reearth.ui.postMessage({ action: "panelState", payload: computePanelState() });
}

// ----- Filtering -----------------------------------------------------------
// Non-matching features are hidden with a Re:Earth styling "show" expression.
// The predicate references feature properties as ${propertyName}; a missing
// value evaluates falsy, so such features are hidden (matches the ticket).
// NOTE: the exact expression operators (esp. text =~ regex) are validated
// in-editor against real data — the builder below is isolated for easy tweaks.

function propRef(name: string): string {
  return "${" + name + "}";
}

/** Combine the active filter values into a single boolean show-expression. */
function buildPredicate(values: Record<string, FilterValue>): string {
  const predicates: string[] = [];
  for (const [prop, value] of Object.entries(values)) {
    if (value.filterType === "dropdown" && value.value) {
      predicates.push(`${propRef(prop)} === ${JSON.stringify(value.value)}`);
    } else if (value.filterType === "range") {
      predicates.push(
        `${propRef(prop)} >= ${value.min} && ${propRef(prop)} <= ${value.max}`
      );
    } else if (value.filterType === "text" && value.value) {
      // Visualizer's expression evaluator doesn't handle the =~ regex operator
      // reliably, so do the substring match in JS: find the property values that
      // contain the query and OR them together with === (which is supported).
      const query = value.value.toLowerCase();
      const matches = Array.from(
        new Set(valuesFor(prop).map((v) => String(v)))
      ).filter((v) => v.toLowerCase().includes(query));
      predicates.push(
        matches.length
          ? `(${matches
              .map((m) => `${propRef(prop)} === ${JSON.stringify(m)}`)
              .join(" || ")})`
          : "false"
      );
    }
  }
  return predicates.join(" && ");
}

/**
 * Restore a layer to full visibility. We explicitly force show=true on every
 * appearance type rather than passing null to override(), because a null
 * override does not reliably cancel a previously applied show-expression.
 */
function restoreLayerVisibility(layerId: string | undefined): void {
  if (!layerId) return;
  try {
    reearth.layers.override?.(layerId, {
      marker: { show: true },
      polygon: { show: true },
      polyline: { show: true },
      model: { show: true },
    });
  } catch (error) {
    console.error("Failed to restore layer visibility:", error);
  }
}

function applyFilters(values: Record<string, FilterValue>): void {
  const layerId = selectedLayerId();
  if (!layerId) return;
  const predicate = buildPredicate(values);
  try {
    if (!predicate) {
      restoreLayerVisibility(layerId);
      activeFilterLayerId = undefined;
      return;
    }
    const conditions: [string, string][] = [
      [predicate, "true"],
      ["true", "false"],
    ];
    const show = { expression: { conditions } };
    // Apply to all common appearance types so the widget is geometry-agnostic.
    reearth.layers.override?.(layerId, {
      marker: { show },
      polygon: { show },
      polyline: { show },
      model: { show },
    });
    activeFilterLayerId = layerId;
  } catch (error) {
    // Overriding can fail (e.g. unsupported appearance); log it and leave the
    // layer unchanged rather than crash the map (per the ticket).
    console.error("Failed to apply layer filter:", error);
  }
}

function resetFilters(): void {
  restoreLayerVisibility(selectedLayerId());
  activeFilterLayerId = undefined;
}

// Handle Apply / Reset coming from the UI.
function handleUIMessage(message: unknown): void {
  const msg = message as {
    action?: string;
    payload?: { values?: Record<string, FilterValue> };
  };
  if (msg?.action === "apply") applyFilters(msg.payload?.values ?? {});
  else if (msg?.action === "reset") resetFilters();
}

// When the selection changes to a different layer, reset everything: clear the
// previously filtered layer's override and rebuild the panel for the new layer.
function handleLayerSelect(): void {
  if (activeFilterLayerId && activeFilterLayerId !== selectedLayerId()) {
    restoreLayerVisibility(activeFilterLayerId);
    activeFilterLayerId = undefined;
  }
  pushPanelState();
}

// Guard startup so a failure here never takes down the map or sibling plugins.
try {
  reearth.extension.on("message", handleUIMessage);
  reearth.layers.on("select", handleLayerSelect);
  // Bootstrap the first render via the __init__ channel (see index.html).
  reearth.ui.postMessage({ action: INIT_ACTION, payload: computePanelState() });
} catch (error) {
  console.error("Layer filter plugin failed to start:", error);
}
