import { useState, useCallback, useRef } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Workflow, WorkflowData } from "@shared/schema";
import WorkflowCanvas from "@/components/workflow/workflow-canvas";
import NodePalette from "@/components/workflow/node-palette";
import WorkflowToolbar from "@/components/workflow/workflow-toolbar";
import SODPolicyEditor from "@/components/workflow/sod-policy-editor";
import WorkflowDashboard from "@/components/workflow/workflow-dashboard";
import { useToast } from "@/hooks/use-toast";
import { Node, Edge, ReactFlowProvider } from "reactflow";

export default function WorkflowEditor() {
  const { id } = useParams<{ id?: string }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showSODEditor, setShowSODEditor] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
  const [isUnsaved, setIsUnsaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load workflow if ID is provided
  const { data: workflow, isLoading } = useQuery({
    queryKey: ["/api/workflows", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiRequest("GET", `/api/workflows/${id}`);
      return await response.json() as Workflow;
    },
    enabled: !!id,
  });

  // Load workflow data when fetched
  useState(() => {
    if (workflow) {
      const workflowData = workflow.data as WorkflowData;
      setNodes(workflowData.nodes || []);
      setEdges(workflowData.edges || []);
      setCurrentWorkflow(workflow);
      setIsUnsaved(false);
    }
  }, [workflow]);

  // Save workflow mutation
  const saveWorkflowMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; data: WorkflowData }) => {
      if (currentWorkflow?.id) {
        const response = await apiRequest("PUT", `/api/workflows/${currentWorkflow.id}`, data);
        return await response.json() as Workflow;
      } else {
        const response = await apiRequest("POST", "/api/workflows", data);
        return await response.json() as Workflow;
      }
    },
    onSuccess: (savedWorkflow) => {
      setCurrentWorkflow(savedWorkflow);
      setIsUnsaved(false);
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({
        title: "Success",
        description: "Workflow saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save workflow",
        variant: "destructive",
      });
    },
  });

  const handleNodesChange = useCallback((newNodes: Node[]) => {
    setNodes(newNodes);
    setIsUnsaved(true);
  }, []);

  const handleEdgesChange = useCallback((newEdges: Edge[]) => {
    setEdges(newEdges);
    setIsUnsaved(true);
  }, []);

  const handleSaveWorkflow = useCallback((name: string, description?: string) => {
    const workflowData: WorkflowData = {
      nodes,
      edges,
      viewport: { x: 0, y: 0, zoom: 1 }
    };

    saveWorkflowMutation.mutate({
      name,
      description,
      data: workflowData,
    });
  }, [nodes, edges, saveWorkflowMutation]);

  const handleExportWorkflow = useCallback(() => {
    const workflowData = {
      name: currentWorkflow?.name || "Untitled Workflow",
      description: currentWorkflow?.description,
      data: { nodes, edges },
      metadata: {
        exported: new Date().toISOString(),
        version: "1.0"
      }
    };

    const blob = new Blob([JSON.stringify(workflowData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowData.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Workflow exported successfully",
    });
  }, [currentWorkflow, nodes, edges, toast]);

  const handleImportWorkflow = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        
        if (imported.data && imported.data.nodes && imported.data.edges) {
          setNodes(imported.data.nodes);
          setEdges(imported.data.edges);
          setCurrentWorkflow(null);
          setIsUnsaved(true);
          
          toast({
            title: "Success",
            description: "Workflow imported successfully",
          });
        } else {
          throw new Error("Invalid workflow format");
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Invalid workflow file format",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  }, [toast]);

  const handleEditSODPolicy = useCallback((node: Node) => {
    setSelectedNode(node);
    setShowSODEditor(true);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading workflow...</div>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <div className="flex h-screen bg-slate-50">
        {/* Left Sidebar */}
        <div className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-sm">
          <NodePalette
            currentWorkflow={currentWorkflow}
            isUnsaved={isUnsaved}
            onSave={handleSaveWorkflow}
            onOpenDashboard={() => setShowDashboard(true)}
            isSaving={saveWorkflowMutation.isPending}
          />
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col relative">
          <WorkflowToolbar
            onExport={handleExportWorkflow}
            onImport={() => fileInputRef.current?.click()}
            currentWorkflow={currentWorkflow}
          />
          
          <WorkflowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onEditSODPolicy={handleEditSODPolicy}
          />
        </div>

        {/* Hidden file input for import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImportWorkflow}
        />

        {/* SOD Policy Editor Modal */}
        {showSODEditor && selectedNode && (
          <SODPolicyEditor
            node={selectedNode}
            onClose={() => setShowSODEditor(false)}
            onSave={(updatedNode) => {
              setNodes(prev => prev.map(n => n.id === updatedNode.id ? updatedNode : n));
              setShowSODEditor(false);
              setIsUnsaved(true);
            }}
          />
        )}

        {/* Workflow Dashboard Modal */}
        {showDashboard && (
          <WorkflowDashboard
            onClose={() => setShowDashboard(false)}
            onWorkflowSelect={(workflowId) => {
              setShowDashboard(false);
              window.location.href = `/workflow/${workflowId}`;
            }}
          />
        )}
      </div>
    </ReactFlowProvider>
  );
}
