/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Clock, 
  Compass, 
  Sparkles, 
  Plus, 
  AlertOctagon, 
  Music, 
  Tv, 
  Maximize2, 
  Minimize2,
  Bell,
  CheckCircle,
  HelpCircle,
  TrendingUp
} from 'lucide-react';

export default function StudyHoursTracker() {
  const { stats, logStudyMinutes } = useDashboard();

  // Timer modes: 'pomodoro' | 'short_break' | 'long_break'
  const [timerMode, setTimerMode] = useState<'pomodoro' | 'short_break' | 'long_break'>('pomodoro');
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodorosCount, setPomodorosCount] = useState(0);

  // Focus mode toggle (full-screen ambient view)
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Integrated focus music playlists preset
  const [musicActive, setMusicActive] = useState(false);
  const [musicProvider, setMusicProvider] = useState<'lofi' | 'ambient' | 'nature'>('lofi');

  // Manual entry states
  const [manualHours, setManualHours] = useState('');
  const [manualMinutes, setManualMinutes] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualSuccess, setManualSuccess] = useState(false);

  // Audio elements ref for timer chime alerts
  const audioContextRef = useRef<AudioContext | null>(null);

  const modeDurations = {
    pomodoro: 25,
    short_break: 5,
    long_break: 15
  };

  // Change timer mode
  const handleModeChange = (mode: 'pomodoro' | 'short_break' | 'long_break') => {
    setIsRunning(false);
    setTimerMode(mode);
    setMinutes(modeDurations[mode]);
    setSeconds(0);
  };

  // Trigger web chime tone using raw synthetic audio oscillator (no external sound file dependencies)
  const playChime = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5

      gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (e) {
      console.warn("Audio Context chime not completed:", e);
    }
  };

  // Timer logic
  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1);
        } else if (seconds === 0) {
          if (minutes === 0) {
            // Timer Finished!
            setIsRunning(false);
            playChime();
            
            if (timerMode === 'pomodoro') {
              setPomodorosCount(prev => prev + 1);
              // Log 25 minutes to stats!
              logStudyMinutes(25, 1);
              alert("🎯 Pomodoro Complete! Time to take a break.");
              handleModeChange('short_break');
            } else {
              alert("☕ Break finished! Back to study.");
              handleModeChange('pomodoro');
            }
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning, minutes, seconds, timerMode]);

  const handleToggleStart = () => {
    // Try to trigger silent oscillator on click first to allow sound on phone/safari
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setMinutes(modeDurations[timerMode]);
    setSeconds(0);
  };

  // Manual study logging
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseInt(manualHours) || 0;
    const m = parseInt(manualMinutes) || 0;
    const totMins = (h * 60) + m;

    if (totMins <= 0) return;

    logStudyMinutes(totMins, 0);
    setManualHours('');
    setManualMinutes('');
    setManualSuccess(true);
    setTimeout(() => setManualSuccess(false), 3000);
  };

  // Math metrics for charts
  const todayStr = new Date().toISOString().split('Y-MM-DD')[0];
  const totalMins = stats.sessions.reduce((sum, s) => sum + s.durationMinutes, 0);

  // Map 7 days of session stats
  const getWeeklySessions = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const sessionsByDay = Array(7).fill(0);
    
    // Pick the last 7 calendar days
    const today = new Date();
    const result = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const mins = stats.sessions
        .filter(s => s.date === ds)
        .reduce((acc, s) => acc + s.durationMinutes, 0);
      result.push({
        label: days[d.getDay()],
        hours: (mins / 60)
      });
    }
    return result;
  };

  const weeklyData = getWeeklySessions();
  const maxHours = Math.max(...weeklyData.map(d => d.hours), 1);

  // Embedded playlists references (YouTube lofi streams / classical loops)
  const playlistUrls = {
    lofi: "https://www.youtube.com/embed/jfKfPfyJRdk", // Lofi Girl Chill
    ambient: "https://www.youtube.com/embed/5qap5aO4i9A", // Lofi nature space
    nature: "https://www.youtube.com/embed/n4_8P3d_fL8" // Forest stream
  };

  return (
    <div className={`space-y-8 max-w-7xl mx-auto p-4 md:p-8 text-white min-h-screen ${isFocusMode ? 'bg-[#05050f] fixed inset-0 z-50 overflow-y-auto' : ''}`}>
      
      {/* Immersive distraction-free Focus Mode view override */}
      {isFocusMode ? (
        <div className="flex flex-col items-center justify-center min-h-screen py-12 relative">
          
          {/* Pulsing visual breathing helper */}
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/15 via-[#03030d] to-purple-950/20 blur-xl flex items-center justify-center pointer-events-none">
            <div className="w-96 h-96 rounded-full bg-indigo-500/5 animate-pulse duration-[4000ms] border border-indigo-500/10" />
          </div>

          <button 
            onClick={() => setIsFocusMode(false)}
            className="absolute top-6 right-6 flex items-center gap-2 p-2.5 px-4 rounded-xl border border-slate-900 bg-slate-950/60 text-slate-400 hover:text-white transition duration-150 text-xs font-mono"
          >
            <Minimize2 className="w-4 h-4" />
            <span>Close Focus Arena</span>
          </button>

          <div className="text-center space-y-3 z-10">
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-bold bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              {timerMode === 'pomodoro' ? '🎯 FOCUS TIME' : '☕ BREAK IN PROGRESS'}
            </span>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-300">Absolute Focus Mode</h2>
            <p className="text-xs text-slate-500 max-w-sm font-sans mx-auto">
              Minimize sidebar noise. Focus purely on timer ticks and your breathing intervals.
            </p>
          </div>

          {/* Interactive timer circular dial */}
          <div className="relative w-72 h-72 md:w-80 md:h-80 flex items-center justify-center my-12 z-10 bg-slate-950/40 rounded-full shadow-2xl border border-slate-900 shadow-indigo-500/5 select-none md:scale-105">
            <svg className="absolute w-full h-full -rotate-90">
              <circle cx="160" cy="160" r="130" className="stroke-slate-950 fill-none" strokeWidth="10" />
              <circle 
                cx="160" 
                cy="160" 
                r="130" 
                className="stroke-indigo-500 fill-none transition-all duration-300" 
                strokeWidth="10" 
                strokeDasharray="816.8"
                strokeDashoffset={816.8 - (816.8 * ((minutes * 60 + seconds) / (modeDurations[timerMode] * 60)))}
                strokeLinecap="round"
              />
            </svg>
            
            <div className="text-center">
              <span className="text-6xl md:text-7.5xl font-black font-mono tracking-tighter block text-slate-100">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase block mt-2">
                Today completed: {pomodorosCount} loops
              </span>
            </div>
          </div>

          {/* Central state controller */}
          <div className="flex items-center gap-4 z-10">
            <button 
              onClick={handleToggleStart}
              className={`p-4 px-8 rounded-2xl flex items-center gap-2 text-sm font-bold shadow transition cursor-pointer ${
                isRunning 
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/10' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/10'
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isRunning ? 'Hold Timer' : 'Initiate Session'}</span>
            </button>
            <button 
              onClick={handleReset}
              className="p-4 border border-slate-800 bg-slate-900 hover:bg-slate-950 text-slate-300 rounded-2xl transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* YouTube lofi audio panel inside full-screen focus */}
          <div className="mt-12 w-full max-w-md bg-slate-950/60 border border-slate-900 rounded-2xl p-4 flex flex-col gap-3.5 z-10 shadow-lg">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-indigo-400" />
                <span>Focus Playlist</span>
              </span>
              <button 
                onClick={() => setMusicActive(!musicActive)}
                className={`text-[10px] px-2.5 py-1 border rounded font-mono ${musicActive ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400' : 'border-slate-800 text-slate-500'}`}
              >
                {musicActive ? 'Now Playing' : 'Offline'}
              </button>
            </div>
            {musicActive && (
              <iframe 
                width="100%" 
                height="80" 
                src={playlistUrls[musicProvider]} 
                title="Lofi focus track player" 
                className="rounded-xl border border-slate-900 bg-black/40"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              />
            )}
            <div className="flex items-center gap-2 justify-center">
              {(['lofi', 'ambient', 'nature'] as const).map(style => (
                <button
                  key={style}
                  onClick={() => { setMusicProvider(style); setMusicActive(true); }}
                  className={`px-3 py-1 rounded text-[10px] font-mono uppercase bg-slate-900 border ${musicProvider === style ? 'border-indigo-504 border-indigo-500 text-indigo-400' : 'border-slate-950 text-slate-500'}`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

        </div>
      ) : (
        // Standard Study Tracker view
        <>
          {/* Header section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest font-semibold font-bold">Deep Work Engine</span>
              <h2 className="text-2xl md:text-3.5xl font-extrabold tracking-tight mt-1 text-slate-100 font-sans leading-none">
                Study Tracker & Pomodoro
              </h2>
              <p className="text-sm text-slate-400 mt-2 font-sans">
                Build study streaks. Alternate focus bursts with spatial breaks to optimize neurotransmitters.
              </p>
            </div>
            
            <button 
              onClick={() => setIsFocusMode(true)}
              className="flex items-center gap-2 p-3 px-5 border border-purple-500/20 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/25 text-indigo-300 rounded-xl font-bold font-sans text-xs transition"
            >
              <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Enter Focus Arena</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Col: Master Timer widget */}
            <div className="lg:col-span-2 p-6 bg-slate-900/40 border border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between space-y-8 min-h-[480px] backdrop-blur-sm">
              {/* Timer Mode Selectors */}
              <div className="flex items-center gap-2 bg-slate-950/40 p-1 border border-slate-800 rounded-2xl max-w-md">
                {(['pomodoro', 'short_break', 'long_break'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleModeChange(mode)}
                    className={`
                      flex-1 py-2.5 rounded-xl text-xs font-sans font-bold transition cursor-pointer capitalize
                      ${timerMode === mode 
                        ? 'bg-indigo-600 text-white shadow' 
                        : 'text-slate-400 hover:text-white'
                      }
                    `}
                  >
                    {mode.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Central timer numeric clock */}
              <div className="flex flex-col items-center justify-center py-6 relative">
                <div className="text-7xl md:text-8.5xl font-black font-mono tracking-tighter text-indigo-400 block tabular-nums scale-105">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>
                <div className="flex items-center gap-2 text-slate-500 font-mono text-[10px] tracking-widest mt-3">
                  <Bell className="w-3.5 h-3.5 text-slate-600" />
                  <span>ALERT CHIME STANDBY | TODAY LOGGED: {pomodorosCount} POMYS</span>
                </div>
              </div>

              {/* Active timer slider logs controller */}
              <div className="flex items-center gap-4 justify-center">
                <button 
                  onClick={handleToggleStart}
                  className={`p-4 px-10 rounded-2xl flex items-center gap-2 text-sm font-bold shadow cursor-pointer text-white transition font-sans ${
                    isRunning 
                      ? 'bg-amber-600 hover:bg-amber-400 shadow-amber-600/10' 
                      : 'bg-indigo-600 hover:bg-indigo-400 shadow-indigo-600/10'
                  }`}
                >
                  {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isRunning ? 'Pause Work' : 'Begin Work Session'}</span>
                </button>
                <button 
                  onClick={handleReset}
                  className="p-4 border border-slate-900 hover:border-slate-800 bg-slate-950/30 text-slate-400 rounded-2xl transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Lofi integrated playlist widget (extra smart feature) */}
              <div className="border-t border-slate-900/70 pt-5 flex items-center justify-between text-xs flex-wrap gap-4 bg-slate-950/15 p-4 rounded-2xl">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-500/10 border border-indigo-400/25 text-indigo-400 rounded-lg">
                    <Music className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-300">Ambient Music Proxy</p>
                    <p className="text-[10px] text-slate-500">Enable integrated focus soundtracks.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setMusicProvider('lofi'); setMusicActive(!musicActive); }}
                    className={`px-3 py-1.5 rounded-lg border text-[10px] font-mono uppercase ${musicActive ? 'bg-indigo-600/10 border-indigo-400/20 text-indigo-400' : 'border-slate-900 text-slate-500 hover:text-white'}`}
                  >
                    🎶 {musicActive ? 'Now Streaming' : 'Play Lofi'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Col: Custom manual hours log Entry + visual graph */}
            <div className="space-y-6">
              {/* Daily targets log details */}
              <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl shadow-xl space-y-4 backdrop-blur-sm">
                <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Manual entry console</span>
                <h3 className="text-base font-bold text-slate-200">Record a study block</h3>

                <form onSubmit={handleManualSubmit} className="space-y-4 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Hours</label>
                      <input 
                        type="number" 
                        min="0"
                        placeholder="0"
                        value={manualHours}
                        onChange={(e) => setManualHours(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-950/45 border border-slate-800 outline-none text-white focus:border-indigo-500/50 text-xs font-sans"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Minutes</label>
                      <input 
                        type="number" 
                        min="0"
                        max="59"
                        placeholder="30"
                        value={manualMinutes}
                        onChange={(e) => setManualMinutes(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-950/45 border border-slate-800 outline-none text-white focus:border-indigo-500/50 text-xs font-sans"
                      />
                    </div>
                  </div>

                  {manualSuccess && (
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-sans">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Study minutes logged! XP increase secured.</span>
                    </p>
                  )}

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-slate-905 border border-slate-800/80 hover:bg-slate-950 bg-[#0f172a]/40 hover:bg-slate-900 hover:border-slate-700/60 text-indigo-300 text-xs font-semibold rounded-xl"
                  >
                    Archive Work Session
                  </button>
                </form>
              </div>

              {/* Custom SVG Weekly progress chart */}
              <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl shadow-xl space-y-4 backdrop-blur-sm">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono text-slate-500 uppercase tracking-widest leading-none">Usage Trend Lines</span>
                  <span className="text-[10px] text-indigo-400 font-mono font-bold flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>7 Days</span>
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-200">Study hours summary</h3>

                {/* SVG Visual Bar chart */}
                <div className="pt-2 h-44 flex items-end justify-between font-mono text-slate-500 relative">
                  
                  {/* Grid background lines */}
                  <div className="absolute inset-0 flex flex-col justify-between border-b border-slate-800 pointer-events-none pb-4">
                    <div className="border-t border-slate-800/30 w-full" />
                    <div className="border-t border-slate-800/30 w-full" />
                    <div className="border-t border-slate-800/30 w-full" />
                  </div>

                  {weeklyData.map((day, idx) => {
                    const barHeight = Math.max(8, Math.round((day.hours / maxHours) * 110));
                    return (
                      <div key={idx} className="flex flex-col items-center flex-1 gap-2.5 relative z-10 group">
                        <span className="text-[10px] font-bold text-indigo-400 opacity-0 group-hover:opacity-100 transition absolute top-[-20px]">
                          {day.hours.toFixed(1)}h
                        </span>
                        <div 
                          className="w-4 rounded-t-md bg-gradient-to-t from-indigo-600 to-purple-500 shadow-md shadow-indigo-600/5 group-hover:from-indigo-400 scroll-smooth transition-all"
                          style={{ height: `${barHeight}px` }}
                        />
                        <span className="text-[10px] text-slate-400 font-medium font-sans">{day.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
