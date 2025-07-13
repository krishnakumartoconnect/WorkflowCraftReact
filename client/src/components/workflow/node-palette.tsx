import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Workflow } from "@shared/schema";
import {
  Play,
  Settings,
  HelpCircle,
  Cloud,
  Bot,
  UserCheck,
  Users,
  Shield,
  Square,
  Save,
  Plus,
  Menu,
  ExternalLink,
  Edit,
} from "lucide-react";

const nodeTypes = [
  { type: "start", label: "Start", description: "Workflow entry point", icon: Play, color: "bg-green-500" },
  { type: "process", label: "Process", description: "Execute business logic", icon: Settings, color: "bg-blue-500" },
  { type: "decision", label: "Decision", description: "Conditional branching", icon: HelpCircle, color: "bg-yellow-500" },
  { type: "api", label: "API Call", description: "External service integration", icon: Cloud, color: "bg-purple-500" },
  { type: "chatbot", label: "Chatbot ML", description: "AI-powered interaction", icon: Bot, color: "bg-indigo-500" },
  { type: "user-approval", label: "User Approval", description: "Single user decision", icon: UserCheck, color: "bg-orange-500" },
  { type: "group-approval", label: "Group Approval", description: "Multiple user consensus", icon: Users, color: "bg-teal-500" },
  { type: "attribute-approval", label: "Attribute Approval", description: "Attribute-based approval", icon: UserCheck, color: "bg-pink-500" },
  { type: "sod-policy", label: "SOD Policy", description: "Separation of duties", icon: Shield, color: "bg-red-500" },
  { type: "end", label: "End", description: "Workflow termination", icon: Square, color: "bg-gray-500" },
];

interface NodePaletteProps {
  currentWorkflow: Workflow | null;
  isUnsaved: boolean;
  onSave: (name: string, description?: string) => void;
  onOpenDashboard: () => void;
  isSaving: boolean;
}

export default function NodePalette({ 
  currentWorkflow, 
  isUnsaved, 
  onSave, 
  onOpenDashboard,
  isSaving 
}: NodePaletteProps) {
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showNameEditor, setShowNameEditor] = useState(false);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleSave = () => {
    if (currentWorkflow) {
      onSave(currentWorkflow.name, currentWorkflow.description);
    } else {
      setShowSaveDialog(true);
    }
  };

  const handleSaveWithName = () => {
    if (workflowName.trim()) {
      onSave(workflowName.trim(), workflowDescription.trim() || undefined);
      setShowSaveDialog(false);
      setWorkflowName("");
      setWorkflowDescription("");
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-slate-900">Workflow Builder</h1>
          <Button variant="ghost" size="sm">
            <Menu className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Workflow Controls */}
        <div className="flex gap-2 mb-4">
          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogTrigger asChild>
              <Button className="flex-1" disabled={isSaving}>
                <Plus className="w-4 h-4 mr-2" />
                New
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Workflow</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Workflow Name</label>
                  <Input
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    placeholder="Enter workflow name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description (optional)</label>
                  <Textarea
                    value={workflowDescription}
                    onChange={(e) => setWorkflowDescription(e.target.value)}
                    placeholder="Describe your workflow"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveWithName} className="flex-1">
                    Create Workflow
                  </Button>
                  <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>

        {/* Current Workflow */}
        {currentWorkflow && (
          <Card className="bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">
                  {currentWorkflow.name}
                  {isUnsaved && <span className="text-orange-500 ml-2">*</span>}
                </p>
                <p className="text-xs text-slate-500">
                  Modified {formatTimeAgo(currentWorkflow.updatedAt)}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowNameEditor(!showNameEditor)}>
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Node Palette */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Node Types</h3>
        
        <div className="space-y-2">
          {nodeTypes.map((nodeType) => (
            <Card
              key={nodeType.type}
              className="p-3 cursor-grab hover:shadow-md transition-shadow"
              draggable
              onDragStart={(e) => onDragStart(e, nodeType.type)}
            >
              <div className="flex items-center">
                <div className={`w-8 h-8 ${nodeType.color} rounded-full flex items-center justify-center mr-3`}>
                  <nodeType.icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{nodeType.label}</p>
                  <p className="text-xs text-slate-500">{nodeType.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Workflow Management */}
      <div className="border-t border-slate-200 p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-slate-700">Workflows</h3>
          <Button variant="ghost" size="sm" onClick={onOpenDashboard}>
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
        
        <Button variant="outline" className="w-full" onClick={onOpenDashboard}>
          View All Workflows
        </Button>
      </div>
    </div>
  );
}
