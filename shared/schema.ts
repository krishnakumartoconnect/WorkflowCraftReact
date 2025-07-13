import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const workflows = pgTable("workflows", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  data: jsonb("data").notNull(), // React Flow data structure
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Workflow schemas
export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Types
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type Workflow = typeof workflows.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// React Flow specific types
export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    nodeType: 'start' | 'process' | 'decision' | 'api' | 'chatbot' | 'user-approval' | 'group-approval' | 'attribute-approval' | 'sod-policy' | 'end';
    config?: any;
    sodPolicy?: string; // JavaScript code for SOD policy nodes
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
}

export interface WorkflowData {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  viewport?: { x: number; y: number; zoom: number };
}

// Job scheduling schemas
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  scheduleType: text("schedule_type").notNull(), // 'once', 'recurring', 'event', 'cron'
  scheduleConfig: jsonb("schedule_config").notNull(), // Configuration for scheduling
  status: text("status").notNull().default("pending"), // 'pending', 'running', 'completed', 'failed', 'cancelled'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastRunAt: true,
  nextRunAt: true,
});

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

export interface JobScheduleConfig {
  // For 'once' type
  executeAt?: string; // ISO date string
  
  // For 'recurring' type
  interval?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  intervalValue?: number; // e.g., every 2 hours
  
  // For 'event' type
  eventType?: 'webhook' | 'file_upload' | 'user_action';
  eventConfig?: any;
  
  // For 'cron' type
  cronExpression?: string; // e.g., "0 9 * * 1-5"
  
  // Common options
  timezone?: string;
  endDate?: string; // ISO date string
  maxExecutions?: number;
}
