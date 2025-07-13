# replit.md

## Overview

This is a full-stack workflow automation application built with React, Express, and Drizzle ORM. The application provides a visual workflow builder where users can create, edit, and manage business process workflows using a drag-and-drop interface. It features various node types including approval processes, API integrations, decision points, and custom SOD (Separation of Duties) policy validation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern full-stack architecture with clear separation between frontend and backend concerns:

### Frontend Architecture
- **React 18** with TypeScript for the user interface
- **React Flow** for the visual workflow canvas and node management
- **TanStack Query** for server state management and API communication
- **Wouter** for client-side routing
- **Tailwind CSS** with **shadcn/ui** components for styling
- **Vite** as the build tool and development server

### Backend Architecture
- **Express.js** server with TypeScript
- **RESTful API** design for workflow CRUD operations
- **Drizzle ORM** for database operations with PostgreSQL
- **In-memory storage** fallback for development (MemStorage class)
- **Node.js VM** for executing custom SOD policy JavaScript code

## Key Components

### Workflow Management
- **Visual Editor**: Drag-and-drop interface for building workflows
- **Node Types**: Support for 10 different node types (start, process, decision, API, chatbot, various approval types, SOD policy, end)
- **Custom Nodes**: Configurable workflow nodes with specific business logic
- **Connection System**: Visual flow connections between nodes

### Data Storage
- **PostgreSQL** database with Drizzle ORM
- **Workflow Schema**: Stores workflow metadata and JSON structure
- **User Schema**: Basic user management (currently minimal)
- **Memory Storage**: Development fallback with sample data

### API Layer
- **Workflow CRUD**: Full create, read, update, delete operations
- **Policy Execution**: JavaScript code execution for SOD policies
- **Validation**: Zod schema validation for data integrity

### UI Components
- **Modular Design**: Reusable shadcn/ui components
- **Responsive Layout**: Mobile-friendly interface
- **Theming**: CSS variables with dark mode support
- **Toast Notifications**: User feedback system

## Data Flow

1. **Workflow Creation**: Users drag nodes from palette onto canvas
2. **Configuration**: Each node can be configured with specific parameters
3. **Connections**: Visual edges connect nodes to define workflow flow
4. **Persistence**: Workflow data saved as JSON structure in database
5. **Execution**: SOD policies can be tested with custom JavaScript code
6. **Management**: Dashboard for browsing, editing, and organizing workflows

## External Dependencies

### Core Technologies
- **React Flow**: Visual workflow canvas functionality
- **Drizzle ORM**: Type-safe database operations
- **TanStack Query**: Server state and caching
- **Radix UI**: Headless component primitives (via shadcn/ui)

### Database
- **PostgreSQL**: Primary database (via @neondatabase/serverless)
- **Drizzle Kit**: Database migrations and schema management

### Development Tools
- **Vite**: Build tool with hot module replacement
- **TypeScript**: Type safety across the stack
- **ESBuild**: Production bundling
- **Replit Integration**: Development environment optimization

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds React app to `dist/public`
- **Backend**: ESBuild bundles Express server to `dist/index.js`
- **Database**: Drizzle migrations applied via `db:push` command

### Environment Configuration
- **Development**: Vite dev server with Express API integration
- **Production**: Static files served by Express with API routes
- **Database**: Connection via `DATABASE_URL` environment variable

### Scripts
- `dev`: Development server with hot reload
- `build`: Production build for both frontend and backend
- `start`: Production server execution
- `db:push`: Apply database schema changes

The application is designed to be deployment-ready with proper error handling, logging, and production optimizations. The modular architecture allows for easy extension of node types and workflow capabilities.