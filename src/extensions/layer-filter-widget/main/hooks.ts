import { useEffect, useState } from "react";

import { type PanelState } from "@/shared/messages";

/** Read the bootstrap state that index.html stashed from the __init__ message. */
function readInitialState(): PanelState {
  const data = (
    window as Window & {
      _reearth_plugin_extension_init_data_?: PanelState;
    }
  )._reearth_plugin_extension_init_data_;
  return data ?? { status: "no-layer" };
}

export default function useLayerFilterPanel() {
  const [panelState, setPanelState] = useState<PanelState>(readInitialState);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.action === "panelState") {
        setPanelState(e.data.payload as PanelState);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return { panelState };
}
