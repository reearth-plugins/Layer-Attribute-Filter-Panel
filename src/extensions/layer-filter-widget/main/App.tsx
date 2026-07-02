import useLayerFilterPanel from "./hooks";

import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

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

  const controls = panelState.controls ?? [];

  return (
    <Card className="rounded-none border-0 shadow-none">
      <CardHeader className="border-b">
        <CardTitle>Layer Filter</CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        {panelState.status === "no-layer" && (
          <p className="text-sm text-muted-foreground">
            Select a layer to start filtering
          </p>
        )}

        {panelState.status === "no-config" && (
          <p className="text-sm text-muted-foreground">
            No filter properties configured. Go to the inspector to set them up.
          </p>
        )}

        {panelState.status === "ready" && (
          <div className="flex flex-col gap-4">
            <span className="text-sm font-medium">
              {panelState.layerName || "Unnamed layer"}
            </span>

            {controls.map((control) => {
              const value = values[control.propertyName];
              return (
                <div
                  key={control.propertyName}
                  className="flex flex-col gap-1.5"
                >
                  <Label className="text-xs">{control.propertyName}</Label>

                  {control.filterType === "dropdown" && (
                    <select
                      className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                      value={value?.filterType === "dropdown" ? value.value : ""}
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
                  )}

                  {control.filterType === "range" && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        aria-label={`${control.propertyName} minimum`}
                        value={value?.filterType === "range" ? value.min : control.min}
                        onChange={(e) =>
                          setRange(control.propertyName, "min", Number(e.target.value))
                        }
                      />
                      <span className="text-xs text-muted-foreground">to</span>
                      <Input
                        type="number"
                        aria-label={`${control.propertyName} maximum`}
                        value={value?.filterType === "range" ? value.max : control.max}
                        onChange={(e) =>
                          setRange(control.propertyName, "max", Number(e.target.value))
                        }
                      />
                    </div>
                  )}

                  {control.filterType === "text" && (
                    <Input
                      type="text"
                      placeholder="Search…"
                      value={value?.filterType === "text" ? value.value : ""}
                      onChange={(e) =>
                        setText(control.propertyName, e.target.value)
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {panelState.status === "ready" && (
        <CardFooter className="flex gap-2 border-t p-4">
          <Button className="flex-1" onClick={handleApply}>
            Apply Filters
          </Button>
          <Button variant="outline" className="flex-1" onClick={handleReset}>
            Reset
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

export default App;
