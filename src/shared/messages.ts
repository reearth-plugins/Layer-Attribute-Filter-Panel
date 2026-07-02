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

/** Drives which view the UI renders. */
export type PanelStatus = "no-layer" | "no-config" | "ready";

/** Snapshot of everything the UI needs to render the panel at a point in time. */
export type PanelState = {
  status: PanelStatus;
  /** Resolved display name of the selected layer, if any. */
  layerName?: string;
  /** Filter configuration read from the inspector. Populated from Chunk 2. */
  filters?: FilterConfig[];
};

/** Messages sent from the extension logic → UI. */
export type LogicToUIMessage = {
  action: "panelState";
  payload: PanelState;
};

/** Messages sent from the UI → extension logic. Wired up in later chunks. */
export type UIToLogicMessage =
  | { action: "apply"; payload: { values: Record<string, unknown> } }
  | { action: "reset" };

/**
 * Action used for the initial-render bootstrap message. The UI may not have
 * attached its message listener yet on first paint, so index.html stashes this
 * payload on window for the React app to read once (see main/index.html).
 */
export const INIT_ACTION = "__init__";
