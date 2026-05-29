/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import Sidebar, { TabId } from './components/Sidebar';
import DashboardHome from './components/DashboardHome';
import TodayTopics from './components/TodayTopics';
import StudyHoursTracker from './components/StudyHoursTracker';
import CodingProblemTracker from './components/CodingProblemTracker';
import ProjectTracker from './components/ProjectTracker';
import TimetablePlanner from './components/TimetablePlanner';
import ProgressAnalytics from './components/ProgressAnalytics';
import HabitTracker from './components/HabitTracker';
import NotesSystem from './components/NotesSystem';
import AiAssistant from './components/AiAssistant';

import { 
  Sparkles, 
  Flame, 
  Award, 
  Bell, 
  User, 
  LogOut,
  Infinity,
  AlertTriangle,
  Menu,
  Sun,
  Moon
} from 'lucide-react';

function DashboardShell() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const stored = localStorage.getItem('study_dashboard_theme');
    if (stored === 'light') return 'light';
    return 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('study_dashboard_theme', theme);
  }, [theme]);

  const { 
    stats, 
    user, 
    authLoading, 
    signInWithGoogle, 
    logout,
    authError,
    clearAuthError,
    toasts
  } = useDashboard();

  // Experience calculations
  const totalXpNeeded = stats.level * 500;
  const progressPercentage = Math.min(100, Math.round((stats.xp / totalXpNeeded) * 100));

  const handleSetTab = (tab: TabId) => {
    setActiveTab(tab);
  };

  // Render correct panel viewport
  const renderTabContent = () => {
    switch(activeTab) {
      case 'home':
        return <DashboardHome setActiveTab={handleSetTab} />;
      case 'topics':
        return <TodayTopics />;
      case 'timer':
        return <StudyHoursTracker />;
      case 'coding':
        return <CodingProblemTracker />;
      case 'projects':
        return <ProjectTracker />;
      case 'timetable':
        return <TimetablePlanner />;
      case 'analytics':
        return <ProgressAnalytics />;
      case 'habits':
        return <HabitTracker />;
      case 'notes':
        return <NotesSystem />;
      case 'ai-coach':
        return <AiAssistant />;
      default:
        return <DashboardHome setActiveTab={handleSetTab} />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-950 text-slate-100 font-sans overflow-x-hidden antialiased">
      {/* 1. Left Nav Sidebar layout */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        level={stats.level}
        xp={stats.xp}
        streakDays={stats.streakDays}
        user={user}
        authLoading={authLoading}
        signInWithGoogle={signInWithGoogle}
        logout={logout}
      />

      {/* 2. Main interactive Viewport with Header */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        
        {/* Top Header stats dashboard bar */}
        <header className="sticky top-0 z-30 h-16 md:h-20 bg-slate-950/90 backdrop-blur-md border-b border-slate-900 px-4 md:px-8 flex items-center justify-between">
          
          {/* Current selected active Tab Title breadcrumbs */}
          <div className="flex items-center gap-3">
            {/* Hamburger Button for Mobile / Tablet Viewports */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer flex items-center justify-center shrink-0"
              title="Open Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 md:gap-2">
              <span className="text-xs md:text-sm text-indigo-400 font-mono capitalize tracking-wider font-semibold">Workspace</span>
              <span className="text-slate-800 text-xs font-mono">/</span>
              <span className="text-xs md:text-sm text-slate-300 font-bold capitalize tracking-wide font-sans truncate max-w-[120px] sm:max-w-none">
                {activeTab === 'home' ? 'Overview' : activeTab.replace('-', ' ')}
              </span>
            </div>
          </div>

          {/* User gamification meters & XP trackers */}
          <div className="flex items-center gap-4 md:gap-6">
            
            {/* XP progress metrics display */}
            <div className="hidden sm:flex flex-col items-end shrink-0">
              <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Level {stats.level} Scholar</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-24 md:w-32 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="bg-gradient-to-r from-indigo-550 from-indigo-505 from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-mono font-bold leading-none">{stats.xp}/{totalXpNeeded} XP</span>
              </div>
            </div>

            {/* Daily Streak Indicator */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-4 py-1.5 font-semibold text-slate-200 text-xs shrink-0 select-none">
              <span className="text-orange-500">🔥</span>
              <span>{stats.streakDays} Day Streak</span>
            </div>

            {/* Dark/Light Mode Theme Toggle Button */}
            <button
              id="theme-mode-toggle"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 md:p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition cursor-pointer flex items-center justify-center shrink-0 shadow-sm"
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === 'dark' ? (
                <Sun className="w-4.5 h-4.5 text-amber-500" />
              ) : (
                <Moon className="w-4.5 h-4.5 text-indigo-500" />
              )}
            </button>

            {/* Real Cloud Sync Status & User Profile Trigger */}
            <div className="flex items-center gap-3 border-l border-slate-900 pl-4 shrink-0">
              {authLoading ? (
                <div className="w-8 h-8 rounded-xl bg-slate-900 animate-pulse border border-slate-800 flex items-center justify-center">
                  <span className="text-[10px] text-indigo-400 font-mono font-semibold">...</span>
                </div>
              ) : user ? (
                <div className="flex items-center gap-2.5">
                  <button 
                    onClick={logout}
                    title="Sign Out of Cloud Sync"
                    className="flex items-center gap-1 text-[10px] uppercase font-mono tracking-wider font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-1.5 rounded-xl transition select-none cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                  <div className="flex items-center gap-2">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || "User"} 
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 md:w-9 md:h-9 rounded-xl border border-slate-800/80 shadow-sm"
                      />
                    ) : (
                      <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-xs text-indigo-400 select-none">
                        {user.displayName ? user.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) : 'U'}
                      </div>
                    )}
                    <div className="hidden md:block text-left">
                      <h5 className="text-[11px] font-bold text-slate-300 leading-none truncate max-w-[100px]">{user.displayName || 'Teshav'}</h5>
                      <span className="text-[9px] text-indigo-400 font-mono font-medium leading-none flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping"></span>
                        Cloud Active
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={signInWithGoogle}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-md transition duration-150 transform active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                  <span className="text-[10px] tracking-wide uppercase font-mono">Sync to Cloud</span>
                </button>
              )}
            </div>

          </div>

        </header>

        {/* 3. Render content block based on tab */}
        <main className="flex-1 pb-16 md:pb-8 relative">
          {renderTabContent()}
        </main>
      </div>

      {/* Floating Popup for Authentication Errors / Iframe limits */}
      {authError && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm md:max-w-md p-4 bg-slate-900/95 border border-red-500/20 rounded-2xl shadow-2xl backdrop-blur-md flex gap-3 animate-slideIn">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <h4 className="text-xs font-bold text-slate-200">Sync Authentication Issue</h4>
              <button onClick={clearAuthError} className="text-slate-500 hover:text-slate-300 text-xs font-mono select-none cursor-pointer">✕</button>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{authError}</p>
            <div className="flex items-center gap-2 pt-1">
              <a 
                href={window.location.href} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-[10px] tracking-wide inline-flex items-center gap-1 cursor-pointer select-none transition"
              >
                Open in New Tab
              </a>
              <button 
                onClick={clearAuthError} 
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-[10px] font-medium transition cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 p-4 rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-300 animate-slideUp font-sans ${
              toast.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500/20 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-rose-950/95 border-rose-500/20 text-rose-200'
                : toast.type === 'warning'
                ? 'bg-amber-950/95 border-amber-500/20 text-amber-200'
                : 'bg-slate-900 border-indigo-500/20 text-indigo-200'
            }`}
          >
            <div className="shrink-0 text-lg bg-white/10 w-6 h-6 rounded-lg flex items-center justify-center">
              {toast.type === 'success' && '🎯'}
              {toast.type === 'error' && '❌'}
              {toast.type === 'warning' && '⏰'}
              {toast.type === 'info' && '✨'}
            </div>
            <div className="flex-1 text-xs font-semibold leading-relaxed">
              {toast.message}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <DashboardProvider>
      <DashboardShell />
    </DashboardProvider>
  );
}
