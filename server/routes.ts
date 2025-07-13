import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { insertWorkflowSchema, insertJobSchema } from "@shared/schema";
import vm from "vm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all workflows
  app.get("/api/workflows", async (req, res) => {
    try {
      const workflows = await storage.getAllWorkflows();
      res.json(workflows);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workflows" });
    }
  });

  // Get workflow by ID
  app.get("/api/workflows/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const workflow = await storage.getWorkflow(id);
      
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workflow" });
    }
  });

  // Create new workflow
  app.post("/api/workflows", async (req, res) => {
    try {
      const workflowData = insertWorkflowSchema.parse(req.body);
      const workflow = await storage.createWorkflow(workflowData);
      res.status(201).json(workflow);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid workflow data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create workflow" });
    }
  });

  // Update workflow
  app.put("/api/workflows/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const workflowData = insertWorkflowSchema.partial().parse(req.body);
      
      const workflow = await storage.updateWorkflow(id, workflowData);
      
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      res.json(workflow);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid workflow data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update workflow" });
    }
  });

  // Delete workflow
  app.delete("/api/workflows/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteWorkflow(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      res.json({ message: "Workflow deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete workflow" });
    }
  });

  // Test SOD policy
  app.post("/api/workflows/test-sod-policy", async (req, res) => {
    try {
      const { code, testUser, testAction, testContext } = req.body;
      
      if (!code || !testUser || !testAction) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Create a secure sandbox for code execution
      const sandbox = {
        user: testUser,
        action: testAction,
        context: testContext || {},
        result: null
      };

      const script = new vm.Script(`
        try {
          ${code}
          result = validateSOD(user, action, context);
        } catch (error) {
          result = { valid: false, reason: error.message };
        }
      `);

      const context = vm.createContext(sandbox);
      script.runInContext(context, { timeout: 5000 });

      res.json({
        success: true,
        result: sandbox.result
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Code execution failed" 
      });
    }
  });

  // Job Management APIs
  
  // Get all jobs
  app.get("/api/jobs", async (req, res) => {
    try {
      const jobs = await storage.getAllJobs();
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  // Get jobs by workflow
  app.get("/api/workflows/:workflowId/jobs", async (req, res) => {
    try {
      const workflowId = parseInt(req.params.workflowId);
      const jobs = await storage.getJobsByWorkflow(workflowId);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workflow jobs" });
    }
  });

  // Get job by ID
  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const job = await storage.getJob(id);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  // Create new job (Run Workflow)
  app.post("/api/jobs", async (req, res) => {
    try {
      const jobData = insertJobSchema.parse(req.body);
      const job = await storage.createJob(jobData);
      
      // Simulate job execution for demo purposes
      setTimeout(async () => {
        await storage.updateJob(job.id, { 
          status: 'running',
          lastRunAt: new Date()
        });
        
        // Simulate completion after 2 seconds
        setTimeout(async () => {
          await storage.updateJob(job.id, { 
            status: 'completed'
          });
        }, 2000);
      }, 1000);
      
      res.status(201).json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid job data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create job" });
    }
  });

  // Update job
  app.put("/api/jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const jobData = insertJobSchema.partial().parse(req.body);
      
      const job = await storage.updateJob(id, jobData);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      res.json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid job data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  // Delete job
  app.delete("/api/jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteJob(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      res.json({ message: "Job deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // Execute workflow immediately (one-time run)
  app.post("/api/workflows/:id/execute", async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      const workflow = await storage.getWorkflow(workflowId);
      
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }

      // Create a one-time job for immediate execution
      const job = await storage.createJob({
        workflowId,
        name: `Immediate execution - ${workflow.name}`,
        description: "One-time immediate workflow execution",
        scheduleType: 'once',
        scheduleConfig: { executeAt: new Date().toISOString() },
        status: 'running'
      });

      // Simulate workflow execution
      setTimeout(async () => {
        await storage.updateJob(job.id, { 
          status: 'completed',
          lastRunAt: new Date()
        });
      }, 3000);

      res.json({
        message: "Workflow execution started",
        job,
        executionId: job.id
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to execute workflow" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
