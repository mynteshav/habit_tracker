/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
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
  CalendarDays,
  Edit3,
  AlertTriangle
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
  const { 
    timetable, 
    addTimetableSlot, 
    updateTimetableSlot, 
    deleteTimetableSlot, 
    showToast 
  } = useDashboard();
  
  const [selectedDay, setSelectedDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'>('Monday');

  // Addition & Editing form states
  const [isAdding, setIsAdding] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);

  const [subject, setSubject] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#8b5cf6');
  const [slotDay, setSlotDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' | 'All Days'>('Monday');
  const [isRepeatingDaily, setIsRepeatingDaily] = useState(false);

  // Sync state when adding is toggled or when selected tab shifts
  useEffect(() => {
    if (!editingSlotId) {
      setSlotDay(selectedDay);
    }
  }, [selectedDay, isAdding, editingSlotId]);

  // Check for time overlaps on the same day(s)
  const checkTimeConflict = (
    idToExclude: string | null,
    dayInput: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' | 'All Days',
    startTimeInput: string,
    endTimeInput: string
  ): { hasConflict: boolean; conflictingSlot?: TimetableSlot; dayMatched?: string } => {
    for (const slot of timetable) {
      if (idToExclude && slot.id === idToExclude) continue;

      // Determine if they share a common day
      let shareDay = false;
      let dayMatched = '';
      if (dayInput === 'All Days' || slot.day === 'All Days') {
        shareDay = true;
        dayMatched = dayInput === 'All Days' ? (slot.day === 'All Days' ? 'every day' : slot.day) : dayInput;
      } else if (dayInput === slot.day) {
        shareDay = true;
        dayMatched = dayInput;
      }

      if (shareDay) {
        // Overlap occurs if startA < endB and startB < endA
        if (startTimeInput < slot.endTime && slot.startTime < endTimeInput) {
          return { hasConflict: true, conflictingSlot: slot, dayMatched };
        }
      }
    }
    return { hasConflict: false };
  };

  const handleStartEdit = (slot: TimetableSlot) => {
    setEditingSlotId(slot.id);
    setSubject(slot.subject);
    setStartTime(slot.startTime);
    setEndTime(slot.endTime);
    setDescription(slot.description || '');
    setColor(slot.color);
    setSlotDay(slot.day);
    setIsRepeatingDaily(slot.day === 'All Days');
    setIsAdding(true);
    showToast(`✏️ Editing "${slot.subject}"`, 'info');
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingSlotId(null);
    setSubject('');
    setStartTime('09:00');
    setEndTime('11:00');
    setDescription('');
    setColor('#8b5cf6');
    setSlotDay(selectedDay);
    setIsRepeatingDaily(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim()) {
      showToast("❌ Subject or Topic is required!", "error");
      return;
    }

    const targetDay = isRepeatingDaily ? 'All Days' : slotDay;
    if (!targetDay) {
      showToast("❌ Day selection is required!", "error");
      return;
    }

    if (startTime >= endTime) {
      showToast("❌ Start Time must be earlier than End Time!", "error");
      return;
    }

    // Overlap checks
    const conflict = checkTimeConflict(editingSlotId, targetDay, startTime, endTime);
    if (conflict.hasConflict) {
      showToast(
        `⚠️ Overlap Conflict on ${conflict.dayMatched}! "${conflict.conflictingSlot?.subject}" resides at ${conflict.conflictingSlot?.startTime} - ${conflict.conflictingSlot?.endTime}`,
        "warning"
      );
      return;
    }

    try {
      if (editingSlotId) {
        await updateTimetableSlot(editingSlotId, {
          day: targetDay,
          startTime,
          endTime,
          subject: subject.trim(),
          description: description.trim() || undefined,
          color
        });
        showToast("✨ Timetable block updated successfully!", "success");
      } else {
        await addTimetableSlot({
          day: targetDay,
          startTime,
          endTime,
          subject: subject.trim(),
          description: description.trim() || undefined,
          color
        });
        showToast("✨ Timetable block added successfully!", "success");
      }
      handleCancel();
    } catch (err: any) {
      showToast(`❌ Failed to save block: ${err.message}`, "error");
    }
  };

  // Filter slots to display on chosen day
  const dailySlots = timetable
    .filter(slot => slot.day === selectedDay || slot.day === 'All Days')
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
          onClick={() => {
            handleCancel();
            setIsAdding(true);
          }}
          className="flex items-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 text-white font-bold font-sans text-xs transition active:scale-95 shadow-md shadow-indigo-600/10"
        >
          <Plus className="w-4 h-4" />
          <span>Add Timeblock</span>
        </button>
      </div>

      {/* Input drawer form */}
      {isAdding && (
        <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-xl space-y-4 backdrop-blur-sm animate-slideUp">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-200">
              {editingSlotId ? '✏️ Edit Timeblock Details' : `📅 Map a Timeblock for ${isRepeatingDaily ? 'All Days' : slotDay}`}
            </h3>
            <button onClick={handleCancel} className="text-slate-500 hover:text-white transition font-bold font-mono">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
            <div className="space-y-1.5 col-span-1 md:col-span-2">
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

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider block">Day Selection</label>
              <select
                value={slotDay === 'All Days' ? 'Monday' : slotDay}
                disabled={isRepeatingDaily}
                onChange={(e) => setSlotDay(e.target.value as any)}
                className="w-full p-3 rounded-xl bg-slate-950/40 border border-slate-900 outline-none text-white focus:border-indigo-500/50 text-sm font-sans disabled:opacity-45 disabled:cursor-not-allowed"
                required
              >
                {DAYS_OF_WEEK.map(d => (
                  <option key={d} value={d} className="bg-slate-950 text-slate-200">
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 flex flex-col justify-end pb-1">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-900 bg-slate-950/20 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isRepeatingDaily}
                  onChange={(e) => {
                    setIsRepeatingDaily(e.target.checked);
                    if (e.target.checked) {
                      setSlotDay('All Days');
                    } else {
                      setSlotDay(selectedDay);
                    }
                  }}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950/40 text-indigo-600 focus:ring-indigo-500 accent-indigo-500 cursor-pointer"
                />
                <div>
                  <span className="font-semibold block text-xs text-slate-200">All Days (Repeat Daily)</span>
                  <span className="text-[10px] text-slate-500">Enable this block on every day of the week</span>
                </div>
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Start Time</label>
              <input 
                type="time" 
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950/40 border border-slate-900 outline-none text-white focus:border-indigo-500/50 text-sm font-mono"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">End Time</label>
              <input 
                type="time" 
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950/40 border border-slate-900 outline-none text-white focus:border-indigo-500/50 text-sm font-mono"
                required
              />
            </div>

            <div className="space-y-1.5 col-span-1 md:col-span-2">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Action description (Optional)</label>
              <input 
                type="text" 
                placeholder="Review arrays, code neural network models..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950/40 border border-slate-900 outline-none text-white focus:border-indigo-500/50 text-sm font-sans"
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
                    className={`p-2 rounded-xl flex items-center gap-1.5 border hover:scale-105 transition text-xs cursor-pointer ${color === c.hex ? 'border-white text-white bg-slate-950/50' : 'border-slate-900 text-slate-400 bg-slate-950/35'}`}
                  >
                    <div className="w-4.5 h-4.5 rounded-full shadow" style={{ backgroundColor: c.hex }} />
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={handleCancel}
                className="px-5 py-2.5 rounded-xl border border-slate-900 bg-slate-950/20 text-xs text-slate-400 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-bold flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <Save className="w-4 h-4" />
                <span>{editingSlotId ? 'Update Block' : 'Save Block'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Week days selectors tabs row */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900/40 border border-slate-800 rounded-2xl shadow-md overflow-x-auto scrollbar-none backdrop-blur-sm">
        {DAYS_OF_WEEK.map(day => {
          const count = timetable.filter(s => s.day === day || s.day === 'All Days').length;
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
                className="p-5 bg-slate-900/50 border border-slate-800 hover:border-slate-700/60 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow relative overflow-hidden backdrop-blur-sm transition duration-250 hover:bg-slate-900/60"
              >
                {/* Custom Color band left indicator */}
                <div className="absolute left-0 inset-y-0 w-1" style={{ backgroundColor: slot.color }} />

                <div className="flex items-start gap-3.5 flex-1">
                  <div className="p-2.5 rounded-xl border border-slate-900/60 flex items-center justify-center shrink-0 bg-slate-950/30 text-slate-400">
                    <Clock className="w-5 h-5" style={{ color: slot.color }} />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-900 text-slate-400 text-[10px]" style={{ borderLeftColor: slot.color, borderLeftWidth: '3px' }}>
                        🕒 {slot.startTime} - {slot.endTime}
                      </span>
                      {slot.day === 'All Days' ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/10 border border-amber-500/25 text-amber-400 uppercase tracking-widest">
                          🔁 Repeats Daily
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-slate-950 border border-slate-800 text-slate-400 uppercase tracking-widest">
                          📅 {slot.day}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm md:text-base font-bold text-slate-100">
                      {slot.subject}
                    </h4>
                    {slot.description && (
                      <p className="text-xs text-slate-400 font-sans mt-0.5">
                        {slot.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Control buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                  <button 
                    onClick={() => handleStartEdit(slot)}
                    className="p-2 border border-slate-900 text-slate-400 hover:text-indigo-400 hover:border-slate-850 rounded-lg bg-slate-950/20 bg-slate-950/10 hover:bg-slate-950/40 transition cursor-pointer"
                    title="Edit block"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={async () => {
                      if (confirm(`Are you sure you want to delete this study block?`)) {
                        await deleteTimetableSlot(slot.id);
                        showToast("🗑️ Time block removed from timetable.", "info");
                      }
                    }}
                    className="p-2 border border-slate-900 text-slate-500 hover:text-rose-400 hover:border-slate-850 rounded-lg bg-slate-950/20 bg-slate-950/10 hover:bg-slate-950/40 transition cursor-pointer"
                    title="Remove block"
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
