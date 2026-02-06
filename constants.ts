import { TaskStatus, Priority } from './types';

export const STATUS_COLORS: Record<TaskStatus, string> = {
  'To Do': 'bg-slate-100 text-slate-700 border-slate-200',
  'Doing': 'bg-amber-100 text-amber-800 border-amber-200',
  'Done': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'At Risk': 'bg-red-100 text-red-800 border-red-200',
  'On Hold': 'bg-purple-100 text-purple-800 border-purple-200',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  'Low': 'bg-gray-200 text-gray-700',
  'Medium': 'bg-blue-100 text-blue-700',
  'High': 'bg-orange-100 text-orange-700',
  'Critical': 'bg-red-100 text-red-700 font-bold',
};

export const TASK_STATUSES: TaskStatus[] = ['To Do', 'Doing', 'Done', 'At Risk', 'On Hold'];

// Mock Data Initialization
const today = new Date();
const formatDate = (d: Date) => d.toISOString().split('T')[0];
const addDays = (d: Date, days: number) => {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
};

export const INITIAL_PROJECTS = [
  {
    id: 'p1',
    name: 'Website Redesign',
    members: ['u1', 'u2', 'u3'], // Default access for initial users
    tasks: [
      {
        id: 't1',
        title: 'Design Mockups',
        description: 'Create Figma designs for homepage',
        status: 'Done' as TaskStatus,
        priority: 'High' as Priority,
        startDate: formatDate(addDays(today, -5)),
        dueDate: formatDate(addDays(today, -2)),
        assignee: 'Alice',
        type: 'Task',
      },
      {
        id: 't2',
        title: 'Develop API',
        description: 'Build REST endpoints for user auth',
        status: 'Doing' as TaskStatus,
        priority: 'Critical' as Priority,
        startDate: formatDate(addDays(today, -1)),
        dueDate: formatDate(addDays(today, 3)),
        assignee: 'Boby',
        type: 'Task',
      },
      {
        id: 't3',
        title: 'Database Migration',
        description: 'Move data from legacy SQL',
        status: 'At Risk' as TaskStatus,
        priority: 'High' as Priority,
        startDate: formatDate(addDays(today, 0)),
        dueDate: formatDate(addDays(today, 2)),
        assignee: 'Charlie',
        type: 'Task',
      },
      {
        id: 't4',
        title: 'QA Testing',
        description: 'Write integration tests',
        status: 'To Do' as TaskStatus,
        priority: 'Medium' as Priority,
        startDate: formatDate(addDays(today, 4)),
        dueDate: formatDate(addDays(today, 8)),
        assignee: 'Diana',
        type: 'Task',
      },
      {
        id: 't5',
        title: 'Stakeholder Review',
        description: 'Monthly sync with board members',
        status: 'On Hold' as TaskStatus,
        priority: 'Low' as Priority,
        startDate: formatDate(addDays(today, 10)),
        dueDate: formatDate(addDays(today, 12)),
        assignee: 'Evan',
        type: 'Milestone',
      },
    ],
    issues: [
      {
        id: 'i1',
        title: 'Login Timeout',
        description: 'Users getting logged out after 5 mins',
        status: 'Open',
        priority: 'High',
        dueDate: formatDate(addDays(today, 1)),
        dateOpened: formatDate(addDays(today, -2)),
        reportedBy: 'Sarah',
        assignedTo: 'Bob',
      },
    ],
  },
  {
    id: 'p2',
    name: 'Mobile App Launch',
    members: ['u1', 'u2'],
    tasks: [],
    issues: [],
  },
];