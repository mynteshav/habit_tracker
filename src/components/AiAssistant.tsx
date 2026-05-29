/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { 
  Send, 
  Sparkles, 
  BookOpen, 
  TrendingUp, 
  FileText, 
  Info, 
  HelpCircle,
  Clock,
  Code,
  Trash2
} from 'lucide-react';
import Markdown from 'react-markdown';

interface ChatMessage {
  sender: 'student' | 'coach';
  text: string;
}

export default function AiAssistant() {
  const { topics, problems, stats, projects, showToast } = useDashboard();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('study_assistant_messages');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved chat messages:", e);
      }
    }
    return [
      { sender: 'coach', text: "Welcome, Scholar! I'm your deep learning & algorithms coach. I possess context on today's scheduled subjects, solved DSA problems, and your stream habits. Ask me to formulate a study plan, explain complex algorithmic constraints, or debug an architecture loop." }
    ];
  });
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  // Save conversation history to local storage
  useEffect(() => {
    localStorage.setItem('study_assistant_messages', JSON.stringify(messages));
  }, [messages]);

  const clearChatHistory = () => {
    const defaultMsg: ChatMessage[] = [
      { sender: 'coach', text: "Welcome, Scholar! I'm your deep learning & algorithms coach. I possess context on today's scheduled subjects, solved DSA problems, and your stream habits. Ask me to formulate a study plan, explain complex algorithmic constraints, or debug an architecture loop." }
    ];
    setMessages(defaultMsg);
    localStorage.setItem('study_assistant_messages', JSON.stringify(defaultMsg));
    showToast("🧹 Conversation history cleared.", "info");
  };

  // Quick Action triggers
  const executePreset = async (promptText: string) => {
    setInputText('');
    setMessages(prev => [...prev, { sender: 'student', text: promptText }]);
    setLoading(true);

    try {
      const resp = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'chat',
          message: promptText,
          topics,
          problemStats: problems,
          studySessions: stats.sessions,
          projects
        })
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${resp.status}`);
      }

      const data = await resp.json();
      if (!data || !data.response || !data.response.trim()) {
        throw new Error("Received an empty response from the Coach API.");
      }
      setMessages(prev => [...prev, { sender: 'coach', text: data.response }]);
    } catch (err: any) {
      console.error("Coach API Error:", err);
      showToast(`🤖 AI Assistant: ${err.message}`, 'error');
      setMessages(prev => [...prev, { sender: 'coach', text: `⚠️ Error contacting Coach Engine: ${err.message}. Please verify server run statuses.` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText;
    setInputText('');
    setMessages(prev => [...prev, { sender: 'student', text: userMsg }]);
    setLoading(true);

    try {
      const resp = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'chat',
          message: userMsg,
          topics,
          problemStats: problems,
          studySessions: stats.sessions,
          projects
        })
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${resp.status}`);
      }

      const data = await resp.json();
      if (!data || !data.response || !data.response.trim()) {
        throw new Error("Received an empty response from the Coach API.");
      }
      setMessages(prev => [...prev, { sender: 'coach', text: data.response }]);
    } catch (err: any) {
      console.error("Coach API Error:", err);
      showToast(`🤖 AI Assistant: ${err.message}`, 'error');
      setMessages(prev => [...prev, { sender: 'coach', text: `⚠️ Offline error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8 text-white min-h-screen">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest font-semibold font-bold">Instruction Coach</span>
          <h2 className="text-2xl md:text-3.5xl font-extrabold tracking-tight mt-1 text-slate-100 font-sans leading-none">
            AI Professional Coach
          </h2>
          <p className="text-sm text-slate-400 mt-2 font-sans">
            Ground queries regarding dynamic programming bounds, project timelines, or deep learning parameters instantly.
          </p>
        </div>
        <button
          onClick={clearChatHistory}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 text-xs font-mono tracking-wider uppercase transition cursor-pointer select-none shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side: Preset prompt cards */}
        <div className="space-y-4">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold block">Quick Actions</span>
          
          {[
            { label: "Create 4-Week Study Plan", prompt: "Build me a meticulous 4-week study roadmap summarizing focus subjects in Machine Learning and DSA arrays.", icon: BookOpen },
            { label: "Explain Dijkstra's Bounds", prompt: "Explain Dijkstra's Shortest Path algorithm clearly, detailing both adjacency matrix and adjacency list time complexities.", icon: Code },
            { label: "Suggest Projects Roadmap", prompt: "I want to construct a React full-stack project utilizing Vite, Tailwind, and Gemini API. Suggest a step-by-step sprint backlog guide.", icon: TrendingUp },
            { label: "Design Daily Review Drill", prompt: "Create a rigorous active revision routine summarizing dynamic intervals for high-priority subjects.", icon: FileText }
          ].map((act, idx) => {
            const Icon = act.icon;
            return (
              <button
                key={idx}
                onClick={() => executePreset(act.prompt)}
                disabled={loading}
                className="w-full p-4 bg-[#0c1020]/95 border border-slate-900 rounded-2xl text-left hover:border-slate-800 hover:bg-slate-950/40 font-sans transition cursor-pointer flex items-center gap-3 active:scale-[0.98] disabled:opacity-40"
              >
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{act.label}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 leading-none">Execute context prompt</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Side: Chat Window Interface Container */}
        <div className="lg:col-span-3 p-6 bg-[#0c1020]/95 border border-slate-900 rounded-3xl shadow-xl flex flex-col justify-between h-[540px]">
          {/* Scrollable messages box */}
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-900 pb-4">
            {messages.map((m, idx) => {
              const isCoach = m.sender === 'coach';
              return (
                <div 
                  key={idx}
                  className={`flex gap-3.5 ${isCoach ? 'justify-start' : 'justify-end'}`}
                >
                  {isCoach && (
                    <div className="w-9 h-9 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                      🤖
                    </div>
                  )}

                  <div className={`
                    p-4 rounded-2xl text-xs md:text-sm leading-relaxed max-w-[85%] font-sans
                    ${isCoach 
                      ? 'bg-slate-950/40 border border-slate-900/80 text-slate-300' 
                      : 'bg-[#1e154a]/30 border border-[#4c1d95]/40 text-purple-300'
                    }
                  `}>
                    {isCoach ? (
                      <div className="markdown-body">
                        <Markdown>{m.text}</Markdown>
                      </div>
                    ) : (
                      <p>{m.text}</p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Loading text bubble indicator */}
            {loading && (
              <div className="flex gap-3.5 justify-start">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0 animate-spinSlow">
                  ⚡
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/30 border border-slate-900 text-slate-500 text-xs font-mono animate-pulse">
                  AI Coach composing answers based on model vectors...
                </div>
              </div>
            )}
          </div>

          {/* Prompt Entry Box form input */}
          <form onSubmit={handleSend} className="mt-4 border-t border-slate-950 pt-4 flex gap-3 items-center">
            <input 
              type="text"
              placeholder="Ask about dynamic programming tables, time allocation formulas, review plans..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={loading}
              className="flex-1 p-3 px-4.5 rounded-xl bg-slate-950/45 border border-slate-900/85 text-xs text-slate-200 outline-none focus:border-indigo-505 focus:border-indigo-400/50"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition cursor-pointer disabled:opacity-45"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      </div>

    </div>
  );
}
