/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { 
  Plus, 
  Trash2, 
  ExternalLink, 
  Github, 
  CheckSquare, 
  FolderPlus,
  Play,
  CheckCircle,
  Clock,
  Briefcase,
  ChevronRight,
  PlusCircle,
  ChevronLeft
} from 'lucide-react';
import { Project, Subtask } from '../types';

export default function ProjectTracker() {
  const { projects, addProject, updateProject, deleteProject, toggleProjectSubtask } = useDashboard();

  // Form states
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [techStr, setTechStr] = useState('');
  const [deadline, setDeadline] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [demoLink, setDemoLink] = useState('');
  const [subtaskStr, setSubtaskStr] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Split tech tags and subtasks
    const technologies = techStr.split(',').map(t => t.trim()).filter(Boolean);
    const subtaskTitles = subtaskStr.split(',').map(s => s.trim()).filter(Boolean);
    const subtasks: Subtask[] = subtaskTitles.map((title, idx) => ({
      id: `sub_${idx}_${Date.now()}`,
      title,
      completed: false
    }));

    addProject({
      name,
      description,
      technologies,
      deadline,
      status: 'Planned',
      githubLink: githubLink || undefined,
      demoLink: demoLink || undefined,
      subtasks
    });

    // Reset Form
    setName('');
    setDescription('');
    setTechStr('');
    setDeadline('');
    setGithubLink('');
    setDemoLink('');
    setSubtaskStr('');
    setIsAdding(false);
  };

  // Status transitions
  const moveStatus = (id: string, newStatus: 'Planned' | 'In Progress' | 'Completed') => {
    updateProject(id, { status: newStatus });
  };

  // Kanban status columns
  const columns = [
    { id: 'Planned' as const, label: 'Planned / Backlog', color: 'border-sky-500/20 text-sky-400 bg-sky-500/5' },
    { id: 'In Progress' as const, label: 'In Active Sprint', color: 'border-amber-500/20 text-amber-500 bg-amber-500/5' },
    { id: 'Completed' as const, label: 'Shipped / Completed', color: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8 text-white min-h-screen">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-purple-400 uppercase tracking-widest font-semibold font-bold">Project Desk</span>
          <h2 className="text-2xl md:text-3.5xl font-extrabold tracking-tight mt-1 text-slate-100 font-sans leading-none">
            Productivity Kanban
          </h2>
          <p className="text-sm text-slate-400 mt-2 font-sans">
            Oversee portfolio timelines, test specifications, and repository deployments.
          </p>
        </div>

        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold font-sans text-xs transition active:scale-95"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Launch New Project</span>
        </button>
      </div>

      {/* Addition Drawer */}
      {isAdding && (
        <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-xl space-y-4 backdrop-blur-sm animate-slideIn">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-200">🚀 Initiate Project Spec</h3>
            <button onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-white transition">X</button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Project Name</label>
              <input 
                type="text" 
                placeholder="e.g. AI Portfolio summarizer, LeetCode Analyzer..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950/40 border border-slate-900 outline-none text-white focus:border-purple-500/50 text-sm font-sans"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Target Deadline</label>
              <input 
                type="date" 
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950/40 border border-slate-900 outline-none text-white focus:border-purple-500/50 text-sm font-sans"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Technologies Used (Comma-separated)</label>
              <input 
                type="text" 
                placeholder="React, Tailwind, Node, Gemini"
                value={techStr}
                onChange={(e) => setTechStr(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950/40 border border-slate-900 outline-none text-white focus:border-purple-500/50 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Sprint Subtasks (Comma-separated)</label>
              <input 
                type="text" 
                placeholder="Draft wireframe, Setup context API, Build models, Deploy"
                value={subtaskStr}
                onChange={(e) => setSubtaskStr(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950/40 border border-slate-900 outline-none text-white focus:border-purple-500/50 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">GitHub Link</label>
              <input 
                type="url" 
                placeholder="https://github.com/your-username/repo"
                value={githubLink}
                onChange={(e) => setGithubLink(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950/40 border border-slate-900 outline-none text-white focus:border-purple-500/50 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Live Demo Link</label>
              <input 
                type="url" 
                placeholder="https://your-app.live"
                value={demoLink}
                onChange={(e) => setDemoLink(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950/40 border border-slate-900 outline-none text-white focus:border-purple-500/50 text-sm"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Description</label>
              <textarea 
                rows={3} 
                placeholder="Overview of project architectures, tech integration, modules..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950/40 border border-slate-900 outline-none text-white focus:border-purple-500/50 text-sm resize-none"
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-900 bg-slate-950/20 text-xs text-slate-400"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-xs text-white font-bold"
              >
                Initiate Project Spec
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Kanban Board Grid columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {columns.map((col) => {
          const colProjects = projects.filter(p => p.status === col.id);
          const isComp = col.id === 'Completed';

          return (
            <div key={col.id} className="space-y-4">
              {/* Column Label */}
              <div className={`p-4 border rounded-2xl flex justify-between items-center ${col.color}`}>
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest">{col.label}</h3>
                <span className="text-xs font-mono font-black py-0.5 px-2.5 bg-slate-950/40 rounded-full border border-slate-900/30">
                  {colProjects.length}
                </span>
              </div>

              {/* Column Cards */}
              <div className="space-y-4 min-h-[480px] bg-slate-900/10 border border-dashed border-slate-800 p-3 rounded-2xl">
                {colProjects.length === 0 ? (
                   <div className="p-8 text-center text-slate-600 text-xs font-sans mt-4">
                    Empty column
                  </div>
                ) : (
                  colProjects.map((proj) => {
                    return (
                      <div 
                        key={proj.id}
                        className="p-5 bg-slate-900/55 border border-slate-800 hover:border-slate-700/60 rounded-2xl space-y-4 shadow relative backdrop-blur-sm"
                      >
                        {/* Header card name */}
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="text-sm md:text-base font-bold text-slate-200 font-sans tracking-tight">{proj.name}</h4>
                            <button 
                              onClick={() => deleteProject(proj.id)}
                              className="text-slate-600 hover:text-rose-400 p-1.5 rounded-lg border border-transparent hover:border-slate-900 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 font-sans leading-relaxed">{proj.description}</p>
                        </div>

                        {/* Tech Tags */}
                        {proj.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {proj.technologies.map((tech, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-slate-950 text-[9px] font-mono border border-slate-900 text-slate-500">
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Expandable tasks checkboxes */}
                        {proj.subtasks.length > 0 && (
                          <div className="space-y-2 pt-1.5 border-t border-slate-950/80">
                            <p className="text-[10px] font-mono uppercase text-slate-500 leading-none">Sprint Roadmap</p>
                            <div className="space-y-1.5">
                              {proj.subtasks.map((task) => (
                                <div key={task.id} className="flex items-center gap-2">
                                  <button 
                                    type="button"
                                    onClick={() => toggleProjectSubtask(proj.id, task.id)}
                                    className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition ${
                                      task.completed ? 'bg-purple-600/30 border-purple-500 text-purple-400' : 'border-slate-800 hover:border-slate-500'
                                    }`}
                                  >
                                    {task.completed && <CheckCircle className="w-3 h-3 text-purple-400" />}
                                  </button>
                                  <span className={`text-xs font-sans mt-0.5 leading-none ${task.completed ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                                    {task.title}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Interactive dynamic progress progress bar */}
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-[10px] font-mono text-slate-500">
                            <span>SHIPPED INTEGRITY</span>
                            <span className="font-bold text-purple-400">{proj.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900">
                            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-300" style={{ width: `${proj.progress}%` }} />
                          </div>
                        </div>

                        {/* Links and movements controllers */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-950/50 flex-wrap gap-2">
                          <div className="flex gap-2">
                            {proj.githubLink && (
                              <a href={proj.githubLink} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white transition">
                                <Github className="w-4 h-4" />
                              </a>
                            )}
                            {proj.demoLink && (
                              <a href={proj.demoLink} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white transition">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>

                          {/* Move selectors */}
                          <div className="flex gap-1">
                            {col.id !== 'Planned' && (
                              <button 
                                onClick={() => moveStatus(proj.id, col.id === 'Completed' ? 'In Progress' : 'Planned')}
                                className="p-1 px-1.5 border border-slate-900 hover:border-slate-800 bg-slate-950/20 text-[10px] text-slate-400 rounded-lg flex items-center gap-1 transition cursor-pointer"
                              >
                                <ChevronLeft className="w-3 h-3" />
                                <span>Back</span>
                              </button>
                            )}
                            {col.id !== 'Completed' && (
                              <button 
                                onClick={() => moveStatus(proj.id, col.id === 'Planned' ? 'In Progress' : 'Completed')}
                                className="p-1 px-1.5 border border-purple-500/10 hover:border-purple-500/25 bg-purple-500/5 text-[10px] text-purple-400 rounded-lg flex items-center gap-1 transition cursor-pointer"
                              >
                                <span>Advance</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
