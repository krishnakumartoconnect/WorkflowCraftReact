import { useState } from "react";
import { Node } from "reactflow";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Play, Save, X, CheckCircle, XCircle } from "lucide-react";

interface SODPolicyEditorProps {
  node: Node;
  onClose: () => void;
  onSave: (updatedNode: Node) => void;
}

const defaultSODPolicy = `// SOD Policy Validation Function
function validateSOD(user, action, context) {
  // Check if user is in finance department
  if (user.department === 'finance' && action.type === 'approve') {
    // Finance users cannot approve their own requests
    if (action.requestedBy === user.id) {
      return {
        valid: false,
        reason: 'Finance users cannot approve their own requests'
      };
    }
  }

  // Check approval amount limits
  if (action.amount > user.approvalLimit) {
    return {
      valid: false,
      reason: 'Amount exceeds user approval limit'
    };
  }

  return { valid: true };
}`;

const defaultTestUser = `{
  "id": "user123",
  "department": "finance",
  "approvalLimit": 10000,
  "role": "manager"
}`;

const defaultTestAction = `{
  "type": "approve",
  "amount": 5000,
  "requestedBy": "user456"
}`;

export default function SODPolicyEditor({ node, onClose, onSave }: SODPolicyEditorProps) {
  const { toast } = useToast();
  const [code, setCode] = useState(node.data.sodPolicy || defaultSODPolicy);
  const [testUser, setTestUser] = useState(defaultTestUser);
  const [testAction, setTestAction] = useState(defaultTestAction);
  const [testResult, setTestResult] = useState<any>(null);

  const testPolicyMutation = useMutation({
    mutationFn: async (data: { code: string; testUser: any; testAction: any }) => {
      const response = await apiRequest("POST", "/api/workflows/test-sod-policy", data);
      return await response.json();
    },
    onSuccess: (result) => {
      setTestResult(result);
    },
    onError: (error) => {
      toast({
        title: "Test Failed",
        description: "Failed to execute policy code",
        variant: "destructive",
      });
      setTestResult({ success: false, error: "Execution failed" });
    },
  });

  const handleTest = () => {
    try {
      const parsedUser = JSON.parse(testUser);
      const parsedAction = JSON.parse(testAction);
      
      testPolicyMutation.mutate({
        code,
        testUser: parsedUser,
        testAction: parsedAction,
      });
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please check your test data format",
        variant: "destructive",
      });
    }
  };

  const handleSave = () => {
    const updatedNode: Node = {
      ...node,
      data: {
        ...node.data,
        sodPolicy: code,
      },
    };
    onSave(updatedNode);
    toast({
      title: "Success",
      description: "SOD policy saved successfully",
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>SOD Policy Editor</DialogTitle>
              <p className="text-sm text-slate-500 mt-1">Configure separation of duties validation logic</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Code Editor */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-slate-900">Validation Function</h3>
                <div className="flex items-center space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleTest}
                    disabled={testPolicyMutation.isPending}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    {testPolicyMutation.isPending ? "Testing..." : "Test"}
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 p-4">
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-full font-mono text-sm code-editor"
                placeholder="Enter your SOD policy validation code..."
              />
            </div>
          </div>

          {/* Test Panel */}
          <div className="w-80 border-l border-slate-200 flex flex-col">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-medium text-slate-900">Test Configuration</h3>
            </div>
            
            <div className="flex-1 p-4 space-y-4 overflow-auto">
              {/* Test User */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Test User</label>
                <Textarea
                  value={testUser}
                  onChange={(e) => setTestUser(e.target.value)}
                  className="text-sm font-mono"
                  rows={6}
                />
              </div>

              {/* Test Action */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Test Action</label>
                <Textarea
                  value={testAction}
                  onChange={(e) => setTestAction(e.target.value)}
                  className="text-sm font-mono"
                  rows={5}
                />
              </div>

              {/* Test Result */}
              {testResult && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Test Result</label>
                  {testResult.success ? (
                    <Card className={`p-3 ${
                      testResult.result?.valid 
                        ? "bg-green-50 border-green-200" 
                        : "bg-red-50 border-red-200"
                    }`}>
                      <div className={`flex items-center text-sm ${
                        testResult.result?.valid ? "text-green-700" : "text-red-700"
                      }`}>
                        {testResult.result?.valid ? (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-2" />
                        )}
                        <span className="font-medium">
                          {testResult.result?.valid ? "Valid" : "Invalid"}
                        </span>
                      </div>
                      {testResult.result?.reason && (
                        <p className={`text-xs mt-1 ${
                          testResult.result?.valid ? "text-green-600" : "text-red-600"
                        }`}>
                          {testResult.result.reason}
                        </p>
                      )}
                    </Card>
                  ) : (
                    <Card className="p-3 bg-red-50 border-red-200">
                      <div className="flex items-center text-red-700 text-sm">
                        <XCircle className="w-4 h-4 mr-2" />
                        <span className="font-medium">Error</span>
                      </div>
                      <p className="text-xs text-red-600 mt-1">
                        {testResult.error || "Code execution failed"}
                      </p>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
