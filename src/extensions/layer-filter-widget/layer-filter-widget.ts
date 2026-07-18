import html from "@distui/layer-filter-widget/main/index.html?raw";

import { INIT_ACTION, type PanelState } from "@/shared/messages";
import { GlobalThis } from "@/shared/reearthTypes";

const reearth = (globalThis as unknown as GlobalThis).reearth;

reearth.ui.show(html);

/** Shape of the inspector configuration this widget reads (see reearth.yml). */
type WidgetProperty = {
  layer_settings?: { layer_name?: string };
};

/**
 * Resolve the layer's display name: the inspector's Layer Name overrides,
 * otherwise fall back to the selected layer's own title.
 */
function resolveLayerName(): string | undefined {
  const property = reearth.extension.widget?.property as
    | WidgetProperty
    | undefined;
  return (
    property?.layer_settings?.layer_name || reearth.layers.selected?.layer?.title
  );
}

/** Build the panel snapshot from the current selection. */
function computePanelState(): PanelState {
  if (!reearth.layers.selected) {
    return { status: "no-layer" };
  }
  // Filter configuration is read in Chunk 2; a selected layer is "ready" for now.
  return { status: "ready", layerName: resolveLayerName() };
}

/** Push the latest panel state to the UI. */
function pushPanelState(): void {
  reearth.ui.postMessage({ action: "panelState", payload: computePanelState() });
}

// Rebuild the panel whenever the selected layer changes.
reearth.layers.on("select", () => {
  pushPanelState();
});

// Bootstrap the first render. The UI's message listener may not be attached on
// first paint, so this goes through the __init__ channel that index.html stashes
// on window for the React app to read once.
reearth.ui.postMessage({ action: INIT_ACTION, payload: computePanelState() });
