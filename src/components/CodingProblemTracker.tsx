/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Code, 
  Award, 
  Flame, 
  PlusCircle,
  HelpCircle,
  Clock,
  ExternalLink,
  BookOpen,
  Search,
  Filter
} from 'lucide-react';
import { CodingProblem } from '../types';

export default function CodingProblemTracker() {
  const { problems, addProblem, updateProblem, deleteProblem, stats } = useDashboard();

  // Form states
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<'LeetCode' | 'GeeksforGeeks' | 'CodeStudio' | 'Other'>('LeetCode');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  // Topic metrics
  const getTopicCounts = () => {
    const counts: Record<string, number> = {};
    problems.forEach(p => {
      const t = p.topic || 'General';
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts).sort((a,b) => b[1] - a[1]);
  };

  const topicTotals = getTopicCounts();
  const strongestTopic = topicTotals[0] ? topicTotals[0][0] : "None Yet";
  const weakestTopic = topicTotals.length > 1 ? topicTotals[topicTotals.length - 1][0] : "None Yet";

  // Difficulty counts
  const easyCount = problems.filter(p => p.difficulty === 'easy').length;
  const mediumCount = problems.filter(p => p.difficulty === 'medium').length;
  const hardCount = problems.filter(p => p.difficulty === 'hard').length;
  const totalCount = problems.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !topic.trim()) return;

    addProblem({
      title,
      platform,
      difficulty,
      topic: topic.trim(),
      notes,
      revisionMarked: false
    });

    setTitle('');
    setTopic('');
    setNotes('');
    setIsAdding(false);
  };

  // Toggle Revision MARK
  const toggleRevision = (id: string, current: boolean) => {
    updateProblem(id, { revisionMarked: !current });
  };

  // Search logic
  const filteredProblems = problems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiff = selectedDifficulty === 'all' || p.difficulty === selectedDifficulty;
    return matchesSearch && matchesDiff;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8 text-white min-h-screen">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-amber-500 uppercase tracking-widest font-semibold font-bold">Competitive Programming</span>
          <h2 className="text-2xl md:text-3.5xl font-extrabold tracking-tight mt-1 text-slate-100 font-sans leading-none">
            DSA Problem Archive
          </h2>
          <p className="text-sm text-slate-400 mt-2 font-sans">
            Maintain active muscle memory for tech interviews. Track platform progress, difficulties, and bookmarks.
          </p>
        </div>

        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 text-white font-bold font-sans text-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Log Solved Problem</span>
        </button>
      </div>

      {/* Analytics Bento header Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* LeetCode stats overview dial bar */}
        <div className="md:col-span-2 p-6 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-4 flex flex-col justify-between shadow-xl backdrop-blur-sm">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500">Distribution Overview</span>
            <h3 className="text-base font-bold text-slate-200 mt-1">Algorithm metrics</h3>
          </div>

          <div className="space-y-3.5 pb-2">
            <div>
              <div className="flex justify-between items-center text-xs font-mono text-emerald-400">
                <span>🟢 Easy ({easyCount})</span>
                <span>{totalCount > 0 ? Math.round((easyCount / totalCount) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-1.5 border border-slate-800">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${totalCount > 0 ? (easyCount / totalCount)*100 : 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-mono text-amber-500">
                <span>🟡 Medium ({mediumCount})</span>
                <span>{totalCount > 0 ? Math.round((mediumCount / totalCount) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-1.5 border border-slate-800">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${totalCount > 0 ? (mediumCount / totalCount)*100 : 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-mono text-rose-500">
                <span>🔴 Hard ({hardCount})</span>
                <span>{totalCount > 0 ? Math.round((hardCount / totalCount) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-1.5 border border-slate-800">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: `${totalCount > 0 ? (hardCount / totalCount)*100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Streaks stats */}
        <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl flex flex-col justify-between shadow-xl backdrop-blur-sm">
          <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500">Solve Consistency</span>
          <div className="text-center">
            <h3 className="text-xs text-slate-400">Coding Streak</h3>
            <div className="text-4.5xl md:text-5xl font-black text-amber-500 flex items-center justify-center gap-2 mt-2 leading-none">
              <Flame className="w-8 h-8 text-amber-500 animate-pulse" />
              <span>{stats.streakDays}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-mono">DAYS RESOLVING ERRORS</p>
          </div>
          <div className="bg-slate-950/40 p-2 border border-slate-800 rounded-xl text-[10px] text-slate-400 leading-tight">
             Streak increases level XP and rewards badge unlocks instantly!
          </div>
        </div>

        {/* Strongest and Weakest topics */}
        <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl flex flex-col justify-between shadow-xl backdrop-blur-sm">
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#d97706]">Focus Vectors</span>
          <div className="space-y-4 my-2">
            <div>
              <p className="text-[10px] text-emerald-400 font-mono">🟢 STRONGEST AREA</p>
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-tight mt-0.5">{strongestTopic}</h4>
            </div>
            <div>
              <p className="text-[10px] text-rose-400 font-mono">🔴 FOR REVISION</p>
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-tight mt-0.5">{weakestTopic}</h4>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-sans leading-relaxed pt-2 border-t border-slate-900/40">
            Computed dynamically based on problem tags categorized in your history.
          </p>
        </div>
      </div>

      {/* Log problem overlay wrapper form */}
      {isAdding && (
        <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-xl space-y-4 backdrop-blur-sm animate-slideIn">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-200">🤖 Archive Algorithm Practice</h3>
            <button onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-white transition cursor-pointer">
              X
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Problem Name</label>
              <input 
                type="text" 
                placeholder="e.g. 1. Two Sum, 1143. Longest Common Subsequence..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950/40 border border-slate-900 outline-none text-white focus:border-amber-500/50 text-sm font-sans"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Concept / Topic Tag</label>
              <input 
                type="text" 
                placeholder="e.g. Arrays, DP, Strings, DFS, Hash-Table..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950/40 border border-slate-900 outline-none text-white focus:border-amber-500/50 text-sm font-sans"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Coding Platform</label>
              <select 
                value={platform}
                onChange={(e) => setPlatform(e.target.value as any)}
                className="w-full p-3 rounded-xl bg-slate-950/40 border border-slate-900 outline-none text-white focus:border-amber-500/50 text-sm font-sans"
              >
                <option value="LeetCode">LeetCode</option>
                <option value="GeeksforGeeks">GeeksforGeeks</option>
                <option value="CodeStudio">CodeStudio</option>
                <option value="Other">Other Platform</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Difficulty Tier</label>
              <select 
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full p-3 rounded-xl bg-slate-950/40 border border-slate-900 outline-none text-white focus:border-amber-500/50 text-sm font-sans"
              >
                <option value="easy">🟢 Easy</option>
                <option value="medium">🟡 Medium</option>
                <option value="hard">🔴 Hard</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Algorithmic complexity notes (Optional)</label>
              <textarea 
                rows={3}
                placeholder="Record Time & Space complexity metrics. E.g. O(N log N) using standard sorting. Mention edge cases..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950/40 border border-slate-900 outline-none text-white focus:border-amber-500/50 text-sm font-sans resize-none"
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-900 hover:bg-slate-950 text-xs text-slate-400"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs text-white font-bold"
              >
                Archive Problem Log
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and search controllers */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-slate-900/40 border border-slate-800 rounded-2xl shadow backdrop-blur-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search problems, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/35 border border-slate-800 text-white focus:border-amber-500/30 outline-none text-xs font-sans"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          {[
            { id: 'all', label: 'All Difficulty' },
            { id: 'easy', label: '🟢 Easy' },
            { id: 'medium', label: '🟡 Medium' },
            { id: 'hard', label: '🔴 Hard' }
          ].map(lvl => (
            <button
              key={lvl.id}
              onClick={() => setSelectedDifficulty(lvl.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-sans font-medium border cursor-pointer ${
                selectedDifficulty === lvl.id 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                  : 'border-slate-800 text-slate-400 hover:bg-slate-950/40'
              }`}
            >
              {lvl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid problems list */}
      <div className="space-y-4">
        {filteredProblems.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/20 border border-slate-800 rounded-3xl">
            <Code className="w-12 h-12 text-slate-600 mx-auto stroke-thin mb-3" />
            <h4 className="text-base font-bold text-slate-400">No coding files archived</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
              Log solved problems above to build your structural analytics distribution.
            </p>
          </div>
        ) : (
          filteredProblems.map((prob) => {
            const isHard = prob.difficulty === 'hard';
            const isMed = prob.difficulty === 'medium';
            return (
              <div 
                key={prob.id}
                className="p-5 bg-slate-900/50 border border-slate-800 hover:border-slate-700/60 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow relative backdrop-blur-sm"
              >
                {/* Platform tag line indicator */}
                <div className="flex items-start gap-3.5 flex-1">
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border uppercase font-mono font-black text-xs
                    ${isHard ? 'bg-rose-500/5 border-rose-500/15 text-rose-400' : isMed ? 'bg-amber-500/5 border-amber-500/15 text-amber-400' : 'bg-emerald-500/5 border-emerald-500/15 text-emerald-400'}
                  `}>
                    {prob.platform.substring(0,2)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2Item font-mono">
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] text-slate-400 font-bold uppercase tracking-wider">{prob.platform}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] text-slate-400 font-bold uppercase tracking-wider">{prob.topic}</span>
                      <span className="text-[10px] text-slate-500">Solved: {prob.solvedAt}</span>
                    </div>
                    <h4 className="text-sm md:text-base font-bold text-slate-200">
                      {prob.title}
                    </h4>
                    {prob.notes && (
                      <p className="text-xs text-slate-400 bg-slate-950/20 p-2.5 rounded-lg border border-slate-900 mt-2 max-w-2xl font-mono">
                        {prob.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Revision mark & deletion actions */}
                <div className="flex items-center gap-3 justify-end md:justify-center shrink-0 pt-3 md:pt-0 border-t border-slate-950/50 md:border-none">
                  {/* Revision Trigger */}
                  <button
                    onClick={() => toggleRevision(prob.id, prob.revisionMarked)}
                    className={`px-3 py-1.5 border hover:text-white rounded-lg text-[10px] font-mono transition cursor-pointer flex items-center gap-1.5 ${
                      prob.revisionMarked 
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                        : 'border-slate-900 text-slate-500 hover:bg-slate-950/30'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{prob.revisionMarked ? 'In Revision' : 'Revisit Later'}</span>
                  </button>

                  <button 
                    onClick={() => deleteProblem(prob.id)}
                    className="p-1.5 border border-slate-900 text-slate-600 hover:text-rose-400 rounded-lg hover:border-slate-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
