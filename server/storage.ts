import { workflows, users, jobs, type Workflow, type InsertWorkflow, type User, type InsertUser, type Job, type InsertJob } from "@shared/schema";

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
  
  // Job operations
  getJob(id: number): Promise<Job | undefined>;
  getAllJobs(): Promise<Job[]>;
  getJobsByWorkflow(workflowId: number): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, job: Partial<InsertJob> & { status?: string; lastRunAt?: Date | null }): Promise<Job | undefined>;
  deleteJob(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private workflows: Map<number, Workflow>;
  private jobs: Map<number, Job>;
  private currentUserId: number;
  private currentWorkflowId: number;
  private currentJobId: number;

  constructor() {
    this.users = new Map();
    this.workflows = new Map();
    this.jobs = new Map();
    this.currentUserId = 1;
    this.currentWorkflowId = 1;
    this.currentJobId = 1;
    
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

  // Job operations
  async getJob(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async getAllJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getJobsByWorkflow(workflowId: number): Promise<Job[]> {
    return Array.from(this.jobs.values())
      .filter(job => job.workflowId === workflowId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createJob(job: InsertJob): Promise<Job> {
    const id = this.currentJobId++;
    const now = new Date();
    
    // Calculate next run time based on schedule
    let nextRunAt: Date | null = null;
    const config = job.scheduleConfig as any;
    if (job.scheduleType === 'once' && config?.executeAt) {
      nextRunAt = new Date(config.executeAt);
    } else if (job.scheduleType === 'recurring') {
      nextRunAt = this.calculateNextRun(config);
    }

    const newJob: Job = {
      ...job,
      id,
      status: job.status || 'pending',
      description: job.description || null,
      createdAt: now,
      updatedAt: now,
      lastRunAt: null,
      nextRunAt,
    };
    this.jobs.set(id, newJob);
    return newJob;
  }

  async updateJob(id: number, job: Partial<InsertJob> & { status?: string; lastRunAt?: Date | null }): Promise<Job | undefined> {
    const existing = this.jobs.get(id);
    if (!existing) return undefined;

    const updated: Job = {
      ...existing,
      ...job,
      updatedAt: new Date(),
    };
    this.jobs.set(id, updated);
    return updated;
  }

  async deleteJob(id: number): Promise<boolean> {
    return this.jobs.delete(id);
  }

  private calculateNextRun(config: any): Date {
    const now = new Date();
    const interval = config.interval || 'daily';
    const intervalValue = config.intervalValue || 1;

    switch (interval) {
      case 'hourly':
        return new Date(now.getTime() + intervalValue * 60 * 60 * 1000);
      case 'daily':
        return new Date(now.getTime() + intervalValue * 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + intervalValue * 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + intervalValue);
        return nextMonth;
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default to 1 day
    }
  }
}

export const storage = new MemStorage();
