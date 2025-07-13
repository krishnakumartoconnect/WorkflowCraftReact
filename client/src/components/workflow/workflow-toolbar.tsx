import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Workflow } from "@shared/schema";
import {
  Download,
  Upload,
  ZoomIn,
  ZoomOut,
  Maximize,
  RotateCcw,
  CheckCircle,
  Play,
} from "lucide-react";

interface WorkflowToolbarProps {
  onExport: () => void;
  onImport: () => void;
  currentWorkflow: Workflow | null;
}

export default function WorkflowToolbar({ 
  onExport, 
  onImport, 
  currentWorkflow 
}: WorkflowToolbarProps) {
  const handleValidateWorkflow = () => {
    // Basic workflow validation logic
    console.log("Validating workflow...");
  };

  const handleRunWorkflow = () => {
    // Workflow execution logic
    console.log("Running workflow...");
  };

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-4">
        {/* File Operations */}
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={onExport}>
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
          <Button variant="ghost" size="sm" onClick={onImport}>
            <Upload className="w-4 h-4 mr-2" />
            Import JSON
          </Button>
          <Separator orientation="vertical" className="h-6" />
        </div>

        {/* Workflow Info */}
        {currentWorkflow && (
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-slate-900">
              {currentWorkflow.name}
            </span>
            {currentWorkflow.description && (
              <span className="text-sm text-slate-500">
                - {currentWorkflow.description}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right Toolbar Actions */}
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" onClick={handleValidateWorkflow}>
          <CheckCircle className="w-4 h-4 mr-2" />
          Validate
        </Button>
        <Button size="sm" onClick={handleRunWorkflow}>
          <Play className="w-4 h-4 mr-2" />
          Run Workflow
        </Button>
      </div>
    </div>
  );
}
