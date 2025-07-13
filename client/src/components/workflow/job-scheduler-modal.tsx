import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Workflow, JobScheduleConfig } from "@shared/schema";
import { format } from "date-fns";
import {
  CalendarIcon,
  Clock,
  Play,
  Repeat,
  Webhook,
  Timer,
  X,
  CheckCircle,
} from "lucide-react";

interface JobSchedulerModalProps {
  workflow: Workflow;
  onClose: () => void;
}

export default function JobSchedulerModal({ workflow, onClose }: JobSchedulerModalProps) {
  const [jobName, setJobName] = useState(`Execute ${workflow.name}`);
  const [jobDescription, setJobDescription] = useState("");
  const [scheduleType, setScheduleType] = useState<string>("once");
  const [executeDate, setExecuteDate] = useState<Date>();
  const [executeTime, setExecuteTime] = useState("09:00");
  const [interval, setInterval] = useState("daily");
  const [intervalValue, setIntervalValue] = useState(1);
  const [cronExpression, setCronExpression] = useState("0 9 * * 1-5");
  const [eventType, setEventType] = useState("webhook");
  const [maxExecutions, setMaxExecutions] = useState<number>();
  const [endDate, setEndDate] = useState<Date>();

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createJobMutation = useMutation({
    mutationFn: async (jobData: any) => {
      const response = await apiRequest("POST", "/api/jobs", jobData);
      return await response.json();
    },
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Job Created Successfully",
        description: `Job "${job.name}" has been scheduled and will execute according to your configuration.`,
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Failed to Create Job",
        description: "There was an error creating the scheduled job. Please try again.",
        variant: "destructive",
      });
    },
  });

  const executeImmediatelyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/workflows/${workflow.id}/execute`);
      return await response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Workflow Execution Started",
        description: `Workflow "${workflow.name}" is now running. Execution ID: ${result.executionId}`,
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Execution Failed",
        description: "Failed to start workflow execution. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleScheduleJob = () => {
    let scheduleConfig: JobScheduleConfig = {};

    switch (scheduleType) {
      case "once":
        if (executeDate) {
          const [hours, minutes] = executeTime.split(':');
          const executeDateTime = new Date(executeDate);
          executeDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          scheduleConfig.executeAt = executeDateTime.toISOString();
        }
        break;
      case "recurring":
        scheduleConfig.interval = interval as any;
        scheduleConfig.intervalValue = intervalValue;
        if (endDate) {
          scheduleConfig.endDate = endDate.toISOString();
        }
        if (maxExecutions) {
          scheduleConfig.maxExecutions = maxExecutions;
        }
        break;
      case "cron":
        scheduleConfig.cronExpression = cronExpression;
        break;
      case "event":
        scheduleConfig.eventType = eventType as any;
        scheduleConfig.eventConfig = {};
        break;
    }

    const jobData = {
      workflowId: workflow.id,
      name: jobName,
      description: jobDescription || null,
      scheduleType,
      scheduleConfig,
    };

    createJobMutation.mutate(jobData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Schedule Workflow Execution</DialogTitle>
              <p className="text-sm text-slate-500 mt-1">
                Configure when and how "{workflow.name}" should be executed
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Left Column - Job Configuration */}
            <div className="space-y-6">
              <Card className="p-4">
                <h3 className="font-semibold text-slate-900 mb-4">Job Details</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="jobName">Job Name</Label>
                    <Input
                      id="jobName"
                      value={jobName}
                      onChange={(e) => setJobName(e.target.value)}
                      placeholder="Enter job name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="jobDescription">Description (Optional)</Label>
                    <Textarea
                      id="jobDescription"
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Describe what this job does"
                      rows={3}
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold text-slate-900 mb-4">Schedule Type</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={scheduleType === "once" ? "default" : "outline"}
                    onClick={() => setScheduleType("once")}
                    className="h-16 flex flex-col items-center justify-center"
                  >
                    <Play className="w-5 h-5 mb-1" />
                    <span className="text-xs">Run Once</span>
                  </Button>
                  <Button
                    variant={scheduleType === "recurring" ? "default" : "outline"}
                    onClick={() => setScheduleType("recurring")}
                    className="h-16 flex flex-col items-center justify-center"
                  >
                    <Repeat className="w-5 h-5 mb-1" />
                    <span className="text-xs">Recurring</span>
                  </Button>
                  <Button
                    variant={scheduleType === "cron" ? "default" : "outline"}
                    onClick={() => setScheduleType("cron")}
                    className="h-16 flex flex-col items-center justify-center"
                  >
                    <Timer className="w-5 h-5 mb-1" />
                    <span className="text-xs">Cron Schedule</span>
                  </Button>
                  <Button
                    variant={scheduleType === "event" ? "default" : "outline"}
                    onClick={() => setScheduleType("event")}
                    className="h-16 flex flex-col items-center justify-center"
                  >
                    <Webhook className="w-5 h-5 mb-1" />
                    <span className="text-xs">Event Trigger</span>
                  </Button>
                </div>
              </Card>
            </div>

            {/* Right Column - Schedule Configuration */}
            <div className="space-y-6">
              {scheduleType === "once" && (
                <Card className="p-4">
                  <h3 className="font-semibold text-slate-900 mb-4">One-Time Execution</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Execution Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {executeDate ? format(executeDate, "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={executeDate}
                            onSelect={setExecuteDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label htmlFor="executeTime">Execution Time</Label>
                      <Input
                        id="executeTime"
                        type="time"
                        value={executeTime}
                        onChange={(e) => setExecuteTime(e.target.value)}
                      />
                    </div>
                  </div>
                </Card>
              )}

              {scheduleType === "recurring" && (
                <Card className="p-4">
                  <h3 className="font-semibold text-slate-900 mb-4">Recurring Schedule</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Repeat Every</Label>
                        <Input
                          type="number"
                          min="1"
                          value={intervalValue}
                          onChange={(e) => setIntervalValue(parseInt(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Interval</Label>
                        <Select value={interval} onValueChange={setInterval}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hourly">Hour(s)</SelectItem>
                            <SelectItem value="daily">Day(s)</SelectItem>
                            <SelectItem value="weekly">Week(s)</SelectItem>
                            <SelectItem value="monthly">Month(s)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>End Date (Optional)</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP") : "No end date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label htmlFor="maxExecutions">Max Executions (Optional)</Label>
                      <Input
                        id="maxExecutions"
                        type="number"
                        min="1"
                        value={maxExecutions || ""}
                        onChange={(e) => setMaxExecutions(e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="Unlimited"
                      />
                    </div>
                  </div>
                </Card>
              )}

              {scheduleType === "cron" && (
                <Card className="p-4">
                  <h3 className="font-semibold text-slate-900 mb-4">Cron Schedule</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cronExpression">Cron Expression</Label>
                      <Input
                        id="cronExpression"
                        value={cronExpression}
                        onChange={(e) => setCronExpression(e.target.value)}
                        placeholder="0 9 * * 1-5"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Default: Weekdays at 9:00 AM
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded text-sm">
                      <p className="font-medium mb-2">Common Examples:</p>
                      <ul className="space-y-1 text-xs">
                        <li>0 9 * * 1-5 - Weekdays at 9:00 AM</li>
                        <li>0 */2 * * * - Every 2 hours</li>
                        <li>0 0 1 * * - First day of every month</li>
                      </ul>
                    </div>
                  </div>
                </Card>
              )}

              {scheduleType === "event" && (
                <Card className="p-4">
                  <h3 className="font-semibold text-slate-900 mb-4">Event Trigger</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Event Type</Label>
                      <Select value={eventType} onValueChange={setEventType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="webhook">Webhook</SelectItem>
                          <SelectItem value="file_upload">File Upload</SelectItem>
                          <SelectItem value="user_action">User Action</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="bg-blue-50 p-3 rounded text-sm">
                      <p className="text-blue-800">
                        Event-triggered workflows will execute when the specified event occurs.
                        Configuration will be completed after job creation.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => executeImmediatelyMutation.mutate()}
              disabled={executeImmediatelyMutation.isPending}
              className="flex items-center"
            >
              <Play className="w-4 h-4 mr-2" />
              {executeImmediatelyMutation.isPending ? "Executing..." : "Execute Now"}
            </Button>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleScheduleJob}
                disabled={createJobMutation.isPending || !jobName.trim()}
                className="flex items-center"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {createJobMutation.isPending ? "Scheduling..." : "Schedule Job"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}