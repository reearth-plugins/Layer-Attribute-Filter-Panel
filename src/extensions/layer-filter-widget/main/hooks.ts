import { useCallback, useEffect, useState } from "react";

import {
  type FilterControl,
  type FilterValue,
  type PanelState,
} from "@/shared/messages";
import { postMsg } from "@/shared/utils";

type ValuesState = Record<string, FilterValue>;

/** Read the bootstrap state that index.html stashed from the __init__ message. */
function readInitialState(): PanelState {
  const data = (
    window as Window & {
      _reearth_plugin_extension_init_data_?: PanelState;
    }
  )._reearth_plugin_extension_init_data_;
  return data ?? { status: "no-layer" };
}

/** Reset control values to their defaults for a given set of controls. */
function defaultValues(controls: FilterControl[] = []): ValuesState {
  const values: ValuesState = {};
  for (const control of controls) {
    if (control.filterType === "dropdown") {
      values[control.propertyName] = { filterType: "dropdown", value: "" };
    } else if (control.filterType === "range") {
      values[control.propertyName] = {
        filterType: "range",
        min: control.min,
        max: control.max,
      };
    } else {
      values[control.propertyName] = { filterType: "text", value: "" };
    }
  }
  return values;
}

export default function useLayerFilterPanel() {
  const [panelState, setPanelState] = useState<PanelState>(readInitialState);
  const [values, setValues] = useState<ValuesState>(() =>
    defaultValues(readInitialState().controls)
  );

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.action === "panelState") {
        const next = e.data.payload as PanelState;
        setPanelState(next);
        // Rebuild control values whenever the controls change (e.g. layer switch).
        setValues(defaultValues(next.controls));
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const setDropdown = useCallback((prop: string, value: string) => {
    setValues((prev) => ({
      ...prev,
      [prop]: { filterType: "dropdown", value },
    }));
  }, []);

  const setRange = useCallback((prop: string, min: number, max: number) => {
    setValues((prev) => ({
      ...prev,
      [prop]: { filterType: "range", min, max },
    }));
  }, []);

  const setText = useCallback((prop: string, value: string) => {
    setValues((prev) => ({ ...prev, [prop]: { filterType: "text", value } }));
  }, []);

  const handleApply = useCallback(() => {
    postMsg("apply", { values });
  }, [values]);

  const handleReset = useCallback(() => {
    setValues(defaultValues(panelState.controls));
    postMsg("reset");
  }, [panelState.controls]);

  return {
    panelState,
    values,
    setDropdown,
    setRange,
    setText,
    handleApply,
    handleReset,
  };
}
