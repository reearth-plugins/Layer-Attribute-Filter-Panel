// Typed message contract between the extension logic (runs in the QuickJS
// sandbox) and the UI iframe (React). Both sides import these types so the
// postMessage protocol cannot silently drift out of sync — this is the single
// source of truth for what crosses the bridge.

export type FilterType = "dropdown" | "range" | "text";

/** One filter entry as configured by the user in the Visualizer inspector. */
export type FilterConfig = {
  propertyName: string;
  filterType: FilterType;
};

/**
 * A control descriptor sent to the UI. Carries the data derived from the
 * selected layer's features (dropdown options, numeric range) so the UI can
 * render the right control without touching the reearth API itself.
 */
export type FilterControl =
  | { propertyName: string; filterType: "dropdown"; options: string[] }
  | { propertyName: string; filterType: "range"; min: number; max: number }
  | { propertyName: string; filterType: "text" };

/** Drives which view the UI renders. */
export type PanelStatus = "no-layer" | "no-config" | "ready";

/** Snapshot of everything the UI needs to render the panel at a point in time. */
export type PanelState = {
  status: PanelStatus;
  /** Resolved display name of the selected layer, if any. */
  layerName?: string;
  /** Controls to render, derived from the inspector config + layer features. */
  controls?: FilterControl[];
};

/**
 * The active value of a single control, sent from the UI on Apply. An empty
 * dropdown/text value means "no constraint" for that property.
 */
export type FilterValue =
  | { filterType: "dropdown"; value: string }
  | { filterType: "range"; min: number; max: number }
  | { filterType: "text"; value: string };

/** Messages sent from the extension logic → UI. */
export type LogicToUIMessage = {
  action: "panelState";
  payload: PanelState;
};

/** Messages sent from the UI → extension logic. */
export type UIToLogicMessage =
  | { action: "apply"; payload: { values: Record<string, FilterValue> } }
  | { action: "reset" };

/**
 * Action used for the initial-render bootstrap message. The UI may not have
 * attached its message listener yet on first paint, so index.html stashes this
 * payload on window for the React app to read once (see main/index.html).
 */
export const INIT_ACTION = "__init__";
