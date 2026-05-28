/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  LayoutDashboard, 
  CheckSquare, 
  Clock, 
  Code, 
  FolderGit, 
  Calendar, 
  TrendingUp, 
  Award, 
  BookOpen, 
  Sparkles, 
  Sparkle,
  Menu,
  X,
  User,
  LogOut
} from 'lucide-react';
import { useState } from 'react';

export type TabId = 
  | 'home'
  | 'topics'
  | 'timer'
  | 'coding'
  | 'projects'
  | 'timetable'
  | 'habits'
  | 'notes'
  | 'analytics'
  | 'ai-coach';

interface SidebarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  level: number;
  xp: number;
  streakDays: number;
  user: any;
  authLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const navItems = [
  { id: 'home' as TabId, label: 'Dashboard Home', icon: LayoutDashboard },
  { id: 'topics' as TabId, label: 'Today Topics', icon: CheckSquare },
  { id: 'timer' as TabId, label: 'Focus & Pomodoro', icon: Clock },
  { id: 'coding' as TabId, label: 'DSA Practice', icon: Code },
  { id: 'projects' as TabId, label: 'Projects Lane', icon: FolderGit },
  { id: 'timetable' as TabId, label: 'Timetable Week', icon: Calendar },
  { id: 'habits' as TabId, label: 'Habits & Streaks', icon: Award },
  { id: 'notes' as TabId, label: 'Notes & Flashcards', icon: BookOpen },
  { id: 'analytics' as TabId, label: 'Analytics Insights', icon: TrendingUp },
  { id: 'ai-coach' as TabId, label: 'AI Study Assistant', icon: Sparkles },
];

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isOpen,
  setIsOpen,
  level, 
  xp, 
  streakDays,
  user,
  authLoading,
  signInWithGoogle,
  logout 
}: SidebarProps) {
  const xpPercent = Math.min(100, Math.round((xp / (level * 500)) * 100));

  const handleTabClick = (tabId: TabId) => {
    setActiveTab(tabId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Sidebar Overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)} 
          className="fixed inset-0 bg-black/60 lg:hidden z-40 transition-opacity backdrop-blur-sm"
        />
      )}

      {/* Sidebar Panel */}
      <aside className={`
        fixed lg:sticky top-0 bottom-0 left-0 lg:h-screen bg-slate-900 border-r border-slate-800 text-slate-300 w-64 lg:w-72 flex flex-col z-50 transition-all duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo and Level Title */}
        <div className="p-6 border-b border-slate-800 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Sparkle className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <h1 className="font-sans font-extrabold text-slate-100 tracking-tight leading-none text-base">
                  Study Coach
                </h1>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest leading-none font-mono font-medium">
                  Goal Master v2.4
                </p>
              </div>
            </div>

            {/* Back Close button inside Sidebar Header for Mobile */}
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1.5 border border-slate-800 rounded-lg bg-slate-950 text-slate-400 hover:text-white transition cursor-pointer"
              title="Close Navigation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Student Status Bento Widget */}
          <div className="mt-2 p-3 bg-slate-950/40 border border-slate-800 rounded-xl">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-1.5 font-medium text-slate-300 font-sans">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Level {level} Scholar</span>
              </div>
              <span className="text-slate-500 font-mono font-medium">{xp} / {level * 500} XP</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full mt-2 overflow-hidden border border-slate-950">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-550"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-2.5 text-xs text-slate-400 font-mono">
              <span>Daily Streak</span>
              <span className="text-pink-400 font-bold flex items-center gap-1">
                🔥 {streakDays} days
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Menus */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
          <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 font-mono">
            Navigation Console
          </span>
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`
                  w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-sans font-medium transition-all group duration-150 relative
                  ${isActive 
                    ? 'bg-indigo-600/10 border border-indigo-500/20 text-white shadow-md shadow-indigo-600/5' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent'
                  }
                `}
              >
                <IconComponent className={`
                  w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-110
                  ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-400'}
                `} />
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute right-3.5 w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User profile footer info */}
        <div className="p-4 border-t border-slate-800 mt-auto bg-slate-950/20">
          {authLoading ? (
            <div className="w-full h-11 bg-slate-950/10 animate-pulse border border-slate-900/50 rounded-xl" />
          ) : user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || "User"} 
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full border-2 border-indigo-400/20 shadow-sm"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-slate-700/50 flex items-center justify-center text-slate-300 font-bold font-sans">
                    {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                  </div>
                )}
                <div className="overflow-hidden min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-slate-300 truncate font-sans">
                    {user.displayName || 'Teshav'}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono truncate">
                    {user.email || 'Cloud Synced'}
                  </p>
                </div>
              </div>
              <button 
                onClick={logout}
                title="Log Out Sync"
                className="text-slate-600 hover:text-rose-400 transition p-1.5 hover:bg-slate-900/40 rounded-lg shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 p-1">
              <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
                Using local storage. Log in to sync across your devices.
              </p>
              <button 
                onClick={signInWithGoogle}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[#0f172a] hover:bg-slate-900 text-slate-300 hover:text-white rounded-lg border border-slate-800 text-xs font-semibold select-none transition"
              >
                Connect Cloud Sync
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
