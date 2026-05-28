/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { 
  TrendingUp, 
  Sparkles, 
  Activity, 
  Compass, 
  Info, 
  Layers, 
  Award, 
  FileText,
  HelpCircle,
  BrainCircuit,
  PieChart
} from 'lucide-react';
import Markdown from 'react-markdown';

interface AIResponse {
  headline: string;
  summary: string;
  points: string[];
  additionalMarkdown: string;
}

export default function ProgressAnalytics() {
  const { topics, problems, projects, stats } = useDashboard();
  const [loading, setLoading] = useState(false);
  const [aiReport, setAiReport] = useState<AIResponse | null>(null);
  const [errorStr, setErrorStr] = useState<string | null>(null);

  // Math totals calculation
  const totalSolved = problems.length;
  const totalMins = stats.sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalHoursStr = (totalMins / 60).toFixed(1);

  const completedCount = topics.filter(t => t.completed).length;
  const pendingCount = topics.length - completedCount;
  const completionRate = topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0;

  // Retrieve customized Gemini Performance Audit
  const handleAiAudit = async () => {
    setLoading(true);
    setErrorStr(null);
    try {
      // Package actual database metrics to pass along to Gemini
      const problemStats = {
        total: totalSolved,
        easy: problems.filter(p => p.difficulty === 'easy').length,
        medium: problems.filter(p => p.difficulty === 'medium').length,
        hard: problems.filter(p => p.difficulty === 'hard').length,
        platform_distribution: {
          leetcode: problems.filter(p => p.platform === 'LeetCode').length,
          gfg: problems.filter(p => p.platform === 'GeeksforGeeks').length,
          codestudio: problems.filter(p => p.platform === 'CodeStudio').length,
        }
      };

      const topicsSummary = topics.map(t => ({
        title: t.title,
        subject: t.subject,
        completed: t.completed,
        priority: t.priority
      }));

      const activeProjects = projects.map(p => ({
        name: p.name,
        progress: p.progress,
        status: p.status,
        subtasks_total: p.subtasks.length,
        subtasks_done: p.subtasks.filter(s => s.completed).length
      }));

      const sessionsSummary = stats.sessions.map(s => ({
        date: s.date,
        minutes: s.durationMinutes,
        pomodoros: s.pomodorosCompleted
      }));

      const response = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'performance_analysis',
          topics: topicsSummary,
          problemStats,
          studySessions: sessionsSummary,
          projects: activeProjects
        })
      });

      if (!response.ok) {
        throw new Error('Failed to synchronize AI evaluation. Please ensure server is running.');
      }

      const data = await response.json();
      setAiReport(data);
    } catch (err: any) {
      console.error(err);
      setErrorStr(err.message || 'Audit synthesis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8 text-white min-h-screen">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-indigo-400 tracking-widest uppercase font-semibold font-bold">Scientific Insights</span>
          <h2 className="text-2xl md:text-3.5xl font-extrabold tracking-tight mt-1 text-slate-100 font-sans leading-none">
            Learning Analytics Dash
          </h2>
          <p className="text-sm text-slate-400 mt-2 font-sans">
            Evaluate time allocations, complete algorithms feedback, and synthesize AI-generated study recommendations.
          </p>
        </div>

        <button 
          onClick={handleAiAudit}
          disabled={loading}
          className="flex items-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 text-white font-bold font-sans text-xs transition active:scale-95 shadow shadow-violet-600/15 disabled:opacity-40"
        >
          <BrainCircuit className="w-4 h-4 text-violet-300 animate-spinSlow" />
          <span>{loading ? 'Synthesizing Audit...' : 'Synthesize AI Performance Audit'}</span>
        </button>
      </div>

      {/* Grid: SVG Graphs & Meters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric Card 1: Study hours spent */}
        <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-4 shadow-xl backdrop-blur-sm">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Volume tracker</span>
            <span className="text-rose-400 text-xs">⏰ Total</span>
          </div>
          <div>
            <h3 className="text-xs text-slate-400">Total Hours Logged</h3>
            <h2 className="text-4.5xl md:text-5xl font-black mt-1 text-indigo-400 tracking-tight leading-none">{totalHoursStr}<span className="text-xs font-mono font-normal text-slate-500 ml-1">HRS</span></h2>
          </div>
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
            <span>Sessions archived</span>
            <span className="font-mono text-slate-300 font-bold">{stats.sessions.length} entries</span>
          </div>
        </div>

        {/* Metric Card 2: Algorithms solved */}
        <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-4 shadow-xl backdrop-blur-sm">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Algorithmic Index</span>
            <span className="text-amber-400 text-xs">🚀 Solved</span>
          </div>
          <div>
            <h3 className="text-xs text-slate-400">Total Solved Problems</h3>
            <h2 className="text-4.5xl md:text-5xl font-black mt-1 text-amber-500 tracking-tight leading-none">{totalSolved}<span className="text-xs font-mono font-normal text-slate-500 ml-1">DSA</span></h2>
          </div>
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
            <span>Platform consistency</span>
            <span className="font-mono text-slate-300 font-bold">Standard 4 platforms</span>
          </div>
        </div>

        {/* Metric Card 3: Topic execution */}
        <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-4 shadow-xl backdrop-blur-sm">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Decision vectors</span>
            <span className="text-emerald-400 text-xs">✅ Completed</span>
          </div>
          <div>
            <h3 className="text-xs text-slate-400">Goal Completion Rate</h3>
            <h2 className="text-4.5xl md:text-5xl font-black mt-1 text-emerald-400 tracking-tight leading-none">{completionRate}%</h2>
          </div>
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
            <span>Active schedule targets</span>
            <span className="font-mono text-slate-300 font-bold">{completedCount} vs {pendingCount} tasks</span>
          </div>
        </div>
      </div>

      {/* AI Performance Report Section (If triggered) */}
      {(loading || aiReport || errorStr) && (
        <div className="p-6 md:p-8 bg-slate-900/40 border border-indigo-500/20 rounded-3xl shadow-xl space-y-6 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 animate-pulse">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-sans tracking-tight">AI Agent Audit Output</h3>
              <p className="text-[10px] text-slate-500 font-mono">POWERED BY GEMINI-3.5-FLASH COCHING ENGINE</p>
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full border-4 border-t-indigo-500 border-indigo-950/20 animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-mono animate-pulse">Analyzing study loops, platform distributions, and time profiles...</p>
            </div>
          ) : errorStr ? (
            <div className="p-4 bg-rose-950/20 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-xs">
              <Info className="w-5 h-5 shrink-0" />
              <span>{errorStr}. (Make sure to run server script first)</span>
            </div>
          ) : aiReport ? (
            <div className="space-y-6 animate-slideIn">
              {/* Headline */}
              <div className="p-4 bg-indigo-950/10 border border-indigo-500/10 rounded-2xl">
                <h4 className="text-lg font-black tracking-tight text-indigo-300">
                  {aiReport.headline}
                </h4>
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Feedback summary</span>
                <p className="text-sm text-slate-300 leading-relaxed font-sans font-medium">
                  {aiReport.summary}
                </p>
              </div>

              {/* Action Bullet points list */}
              {aiReport.points.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Action Roadmap</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {aiReport.points.map((p, idx) => (
                      <div key={idx} className="flex gap-2.5 p-3 rounded-xl bg-slate-950/40 border border-slate-800 leading-relaxed text-xs text-slate-400">
                        <span className="text-indigo-400 font-mono font-extrabold">{idx + 1}.</span>
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rich detail Study plans Markdown */}
              {aiReport.additionalMarkdown && (
                <div className="border-t border-slate-800 pt-5 space-y-3">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Structured Study Guides & Timelines</span>
                  <div className="p-5 rounded-2xl bg-slate-950/45 border border-slate-800 text-xs md:text-sm text-slate-300 leading-relaxed max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-900 prose prose-invert prose-indigo prose-sm max-w-none">
                    <div className="markdown-body">
                      <Markdown>{aiReport.additionalMarkdown}</Markdown>
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : null}
        </div>
      )}

      {/* Smart insights presets footer */}
      <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-3xl flex items-center gap-4 backdrop-blur-sm">
        <div className="p-3 bg-indigo-600/10 border border-indigo-500/25 rounded-2xl text-indigo-400 shrink-0">
          <Activity className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-300">Historical Productivity Fact</p>
          <p className="text-xs text-slate-400 leading-relaxed mt-0.5 font-sans">
            "Your highest XP accumulation periods occur between <b>8 PM – 11 PM</b> after resolving algorithms. Reviewing flashcards in this window optimizes temporal consolidation."
          </p>
        </div>
      </div>

    </div>
  );
}
