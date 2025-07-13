import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Workflow } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  X,
  Plus,
  Search,
  Edit,
  Trash2,
  FolderOpen,
  Copy,
  Download,
} from "lucide-react";

interface WorkflowDashboardProps {
  onClose: () => void;
  onWorkflowSelect: (workflowId: number) => void;
}

export default function WorkflowDashboard({ onClose, onWorkflowSelect }: WorkflowDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("lastModified");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ["/api/workflows"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/workflows");
      return await response.json() as Workflow[];
    },
  });

  const deleteWorkflowMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/workflows/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({
        title: "Success",
        description: "Workflow deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete workflow",
        variant: "destructive",
      });
    },
  });

  const filteredWorkflows = workflows.filter(workflow =>
    workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (workflow.description && workflow.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sortedWorkflows = [...filteredWorkflows].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "created":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "lastModified":
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  const handleDeleteWorkflow = (workflow: Workflow) => {
    if (confirm(`Are you sure you want to delete "${workflow.name}"?`)) {
      deleteWorkflowMutation.mutate(workflow.id);
    }
  };

  const handleExportWorkflow = (workflow: Workflow) => {
    const exportData = {
      name: workflow.name,
      description: workflow.description,
      data: workflow.data,
      metadata: {
        exported: new Date().toISOString(),
        version: "1.0",
        originalId: workflow.id,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflow.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: `${workflow.name} exported successfully`,
    });
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const getNodeCount = (workflow: Workflow) => {
    const data = workflow.data as any;
    return data?.nodes?.length || 0;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Workflow Dashboard</DialogTitle>
              <p className="text-sm text-slate-500 mt-1">Manage all your workflows</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Dashboard Actions */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button onClick={() => onWorkflowSelect(0)}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Workflow
              </Button>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search workflows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-500">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lastModified">Last Modified</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="created">Created Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Workflow List */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-lg">Loading workflows...</div>
            </div>
          ) : sortedWorkflows.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <p className="text-lg text-slate-600">No workflows found</p>
                {searchQuery && (
                  <p className="text-sm text-slate-500 mt-1">
                    Try adjusting your search criteria
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedWorkflows.map((workflow) => (
                <Card key={workflow.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{workflow.name}</h3>
                      {workflow.description && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                          {workflow.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onWorkflowSelect(workflow.id)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteWorkflow(workflow)}
                        disabled={deleteWorkflowMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
                    <span>{getNodeCount(workflow)} nodes</span>
                    <span>{formatTimeAgo(workflow.updatedAt)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => onWorkflowSelect(workflow.id)}
                    >
                      <FolderOpen className="w-4 h-4 mr-1" />
                      Open
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportWorkflow(workflow)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
