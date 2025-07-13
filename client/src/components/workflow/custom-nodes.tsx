import { Handle, Position, NodeProps } from "reactflow";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  Code,
} from "lucide-react";

const nodeIcons = {
  start: Play,
  process: Settings,
  decision: HelpCircle,
  api: Cloud,
  chatbot: Bot,
  "user-approval": UserCheck,
  "group-approval": Users,
  "attribute-approval": UserCheck,
  "sod-policy": Shield,
  end: Square,
};

const nodeColors = {
  start: "border-green-400 bg-green-50",
  process: "border-blue-400 bg-blue-50",
  decision: "border-yellow-400 bg-yellow-50",
  api: "border-purple-400 bg-purple-50",
  chatbot: "border-indigo-400 bg-indigo-50",
  "user-approval": "border-orange-400 bg-orange-50",
  "group-approval": "border-teal-400 bg-teal-50",
  "attribute-approval": "border-pink-400 bg-pink-50",
  "sod-policy": "border-red-400 bg-red-50",
  end: "border-gray-400 bg-gray-50",
};

const nodeIconColors = {
  start: "bg-green-500",
  process: "bg-blue-500",
  decision: "bg-yellow-500",
  api: "bg-purple-500",
  chatbot: "bg-indigo-500",
  "user-approval": "bg-orange-500",
  "group-approval": "bg-teal-500",
  "attribute-approval": "bg-pink-500",
  "sod-policy": "bg-red-500",
  end: "bg-gray-500",
};

interface CustomNodeData {
  label: string;
  nodeType: keyof typeof nodeIcons;
  config?: any;
  sodPolicy?: string;
  onEditSODPolicy?: (node: any) => void;
}

export default function CustomNode({ data, id }: NodeProps<CustomNodeData>) {
  const Icon = nodeIcons[data.nodeType];
  const colorClass = nodeColors[data.nodeType];
  const iconColorClass = nodeIconColors[data.nodeType];

  const isApprovalNode = data.nodeType.includes("approval");
  const isDecisionNode = data.nodeType === "decision";
  const hasMultipleOutputs = isApprovalNode || isDecisionNode;

  return (
    <Card className={`relative w-48 p-4 node-shadow border-2 ${colorClass}`}>
      {/* Input Handle */}
      {data.nodeType !== "start" && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-2 h-2 !bg-blue-500 !border-white !border-2"
        />
      )}

      {/* Node Content */}
      <div className="flex items-center mb-2">
        <div className={`w-8 h-8 ${iconColorClass} rounded-full flex items-center justify-center mr-3`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900 text-sm">{data.label}</h4>
          <p className="text-xs text-slate-500">{getNodeDescription(data.nodeType)}</p>
        </div>
      </div>

      {/* Node Configuration */}
      <div className="text-xs text-slate-600">
        {data.nodeType === "sod-policy" && (
          <div className="space-y-2">
            {data.sodPolicy && (
              <div className="bg-slate-100 p-2 rounded text-xs font-mono max-h-16 overflow-hidden">
                {data.sodPolicy.split('\n').slice(0, 3).join('\n')}
                {data.sodPolicy.split('\n').length > 3 && '...'}
              </div>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs"
              onClick={() => data.onEditSODPolicy?.({ id, data })}
            >
              <Code className="w-3 h-3 mr-1" />
              Edit Policy
            </Button>
          </div>
        )}
        
        {data.nodeType === "decision" && (
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>✓ True</span>
              <span className="text-green-600">Continue</span>
            </div>
            <div className="flex justify-between">
              <span>✗ False</span>
              <span className="text-red-600">Branch</span>
            </div>
          </div>
        )}

        {isApprovalNode && (
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>✓ Approved</span>
              <span className="text-green-600">Continue</span>
            </div>
            <div className="flex justify-between">
              <span>✗ Rejected</span>
              <span className="text-red-600">End</span>
            </div>
          </div>
        )}

        {data.config && Object.keys(data.config).length > 0 && (
          <div className="mt-2 text-xs">
            {Object.entries(data.config).map(([key, value]) => (
              <div key={key} className="truncate">
                {key}: {String(value)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Output Handles */}
      {data.nodeType !== "end" && (
        <>
          {hasMultipleOutputs ? (
            <>
              {/* Success/True output */}
              <Handle
                type="source"
                position={Position.Right}
                id="success"
                style={{ top: "40%" }}
                className="w-2 h-2 !bg-green-500 !border-white !border-2"
              />
              {/* Failure/False output */}
              <Handle
                type="source"
                position={Position.Right}
                id="failure"
                style={{ top: "70%" }}
                className="w-2 h-2 !bg-red-500 !border-white !border-2"
              />
            </>
          ) : (
            <Handle
              type="source"
              position={Position.Right}
              className="w-2 h-2 !bg-blue-500 !border-white !border-2"
            />
          )}
        </>
      )}
    </Card>
  );
}

function getNodeDescription(nodeType: string): string {
  const descriptions: Record<string, string> = {
    start: "Workflow entry point",
    process: "Execute business logic",
    decision: "Conditional branching",
    api: "External service integration",
    chatbot: "AI-powered interaction",
    "user-approval": "Single user decision",
    "group-approval": "Multiple user consensus",
    "attribute-approval": "Attribute-based approval",
    "sod-policy": "Separation of duties",
    end: "Workflow termination",
  };
  return descriptions[nodeType] || "Unknown node type";
}
