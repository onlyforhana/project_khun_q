import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  Layout, Plus, Calendar, List, Trello, AlertCircle, 
  Settings, X, CheckCircle2, AlertTriangle, Clock, 
  MoreVertical, FileText, ChevronRight, User,
  Briefcase, Hexagon, Layers, Command, Box, Hash,
  Download, Upload, Filter, Save, Loader2, Check,
  ZoomIn, ZoomOut, CheckSquare, Square, Minus,
  RefreshCw, Trash2, Image as ImageIcon, Users, Shield, ShieldCheck, Eye,
  Link as LinkIcon, RotateCcw, LogOut, Flag, Target
} from 'lucide-react';
import { Project, Task, Issue, ViewType, TaskStatus, Priority, IssueStatus, User as UserType, UserRole, TaskType } from './types';
import { STATUS_COLORS, PRIORITY_COLORS, TASK_STATUSES, INITIAL_PROJECTS } from './constants';

// --- Constants & Config ---

const WORKSPACE_ICONS: Record<string, React.ElementType> = {
  Layout,
  Briefcase,
  Hexagon,
  Layers,
  Command,
  Box,
  Hash,
  Trello,
  List,
  CheckCircle2,
  AlertCircle
};

const AVATAR_COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 
  'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 
  'bg-cyan-500', 'bg-blue-500', 'bg-indigo-500', 
  'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 
  'bg-pink-500', 'bg-rose-500'
];

const ROLE_ICONS: Record<UserRole, React.ElementType> = {
  'Owner': ShieldCheck,
  'Admin': Shield,
  'Member': Users,
  'Viewer': Eye
};

// --- Utilities ---

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// --- Shared Components ---

const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => (
  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${PRIORITY_COLORS[priority]}`}>
    {priority}
  </span>
);

const StatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => (
  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${STATUS_COLORS[status]}`}>
    {status}
  </span>
);

const UserAvatar: React.FC<{ name: string; color?: string; size?: 'sm' | 'md' }> = ({ name, color, size = 'sm' }) => {
  // Guard against undefined/empty names to prevent crashes
  const safeName = name || '?';
  const initials = safeName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const sizeClasses = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm';
  const bgColor = color || 'bg-gray-400';
  
  return (
    <div className={`${sizeClasses} ${bgColor} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 border-2 border-white shadow-sm`} title={safeName}>
      {initials}
    </div>
  );
};

// --- Main Application ---

