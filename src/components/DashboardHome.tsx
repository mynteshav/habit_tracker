/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { motion } from 'motion/react';
import { 
  Flame, 
  Clock, 
  Code, 
  CheckSquare, 
  AlertCircle, 
  TrendingUp, 
  Sparkles, 
  Calendar,
  ChevronRight,
  Info
} from 'lucide-react';
import { AchievementBadge } from '../types';

const MOTIVATION_QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it is done.", author: "Nelson Mandela" },
  { text: "Do not wish for an easier life, wish for the strength to endure a difficult one.", author: "Bruce Lee" },
  { text: "First solve the problem. Then, write the code.", author: "John Johnson" },
  { text: "Consistency is what transforms average into excellence.", author: "Anonymous" },
  { text: "Your focus determines your reality.", author: "Qui-Gon Jinn" },
  { text: "Every champion was once a contender who refused to give up.", author: "Rocky Balboa" }
];

export default function DashboardHome({ setActiveTab }: { setActiveTab: (tab: any) => void }) {
  const { topics, problems, projects, habits, stats, user, resetApp } = useDashboard();
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [quote, setQuote] = useState(MOTIVATION_QUOTES[0]);
  const [isResetConfirming, setIsResetConfirming] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState(false);

  // Synchronize ticking clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    
    // Choose a quote based on the day of month
    const dayIndex = new Date().getDate() % MOTIVATION_QUOTES.length;
    setQuote(MOTIVATION_QUOTES[dayIndex]);

    return () => clearInterval(timer);
  }, []);

  // Compute metrics from real state
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Today study minutes
  const todayStudyMins = stats.sessions
    .filter(s => s.date === todayStr)
    .reduce((total, s) => total + s.durationMinutes, 0);
  const todayStudyHoursStr = (todayStudyMins / 60).toFixed(1);

  // Solved today
  const solvedToday = problems.filter(p => p.solvedAt === todayStr).length;

  // Completed topics
  const todayTopicsCount = topics.length;
  const completedTodayTopics = topics.filter(t => t.completed).length;
  const pendingTodayTopics = todayTopicsCount - completedTodayTopics;

  // Project progress percentage average
  const avgProjectProgress = projects.length > 0 
    ? Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length) 
    : 0;

  // Weekly consistency: percentage of habits completed today
  const activeHabitsCount = habits.length;
  const habitsDoneToday = habits.filter(h => h.history[todayStr]).length;
  const habitCompletionRate = activeHabitsCount > 0 
    ? Math.round((habitsDoneToday / activeHabitsCount) * 100) 
    : 0;

  // Total XP needed
  const xpNeeded = stats.level * 500;
  const levelProgressPercent = Math.min(100, Math.round((stats.xp / xpNeeded) * 100));

  // Filter 3 unlocked badges
  const unlockedBadges = stats.badges.filter(b => b.unlocked);
  const lockedBadges = stats.badges.filter(b => !b.unlocked).slice(0, 3);

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8 text-slate-100 min-h-screen">
      {/* 1. Welcome Header Bento (Time & Quote widget) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Welcome and live time */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2 p-6 md:p-8 bg-gradient-to-br from-slate-900 via-slate-900/80 to-slate-950 border border-slate-800 rounded-3xl relative overflow-hidden flex flex-col justify-between shadow-2xl backdrop-blur-md"
        >
          {/* Neon mesh background highlights */}
          <div className="absolute top-[-40px] right-[-40px] w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-40px] left-[-40px] w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs tracking-wider uppercase font-semibold">
              <Sparkles className="w-3.5 h-3.5 animate-spinSlow" />
              <span>Personal Academics Brain</span>
            </div>
            <h2 className="text-2xl md:text-3.5xl font-extrabold tracking-tight mt-3 text-slate-100 font-sans leading-tight">
              Hello, {user?.displayName ? user.displayName.split(' ')[0] : 'Teshav'}! Ready to build focus?
            </h2>
            <p className="text-sm text-slate-400 mt-2 font-sans max-w-md">
              Your consistency is compounding. Keep learning, solving algorithms, and pushing project code.
            </p>
          </div>

          <div className="mt-8 border-t border-slate-800/60 pt-5 flex flex-wrap gap-4 items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-mono uppercase tracking-widest leading-none mb-1">Current Date</p>
              <span className="text-sm font-semibold text-slate-300 font-sans">{dateStr || 'Loading date...'}</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 font-mono uppercase tracking-widest leading-none mb-1 text-left md:text-right">Clock (GMT)</p>
              <span className="text-xl md:text-2xl font-black text-indigo-400 tracking-wider font-mono">
                {timeStr || '18:17:28'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Daily Motivation Widget & Streak metrics */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl flex flex-col justify-between shadow-xl backdrop-blur-sm relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <span className="px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[10px] tracking-wider uppercase font-semibold">
              Daily Verse
            </span>
            <div className="flex items-center gap-1.5 text-orange-405 text-orange-500 bg-slate-950/60 px-2.5 py-1 border border-slate-800 rounded-full font-bold text-xs">
              <span>🔥 {stats.streakDays} Day Streak</span>
            </div>
          </div>

          <div className="my-6">
            <p className="text-slate-300 italic text-sm md:text-base leading-relaxed font-sans font-medium">
              "{quote.text}"
            </p>
            <p className="text-xs text-slate-500 mt-2.5 font-mono text-right">- {quote.author}</p>
          </div>

          <div className="bg-slate-950/40 border border-slate-800 p-3 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400 leading-none">Level {stats.level} Scholar Progress</p>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="w-28 bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: `${levelProgressPercent}%` }} />
                </div>
                <span className="text-[10px] text-slate-500 font-mono font-bold">{levelProgressPercent}%</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 2. Rapid KPI Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { title: "Study Hours Today", val: `${todayStudyHoursStr}h`, desc: "Target: 5.0 hrs", icon: Clock, color: "text-indigo-400", bgs: "from-indigo-600/10 to-transparent", tab: "timer" },
          { title: "DSA Solved Today", val: solvedToday, desc: `${problems.length} total solved`, icon: Code, color: "text-amber-400", bgs: "from-amber-600/10 to-transparent", tab: "coding" },
          { title: "Completed Topics", val: `${completedTodayTopics}/${todayTopicsCount}`, desc: `${pendingTodayTopics} tasks pending`, icon: CheckSquare, color: "text-emerald-400", bgs: "from-emerald-600/10 to-transparent", tab: "topics" },
          { title: "Project Progress %", val: `${avgProjectProgress}%`, desc: `${projects.length} files tracked`, icon: TrendingUp, color: "text-purple-400", bgs: "from-purple-600/10 to-transparent", tab: "projects" }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + (idx * 0.05) }}
              whileHover={{ y: -3, transition: { duration: 0.1 } }}
              onClick={() => setActiveTab(item.tab as any)}
              className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col justify-between shadow-lg cursor-pointer hover:border-slate-700/60 relative overflow-hidden backdrop-blur-sm"
            >
              <div className={`absolute inset-0 bg-gradient-to-b ${item.bgs} opacity-30`} />
              <div className="flex justify-between items-center relative z-10">
                <span className="text-xs text-slate-500 font-mono uppercase tracking-widest">{item.title}</span>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className="mt-4 relative z-10">
                <h3 className="text-2xl md:text-3.5xl font-black tracking-tight leading-none">{item.val}</h3>
                <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1 font-sans">
                  <Info className="w-3 h-3 text-slate-600" />
                  <span>{item.desc}</span>
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 3. Circular Progress Overview and Streaks & Badges Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Productivity & Circular Completion widgets */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between backdrop-blur-sm"
        >
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#7c3aed] font-semibold">Goal Progress Stats</span>
            <h3 className="text-lg font-bold tracking-tight mt-1 text-slate-200">Consistency Loops</h3>
          </div>

          {/* Dual circular dial meters */}
          <div className="grid grid-cols-2 gap-4 my-6">
            {/* Circle 1: Topic completion rate */}
            <div className="flex flex-col items-center p-3 bg-slate-950/20 border border-slate-800 rounded-2xl">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="absolute w-full h-full -rotate-90">
                  <circle cx="48" cy="48" r="38" className="stroke-slate-900 fill-none" strokeWidth="8" />
                  <circle 
                    cx="48" 
                    cy="48" 
                    r="38" 
                    className="stroke-indigo-500 fill-none transition-all duration-700" 
                    strokeWidth="8" 
                    strokeDasharray="238.76"
                    strokeDashoffset={238.76 - (238.76 * (todayTopicsCount > 0 ? (completedTodayTopics / todayTopicsCount) : 0))}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="text-center z-10">
                  <span className="text-lg font-black">{todayTopicsCount > 0 ? Math.round((completedTodayTopics / todayTopicsCount) * 100) : 0}%</span>
                  <p className="text-[8px] text-slate-500 font-mono tracking-widest leading-none mt-0.5">TOPICS</p>
                </div>
              </div>
              <span className="text-xs text-slate-400 mt-2.5 font-sans font-medium">Daily Checklist</span>
            </div>

            {/* Circle 2: Habit loop completion standard */}
            <div className="flex flex-col items-center p-3 bg-slate-950/20 border border-slate-800 rounded-2xl">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="absolute w-full h-full -rotate-90">
                  <circle cx="48" cy="48" r="38" className="stroke-slate-900 fill-none" strokeWidth="8" />
                  <circle 
                    cx="48" 
                    cy="48" 
                    r="38" 
                    className="stroke-pink-500 fill-none transition-all duration-700" 
                    strokeWidth="8" 
                    strokeDasharray="238.76"
                    strokeDashoffset={238.76 - (238.76 * (habitCompletionRate / 100))}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="text-center z-10">
                  <span className="text-lg font-black text-pink-400">{habitCompletionRate}%</span>
                  <p className="text-[8px] text-slate-500 font-mono tracking-widest leading-none mt-0.5">HABITS</p>
                </div>
              </div>
              <span className="text-xs text-slate-400 mt-2.5 font-sans font-medium">Habit Alignment</span>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-sans border-t border-slate-800 pt-3 leading-relaxed flex items-start gap-2">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>Finish pending topics and check daily habits to unlock up to <b>150 XP</b> and secure today's streak badge.</span>
          </div>
        </motion.div>

        {/* Achievement Badges widget */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between backdrop-blur-sm md:col-span-2"
        >
          <div>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-[#d97706] font-semibold">Scholar Badges</span>
                <h3 className="text-lg font-bold tracking-tight mt-1 text-slate-200">Unlocked Achievements</h3>
              </div>
              <span className="text-xs text-amber-500 font-mono font-bold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                👑 {unlockedBadges.length} Unlock{unlockedBadges.length !== 1 && 's'}
              </span>
            </div>

            {/* Badges lists bento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              {/* Completed Badges Panel */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono text-emerald-500 tracking-wider font-semibold uppercase">Earned</h4>
                {unlockedBadges.length === 0 ? (
                  <div className="p-4 bg-slate-950/20 border border-dashed border-slate-800 text-center rounded-2xl text-xs text-slate-500">
                    No badges unlocked yet! Start logging hours or complete topics.
                  </div>
                ) : (
                  unlockedBadges.slice(0, 3).map((badge, idx) => (
                    <div key={idx} className="flex items-center gap-3.5 p-3 rounded-2xl bg-emerald-950/10 border border-emerald-500/15">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400 font-semibold shrink-0">
                        🏆
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-300">{badge.title}</h5>
                        <p className="text-[11px] text-slate-400 font-sans mt-0.5">{badge.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Locked/Goal Badges Panel */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono text-indigo-400 tracking-wider font-semibold uppercase text-slate-500">Goals in progress</h4>
                {lockedBadges.map((badge, idx) => (
                  <div key={idx} className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-950/15 border border-slate-800/80 opacity-65">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-center text-slate-400 text-sm font-semibold shrink-0 filter grayscale">
                      🔒
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-300">{badge.title}</h5>
                      <p className="text-[11px] text-slate-400 font-sans mt-0.5">{badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('ai-coach')}
            className="mt-6 p-4 rounded-xl bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between cursor-pointer group transition duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">AI Coach Advice Available</p>
                <p className="text-[10px] text-slate-400">"Your algorithmic coding streak is hot. Let's optimize your study window."</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition duration-200" />
          </div>
        </motion.div>
      </div>

      {/* 4. Reset & Diagnostics Settings Section */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 bg-slate-900/30 border border-slate-800/80 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 backdrop-blur-sm"
      >
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#f43f5e] animate-pulse"></span>
            <h3 className="text-sm font-bold tracking-wide uppercase text-slate-300 font-mono">System Clean-State Controls</h3>
          </div>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Need a fresh start? Clear your local storage modules, progress dashboards, and rewrite statistics to a default condition where your active learning streak starts cleanly at <b className="text-indigo-400">0 days</b> with zero preloaded mock entries.
          </p>
        </div>

        <div className="flex flex-col items-stretch sm:items-end justify-center shrink-0 gap-2 min-w-[200px]">
          {resetSuccessMsg ? (
            <div className="px-4 py-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-xl text-center animate-pulse">
              ✓ App Reset Successfully!
            </div>
          ) : !isResetConfirming ? (
            <button 
              onClick={() => setIsResetConfirming(true)}
              className="px-5 py-2.5 bg-slate-800 hover:bg-rose-950/40 hover:text-rose-450 hover:border-rose-500/30 text-slate-300 border border-slate-700/80 rounded-xl text-xs font-bold tracking-wide transition select-none cursor-pointer"
            >
              Reset App Stats & Streaks
            </button>
          ) : (
            <div className="flex flex-col gap-2 w-full">
              <span className="text-[10px] text-rose-450 text-rose-400 font-mono text-center sm:text-right font-bold">Wipe all study metrics?</span>
              <div className="flex items-center gap-1.5 justify-end">
                <button 
                  onClick={async () => {
                    await resetApp();
                    setIsResetConfirming(false);
                    setResetSuccessMsg(true);
                    setTimeout(() => setResetSuccessMsg(false), 3000);
                  }}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-rose-500/10 cursor-pointer transition select-none"
                >
                  Yes, Reset to 0
                </button>
                <button 
                  onClick={() => setIsResetConfirming(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer transition select-none"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
