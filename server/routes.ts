import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { insertWorkflowSchema } from "@shared/schema";
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

  const httpServer = createServer(app);
  return httpServer;
}
