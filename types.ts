export type TaskStatus = 'To Do' | 'Doing' | 'Done' | 'At Risk' | 'On Hold';
export type IssueStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
export type ViewType = 'list' | 'kanban' | 'gantt' | 'issues';

export type UserRole = 'Owner' | 'Admin' | 'Member' | 'Viewer';
export type TaskType = 'Task' | 'Milestone';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatarColor: string; // e.g., 'bg-blue-500'
  email?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  startDate: string; // ISO Date string YYYY-MM-DD
  dueDate: string;   // ISO Date string YYYY-MM-DD
  closedDate?: string; // Optional closed date
  assignee: string; // Stores the User.name or User.id
  type: TaskType;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: Priority;
  dueDate: string;
  closedDate?: string;
  dateOpened: string;
  reportedBy: string;
  assignedTo: string;
}

export interface Project {
  id: string;
  name: string;
  tasks: Task[];
  issues: Issue[];
  members: string[]; // Array of User IDs representing who has access
}