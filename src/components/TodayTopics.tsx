/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Filter, 
  Check, 
  ChevronUp, 
  ChevronDown, 
  Save, 
  X, 
  Notebook, 
  Tag, 
  AlertCircle
} from 'lucide-react';
import { Topic } from '../types';

export default function TodayTopics() {
  const { 
    topics, 
    addTopic, 
    updateTopic, 
    deleteTopic, 
    completeTopic, 
    reorderTopics,
    showToast,
    checkExpiredTopics
  } = useDashboard();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'expired'>('active');
  const [isAdding, setIsAdding] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');

  // Expiry mode choice
  const [autoDeleteExpired, setAutoDeleteExpired] = useState(() => {
    return localStorage.getItem('auto_delete_expired_topics') === 'true';
  });

  const toggleAutoDeleteExpired = () => {
    const nextValue = !autoDeleteExpired;
    setAutoDeleteExpired(nextValue);
    localStorage.setItem('auto_delete_expired_topics', String(nextValue));
    showToast(`Expired topics will now be ${nextValue ? 'automatically deleted' : 'moved to Expired tasks list'}.`, 'info');
    setTimeout(() => {
      checkExpiredTopics();
    }, 500);
  };

  // Date calculation
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  // Run the check when the page mounts
  useEffect(() => {
    checkExpiredTopics();
  }, []);

  // Search and Filter logic
  const filteredTopics = topics
    .filter((t) => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.subject.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      const isExpired = !t.completed && t.deadline && t.deadline < todayStr;
      
      if (filterStatus === 'all') return true;
      if (filterStatus === 'completed') return t.completed;
      if (filterStatus === 'expired') return isExpired;
      if (filterStatus === 'active') return !t.completed && !isExpired;
      return true;
    })
    .sort((a, b) => a.order - b.order);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast("❌ Topic title cannot be empty!", "error");
      return;
    }
    if (!subject.trim()) {
      showToast("❌ Subject / Category cannot be empty!", "error");
      return;
    }

    if (editingTopicId) {
      updateTopic(editingTopicId, {
        title,
        subject,
        priority,
        deadline,
        notes
      });
      showToast("✏️ Topic updated successfully!", "success");
      setEditingTopicId(null);
    } else {
      addTopic({
        title,
        subject,
        priority,
        deadline: deadline || new Date().toISOString().split('T')[0],
        notes
      });
    }

    // Reset Form
    setTitle('');
    setSubject('');
    setPriority('medium');
    setDeadline('');
    setNotes('');
    setIsAdding(false);
  };

  const handleEdit = (topic: Topic) => {
    setEditingTopicId(topic.id);
    setTitle(topic.title);
    setSubject(topic.subject);
    setPriority(topic.priority);
    setDeadline(topic.deadline);
    setNotes(topic.notes);
    setIsAdding(true);
  };

  const handleCancel = () => {
    setEditingTopicId(null);
    setTitle('');
    setSubject('');
    setPriority('medium');
    setDeadline('');
    setNotes('');
    setIsAdding(false);
  };

  // Up/down buttons for simulated drag-and-drop
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    reorderTopics(index, index - 1);
  };

  const handleMoveDown = (index: number) => {
    if (index === filteredTopics.length - 1) return;
    reorderTopics(index, index + 1);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8 text-slate-100 min-h-screen">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest font-semibold font-medium">Today's Agenda</span>
          <h2 className="text-2xl md:text-3.5xl font-extrabold tracking-tight mt-1 text-slate-100 font-sans">
            Curriculum Checklist
          </h2>
          <p className="text-sm text-slate-400 mt-1.5 font-sans leading-none">
            Break your daily workload into digestible study loops. Keep active notes for reinforcement.
          </p>
        </div>
        <button
          onClick={() => { setIsAdding(true); setEditingTopicId(null); }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/20 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Topic</span>
        </button>
      </div>

      {/* Input Form drawer / modal */}
      {isAdding && (
        <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-xl space-y-4 backdrop-blur-sm animate-slideIn">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-200">
              {editingTopicId ? "✏️ Edit Topic Loop" : "📝 Create A Study Loop"}
            </h3>
            <button onClick={handleCancel} className="text-slate-500 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            <div className="space-y-1.5Col">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Topic Title</label>
              <input
                type="text"
                placeholder="e.g. DSA Arrays or ML Gradient Descent"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950/45 border border-slate-900/80 text-white focus:border-indigo-500/50 outline-none text-sm font-sans"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Subject / Category</label>
              <input
                type="text"
                placeholder="e.g. Data Structures, Statistics, Web Dev"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950/45 border border-slate-900/80 text-white focus:border-indigo-500/50 outline-none text-sm font-sans"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950/45 border border-slate-900/80 text-white focus:border-indigo-500/50 outline-none text-sm font-sans"
              >
                <option value="high">🔴 High Priority (ASAP)</option>
                <option value="medium">🟡 Medium Priority (Normal)</option>
                <option value="low">🔵 Low Priority (Flexible)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Completion Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950/45 border border-slate-900/80 text-white focus:border-indigo-500/50 outline-none text-sm font-sans"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Topic Notes & Reference Links</label>
              <textarea
                rows={3}
                placeholder="Quick study findings, formulas, key parameters, questions to recall..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950/45 border border-slate-900/80 text-white focus:border-indigo-500/50 outline-none text-sm font-sans resize-none"
              />
            </div>

            <div className="md:col-span-2 pt-2 flex items-center justify-end gap-3.5">
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 py-2.5 rounded-xl border border-slate-900 hover:bg-slate-950 text-slate-400 text-sm transition font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow shadow-indigo-600/20 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{editingTopicId ? "Save Changes" : "Create Topic"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Panel */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-slate-900/40 border border-slate-800 rounded-2xl shadow-md backdrop-blur-sm">
        {/* Left search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search titles or subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/35 border border-slate-900 text-white focus:border-indigo-500/30 outline-none text-xs font-sans"
          />
        </div>

        {/* Right filter choices */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            {[
              { id: 'all', label: 'All Topics' },
              { id: 'active', label: 'Active' },
              { id: 'completed', label: 'Completed' },
              { id: 'expired', label: 'Expired' }
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setFilterStatus(opt.id as any)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition cursor-pointer shrink-0 border
                  ${filterStatus === opt.id 
                    ? 'border-indigo-500/35 text-indigo-400 bg-indigo-500/10' 
                    : 'border-slate-900 text-slate-400 hover:text-white hover:bg-slate-950/40'
                  }
                `}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-800 hidden md:block" />

          {/* Expiry Mode Switcher */}
          <button
            onClick={toggleAutoDeleteExpired}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono transition border cursor-pointer shrink-0 ${
              autoDeleteExpired 
                ? 'bg-rose-950/40 border-rose-500/25 text-rose-400 hover:bg-rose-950/60' 
                : 'bg-slate-950/40 border-slate-900 text-slate-400 hover:text-white hover:bg-slate-950/60'
            }`}
            title="Toggle whether expired topics are automatically deleted or kept in Expired topics section"
          >
            <span>⏳ Expiry Mode:</span>
            <span className="font-bold uppercase tracking-wider">
              {autoDeleteExpired ? 'Auto-Delete' : 'Move to Expired'}
            </span>
          </button>
        </div>
      </div>

      {/* Topics list layout */}
      <div className="space-y-3.5">
        {filteredTopics.length === 0 ? (
          <div className="p-12 bg-slate-900/20 border border-slate-800 rounded-3xl text-center shadow-lg">
            <Notebook className="w-12 h-12 text-slate-600 mx-auto stroke-thin mb-4" />
            <h4 className="text-base font-bold text-slate-300">No matching study loops</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1.5 font-sans leading-relaxed">
              Define a new subject study block or expand filters to view more items.
            </p>
          </div>
        ) : (
          filteredTopics.map((item, index) => {
            const isHigh = item.priority === 'high';
            const isLow = item.priority === 'low';
            
            return (
              <div 
                key={item.id}
                className={`
                  p-5 rounded-2xl bg-slate-900/50 border transition-all duration-150 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 shadow hover:border-slate-700/60 backdrop-blur-sm
                  ${item.completed ? 'border-slate-900 opacity-75 backdrop-blur-sm bg-slate-900/30' : 'border-slate-800'}
                `}
              >
                {/* Priority Left Indicator Bar */}
                <div className={`absolute left-0 inset-y-0 w-1 ${isHigh ? 'bg-rose-500' : isLow ? 'bg-sky-500' : 'bg-amber-500'}`} />

                {/* Left check status and descriptions */}
                <div className="flex items-start gap-4 flex-1">
                  <button 
                    onClick={() => completeTopic(item.id)}
                    className={`
                      w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 cursor-pointer mt-1 relative overflow-hidden transition-all duration-150
                      ${item.completed 
                        ? 'bg-indigo-600/30 border-indigo-500/60 text-indigo-400' 
                        : 'border-slate-700 hover:border-slate-500'
                      }
                    `}
                  >
                    {item.completed && <Check className="w-4 h-4" />}
                  </button>

                  <div className="space-y-1 overflow-hidden">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-900 border border-slate-800 text-slate-400">
                        {item.subject}
                      </span>
                      <span className={`
                        px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border
                        ${isHigh 
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                          : isLow 
                          ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' 
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        }
                      `}>
                        {item.priority}
                      </span>
                      {item.deadline && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          📅 Due: {item.deadline}
                        </span>
                      )}
                    </div>
                    <h4 className={`text-sm md:text-base font-bold font-sans ${item.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                      {item.title}
                    </h4>
                    {item.notes && (
                      <p className="text-xs text-slate-400 font-sans leading-relaxed pt-1.5 border-t border-slate-900/60 mt-1 max-w-xl">
                        {item.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2 shrink-0 justify-end md:justify-center border-t border-slate-950/60 md:border-none pt-3 md:pt-0">
                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-0.5 border border-slate-900/80 p-0.5 rounded-lg bg-slate-950/30">
                    <button 
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1 hover:text-indigo-400 disabled:opacity-20 disabled:hover:text-slate-500 transition cursor-pointer"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleMoveDown(index)}
                      disabled={index === filteredTopics.length - 1}
                      className="p-1 hover:text-indigo-400 disabled:opacity-20 disabled:hover:text-slate-500 transition cursor-pointer"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Edit action */}
                  <button 
                    onClick={() => handleEdit(item)}
                    className="p-2 border border-slate-900 hover:border-slate-800 bg-slate-950/30 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Delete action */}
                  <button 
                    onClick={() => deleteTopic(item.id)}
                    className="p-2 border border-slate-900 hover:border-rose-950 bg-slate-950/30 rounded-lg text-slate-500 hover:text-rose-400 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Expired Tasks Section */}
      {!autoDeleteExpired && topics.filter(t => !t.completed && t.deadline && t.deadline < todayStr).length > 0 && (
        <div className="p-6 bg-rose-500/5 border border-rose-500/15 rounded-2xl space-y-4 shadow-sm animate-slideUp mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-bold uppercase tracking-wider">
                <AlertCircle className="w-4 h-4" />
                <span>Expired Tasks & Topics ({topics.filter(t => !t.completed && t.deadline && t.deadline < todayStr).length})</span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                These topics passed their deadlines without completion. Please reschedule, delete, or finish them!
              </p>
            </div>
          </div>
          
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 scrollbar-thin">
            {topics.filter(t => !t.completed && t.deadline && t.deadline < todayStr).map((item) => (
              <div 
                key={item.id}
                className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl flex items-center justify-between gap-3 relative overflow-hidden"
              >
                <div className="absolute left-0 inset-y-0 w-1 bg-rose-500" />
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => completeTopic(item.id)}
                    className="w-5 h-5 rounded border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold hover:bg-rose-500/20 cursor-pointer"
                    title="Mark Completed"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <div>
                    <h5 className="text-xs font-bold text-slate-200">{item.title}</h5>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-mono uppercase bg-rose-500/10 text-rose-400 px-1 py-0.5 rounded border border-rose-500/20">
                        {item.subject}
                      </span>
                      <span className="text-[9px] text-rose-400 font-mono">
                        📅 Due: {item.deadline} (Expired)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-1.5 border border-slate-900 bg-slate-950/30 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                    title="Reschedule / Edit"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteTopic(item.id)}
                    className="p-1.5 border border-slate-900 bg-slate-950/30 text-slate-500 hover:text-rose-400 rounded-lg transition cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
