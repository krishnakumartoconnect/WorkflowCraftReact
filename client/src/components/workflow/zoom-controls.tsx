import { useState, useCallback } from "react";
import { useReactFlow } from "reactflow";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  RotateCcw,
} from "lucide-react";

export default function ZoomControls() {
  const { zoomIn, zoomOut, fitView, setViewport } = useReactFlow();
  const [zoomLevel, setZoomLevel] = useState(100);

  const handleZoomIn = useCallback(() => {
    zoomIn({ duration: 200 });
    setZoomLevel(prev => Math.min(prev * 1.2, 1000));
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut({ duration: 200 });
    setZoomLevel(prev => Math.max(prev / 1.2, 10));
  }, [zoomOut]);

  const handleFitView = useCallback(() => {
    fitView({ duration: 200, padding: 0.1 });
    setZoomLevel(100);
  }, [fitView]);

  const handleResetZoom = useCallback(() => {
    setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 200 });
    setZoomLevel(100);
  }, [setViewport]);

  return (
    <Card className="absolute bottom-6 left-6 zoom-controls border border-slate-200 shadow-lg p-2 flex items-center space-x-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleZoomOut}
        disabled={zoomLevel <= 10}
        className="p-2 h-8 w-8"
      >
        <ZoomOut className="w-4 h-4" />
      </Button>
      
      <div className="px-3 py-1 text-sm font-medium text-slate-700 min-w-[60px] text-center">
        {Math.round(zoomLevel)}%
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleZoomIn}
        disabled={zoomLevel >= 1000}
        className="p-2 h-8 w-8"
      >
        <ZoomIn className="w-4 h-4" />
      </Button>
      
      <div className="w-px h-6 bg-slate-200 mx-1" />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleFitView}
        className="p-2 h-8 w-8"
        title="Fit to screen"
      >
        <Maximize className="w-4 h-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleResetZoom}
        className="p-2 h-8 w-8"
        title="Reset zoom"
      >
        <RotateCcw className="w-4 h-4" />
      </Button>
    </Card>
  );
}
