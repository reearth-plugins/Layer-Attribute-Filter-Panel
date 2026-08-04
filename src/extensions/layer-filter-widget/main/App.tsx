import { ChevronDown, Filter, FilterX, Layers, Search } from "lucide-react";
import { type ReactNode } from "react";

import useLayerFilterPanel from "./hooks";

import { Slider } from "@/shared/components/ui/slider";

const FIELD = "bg-[#1c1f26] border border-[#3a3f4e] border-solid rounded-[6px]";
const LABEL = "text-[11px] italic text-[#6b7280]";
const DIVIDER = "h-px w-full bg-[#3a3f4e]";

/** Round to at most two decimals for display. */
function fmt(n: number): string {
  return Number.isFinite(n) ? String(Math.round(n * 100) / 100) : "0";
}

/** Pick a slider step that stays whole for large integer ranges. */
function rangeStep(min: number, max: number): number {
  const span = max - min;
  if (span <= 0) return 1;
  return span > 50 ? 1 : span / 100;
}

function EmptyState({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <>
      <div className={DIVIDER} />
      <div className="flex flex-col items-center gap-3 px-2 py-8 text-center">
        <div className="text-[#6b7280]">{icon}</div>
        <p className="text-[11px] text-[#6b7280]">{text}</p>
      </div>
    </>
  );
}

function App() {
  const {
    panelState,
    values,
    setDropdown,
    setRange,
    setText,
    handleApply,
    handleReset,
  } = useLayerFilterPanel();
  const { status, layerName, controls = [] } = panelState;

  return (
    <div className="w-full rounded-[8px] border border-solid border-[#3a3f4e] bg-[#1c1f26] p-2 text-white">
      <div className="flex flex-col gap-3.5 rounded-[8px] bg-[#252a35] p-3">
        {/* Header */}
        <div className="flex items-center gap-1.5">
          <Filter className="size-4 text-[#3b82f6]" />
          <span className="text-xs font-semibold">Layer Filter</span>
        </div>

        {status === "no-layer" && (
          <EmptyState
            icon={<Layers className="size-5" />}
            text="Select a layer to start filtering"
          />
        )}

        {status === "no-config" && (
          <EmptyState
            icon={<FilterX className="size-5" />}
            text="No filter properties configured. Go to the inspector to set them up."
          />
        )}

        {status === "ready" && (
          <>
            <div className={DIVIDER} />

            {/* Selected layer */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#6b7280]">Layer:</span>
              <span className="rounded-[6px] bg-[#1c1f26] px-1.5 py-0.5 text-xs italic text-[#6b7280]">
                {layerName || "Unnamed layer"}
              </span>
            </div>

            {/* Filter controls */}
            <div className="flex flex-col gap-4">
              {controls.map((control) => {
                const value = values[control.propertyName];
                return (
                  <div
                    key={control.propertyName}
                    className="flex flex-col gap-2"
                  >
                    <span className={LABEL}>{control.propertyName}</span>

                    {control.filterType === "dropdown" && (
                      <div className={`relative ${FIELD}`}>
                        <select
                          className="w-full appearance-none bg-transparent px-[18px] py-2 pr-8 text-[10px] italic text-[#6b7280] outline-none"
                          value={
                            value?.filterType === "dropdown" ? value.value : ""
                          }
                          onChange={(e) =>
                            setDropdown(control.propertyName, e.target.value)
                          }
                        >
                          <option value="">All</option>
                          {control.options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3 -translate-y-1/2 text-[#6b7280]" />
                      </div>
                    )}

                    {control.filterType === "range" && (
                      <div className="flex flex-col gap-2 pt-1">
                        <Slider
                          min={control.min}
                          max={control.max}
                          step={rangeStep(control.min, control.max)}
                          value={
                            value?.filterType === "range"
                              ? [value.min, value.max]
                              : [control.min, control.max]
                          }
                          onValueChange={(vals) =>
                            setRange(control.propertyName, vals[0], vals[1])
                          }
                        />
                        <div className="flex justify-between text-[10px] italic text-[#6b7280]">
                          <span>
                            {fmt(
                              value?.filterType === "range"
                                ? value.min
                                : control.min
                            )}
                          </span>
                          <span>
                            {fmt(
                              value?.filterType === "range"
                                ? value.max
                                : control.max
                            )}
                          </span>
                        </div>
                      </div>
                    )}

                    {control.filterType === "text" && (
                      <div className={`flex h-8 items-center gap-1 px-[11px] ${FIELD}`}>
                        <Search className="size-3 shrink-0 text-[#6b7280]" />
                        <input
                          className="w-full bg-transparent text-[10px] text-white outline-none placeholder:text-[#6b7280]"
                          placeholder="Search..."
                          value={value?.filterType === "text" ? value.value : ""}
                          onChange={(e) =>
                            setText(control.propertyName, e.target.value)
                          }
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className={DIVIDER} />
            <div className="flex flex-col gap-3.5">
              <button
                type="button"
                onClick={handleApply}
                className="h-9 w-full rounded-[8px] border border-solid border-[#3a3f4e] bg-[#3b82f6] text-xs text-white transition-colors hover:bg-[#3b82f6]/90"
              >
                Apply Filters
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="h-9 w-full rounded-[8px] border border-solid border-[#3a3f4e] bg-[#1c1f26] text-xs text-[#f87171] transition-colors hover:bg-[#1c1f26]/70"
              >
                Reset All Filters
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
