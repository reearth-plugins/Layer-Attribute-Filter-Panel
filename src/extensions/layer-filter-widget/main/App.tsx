import useHooks from "./hooks";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

function App() {
  const { panelState } = useHooks();

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
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium">
              {panelState.layerName || "Unnamed layer"}
            </span>
            {/* Filter controls are added in Chunk 2. */}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default App;