export default function App() {
  // --- Workspace State ---
  const [workspace, setWorkspace] = useState<{ name: string; icon: string; members: UserType[] }>(() => {
    try {
      const saved = localStorage.getItem('taskflow_workspace_v1');
      if (saved) {
         const parsed = JSON.parse(saved);
         // Ensure members exist for old saves
         if (!parsed.members) {
            parsed.members = [
               { id: 'u1', name: 'John Doe', role: 'Owner', avatarColor: 'bg-blue-500', email: 'john@example.com' },
               { id: 'u2', name: 'Alice Smith', role: 'Admin', avatarColor: 'bg-purple-500', email: 'alice@example.com' },
               { id: 'u3', name: 'Bob Johnson', role: 'Member', avatarColor: 'bg-emerald-500', email: 'bob@example.com' }
            ];
         }
         return parsed;
      }
    } catch (e) {
      console.error("Failed to load workspace settings", e);
    }
    return { 
       name: 'TaskFlow Pro', 
       icon: 'Layout',
       members: [
          { id: 'u1', name: 'John Doe', role: 'Owner', avatarColor: 'bg-blue-500', email: 'john@example.com' },
          { id: 'u2', name: 'Alice Smith', role: 'Admin', avatarColor: 'bg-purple-500', email: 'alice@example.com' },
          { id: 'u3', name: 'Bob Johnson', role: 'Member', avatarColor: 'bg-emerald-500', email: 'bob@example.com' }
       ]
    };
  });

  useEffect(() => {
    localStorage.setItem('taskflow_workspace_v1', JSON.stringify(workspace));
  }, [workspace]);

  // --- Current User Simulation State ---
  // Default to the first user (Owner) or fallback
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
     return workspace.members[0]?.id || 'u1';
  });

  const currentUser = useMemo(() => {
     return workspace.members.find(m => m.id === currentUserId) || workspace.members[0];
  }, [workspace.members, currentUserId]);


  // --- Project Data State ---
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem('taskflow_data_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
            // Migration: Ensure 'members' and 'tasks.type' fields exist
            return parsed.map((p: any) => ({
                ...p,
                members: Array.isArray(p.members) ? p.members : [],
                tasks: p.tasks.map((t: any) => ({ ...t, type: t.type || 'Task' }))
            }));
        }
      }
    } catch (e) {
      console.error("Failed to load data from local storage", e);
    }
    // Fallback only if no local data exists
    return INITIAL_PROJECTS as unknown as Project[];
  });

  // Persist changes to LocalStorage
  useEffect(() => {
    if (projects && projects.length > 0) {
       localStorage.setItem('taskflow_data_v1', JSON.stringify(projects));
    }
  }, [projects]);

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
      // Try to restore last active project
      const savedId = localStorage.getItem('taskflow_active_project_v1');
      const projectExists = projects.find(p => p.id === savedId);
      return projectExists ? savedId! : (projects[0]?.id || '');
  });

  useEffect(() => {
      localStorage.setItem('taskflow_active_project_v1', activeProjectId);
  }, [activeProjectId]);

  const [currentView, setCurrentView] = useState<ViewType>(() => {
    return (localStorage.getItem('taskflow_current_view_v1') as ViewType) || 'list';
  });

  useEffect(() => {
    localStorage.setItem('taskflow_current_view_v1', currentView);
  }, [currentView]);

  // Modal States
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null); // Null = Create, Object = Edit
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);

  // Manual Save State
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Derived State: Projects Visible to Current User
  const visibleProjects = useMemo(() => {
     if (!currentUser) return projects;
     
     // Admins and Owners see everything
     if (currentUser.role === 'Admin' || currentUser.role === 'Owner') {
        return projects;
     }

     // Members and Viewers see only projects they are assigned to
     return projects.filter(p => p.members?.includes(currentUser.id));
  }, [projects, currentUser]);

  const activeProject = useMemo(() => 
    visibleProjects.find(p => p.id === activeProjectId) || visibleProjects[0] || null, 
  [visibleProjects, activeProjectId]);

  // --- Project Management ---

  const handleCreateProject = (name: string, members: string[]) => {
    const newProject: Project = {
      id: generateId(),
      name,
      tasks: [],
      issues: [],
      members: members
    };
    setProjects(prev => {
        const updated = [...prev, newProject];
        return updated;
    });
    setActiveProjectId(newProject.id);
    setIsProjectModalOpen(false);
  };

  const handleUpdateProject = (id: string, name: string, members: string[]) => {
    setProjects(prev => {
        const updated = prev.map(p => p.id === id ? { ...p, name, members } : p);
        return updated;
    });
    setIsProjectModalOpen(false);
    setProjectToEdit(null);
  };

  const handleDeleteProject = (id: string) => {
    if (projects.length <= 1) {
      alert("Cannot delete the last project.");
      return;
    }
    const remaining = projects.filter(p => p.id !== id);
    setProjects(remaining);
    setActiveProjectId(remaining[0].id);
    setIsProjectModalOpen(false);
    setProjectToEdit(null);
  };

  // --- Task Management ---

  const handleSaveTask = (task: Task) => {
    let updatedProjects;
    if (editingTask && editingTask.id !== 'new') {
      // Update
      updatedProjects = projects.map(p => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            tasks: p.tasks.map(t => t.id === task.id ? task : t)
          };
        }
        return p;
      });
    } else {
      // Create
      const newTask = { ...task, id: generateId() };
      updatedProjects = projects.map(p => {
        if (p.id === activeProjectId) {
          return { ...p, tasks: [...p.tasks, newTask] };
        }
        return p;
      });
    }
    setProjects(updatedProjects);
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleTaskStatusChange = (taskId: string, newStatus: TaskStatus) => {
    const updatedProjects = projects.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          tasks: p.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
        };
      }
      return p;
    });
    setProjects(updatedProjects);
  };

  const handleBulkUpdateTasks = (taskIds: string[], updates: Partial<Task>) => {
     setProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
           return {
              ...p,
              tasks: p.tasks.map(t => taskIds.includes(t.id) ? { ...t, ...updates } : t)
           };
        }
        return p;
     }));
  };

  // --- Issue Management ---

  const handleSaveIssue = (issue: Issue) => {
    // Logic: If status is Resolved/Closed and closedDate is empty, default to today.
    // If status is Open/InProgress, clear closedDate.
    const processedIssue = { ...issue };
    if ((processedIssue.status === 'Resolved' || processedIssue.status === 'Closed') && !processedIssue.closedDate) {
      processedIssue.closedDate = new Date().toISOString().split('T')[0];
    } else if (processedIssue.status === 'Open' || processedIssue.status === 'In Progress') {
      processedIssue.closedDate = undefined;
    }

    let updatedProjects;
    if (editingIssue && editingIssue.id !== 'new') {
      // Update
      updatedProjects = projects.map(p => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            issues: p.issues.map(i => i.id === issue.id ? processedIssue : i)
          };
        }
        return p;
      });
    } else {
      // Create
      const newIssue = { ...processedIssue, id: generateId() };
      updatedProjects = projects.map(p => {
        if (p.id === activeProjectId) {
          return { ...p, issues: [...p.issues, newIssue] };
        }
        return p;
      });
    }
    setProjects(updatedProjects);
    setIsIssueModalOpen(false);
    setEditingIssue(null);
  };

  // --- Data Management (Export/Import) ---
  
  const handleExportData = () => {
    const dataStr = JSON.stringify(projects, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `taskflow_backup_${new Date().toISOString().slice(0,10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files.length > 0) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (e) => {
        if (e.target?.result) {
          try {
            const parsed = JSON.parse(e.target.result as string);
            if (Array.isArray(parsed)) {
              setProjects(parsed);
              localStorage.setItem('taskflow_data_v1', JSON.stringify(parsed));
              setIsWorkspaceModalOpen(false);
              // Force update active project if current one doesn't exist in new data
              if (parsed.length > 0 && !parsed.find((p: Project) => p.id === activeProjectId)) {
                 setActiveProjectId(parsed[0].id);
              }
              alert("Data restored successfully!");
            } else {
               alert("Invalid backup file format.");
            }
          } catch (err) {
            console.error(err);
            alert("Failed to parse backup file");
          }
        }
      };
    }
  };

  const handleResetData = () => {
    if (window.confirm("Are you sure you want to reset all data? This will clear all projects and tasks and restore the defaults. This cannot be undone.")) {
      localStorage.removeItem('taskflow_data_v1');
      localStorage.removeItem('taskflow_workspace_v1');
      localStorage.removeItem('taskflow_active_project_v1');
      window.location.reload();
    }
  };

  // --- Manual Save Function ---
  const handleManualSave = () => {
    setSaveStatus('saving');
    // Mimic network/processing delay for better UX
    setTimeout(() => {
        try {
            localStorage.setItem('taskflow_workspace_v1', JSON.stringify(workspace));
            localStorage.setItem('taskflow_data_v1', JSON.stringify(projects));
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (e) {
            console.error("Save failed", e);
            setSaveStatus('idle'); 
            alert("Failed to save to local storage.");
        }
    }, 600);
  };


  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col flex-shrink-0 transition-all z-20">
        {/* Workspace Header - Clickable for Settings */}
        <div 
           className="p-6 border-b border-slate-700 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors group relative"
           onClick={() => setIsWorkspaceModalOpen(true)}
           title="Workspace Settings & Backups"
        >
          <div className="flex items-center gap-3 overflow-hidden">
             {workspace.icon.startsWith('data:') ? (
                 <img 
                    src={workspace.icon} 
                    alt="Workspace Logo" 
                    className="w-8 h-8 rounded object-cover flex-shrink-0 bg-white"
                 />
             ) : (
                React.createElement(WORKSPACE_ICONS[workspace.icon] || Layout, { 
                    className: "text-blue-400 flex-shrink-0", 
                    size: 24 
                })
             )}
            <h1 className="text-xl font-bold tracking-tight truncate" title={workspace.name}>{workspace.name}</h1>
          </div>
          <Settings size={16} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4" />
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-2 flex items-center justify-between">
             <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Projects</div>
             {currentUser.role !== 'Admin' && currentUser.role !== 'Owner' && (
                 <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">Assigned Only</span>
             )}
          </div>
          
          {visibleProjects.length === 0 ? (
             <div className="px-4 text-sm text-slate-500 italic py-2">
                No projects found for you.
             </div>
          ) : visibleProjects.map(project => (
            <div 
              key={project.id}
              className={`group flex items-center justify-between px-4 py-3 mx-2 rounded-lg cursor-pointer transition-colors ${
                activeProjectId === project.id 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
              onClick={() => setActiveProjectId(project.id)}
            >
              <div className="truncate font-medium max-w-[140px]" title={project.name}>{project.name}</div>
              {/* Only show edit button if user is Admin or Owner */}
              {(currentUser.role === 'Admin' || currentUser.role === 'Owner') && (
                 <button 
                   onClick={(e) => {
                     e.stopPropagation();
                     setProjectToEdit(project);
                     setIsProjectModalOpen(true);
                   }}
                   className={`opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-700 ${activeProjectId === project.id ? 'hover:bg-blue-700' : ''}`}
                 >
                   <Settings size={14} />
                 </button>
              )}
            </div>
          ))}
          
          {(currentUser.role === 'Admin' || currentUser.role === 'Owner') && (
            <button 
              onClick={() => {
                setProjectToEdit(null);
                setIsProjectModalOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-3 mt-2 text-sm text-slate-400 hover:text-blue-400 transition-colors w-full"
            >
              <Plus size={16} />
              <span>New Project</span>
            </button>
          )}
        </div>
        
        {/* User Simulation & Save */}
        <div className="p-4 border-t border-slate-800 space-y-3">
           {/* Simulation Dropdown */}
           <div className="bg-slate-800 rounded-lg p-2 border border-slate-700">
              <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1 ml-1">Simulate User:</label>
              <div className="flex items-center gap-2">
                 <UserAvatar name={currentUser.name} color={currentUser.avatarColor} size="sm" />
                 <select 
                    value={currentUserId}
                    onChange={(e) => setCurrentUserId(e.target.value)}
                    className="bg-transparent text-sm text-slate-200 outline-none flex-1 w-full cursor-pointer hover:bg-slate-700 rounded px-1 -ml-1"
                 >
                    {workspace.members.map(m => (
                       <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                          {m.name} ({m.role})
                       </option>
                    ))}
                 </select>
              </div>
           </div>

           <button 
              onClick={handleManualSave}
              disabled={saveStatus !== 'idle'}
              className={`flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg text-sm font-medium transition-all shadow-sm border ${
                  saveStatus === 'saved' 
                    ? 'bg-green-600 text-white border-green-600'
                    : saveStatus === 'saving'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Save all changes to local storage"
           >
              {saveStatus === 'saving' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving...</span>
                  </>
              ) : saveStatus === 'saved' ? (
                  <>
                     <Check size={16} />
                     <span>Saved!</span>
                  </>
              ) : (
                  <>
                    <Save size={16} />
                    <span>Save Changes</span>
                  </>
              )}
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {activeProject ? (
        <>
        {/* Top Navigation */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800">{activeProject.name}</h2>
            <div className="h-6 w-px bg-gray-300 mx-2"></div>
            <div className="flex bg-gray-100 p-1 rounded-lg">
               {[
                 { id: 'list', icon: List, label: 'List' },
                 { id: 'kanban', icon: Trello, label: 'Board' },
                 { id: 'gantt', icon: Calendar, label: 'Gantt' },
                 { id: 'issues', icon: AlertCircle, label: 'Issues' },
               ].map((view) => (
                 <button
                    key={view.id}
                    onClick={() => setCurrentView(view.id as ViewType)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      currentView === view.id 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                 >
                    <view.icon size={16} />
                    {view.label}
                 </button>
               ))}
            </div>
          </div>

          <div>
             <button 
                onClick={() => {
                   if (currentView === 'issues') {
                     setEditingIssue({ 
                       id: 'new',
                       title: '',
                       description: '',
                       status: 'Open',
                       priority: 'Medium',
                       dueDate: new Date().toISOString().split('T')[0],
                       dateOpened: new Date().toISOString().split('T')[0],
                       reportedBy: currentUser.name,
                       assignedTo: ''
                     } as Issue);
                     setIsIssueModalOpen(true);
                   } else {
                     setEditingTask({ 
                       id: 'new',
                       title: '',
                       description: '',
                       status: 'To Do',
                       priority: 'Medium',
                       startDate: new Date().toISOString().split('T')[0],
                       dueDate: new Date().toISOString().split('T')[0],
                       assignee: '',
                       type: 'Task'
                     } as Task);
                     setIsTaskModalOpen(true);
                   }
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors active:scale-95"
             >
                <Plus size={18} />
                <span>Add {currentView === 'issues' ? 'Issue' : 'Item'}</span>
             </button>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-hidden relative bg-gray-50">
          {currentView === 'kanban' && (
            <KanbanView 
              tasks={activeProject.tasks} 
              onUpdateStatus={handleTaskStatusChange}
              onEditTask={(t) => { setEditingTask(t); setIsTaskModalOpen(true); }}
              members={workspace.members}
            />
          )}
          {currentView === 'list' && (
            <TaskListView 
               tasks={activeProject.tasks}
               onEditTask={(t) => { setEditingTask(t); setIsTaskModalOpen(true); }}
               onBulkUpdate={handleBulkUpdateTasks}
               members={workspace.members}
            />
          )}
          {currentView === 'gantt' && (
             <GanttView 
                tasks={activeProject.tasks}
                onEditTask={(t) => { setEditingTask(t); setIsTaskModalOpen(true); }}
             />
          )}
          {currentView === 'issues' && (
             <IssueLogView 
                issues={activeProject.issues}
                onEditIssue={(i) => { setEditingIssue(i); setIsIssueModalOpen(true); }}
                members={workspace.members}
             />
          )}
        </div>
        </>
        ) : (
           <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
               <Briefcase size={64} className="mb-4 text-gray-300" />
               <h3 className="text-lg font-semibold text-gray-600">No Projects Found</h3>
               <p className="max-w-xs text-center mt-2">
                  {currentUser.role === 'Admin' || currentUser.role === 'Owner' 
                    ? "Create a new project to get started." 
                    : "You haven't been assigned to any projects yet."}
               </p>
           </div>
        )}
      </main>

      {/* --- Modals --- */}
      
      {/* Workspace Modal */}
      <Modal
         isOpen={isWorkspaceModalOpen}
         onClose={() => setIsWorkspaceModalOpen(false)}
         title="Workspace Settings"
      >
         <WorkspaceForm 
            initialData={workspace}
            onSubmit={(newData) => {
               setWorkspace(newData);
               setIsWorkspaceModalOpen(false);
            }}
            onExport={handleExportData}
            onImport={handleImportData}
            onReset={handleResetData}
         />
      </Modal>

      {/* Project Modal */}
      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        title={projectToEdit ? 'Edit Project' : 'New Project'}
      >
        <ProjectForm 
           initialData={projectToEdit}
           workspaceMembers={workspace.members}
           onSubmit={(name, members) => projectToEdit ? handleUpdateProject(projectToEdit.id, name, members) : handleCreateProject(name, members)}
           onDelete={projectToEdit ? () => handleDeleteProject(projectToEdit.id) : undefined}
        />
      </Modal>

      {/* Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title={editingTask?.id === 'new' ? 'Create Task' : 'Edit Task'}
      >
        {editingTask && (
          <TaskForm 
            initialData={editingTask}
            onSubmit={handleSaveTask}
            members={workspace.members}
          />
        )}
      </Modal>

      {/* Issue Modal */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        title={editingIssue?.id === 'new' ? 'Report Issue' : 'Edit Issue'}
      >
         {editingIssue && (
            <IssueForm 
               initialData={editingIssue}
               onSubmit={handleSaveIssue}
               members={workspace.members}
            />
         )}
      </Modal>

    </div>
  );
}

// --- Form Components ---

// ... (WorkspaceForm - no changes) ...
const WorkspaceForm: React.FC<{
  initialData: { name: string; icon: string; members: UserType[] };
  onSubmit: (data: { name: string; icon: string; members: UserType[] }) => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
}> = ({ initialData, onSubmit, onExport, onImport, onReset }) => {
  const [formData, setFormData] = useState(initialData);
  const [newMember, setNewMember] = useState({ name: '', role: 'Member' as UserRole });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setFormData({ ...formData, icon: reader.result as string });
          };
          reader.readAsDataURL(file);
      }
  };

  const handleAddMember = () => {
    if (newMember.name.trim()) {
       const member: UserType = {
          id: generateId(),
          name: newMember.name.trim(),
          role: newMember.role,
          avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
       };
       setFormData({ ...formData, members: [...formData.members, member] });
       setNewMember({ name: '', role: 'Member' });
    }
  };

  const handleRemoveMember = (id: string) => {
     setFormData({ ...formData, members: formData.members.filter(m => m.id !== id) });
  };

  const handleRoleChange = (id: string, newRole: UserRole) => {
     setFormData({ ...formData, members: formData.members.map(m => m.id === id ? { ...m, role: newRole } : m) });
  };

  return (
    <div className="space-y-8">
      {/* General Settings */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">General Settings</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Workspace Name</label>
          <input 
            type="text" 
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Workspace Icon</label>
          <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 rounded-lg bg-white border border-gray-300 flex items-center justify-center overflow-hidden">
                   {formData.icon.startsWith('data:') ? (
                       <img src={formData.icon} alt="Preview" className="w-full h-full object-cover" />
                   ) : (
                       React.createElement(WORKSPACE_ICONS[formData.icon] || Layout, { className: "text-gray-400", size: 24 })
                   )}
               </div>
               <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                  <ImageIcon size={16} />
                  Upload Logo
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
               </label>
          </div>
          <div className="grid grid-cols-6 gap-2">
             {Object.keys(WORKSPACE_ICONS).map((iconKey) => {
                const IconComp = WORKSPACE_ICONS[iconKey];
                return (
                   <button
                      key={iconKey}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: iconKey })}
                      className={`p-3 rounded-lg flex items-center justify-center transition-all ${formData.icon === iconKey ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-500' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                   >
                      <IconComp size={20} />
                   </button>
                )
             })}
          </div>
        </div>
      </div>

      {/* Team Management */}
      <div className="space-y-4">
         <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Team Members & Permissions</h3>
         
         <div className="flex gap-2">
            <input 
               type="text" 
               placeholder="Member Name"
               value={newMember.name}
               onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
               className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
            />
            <select
               value={newMember.role}
               onChange={(e) => setNewMember({ ...newMember, role: e.target.value as UserRole })}
               className="p-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
               <option value="Admin">Admin</option>
               <option value="Member">Member</option>
               <option value="Viewer">Viewer</option>
            </select>
            <button 
               type="button"
               onClick={handleAddMember}
               className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
               disabled={!newMember.name.trim()}
            >
               <Plus size={20} />
            </button>
         </div>

         <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
            {formData.members.map(member => {
               const RoleIcon = ROLE_ICONS[member.role] || User;
               return (
                  <div key={member.id} className="flex items-center justify-between p-3 border-b border-gray-200 last:border-0 hover:bg-white transition-colors">
                     <div className="flex items-center gap-3">
                        <UserAvatar name={member.name} color={member.avatarColor} />
                        <div>
                           <div className="text-sm font-medium text-gray-900">{member.name}</div>
                           <div className="text-xs text-gray-500 flex items-center gap-1">
                              <RoleIcon size={12} />
                              {member.role}
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                        {member.role !== 'Owner' && (
                           <>
                              <select
                                 value={member.role}
                                 onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                                 className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                              >
                                 <option value="Admin">Admin</option>
                                 <option value="Member">Member</option>
                                 <option value="Viewer">Viewer</option>
                              </select>
                              <button 
                                 type="button"
                                 onClick={() => handleRemoveMember(member.id)}
                                 className="text-red-400 hover:text-red-600 p-1 rounded"
                              >
                                 <Trash2 size={16} />
                              </button>
                           </>
                        )}
                        {member.role === 'Owner' && <span className="text-xs text-gray-400 italic px-2">Owner</span>}
                     </div>
                  </div>
               );
            })}
         </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
         <h3 className="text-sm font-semibold text-gray-900 mb-3">Data Management</h3>
         <div className="flex gap-4 mb-4">
             <button 
                type="button"
                onClick={onExport}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
             >
                <Download size={16} />
                Backup Data
             </button>
             <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                <Upload size={16} />
                Restore Data
                <input type="file" accept=".json" onChange={onImport} className="hidden" />
             </label>
             <button 
                type="button"
                onClick={onReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-100"
             >
                <RotateCcw size={16} />
                Reset App
             </button>
         </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button
          onClick={() => onSubmit(formData)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

const ProjectForm: React.FC<{
  initialData: Project | null;
  workspaceMembers: UserType[];
  onSubmit: (name: string, members: string[]) => void;
  onDelete?: () => void;
}> = ({ initialData, workspaceMembers, onSubmit, onDelete }) => {
  const [name, setName] = useState(initialData?.name || '');
  // Default to all members if new project, or load existing
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
     new Set(initialData?.members || workspaceMembers.map(m => m.id))
  );

  const toggleMember = (id: string) => {
     const newSet = new Set(selectedMembers);
     if (newSet.has(id)) newSet.delete(id);
     else newSet.add(id);
     setSelectedMembers(newSet);
  };

  const toggleAll = () => {
     if (selectedMembers.size === workspaceMembers.length) {
        setSelectedMembers(new Set());
     } else {
        setSelectedMembers(new Set(workspaceMembers.map(m => m.id)));
     }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Website Redesign"
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          autoFocus
        />
      </div>

      <div>
         <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">Project Members</label>
            <button 
               type="button"
               onClick={toggleAll}
               className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
               {selectedMembers.size === workspaceMembers.length ? 'Deselect All' : 'Select All'}
            </button>
         </div>
         <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto bg-gray-50 p-2 space-y-1">
             {workspaceMembers.map(member => (
                <div 
                  key={member.id} 
                  className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${selectedMembers.has(member.id) ? 'bg-white shadow-sm border border-blue-100' : 'hover:bg-gray-100 border border-transparent'}`}
                  onClick={() => toggleMember(member.id)}
                >
                   <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedMembers.has(member.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-400 bg-white'}`}>
                      {selectedMembers.has(member.id) && <Check size={12} className="text-white" />}
                   </div>
                   <UserAvatar name={member.name} color={member.avatarColor} size="sm" />
                   <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{member.name}</div>
                      <div className="text-xs text-gray-500">{member.role}</div>
                   </div>
                </div>
             ))}
         </div>
         <p className="text-xs text-gray-500 mt-1">Admin and Owner roles always have access.</p>
      </div>

      <div className="flex justify-between items-center pt-2">
        {onDelete ? (
           <button
             type="button"
             onClick={() => {
                if (window.confirm("Are you sure you want to delete this project? All tasks will be lost.")) {
                   onDelete();
                }
             }}
             className="text-red-500 hover:text-red-700 text-sm font-medium"
           >
             Delete Project
           </button>
        ) : <div></div>}
        
        <button
          onClick={() => {
             if (name.trim()) onSubmit(name, Array.from(selectedMembers));
          }}
          disabled={!name.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {initialData ? 'Update Project' : 'Create Project'}
        </button>
      </div>
    </div>
  );
};

// ... (TaskForm, IssueForm, View Components - no changes) ...
const TaskForm: React.FC<{
  initialData: Task;
  onSubmit: (task: Task) => void;
  members: UserType[];
}> = ({ initialData, onSubmit, members }) => {
  const [formData, setFormData] = useState<Task>(initialData);

  const handleChange = (field: keyof Task, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
         <div className="col-span-3">
            <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
            <input 
              type="text" 
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              autoFocus
            />
         </div>
         <div>
             <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
             <select
                value={formData.type}
                onChange={(e) => {
                   const newType = e.target.value as TaskType;
                   const updates: any = { type: newType };
                   // If switching to milestone, maybe sync start date to due date
                   if (newType === 'Milestone') {
                      updates.startDate = formData.dueDate;
                   }
                   setFormData(prev => ({ ...prev, ...updates }));
                }}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
             >
                <option value="Task">Task</option>
                <option value="Milestone">Milestone</option>
             </select>
         </div>
      </div>

      <div>
         <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
         <textarea 
            rows={2}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
         />
      </div>

      <div className="grid grid-cols-2 gap-4">
         <div>
             <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
             <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
             >
                {TASK_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
         </div>
         <div>
             <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
             <select
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
             >
                {Object.keys(PRIORITY_COLORS).map(p => <option key={p} value={p}>{p}</option>)}
             </select>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
         <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Assignee</label>
            <select
               value={formData.assignee}
               onChange={(e) => handleChange('assignee', e.target.value)}
               className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
            >
               <option value="">Unassigned</option>
               {members.map(member => (
                  <option key={member.id} value={member.name}>{member.name}</option>
               ))}
            </select>
         </div>
         <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Due Date</label>
            <input 
               type="date"
               value={formData.dueDate}
               onChange={(e) => {
                  const val = e.target.value;
                  setFormData(prev => ({ 
                      ...prev, 
                      dueDate: val,
                      startDate: prev.type === 'Milestone' ? val : prev.startDate
                  }));
               }}
               className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
         </div>
      </div>

      {/* Only show Start Date if it is a Task */}
      {formData.type === 'Task' && (
         <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                <input 
                   type="date"
                   value={formData.startDate}
                   onChange={(e) => handleChange('startDate', e.target.value)}
                   className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
             </div>
             {formData.status === 'Done' && (
                <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1">Closed Date</label>
                   <input 
                      type="date"
                      value={formData.closedDate || ''}
                      onChange={(e) => handleChange('closedDate', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                   />
                </div>
             )}
         </div>
      )}

      <div className="flex justify-end pt-4">
         <button
            onClick={() => onSubmit(formData)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
         >
            Save {formData.type}
         </button>
      </div>
    </div>
  );
};

const IssueForm: React.FC<{
  initialData: Issue;
  onSubmit: (issue: Issue) => void;
  members: UserType[];
}> = ({ initialData, onSubmit, members }) => {
  const [formData, setFormData] = useState<Issue>(initialData);

  const handleChange = (field: keyof Issue, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
         <div className="col-span-3">
            <label className="block text-xs font-medium text-gray-500 mb-1">Issue Title</label>
            <input 
              type="text" 
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              autoFocus
            />
         </div>
         <div>
             <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
             <select
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
             >
                {Object.keys(PRIORITY_COLORS).map(p => <option key={p} value={p}>{p}</option>)}
             </select>
         </div>
      </div>

      <div>
         <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
         <textarea 
            rows={3}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
         />
      </div>

      <div className="grid grid-cols-2 gap-4">
         <div>
             <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
             <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
             >
                 <option value="Open">Open</option>
                 <option value="In Progress">In Progress</option>
                 <option value="Resolved">Resolved</option>
                 <option value="Closed">Closed</option>
             </select>
         </div>
         <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Reported By</label>
            <select
               value={formData.reportedBy}
               onChange={(e) => handleChange('reportedBy', e.target.value)}
               className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
            >
               <option value="">Unassigned</option>
               {members.map(member => (
                  <option key={member.id} value={member.name}>{member.name}</option>
               ))}
            </select>
         </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
         <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date Opened</label>
            <input 
               type="date"
               value={formData.dateOpened}
               onChange={(e) => handleChange('dateOpened', e.target.value)}
               className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
         </div>
         <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Due Date</label>
            <input 
               type="date"
               value={formData.dueDate}
               onChange={(e) => handleChange('dueDate', e.target.value)}
               className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
         </div>
         <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Assigned To</label>
            <select
               value={formData.assignedTo}
               onChange={(e) => handleChange('assignedTo', e.target.value)}
               className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
            >
               <option value="">Unassigned</option>
               {members.map(member => (
                  <option key={member.id} value={member.name}>{member.name}</option>
               ))}
            </select>
         </div>
      </div>

      <div className="flex justify-end pt-4">
         <button
            onClick={() => onSubmit(formData)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
         >
            Save Issue
         </button>
      </div>
    </div>
  );
};

// ... (KanbanView, TaskListView, GanttView, IssueLogView - no changes) ...
const KanbanView: React.FC<{ 
  tasks: Task[], 
  onUpdateStatus: (id: string, status: TaskStatus) => void,
  onEditTask: (t: Task) => void,
  members: UserType[]
}> = ({ tasks, onUpdateStatus, onEditTask, members }) => {
  const draggedItemRef = useRef<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    draggedItemRef.current = taskId;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = draggedItemRef.current;
    if (taskId) {
      onUpdateStatus(taskId, status);
    }
    draggedItemRef.current = null;
  };

  return (
    <div className="h-full overflow-x-auto overflow-y-hidden p-6">
      <div className="flex gap-6 h-full min-w-max">
        {TASK_STATUSES.map(status => {
           const columnTasks = tasks.filter(t => t.status === status);
           return (
             <div 
                key={status}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
                className="w-80 flex flex-col bg-gray-100 rounded-xl max-h-full border border-gray-200 shadow-inner"
             >
                <div className="p-4 flex items-center justify-between sticky top-0 bg-gray-100 rounded-t-xl z-10">
                   <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[status].split(' ')[0].replace('bg-', 'bg-')}`}></span>
                      {status}
                   </h3>
                   <span className="text-xs font-bold text-gray-400 bg-gray-200 px-2 py-1 rounded-full">
                      {columnTasks.length}
                   </span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                   {columnTasks.map(task => {
                      const assigneeUser = members.find(m => m.name === task.assignee);
                      return (
                      <div
                         key={task.id}
                         draggable
                         onDragStart={(e) => handleDragStart(e, task.id)}
                         onClick={() => onEditTask(task)}
                         className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group relative"
                      >
                         <div className="flex justify-between items-start mb-2">
                            {task.type === 'Milestone' ? (
                               <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                                  <Flag size={12} /> Milestone
                               </span>
                            ) : (
                               <span className="text-xs font-medium text-gray-400">#{task.id.slice(0, 4)}</span>
                            )}
                            <PriorityBadge priority={task.priority} />
                         </div>
                         <h4 className="text-sm font-bold text-gray-900 mb-2 leading-tight">{task.title}</h4>
                         
                         <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                               <Calendar size={12} />
                               {task.dueDate}
                            </div>
                            {task.assignee && (
                               <UserAvatar name={task.assignee} color={assigneeUser?.avatarColor} />
                            )}
                         </div>
                      </div>
                   )})}
                   {columnTasks.length === 0 && (
                      <div className="h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                         Drop tasks here
                      </div>
                   )}
                </div>
             </div>
           );
        })}
      </div>
    </div>
  );
};

const TaskListView: React.FC<{
  tasks: Task[],
  onEditTask: (t: Task) => void,
  onBulkUpdate: (taskIds: string[], updates: Partial<Task>) => void,
  members: UserType[]
}> = ({ tasks, onEditTask, onBulkUpdate, members }) => {
   // --- Selection State ---
   const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

   // --- Width Persistence ---
   const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
       try {
           const saved = localStorage.getItem('taskflow_ui_v1');
           return saved ? JSON.parse(saved) : {
               title: 250,
               description: 350,
               status: 120,
               priority: 120,
               assignee: 160,
               startDate: 120,
               dueDate: 120,
               closedDate: 120
           };
       } catch (e) {
           return {
               title: 250,
               description: 350,
               status: 120,
               priority: 120,
               assignee: 160,
               startDate: 120,
               dueDate: 120,
               closedDate: 120
           };
       }
   });

   useEffect(() => {
       localStorage.setItem('taskflow_ui_v1', JSON.stringify(columnWidths));
   }, [columnWidths]);

   // --- Order Persistence ---
   const [columnOrder, setColumnOrder] = useState<string[]>(() => {
      try {
         const saved = localStorage.getItem('taskflow_ui_order_v1');
         if (saved) {
             const parsed = JSON.parse(saved);
             if (!parsed.includes('closedDate')) {
                 return [...parsed, 'closedDate'];
             }
             return parsed;
         }
      } catch (e) {}
      return ['title', 'description', 'status', 'priority', 'assignee', 'startDate', 'dueDate', 'closedDate'];
   });

   useEffect(() => {
      localStorage.setItem('taskflow_ui_order_v1', JSON.stringify(columnOrder));
   }, [columnOrder]);

   // --- Resizing Logic ---
   const [resizing, setResizing] = useState<{ key: string; startX: number; startWidth: number } | null>(null);

   useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
         if (!resizing) return;
         const diff = e.clientX - resizing.startX;
         const newWidth = Math.max(80, resizing.startWidth + diff); 
         setColumnWidths(prev => ({ ...prev, [resizing.key]: newWidth }));
      };

      const handleMouseUp = () => {
         setResizing(null);
         document.body.style.cursor = 'default';
      };

      if (resizing) {
         window.addEventListener('mousemove', handleMouseMove);
         window.addEventListener('mouseup', handleMouseUp);
         document.body.style.cursor = 'col-resize';
      }

      return () => {
         window.removeEventListener('mousemove', handleMouseMove);
         window.removeEventListener('mouseup', handleMouseUp);
         document.body.style.cursor = 'default';
      };
   }, [resizing]);

   const startResize = (e: React.MouseEvent, key: string) => {
      e.preventDefault();
      e.stopPropagation();
      setResizing({ key, startX: e.clientX, startWidth: columnWidths[key] });
   };

   // --- Drag & Drop Logic ---
   const [draggedColumn, setDraggedColumn] = useState<string | null>(null);

   const handleColumnDragStart = (e: React.DragEvent, key: string) => {
      setDraggedColumn(key);
      e.dataTransfer.effectAllowed = 'move';
   };

   const handleColumnDragOver = (e: React.DragEvent, targetKey: string) => {
      e.preventDefault(); 
      if (draggedColumn === targetKey) return;
   };

   const handleColumnDrop = (e: React.DragEvent, targetKey: string) => {
      e.preventDefault();
      if (!draggedColumn || draggedColumn === targetKey) return;

      const newOrder = [...columnOrder];
      const draggedIdx = newOrder.indexOf(draggedColumn);
      const targetIdx = newOrder.indexOf(targetKey);

      newOrder.splice(draggedIdx, 1);
      newOrder.splice(targetIdx, 0, draggedColumn);

      setColumnOrder(newOrder);
      setDraggedColumn(null);
   };

   // --- Filtering Logic ---
   const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
   const [filterOpen, setFilterOpen] = useState<string | null>(null);

   const filteredTasks = useMemo(() => {
      return tasks.filter(task => {
         return Object.entries(activeFilters).every(([key, value]) => {
            if (!value) return true;
            if (key === 'status') return task.status === value;
            if (key === 'priority') return task.priority === value;
            const itemVal = String((task as any)[key] || '').toLowerCase();
            return itemVal.includes((value as string).toLowerCase());
         });
      });
   }, [tasks, activeFilters]);

   const clearFilter = (key: string) => {
       const next = {...activeFilters};
       delete next[key];
       setActiveFilters(next);
       setFilterOpen(null);
   };

   // --- Selection Logic ---
   const toggleSelection = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedIds(newSet);
   };

   const toggleAllSelection = () => {
      if (selectedIds.size === filteredTasks.length && filteredTasks.length > 0) {
         setSelectedIds(new Set());
      } else {
         setSelectedIds(new Set(filteredTasks.map(t => t.id)));
      }
   };

   // --- Configuration ---
   const COLUMN_LABELS: Record<string, string> = {
     title: 'Task / Milestone',
     description: 'Description',
     status: 'Status',
     priority: 'Priority',
     assignee: 'Assignee',
     startDate: 'Start Date',
     dueDate: 'Due Date',
     closedDate: 'Closed Date',
   };

   const renderCellContent = (task: Task, key: string) => {
      switch (key) {
        case 'title': 
           return (
              <div className="flex items-center gap-2">
                 {task.type === 'Milestone' && <Flag size={14} className="text-red-600 fill-red-100" />}
                 <div className={`text-sm ${task.type === 'Milestone' ? 'font-bold text-red-900' : 'font-bold text-gray-900'} truncate`}>{task.title}</div>
              </div>
           );
        case 'description': 
           return <div className="text-sm text-gray-500 truncate" title={task.description}>{task.description}</div>;
        case 'status': 
           return <StatusBadge status={task.status} />;
        case 'priority': 
           return <PriorityBadge priority={task.priority} />;
        case 'assignee': 
           const user = members.find(m => m.name === task.assignee);
           return (
              <div className="flex items-center gap-2">
                 {task.assignee ? <UserAvatar name={task.assignee} color={user?.avatarColor} size="sm" /> : <User size={14} className="text-gray-400"/>}
                 <span className="truncate">{task.assignee || 'Unassigned'}</span>
              </div>
           );
        case 'startDate': 
           return <span className="text-xs text-gray-500 font-mono">{task.startDate}</span>;
        case 'dueDate': 
           return <span className="text-xs text-gray-500 font-mono">{task.dueDate}</span>;
        case 'closedDate':
           return <span className="text-xs text-gray-500 font-mono">{task.closedDate || '-'}</span>;
        default: return null;
      }
   };

   // Render Filter Input based on Column Type
   const renderFilterInput = (key: string) => {
      if (key === 'status') {
          return (
             <select 
                className="w-full p-2 border rounded text-sm text-gray-800 bg-white"
                value={activeFilters[key] || ''}
                onChange={(e) => setActiveFilters({...activeFilters, [key]: e.target.value})}
             >
                 <option value="">All Statuses</option>
                 {TASK_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
          );
      }
      if (key === 'priority') {
          return (
             <select 
                className="w-full p-2 border rounded text-sm text-gray-800 bg-white"
                value={activeFilters[key] || ''}
                onChange={(e) => setActiveFilters({...activeFilters, [key]: e.target.value})}
             >
                 <option value="">All Priorities</option>
                 {Object.keys(PRIORITY_COLORS).map(p => <option key={p} value={p}>{p}</option>)}
             </select>
          );
      }
      if (key.toLowerCase().includes('date')) {
         return (
             <input 
                type="date"
                className="w-full p-2 border rounded text-sm text-gray-800"
                value={activeFilters[key] || ''}
                onChange={(e) => setActiveFilters({...activeFilters, [key]: e.target.value})}
             />
         );
      }
      return (
         <input 
            type="text"
            className="w-full p-2 border rounded text-sm text-gray-800"
            placeholder={`Filter ${COLUMN_LABELS[key]}...`}
            value={activeFilters[key] || ''}
            onChange={(e) => setActiveFilters({...activeFilters, [key]: e.target.value})}
            autoFocus
         />
      );
   };

   const isAllSelected = filteredTasks.length > 0 && selectedIds.size === filteredTasks.length;
   const isIndeterminate = selectedIds.size > 0 && selectedIds.size < filteredTasks.length;

   return (
      <div className="h-full overflow-y-auto p-6 relative">
         {/* Filter Overlay to close on click outside */}
         {filterOpen && <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(null)}></div>}
         
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-fit min-w-full pb-20">
            <div className="overflow-x-auto">
                <table className="text-left border-collapse" style={{ tableLayout: 'fixed', width: 'max-content' }}>
                   <colgroup>
                      <col style={{ width: 48 }} /> {/* Checkbox Column */}
                      {columnOrder.map(key => (
                         <col key={key} style={{ width: columnWidths[key] }} />
                      ))}
                   </colgroup>
                   <thead>
                      <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                         {/* Select All Checkbox */}
                         <th className="px-6 py-4 relative bg-gray-50 sticky left-0 z-20">
                            <div 
                               className="cursor-pointer flex items-center justify-center"
                               onClick={toggleAllSelection}
                            >
                               {isAllSelected ? (
                                  <CheckSquare size={18} className="text-blue-600" />
                               ) : isIndeterminate ? (
                                  <Minus size={18} className="text-blue-600" />
                               ) : (
                                  <Square size={18} className="text-gray-400" />
                               )}
                            </div>
                         </th>
                         
                         {columnOrder.map(key => (
                             <th 
                                key={key} 
                                draggable
                                onDragStart={(e) => handleColumnDragStart(e, key)}
                                onDragOver={(e) => handleColumnDragOver(e, key)}
                                onDrop={(e) => handleColumnDrop(e, key)}
                                className={`relative px-6 py-4 font-semibold group select-none cursor-move transition-opacity ${
                                   draggedColumn === key ? 'opacity-50 bg-gray-100' : 'hover:bg-gray-100'
                                }`}
                             >
                                <div className="flex items-center justify-between">
                                    <span>{COLUMN_LABELS[key]}</span>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setFilterOpen(filterOpen === key ? null : key); }}
                                        className={`p-1 rounded hover:bg-gray-200 transition-colors ${activeFilters[key] ? 'bg-blue-100 text-blue-600' : 'text-gray-400 opacity-0 group-hover:opacity-100'}`}
                                        style={{ opacity: activeFilters[key] ? 1 : undefined }}
                                    >
                                        <Filter size={14} />
                                    </button>
                                </div>
                                
                                {/* Filter Popover */}
                                {filterOpen === key && (
                                    <div 
                                        className="absolute top-full left-0 mt-2 w-56 bg-white shadow-xl rounded-lg border border-gray-200 p-3 z-50 cursor-default"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="mb-2 text-xs font-semibold text-gray-500">Filter by {COLUMN_LABELS[key]}</div>
                                        {renderFilterInput(key)}
                                        {activeFilters[key] && (
                                            <button 
                                                onClick={() => clearFilter(key)}
                                                className="mt-2 text-xs text-red-500 hover:text-red-700 w-full text-right"
                                            >
                                                Clear Filter
                                            </button>
                                        )}
                                    </div>
                                )}

                                <div 
                                   className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 group-hover:bg-gray-200 transition-colors z-10"
                                   onMouseDown={(e) => startResize(e, key)}
                                />
                             </th>
                         ))}
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                      {filteredTasks.map(task => {
                         const isSelected = selectedIds.has(task.id);
                         return (
                            <tr 
                                key={task.id} 
                                onClick={() => onEditTask(task)}
                                className={`cursor-pointer transition-colors group ${isSelected ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-blue-50'}`}
                            >
                               <td className="px-6 py-4 relative z-10 sticky left-0" onClick={(e) => e.stopPropagation()}>
                                  <div 
                                     className="cursor-pointer flex items-center justify-center"
                                     onClick={() => toggleSelection(task.id)}
                                  >
                                     {isSelected ? (
                                        <CheckSquare size={18} className="text-blue-600" />
                                     ) : (
                                        <Square size={18} className="text-gray-300 hover:text-gray-500" />
                                     )}
                                  </div>
                               </td>
                               {columnOrder.map(key => (
                                  <td key={key} className="px-6 py-4 overflow-hidden text-ellipsis whitespace-nowrap">
                                     {renderCellContent(task, key)}
                                  </td>
                               ))}
                            </tr>
                         );
                      })}
                   </tbody>
                </table>
                {filteredTasks.length === 0 && (
                   <div className="p-12 text-center text-gray-400 w-full">
                       {Object.keys(activeFilters).length > 0 ? 'No tasks match current filters.' : 'No tasks found in this project.'}
                   </div>
                )}
            </div>
         </div>

         {/* Floating Bulk Action Bar */}
         {selectedIds.size > 0 && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-6 z-50 animate-in fade-in slide-in-from-bottom-4 border border-slate-700">
               <div className="flex items-center gap-2 text-sm font-semibold border-r border-slate-700 pr-4">
                  <div className="bg-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                     {selectedIds.size}
                  </div>
                  <span>selected</span>
               </div>
               
               <div className="flex items-center gap-3">
                  <select 
                     className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-200"
                     onChange={(e) => {
                        onBulkUpdate(Array.from(selectedIds), { status: e.target.value as TaskStatus });
                        setSelectedIds(new Set()); // Clear selection after action
                     }}
                     value=""
                  >
                     <option value="" disabled>Change Status...</option>
                     {TASK_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>

                  <select 
                     className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-200"
                     onChange={(e) => {
                        onBulkUpdate(Array.from(selectedIds), { priority: e.target.value as Priority });
                        setSelectedIds(new Set()); // Clear selection after action
                     }}
                     value=""
                  >
                     <option value="" disabled>Change Priority...</option>
                     {Object.keys(PRIORITY_COLORS).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
               </div>

               <button 
                  onClick={() => setSelectedIds(new Set())}
                  className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ml-2"
               >
                  <X size={18} />
               </button>
            </div>
         )}
      </div>
   );
};

const GanttView: React.FC<{
   tasks: Task[],
   onEditTask: (t: Task) => void
}> = ({ tasks, onEditTask }) => {
   const [pixelsPerDay, setPixelsPerDay] = useState(40);
   const viewMode = pixelsPerDay >= 18 ? 'Daily' : 'Monthly'; // Threshold for rendering text

   // Constants
   const PIXELS_PER_DAY = pixelsPerDay;
   const ROW_HEIGHT = 48; // h-12 equivalent in px
   
   // 1. Determine Timeline Bounds
   const sortedTasks = useMemo(() => {
       return [...tasks].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
   }, [tasks]);

   const taskDates = tasks.flatMap(t => [new Date(t.startDate), new Date(t.dueDate)]);
   const minDateRaw = taskDates.length ? new Date(Math.min(...taskDates.map(d => d.getTime()))) : new Date();
   const maxDateRaw = taskDates.length ? new Date(Math.max(...taskDates.map(d => d.getTime()))) : new Date();

   // Buffer
   const startDate = new Date(minDateRaw);
   startDate.setDate(startDate.getDate() - (viewMode === 'Daily' ? 5 : 15));
   
   // Normalize Start Date for Monthly view (Snap to 1st of month)
   if (viewMode === 'Monthly') {
      startDate.setDate(1);
   }

   const endDate = new Date(maxDateRaw);
   endDate.setDate(endDate.getDate() + (viewMode === 'Daily' ? 10 : 45));

   // 2. Generate Time Intervals (Columns)
   const columns = [];
   const curr = new Date(startDate);
   let safetyLoopCount = 0;
   
   if (viewMode === 'Daily') {
       while (curr <= endDate && safetyLoopCount < 1000) {
           columns.push(new Date(curr));
           curr.setDate(curr.getDate() + 1);
           safetyLoopCount++;
       }
   } else {
       // Iterate months
       // Since we snapped startDate to 1st, we can just increment months
       while(curr <= endDate && safetyLoopCount < 200) {
          columns.push(new Date(curr));
          curr.setMonth(curr.getMonth() + 1);
          safetyLoopCount++;
       }
   }
   
   const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

   // 3. Pre-calculate Task Positions for Dependencies
   const taskPositions = useMemo(() => {
      const positions = new Map<string, { x: number; width: number; y: number }>();
      sortedTasks.forEach((task, index) => {
          const tStart = new Date(task.startDate);
          const tEnd = new Date(task.dueDate);
          const startOffset = (tStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
          const duration = (tEnd.getTime() - tStart.getTime()) / (1000 * 60 * 60 * 24) + 1;
          
          const left = startOffset * PIXELS_PER_DAY;
          const width = duration * PIXELS_PER_DAY;
          // Row calculation: (index * 48px) + (24px for center) + (12px top padding roughly?)
          // The row container is relative h-12. The bar is absolute top-2 (8px). 
          // So center Y relative to task row start is 8 + 16 (half height of 32px bar) = 24px.
          // Total Y relative to body container = index * 48 + 24.
          const y = index * ROW_HEIGHT + 24; 
          
          positions.set(task.id, { x: left, width, y });
      });
      return positions;
   }, [sortedTasks, startDate, PIXELS_PER_DAY]);


   return (
      <div className="h-full flex flex-col p-6 overflow-hidden">
         {/* Toolbar */}
         <div className="flex justify-between items-center mb-4 px-1">
             <div className="flex items-center gap-2">
                 <button 
                     onClick={() => setPixelsPerDay(prev => Math.max(prev * 0.8, 2))}
                     className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors"
                     title="Zoom Out"
                 >
                     <ZoomOut size={18} />
                 </button>
                 <input 
                     type="range" 
                     min="2" 
                     max="100" 
                     value={pixelsPerDay} 
                     onChange={(e) => setPixelsPerDay(Number(e.target.value))}
                     className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                 />
                 <button 
                     onClick={() => setPixelsPerDay(prev => Math.min(prev * 1.25, 100))}
                     className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors"
                     title="Zoom In"
                 >
                     <ZoomIn size={18} />
                 </button>
                 <span className="text-xs text-gray-400 font-mono w-12 text-center">{Math.round(pixelsPerDay)}px</span>
             </div>

             <div className="bg-white border border-gray-200 rounded-lg flex p-1 shadow-sm">
                <button 
                  onClick={() => setPixelsPerDay(40)} // Preset Daily
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === 'Daily' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-900'}`}
                >Daily</button>
                <button 
                   onClick={() => setPixelsPerDay(5)} // Preset Monthly
                   className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === 'Monthly' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-900'}`}
                >Monthly</button>
             </div>
         </div>

         <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-auto relative">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-gray-50 border-b border-gray-200 flex min-w-max">
               <div className="w-48 flex-shrink-0 p-3 font-semibold text-xs text-gray-500 uppercase border-r border-gray-200 bg-gray-50 sticky left-0 z-30">
                  Task Name
               </div>
               
               {/* Timeline Header */}
               <div className="flex">
                   {viewMode === 'Daily' ? (
                       columns.map((day, i) => (
                           <div key={i} className="flex-shrink-0 border-r border-gray-100 flex flex-col items-center justify-center" style={{ width: PIXELS_PER_DAY }}>
                               <span className="text-[10px] text-gray-400">{day.toLocaleDateString('en-US', { weekday: 'narrow' })}</span>
                               <span className="text-xs font-bold text-gray-700">{day.getDate()}</span>
                           </div>
                       ))
                   ) : (
                       // Monthly Headers
                       columns.map((monthDate, i) => {
                           const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
                           return (
                               <div key={i} className="flex-shrink-0 border-r border-gray-100 flex items-center justify-center font-bold text-xs text-gray-700" 
                                    style={{ width: daysInMonth * PIXELS_PER_DAY }}>
                                   {monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                               </div>
                           )
                       })
                   )}
               </div>
            </div>

            {/* Body */}
            <div className="min-w-max relative">
               
               {/* Dependency Lines Layer REMOVED */}

               {sortedTasks.map((task, index) => {
                  const pos = taskPositions.get(task.id);
                  if (!pos) return null;

                  const colorClass = STATUS_COLORS[task.status].split(' ')[0];

                  return (
                     <div key={task.id} className="flex border-b border-gray-50 hover:bg-gray-50 relative h-12">
                        <div className="w-48 flex-shrink-0 p-3 text-sm font-medium text-gray-700 border-r border-gray-200 bg-white sticky left-0 z-10 flex items-center truncate">
                           {task.title}
                           {task.type === 'Milestone' && <Flag size={12} className="ml-2 text-red-500 fill-red-500" />}
                        </div>
                        <div className="relative flex-grow h-full" style={{ width: totalDays * PIXELS_PER_DAY }}>
                            {/* Grid Lines */}
                           <div className="absolute inset-0 flex pointer-events-none h-full z-0">
                                {viewMode === 'Daily' ? (
                                    Array.from({ length: totalDays }).map((_, i) => (
                                        <div key={i} className="border-r border-gray-50 h-full flex-shrink-0" style={{ width: PIXELS_PER_DAY }}></div>
                                    ))
                                ) : (
                                    columns.map((monthDate, i) => {
                                         const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
                                         return (
                                             <div key={i} className="border-r border-gray-100 h-full flex-shrink-0" style={{ width: daysInMonth * PIXELS_PER_DAY }}></div>
                                         )
                                    })
                                )}
                           </div>
                           
                           {/* Render Task Bar or Milestone Diamond */}
                           {task.type === 'Milestone' ? (
                              // Milestone Rendering (Diamond)
                              <div
                                 onClick={() => onEditTask(task)}
                                 className="absolute top-2.5 w-7 h-7 bg-red-600 rotate-45 cursor-pointer hover:bg-red-700 shadow-md border-2 border-white z-20 flex items-center justify-center"
                                 style={{ left: `${pos.x - 14}px` }} // Center it on the start date
                                 title={`Milestone: ${task.title} (${new Date(task.dueDate).toLocaleDateString()})`}
                              >
                                 {/* Inner dot for detail */}
                                 <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                           ) : (
                              // Standard Task Bar
                              pos.width > 0 && (
                                 <div
                                    onClick={() => onEditTask(task)}
                                    className={`absolute top-2 h-8 rounded-md shadow-sm cursor-pointer hover:brightness-95 transition-all flex items-center px-2 text-xs font-bold truncate text-opacity-80 ${colorClass} ${task.status === 'Done' ? 'opacity-60' : ''} z-10`}
                                    style={{ left: `${pos.x}px`, width: `${pos.width}px` }}
                                 >
                                    <span className="truncate mix-blend-multiply text-black">{task.title}</span>
                                 </div>
                              )
                           )}
                           
                           {/* Label for Milestone (Displayed next to diamond) */}
                           {task.type === 'Milestone' && (
                               <div 
                                  className="absolute top-3 text-xs font-bold text-red-800 z-10 pointer-events-none whitespace-nowrap"
                                  style={{ left: `${pos.x + 20}px` }}
                               >
                                  {task.title}
                               </div>
                           )}

                        </div>
                     </div>
                  );
               })}
            </div>
         </div>
      </div>
   );
};

const IssueLogView: React.FC<{
  issues: Issue[],
  onEditIssue: (i: Issue) => void,
  members: UserType[]
}> = ({ issues, onEditIssue, members }) => {
   // --- Width Persistence ---
   const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
       try {
           const saved = localStorage.getItem('taskflow_issue_ui_v1');
           return saved ? JSON.parse(saved) : {
               title: 250,
               description: 300,
               status: 120,
               priority: 120,
               dateOpened: 120,
               dueDate: 120,
               closedDate: 120,
               reportedBy: 150,
               assignedTo: 150
           };
       } catch (e) {
           return {
               title: 250,
               description: 300,
               status: 120,
               priority: 120,
               dateOpened: 120,
               dueDate: 120,
               closedDate: 120,
               reportedBy: 150,
               assignedTo: 150
           };
       }
   });

   useEffect(() => {
       localStorage.setItem('taskflow_issue_ui_v1', JSON.stringify(columnWidths));
   }, [columnWidths]);

   // --- Order Persistence ---
   const [columnOrder, setColumnOrder] = useState<string[]>(() => {
      try {
         const saved = localStorage.getItem('taskflow_issue_order_v1');
         return saved ? JSON.parse(saved) : ['title', 'description', 'status', 'priority', 'dateOpened', 'dueDate', 'closedDate', 'reportedBy', 'assignedTo'];
      } catch (e) {
         return ['title', 'description', 'status', 'priority', 'dateOpened', 'dueDate', 'closedDate', 'reportedBy', 'assignedTo'];
      }
   });

   useEffect(() => {
      localStorage.setItem('taskflow_issue_order_v1', JSON.stringify(columnOrder));
   }, [columnOrder]);

   // --- Resizing Logic ---
   const [resizing, setResizing] = useState<{ key: string; startX: number; startWidth: number } | null>(null);

   useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
         if (!resizing) return;
         const diff = e.clientX - resizing.startX;
         const newWidth = Math.max(80, resizing.startWidth + diff); 
         setColumnWidths(prev => ({ ...prev, [resizing.key]: newWidth }));
      };

      const handleMouseUp = () => {
         setResizing(null);
         document.body.style.cursor = 'default';
      };

      if (resizing) {
         window.addEventListener('mousemove', handleMouseMove);
         window.addEventListener('mouseup', handleMouseUp);
         document.body.style.cursor = 'col-resize';
      }

      return () => {
         window.removeEventListener('mousemove', handleMouseMove);
         window.removeEventListener('mouseup', handleMouseUp);
         document.body.style.cursor = 'default';
      };
   }, [resizing]);

   const startResize = (e: React.MouseEvent, key: string) => {
      e.preventDefault();
      e.stopPropagation();
      setResizing({ key, startX: e.clientX, startWidth: columnWidths[key] });
   };

   // --- Drag & Drop Logic ---
   const [draggedColumn, setDraggedColumn] = useState<string | null>(null);

   const handleColumnDragStart = (e: React.DragEvent, key: string) => {
      setDraggedColumn(key);
      e.dataTransfer.effectAllowed = 'move';
   };

   const handleColumnDragOver = (e: React.DragEvent, targetKey: string) => {
      e.preventDefault(); 
      if (draggedColumn === targetKey) return;
   };

   const handleColumnDrop = (e: React.DragEvent, targetKey: string) => {
      e.preventDefault();
      if (!draggedColumn || draggedColumn === targetKey) return;

      const newOrder = [...columnOrder];
      const draggedIdx = newOrder.indexOf(draggedColumn);
      const targetIdx = newOrder.indexOf(targetKey);

      newOrder.splice(draggedIdx, 1);
      newOrder.splice(targetIdx, 0, draggedColumn);

      setColumnOrder(newOrder);
      setDraggedColumn(null);
   };

   // --- Filtering Logic ---
   const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
   const [filterOpen, setFilterOpen] = useState<string | null>(null);

   const filteredIssues = useMemo(() => {
      return issues.filter(issue => {
         return Object.entries(activeFilters).every(([key, value]) => {
            if (!value) return true;
            if (key === 'status') return issue.status === value;
            if (key === 'priority') return issue.priority === value;
            const itemVal = String((issue as any)[key] || '').toLowerCase();
            return itemVal.includes((value as string).toLowerCase());
         });
      });
   }, [issues, activeFilters]);

   const clearFilter = (key: string) => {
       const next = {...activeFilters};
       delete next[key];
       setActiveFilters(next);
       setFilterOpen(null);
   };

   // --- Configuration ---
   const COLUMN_LABELS: Record<string, string> = {
     title: 'Issue',
     description: 'Description',
     status: 'Status',
     priority: 'Priority',
     dateOpened: 'Date Opened',
     dueDate: 'Due Date',
     closedDate: 'Closed Date',
     reportedBy: 'Reported By',
     assignedTo: 'Assigned To',
   };

   const renderCellContent = (issue: Issue, key: string) => {
      switch (key) {
        case 'title': 
           return (
             <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
                <span className="font-medium text-gray-900 truncate">{issue.title}</span>
             </div>
           );
        case 'description': 
           return <div className="text-sm text-gray-500 truncate" title={issue.description}>{issue.description}</div>;
        case 'status': 
           return (
               <span className={`px-2 py-1 rounded-full text-xs font-bold 
                  ${issue.status === 'Open' ? 'bg-red-100 text-red-700' : 
                    issue.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'}`
               }>
                  {issue.status}
               </span>
           );
        case 'priority': 
           return <PriorityBadge priority={issue.priority} />;
        case 'dateOpened': 
           return <span className="text-xs text-gray-600 font-mono">{issue.dateOpened}</span>;
        case 'dueDate': 
           return <span className="text-xs text-gray-600 font-mono">{issue.dueDate}</span>;
        case 'closedDate':
           return issue.closedDate ? (
              <div className="flex items-center gap-1 text-green-600 text-xs">
                 <CheckCircle2 size={14} />
                 {issue.closedDate}
              </div>
           ) : <span className="text-gray-400">-</span>;
        case 'reportedBy':
             const reporter = members.find(m => m.name === issue.reportedBy);
             return (
               <div className="flex items-center gap-2">
                 {issue.reportedBy ? <UserAvatar name={issue.reportedBy} color={reporter?.avatarColor} size="sm" /> : null}
                 <span className="text-sm text-gray-700">{issue.reportedBy}</span>
               </div>
             );
        case 'assignedTo':
             const assignee = members.find(m => m.name === issue.assignedTo);
             return (
               <div className="flex items-center gap-2">
                 {issue.assignedTo ? <UserAvatar name={issue.assignedTo} color={assignee?.avatarColor} size="sm" /> : null}
                 <span className="text-sm text-gray-700">{issue.assignedTo || '-'}</span>
               </div>
             );
        default: return null;
      }
   };

   // Render Filter Input based on Column Type
   const renderFilterInput = (key: string) => {
      if (key === 'status') {
          return (
             <select 
                className="w-full p-2 border rounded text-sm text-gray-800 bg-white"
                value={activeFilters[key] || ''}
                onChange={(e) => setActiveFilters({...activeFilters, [key]: e.target.value})}
             >
                 <option value="">All Statuses</option>
                 <option value="Open">Open</option>
                 <option value="In Progress">In Progress</option>
                 <option value="Resolved">Resolved</option>
                 <option value="Closed">Closed</option>
             </select>
          );
      }
      if (key === 'priority') {
          return (
             <select 
                className="w-full p-2 border rounded text-sm text-gray-800 bg-white"
                value={activeFilters[key] || ''}
                onChange={(e) => setActiveFilters({...activeFilters, [key]: e.target.value})}
             >
                 <option value="">All Priorities</option>
                 {Object.keys(PRIORITY_COLORS).map(p => <option key={p} value={p}>{p}</option>)}
             </select>
          );
      }
      if (key.toLowerCase().includes('date')) {
         return (
             <input 
                type="date"
                className="w-full p-2 border rounded text-sm text-gray-800"
                value={activeFilters[key] || ''}
                onChange={(e) => setActiveFilters({...activeFilters, [key]: e.target.value})}
             />
         );
      }
      return (
         <input 
            type="text"
            className="w-full p-2 border rounded text-sm text-gray-800"
            placeholder={`Filter ${COLUMN_LABELS[key]}...`}
            value={activeFilters[key] || ''}
            onChange={(e) => setActiveFilters({...activeFilters, [key]: e.target.value})}
            autoFocus
         />
      );
   };

   return (
      <div className="h-full overflow-y-auto p-6 relative">
         {/* Filter Overlay to close on click outside */}
         {filterOpen && <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(null)}></div>}
         
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-fit min-w-full pb-20">
            <div className="overflow-x-auto">
                <table className="text-left border-collapse" style={{ tableLayout: 'fixed', width: 'max-content' }}>
                   <colgroup>
                      {columnOrder.map(key => (
                         <col key={key} style={{ width: columnWidths[key] }} />
                      ))}
                   </colgroup>
                   <thead>
                      <tr className="bg-red-50 text-red-900 text-xs uppercase tracking-wider border-b border-red-100">
                         {columnOrder.map(key => (
                             <th 
                                key={key} 
                                draggable
                                onDragStart={(e) => handleColumnDragStart(e, key)}
                                onDragOver={(e) => handleColumnDragOver(e, key)}
                                onDrop={(e) => handleColumnDrop(e, key)}
                                className={`relative px-6 py-4 font-semibold group select-none cursor-move transition-opacity ${
                                   draggedColumn === key ? 'opacity-50 bg-red-100' : 'hover:bg-red-100'
                                }`}
                             >
                                <div className="flex items-center justify-between">
                                    <span>{COLUMN_LABELS[key]}</span>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setFilterOpen(filterOpen === key ? null : key); }}
                                        className={`p-1 rounded hover:bg-red-200 transition-colors ${activeFilters[key] ? 'bg-red-200 text-red-800' : 'text-red-300 opacity-0 group-hover:opacity-100'}`}
                                        style={{ opacity: activeFilters[key] ? 1 : undefined }}
                                    >
                                        <Filter size={14} />
                                    </button>
                                </div>
                                
                                {/* Filter Popover */}
                                {filterOpen === key && (
                                    <div 
                                        className="absolute top-full left-0 mt-2 w-56 bg-white shadow-xl rounded-lg border border-gray-200 p-3 z-50 cursor-default"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="mb-2 text-xs font-semibold text-gray-500">Filter by {COLUMN_LABELS[key]}</div>
                                        {renderFilterInput(key)}
                                        {activeFilters[key] && (
                                            <button 
                                                onClick={() => clearFilter(key)}
                                                className="mt-2 text-xs text-red-500 hover:text-red-700 w-full text-right"
                                            >
                                                Clear Filter
                                            </button>
                                        )}
                                    </div>
                                )}

                                <div 
                                   className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-red-300 group-hover:bg-red-200 transition-colors z-10"
                                   onMouseDown={(e) => startResize(e, key)}
                                />
                             </th>
                         ))}
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                      {filteredIssues.map(issue => (
                         <tr 
                            key={issue.id} 
                            onClick={() => onEditIssue(issue)}
                            className="hover:bg-red-50 cursor-pointer transition-colors group"
                         >
                            {columnOrder.map(key => (
                               <td key={key} className="px-6 py-4 overflow-hidden text-ellipsis whitespace-nowrap">
                                  {renderCellContent(issue, key)}
                               </td>
                            ))}
                         </tr>
                      ))}
                   </tbody>
                </table>
                {filteredIssues.length === 0 && (
                   <div className="p-12 text-center text-gray-400 w-full">
                       {Object.keys(activeFilters).length > 0 ? 'No issues match current filters.' : 'No issues found in this project.'}
                   </div>
                )}
            </div>
         </div>
      </div>
   );
};