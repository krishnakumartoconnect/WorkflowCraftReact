import { workflows, users, type Workflow, type InsertWorkflow, type User, type InsertUser } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Workflow operations
  getWorkflow(id: number): Promise<Workflow | undefined>;
  getAllWorkflows(): Promise<Workflow[]>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: number, workflow: Partial<InsertWorkflow>): Promise<Workflow | undefined>;
  deleteWorkflow(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private workflows: Map<number, Workflow>;
  private currentUserId: number;
  private currentWorkflowId: number;

  constructor() {
    this.users = new Map();
    this.workflows = new Map();
    this.currentUserId = 1;
    this.currentWorkflowId = 1;
    
    // Initialize with some sample workflows
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample workflows
    const sampleWorkflow1: Workflow = {
      id: this.currentWorkflowId++,
      name: "Customer Onboarding Process",
      description: "Complete customer registration and verification workflow",
      data: {
        nodes: [
          {
            id: "start-1",
            type: "custom",
            position: { x: 100, y: 100 },
            data: {
              label: "Start Process",
              nodeType: "start",
              config: { trigger: "Form Submission" }
            }
          },
          {
            id: "decision-1",
            type: "custom",
            position: { x: 400, y: 80 },
            data: {
              label: "Age Verification",
              nodeType: "decision",
              config: { condition: "age >= 18" }
            }
          },
          {
            id: "end-1",
            type: "custom",
            position: { x: 1040, y: 120 },
            data: {
              label: "Complete",
              nodeType: "end",
              config: { action: "Send welcome email" }
            }
          }
        ],
        edges: [
          {
            id: "e1-2",
            source: "start-1",
            target: "decision-1"
          },
          {
            id: "e2-3",
            source: "decision-1",
            target: "end-1"
          }
        ],
        viewport: { x: 0, y: 0, zoom: 1 }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.workflows.set(1, sampleWorkflow1);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getWorkflow(id: number): Promise<Workflow | undefined> {
    return this.workflows.get(id);
  }

  async getAllWorkflows(): Promise<Workflow[]> {
    return Array.from(this.workflows.values()).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async createWorkflow(workflow: InsertWorkflow): Promise<Workflow> {
    const id = this.currentWorkflowId++;
    const now = new Date();
    const newWorkflow: Workflow = {
      ...workflow,
      id,
      description: workflow.description || null,
      createdAt: now,
      updatedAt: now,
    };
    this.workflows.set(id, newWorkflow);
    return newWorkflow;
  }

  async updateWorkflow(id: number, workflow: Partial<InsertWorkflow>): Promise<Workflow | undefined> {
    const existing = this.workflows.get(id);
    if (!existing) return undefined;

    const updated: Workflow = {
      ...existing,
      ...workflow,
      updatedAt: new Date(),
    };
    this.workflows.set(id, updated);
    return updated;
  }

  async deleteWorkflow(id: number): Promise<boolean> {
    return this.workflows.delete(id);
  }
}

export const storage = new MemStorage();
