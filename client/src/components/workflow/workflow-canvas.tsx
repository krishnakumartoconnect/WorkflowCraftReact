import { useCallback, useState } from "react";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Connection,
  NodeDragHandler,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
} from "reactflow";
import "reactflow/dist/style.css";

import CustomNode from "./custom-nodes";
import ZoomControls from "./zoom-controls";

const nodeTypes = {
  custom: CustomNode,
};

interface WorkflowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  onEditSODPolicy: (node: Node) => void;
}

export default function WorkflowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onEditSODPolicy,
}: WorkflowCanvasProps) {
  const [reactFlowNodes, setReactFlowNodes, onNodesChangeInternal] = useNodesState(nodes);
  const [reactFlowEdges, setReactFlowEdges, onEdgesChangeInternal] = useEdgesState(edges);

  // Update parent when internal state changes
  const handleNodesChange: OnNodesChange = useCallback((changes) => {
    onNodesChangeInternal(changes);
    // Update parent with new nodes after state change
    setImmediate(() => {
      setReactFlowNodes(current => {
        onNodesChange(current);
        return current;
      });
    });
  }, [onNodesChangeInternal, onNodesChange]);

  const handleEdgesChange: OnEdgesChange = useCallback((changes) => {
    onEdgesChangeInternal(changes);
    // Update parent with new edges after state change
    setImmediate(() => {
      setReactFlowEdges(current => {
        onEdgesChange(current);
        return current;
      });
    });
  }, [onEdgesChangeInternal, onEdgesChange]);

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      const newEdge = {
        ...connection,
        id: `${connection.source}-${connection.target}`,
        type: "smoothstep",
      } as Edge;
      
      setReactFlowEdges(edges => {
        const updated = addEdge(newEdge, edges);
        onEdgesChange(updated);
        return updated;
      });
    },
    [setReactFlowEdges, onEdgesChange]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const nodeType = event.dataTransfer.getData('application/reactflow');
      if (!nodeType) return;

      const position = {
        x: event.clientX - 200,
        y: event.clientY - 100,
      };

      const newNode: Node = {
        id: `${nodeType}-${Date.now()}`,
        type: 'custom',
        position,
        data: {
          label: getNodeLabel(nodeType),
          nodeType: nodeType as any,
          onEditSODPolicy,
        },
      };

      setReactFlowNodes(nodes => {
        const updated = [...nodes, newNode];
        onNodesChange(updated);
        return updated;
      });
    },
    [setReactFlowNodes, onNodesChange, onEditSODPolicy]
  );

  // Update nodes when props change
  useState(() => {
    setReactFlowNodes(nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onEditSODPolicy,
      },
    })));
  }, [nodes, onEditSODPolicy]);

  // Update edges when props change
  useState(() => {
    setReactFlowEdges(edges);
  }, [edges]);

  return (
    <div className="flex-1 relative workflow-canvas">
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={10}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Controls showInteractive={false} />
        <Background color="#e2e8f0" gap={20} />
      </ReactFlow>
      
      <ZoomControls />
    </div>
  );
}

function getNodeLabel(nodeType: string): string {
  const labels: Record<string, string> = {
    start: "Start Process",
    process: "Process Step",
    decision: "Decision Point",
    api: "API Call",
    chatbot: "Chatbot ML",
    "user-approval": "User Approval",
    "group-approval": "Group Approval", 
    "attribute-approval": "Attribute Approval",
    "sod-policy": "SOD Policy",
    end: "End Process",
  };
  return labels[nodeType] || "Unknown Node";
}
