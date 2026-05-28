/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  Clock, 
  Sparkles, 
  Save, 
  BookOpen, 
  Info,
  CalendarDays
} from 'lucide-react';
import { TimetableSlot } from '../types';

const DAYS_OF_WEEK: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const PRESET_COLORS = [
  { hex: '#8b5cf6', label: 'Indigo Focus' },
  { hex: '#3b82f6', label: 'Blue Project' },
  { hex: '#10b981', label: 'Sprinting Emerald' },
  { hex: '#f59e0b', label: 'Revision Amber' },
  { hex: '#ec4899', label: 'Pink Creativity' },
  { hex: '#ef4444', label: 'Red Hardcore' }
];

export default function TimetablePlanner() {
  const { timetable, addTimetableSlot, deleteTimetableSlot } = useDashboard();
  const [selectedDay, setSelectedDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'>('Monday');

  // Addition form states
  const [isAdding, setIsAdding] = useState(false);
  const [subject, setSubject] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#8b5cf6');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    addTimetableSlot({
      day: selectedDay,
      startTime,
      endTime,
      subject,
      description: description || undefined,
      color
    });

    setSubject('');
    setDescription('');
    setIsAdding(false);
  };

  // Filter slot by selected day
  const dailySlots = timetable
    .filter(slot => slot.day === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8 text-white min-h-screen">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest font-semibold font-bold">Session Matrix</span>
          <h2 className="text-2xl md:text-3.5xl font-extrabold tracking-tight mt-1 text-slate-100 font-sans leading-none">
            Weekly Timetable Planner
          </h2>
          <p className="text-sm text-slate-400 mt-2 font-sans">
            Build systematic blocking models. Assign slots early to bypass continuous execution decisions.
          </p>
        </div>

        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 text-white font-bold font-sans text-xs transition active:scale-95 shadow-md shadow-indigo-600/10"
        >
          <Plus className="w-4 h-4" />
          <span>Add Timeblock</span>
        </button>
      </div>

      {/* Input drawer form */}
      {isAdding && (
        <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-xl space-y-4 backdrop-blur-sm animate-slideIn">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-200">📅 Map a Timeblock for {selectedDay}</h3>
            <button onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-white transition">X</button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Subject or Topic Block</label>
              <input 
                type="text" 
                placeholder="e.g. DSA Practice, Machine Learning Lab..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950/40 border border-slate-900 outline-none text-white focus:border-indigo-500/50 text-sm font-sans"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Action description (Optional)</label>
              <input 
                type="text" 
                placeholder="Review arrays, code neural network models..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950/40 border border-slate-900 outline-none text-white focus:border-indigo-500/50 text-sm font-sans"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Start Time</label>
              <input 
                type="time" 
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950/40 border border-slate-900 outline-none text-white focus:border-indigo-500/50 text-sm font-mono"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">End Time</label>
              <input 
                type="time" 
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950/40 border border-slate-900 outline-none text-white focus:border-indigo-500/50 text-sm font-mono"
                required
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider block">Subject Color theme</label>
              <div className="flex flex-wrap gap-3">
                {PRESET_COLORS.map(c => (
                  <button 
                    key={c.hex}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    className={`p-2 rounded-xl flex items-center gap-1.5 border hover:scale-105 transition text-xs ${color === c.hex ? 'border-white text-white' : 'border-slate-900 text-slate-400 bg-slate-950/35'}`}
                  >
                    <div className="w-4.5 h-4.5 rounded-full" style={{ backgroundColor: c.hex }} />
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
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
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-bold flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Block</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Week days selectors tabs row */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900/40 border border-slate-800 rounded-2xl shadow-md overflow-x-auto scrollbar-none backdrop-blur-sm">
        {DAYS_OF_WEEK.map(day => {
          const count = timetable.filter(s => s.day === day).length;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`
                px-5 py-3 rounded-xl font-sans font-bold text-xs transition cursor-pointer flex items-center gap-2 shrink-0
                ${selectedDay === day 
                  ? 'bg-indigo-600 text-white shadow' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-950/40'
                }
              `}
            >
              <span>{day.substring(0, 3)}</span>
              {count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono leading-none ${selectedDay === day ? 'bg-indigo-800 text-white' : 'bg-slate-900 border border-slate-800 text-slate-500'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Timeblocks Listing cards */}
      <div className="space-y-4">
        {dailySlots.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/20 border border-slate-800 rounded-3xl">
            <CalendarDays className="w-12 h-12 text-slate-600 mx-auto stroke-thin mb-3" />
            <h4 className="text-base font-bold text-slate-400">Timetable empty for {selectedDay}</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed font-sans">
              Set study intervals, workout sprints, or leisure blocks above to systematically secure time focus.
            </p>
          </div>
        ) : (
          dailySlots.map((slot) => {
            return (
              <div 
                key={slot.id}
                className="p-5 bg-slate-900/50 border border-slate-800 hover:border-slate-700/60 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow relative overflow-hidden backdrop-blur-sm"
              >
                {/* Custom Color band left indicator */}
                <div className="absolute left-0 inset-y-0 w-1" style={{ backgroundColor: slot.color }} />

                <div className="flex items-start gap-3.5 flex-1">
                  <div className="p-2.5 rounded-xl border border-slate-900/60 flex items-center justify-center shrink-0 bg-slate-950/30 text-slate-400">
                    <Clock className="w-5 h-5" style={{ color: slot.color }} />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold">
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-900 text-slate-400 text-[10px]" style={{ borderLeftColor: slot.color, borderLeftWidth: '3px' }}>
                        🕒 {slot.startTime} - {slot.endTime}
                      </span>
                    </div>
                    <h4 className="text-sm md:text-base font-bold text-slate-200">
                      {slot.subject}
                    </h4>
                    {slot.description && (
                      <p className="text-xs text-slate-400 font-sans mt-0.5">
                        {slot.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Deletion control */}
                <button 
                  onClick={() => deleteTimetableSlot(slot.id)}
                  className="p-2 border border-slate-900 text-slate-600 hover:text-rose-400 rounded-lg hover:border-slate-800 shrink-0 self-end md:self-auto cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
