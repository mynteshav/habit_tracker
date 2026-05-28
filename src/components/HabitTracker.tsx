/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { 
  Plus, 
  Trash2, 
  Flame, 
  Check, 
  Activity, 
  CalendarDays,
  PlusCircle,
  HelpCircle,
  TrendingUp,
  Award
} from 'lucide-react';
import { Habit } from '../types';

export default function HabitTracker() {
  const { habits, addHabit, toggleHabitDate, deleteHabit } = useDashboard();
  const [isAdding, setIsAdding] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitDesc, setNewHabitDesc] = useState('');

  // Generate the last 7 calendar days for checking off
  const getLast7Days = () => {
    const result = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      result.push({
        dateStr: d.toISOString().split('T')[0],
        dayName: days[d.getDay()],
        label: d.getDate()
      });
    }
    return result;
  };

  const calendarDays = getLast7Days();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    addHabit(
      newHabitName,
      newHabitDesc || "Maintain visual flow daily",
      'daily'
    );

    setNewHabitName('');
    setNewHabitDesc('');
    setIsAdding(false);
  };

  // Compute stats on streaks
  const calculateStreak = (habit: Habit) => {
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      if (habit.history[ds]) {
        streak++;
      } else if (i > 0) {
        // Break streak only if not "today" (allowing completion by end of day)
        break;
      }
    }
    return streak;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8 text-white min-h-screen">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-pink-400 uppercase tracking-widest font-semibold font-bold">Behavior Alignment</span>
          <h2 className="text-2xl md:text-3.5xl font-extrabold tracking-tight mt-1 text-slate-100 font-sans leading-none">
            Habit & Streak Ledger
          </h2>
          <p className="text-sm text-slate-400 mt-2 font-sans">
            Build bulletproof subconscious routines. Track checklist columns for standard vectors and view day-streaks.
          </p>
        </div>

        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 text-white font-bold font-sans text-xs transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Habit</span>
        </button>
      </div>

      {/* Entry Box Drawer */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="p-6 bg-[#0c1020]/95 border border-slate-900 rounded-2xl shadow-xl space-y-4 animate-slideIn">
          <div className="flex justify-between items-center border-b border-slate-900 pb-3">
            <h3 className="text-base font-bold text-slate-200">🏆 Setup Routine Behavioral Track</h3>
            <button type="button" onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-white transition">X</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Habit name</label>
              <input 
                type="text" 
                placeholder="e.g. Solve 2 LeetCode problems, Wake up at 6 AM, Revise notes..."
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950/40 border border-slate-900 outline-none text-white focus:border-pink-500/50 text-sm font-sans"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Purpose / Description</label>
              <input 
                type="text" 
                placeholder="Core mental/physiological trigger..."
                value={newHabitDesc}
                onChange={(e) => setNewHabitDesc(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950/40 border border-slate-900 outline-none text-white focus:border-pink-500/50 text-sm font-sans"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => setIsAdding(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-900 bg-slate-950/20 text-xs text-slate-400"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-xs text-white font-bold"
            >
              Secure Habit Track
            </button>
          </div>
        </form>
      )}

      {/* Routine list grid */}
      <div className="space-y-5">
        {habits.length === 0 ? (
          <div className="p-12 text-center bg-[#0c1020]/50 border border-slate-900 rounded-3xl">
            <Award className="w-12 h-12 text-slate-600 mx-auto stroke-thin mb-3" />
            <h4 className="text-base font-bold text-slate-400">No habits tracked</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
              Register standard daily habits (e.g., wake early, log 5 coding tasks) to oversee streak meters.
            </p>
          </div>
        ) : (
          habits.map((habit) => {
            const streak = calculateStreak(habit);
            const totalComps = Object.keys(habit.history).length;

            return (
              <div 
                key={habit.id}
                className="p-5 bg-[#0c1020]/95 border border-slate-900 hover:border-slate-800 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow relative overflow-hidden"
              >
                {/* Info and stats left panel */}
                <div className="flex items-start gap-4 lg:w-96">
                  <div className="w-10 h-10 rounded-xl bg-pink-600/10 border border-pink-400/25 text-pink-400 flex items-center justify-center shrink-0">
                    🏆
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm md:text-base font-bold text-slate-200 tracking-tight">{habit.name}</h4>
                    <p className="text-xs text-slate-400 font-sans leading-none">{habit.description}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono mt-2">
                      <span className="flex items-center gap-0.5 text-pink-400 font-bold">
                        🔥 {streak}d streak
                      </span>
                      <span>•</span>
                      <span>Total done: {totalComps} times</span>
                    </div>
                  </div>
                </div>

                {/* Checklist dates scheduler */}
                <div className="flex items-center gap-3 overflow-x-auto py-1 scrollbar-none flex-1 justify-between lg:justify-end border-t border-slate-950/60 lg:border-none pt-4 lg:pt-0">
                  {calendarDays.map((day) => {
                    const isDone = !!habit.history[day.dateStr];
                    return (
                      <div key={day.dateStr} className="flex flex-col items-center gap-1.5 shrink-0 px-2 lg:px-3">
                        <span className="text-[9px] text-slate-500 font-mono font-medium">{day.dayName}</span>
                        <button
                          onClick={() => toggleHabitDate(habit.id, day.dateStr)}
                          className={`
                            w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition relative overflow-hidden
                            ${isDone 
                              ? 'bg-pink-600/20 border-pink-500 text-pink-400' 
                              : 'border-slate-800 bg-slate-950/15 text-slate-600 hover:border-slate-600 hover:text-white'
                            }
                          `}
                        >
                          <span className="text-xs font-mono font-bold">{day.label}</span>
                          {isDone && (
                            <span className="absolute bottom-1 w-1 h-1 bg-pink-400 rounded-full" />
                          )}
                        </button>
                      </div>
                    );
                  })}

                  {/* Delete action */}
                  <div className="pl-4 lg:pl-6 border-l border-slate-900 self-end lg:self-auto shrink-0 pb-1">
                    <button 
                      onClick={() => deleteHabit(habit.id)}
                      className="p-2 border border-slate-900 text-slate-600 hover:text-rose-400 rounded-xl hover:border-slate-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
