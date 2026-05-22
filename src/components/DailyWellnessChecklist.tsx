import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Droplet, 
  Moon, 
  Flame, 
  Plus, 
  Minus, 
  CheckCircle2, 
  Sparkles, 
  Trophy, 
  RotateCcw,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface WellnessData {
  hydration: number; // Glasses of water
  sleep: number;      // Hours
  activeMinutes: number; // Minutes
  hydrationChecked: boolean;
  sleepChecked: boolean;
  activeChecked: boolean;
}

const WATER_GOAL = 8;       // 8 glasses
const SLEEP_GOAL = 8.0;     // 8 hours
const ACTIVE_GOAL = 30;     // 30 minutes

export default function DailyWellnessChecklist() {
  const [todayStr, setTodayStr] = useState('');
  const [data, setData] = useState<WellnessData>({
    hydration: 0,
    sleep: 0,
    activeMinutes: 0,
    hydrationChecked: false,
    sleepChecked: false,
    activeChecked: false
  });
  const [showCelebrate, setShowCelebrate] = useState(false);

  // Initialize date & fetch from localStorage
  useEffect(() => {
    // Format date as local date string to avoid timezone shifts
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${dateKeyHelper() ? dateKeyHelper() : day}`; // safe fallback helper
    
    function dateKeyHelper() {
      return day;
    }

    setTodayStr(dateKey);

    const saved = localStorage.getItem(`wellness_checklist_${dateKey}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData(prev => ({
          ...prev,
          ...parsed
        }));
      } catch (e) {
        console.error('Failed to parse daily wellness checklist state', e);
      }
    } else {
      // Clear old wellness_checklist to avoid cluttered localstorage
      // (Optional clean-up: remove keys starting with wellness_checklist_ from other days if needed)
    }
  }, []);

  // Sync data to localStorage on changes
  useEffect(() => {
    if (!todayStr) return;
    localStorage.setItem(`wellness_checklist_${todayStr}`, JSON.stringify(data));

    // Check if everything is checked and at least goals are close or completed to trigger celebration
    const allCompleted = 
      (data.hydration >= WATER_GOAL || data.hydrationChecked) &&
      (data.sleep >= SLEEP_GOAL || data.sleepChecked) &&
      (data.activeMinutes >= ACTIVE_GOAL || data.activeChecked);

    if (allCompleted && (data.hydration > 0 || data.sleep > 0 || data.activeMinutes > 0)) {
      setShowCelebrate(true);
    } else {
      setShowCelebrate(false);
    }
  }, [data, todayStr]);

  const updateField = <K extends keyof WellnessData>(field: K, value: WellnessData[K]) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const incrementHydration = () => {
    const nextVal = Math.min(24, data.hydration + 1);
    setData(prev => ({
      ...prev,
      hydration: nextVal,
      // Auto-toggle check if target reached
      hydrationChecked: nextVal >= WATER_GOAL ? true : prev.hydrationChecked
    }));
  };

  const decrementHydration = () => {
    const nextVal = Math.max(0, data.hydration - 1);
    setData(prev => ({
      ...prev,
      hydration: nextVal,
      hydrationChecked: nextVal < WATER_GOAL ? false : prev.hydrationChecked
    }));
  };

  const incrementSleep = () => {
    const nextVal = Math.min(24, data.sleep + 0.5);
    setData(prev => ({
      ...prev,
      sleep: nextVal,
      sleepChecked: nextVal >= SLEEP_GOAL ? true : prev.sleepChecked
    }));
  };

  const decrementSleep = () => {
    const nextVal = Math.max(0, data.sleep - 0.5);
    setData(prev => ({
      ...prev,
      sleep: nextVal,
      sleepChecked: nextVal < SLEEP_GOAL ? false : prev.sleepChecked
    }));
  };

  const incrementActive = () => {
    const nextVal = Math.min(480, data.activeMinutes + 5);
    setData(prev => ({
      ...prev,
      activeMinutes: nextVal,
      activeChecked: nextVal >= ACTIVE_GOAL ? true : prev.activeChecked
    }));
  };

  const decrementActive = () => {
    const nextVal = Math.max(0, data.activeMinutes - 5);
    setData(prev => ({
      ...prev,
      activeMinutes: nextVal,
      activeChecked: nextVal < ACTIVE_GOAL ? false : prev.activeChecked
    }));
  };

  const resetToday = () => {
    if (window.confirm("Do you want to reset today's tracked wellness checklist data?")) {
      setData({
        hydration: 0,
        sleep: 0,
        activeMinutes: 0,
        hydrationChecked: false,
        sleepChecked: false,
        activeChecked: false
      });
    }
  };

  // Compute stats
  const completedCount = 
    (data.hydrationChecked ? 1 : 0) + 
    (data.sleepChecked ? 1 : 0) + 
    (data.activeChecked ? 1 : 0);

  const completionPercent = Math.round((completedCount / 3) * 100);

  // Format nice human date
  const getReadableToday = () => {
    return new Date().toLocaleDateString(undefined, {
      weekday: 'long', 
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <div id="daily-wellness-checklist-container" className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden">
      
      {/* Dynamic celebratory ambient glow overlay */}
      {showCelebrate && (
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 pointer-events-none animate-pulse" />
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1 px-2 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold tracking-wider uppercase">
              Daily Habit Tracker
            </div>
            <span className="text-xs text-slate-550">•</span>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
              <Calendar className="w-3.5 h-3.5" />
              <span className="font-medium">{getReadableToday()}</span>
            </div>
          </div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
            Wellness Checklist
            {showCelebrate && <Sparkles className="w-4 h-4 text-emerald-400 animate-bounce" />}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Daily Progress</span>
            <span className="text-sm font-extrabold font-mono text-emerald-400">{completionPercent}% Complete</span>
          </div>
          
          <button
            onClick={resetToday}
            title="Reset data"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Global Progress Bar */}
      <div className="my-4 h-1.5 w-full bg-slate-900 rounded-full overflow-hidden relative border border-white/[0.02]">
        <motion.div
          id="wellness-progressbar-fill"
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
          initial={{ width: 0 }}
          animate={{ width: `${completionPercent}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Checklist items layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
        
        {/* Unit 1: Hydration Tracker */}
        <div className={`p-4 rounded-xl border text-left flex flex-col justify-between transition relative overflow-hidden bg-white/5 ${data.hydrationChecked ? 'border-emerald-500/25 bg-emerald-500/[0.02]' : 'border-white/5 hover:bg-white/[0.07]'}`}>
          
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${data.hydrationChecked ? 'bg-emerald-400/20 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                <Droplet className="w-4 h-4 fill-current" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Hydration target</h4>
                <p className="text-[9px] text-slate-400 font-mono">Goal: {WATER_GOAL} glasses</p>
              </div>
            </div>

            <button
              id="chk-hydration"
              onClick={() => updateField('hydrationChecked', !data.hydrationChecked)}
              className={`p-1 rounded cursor-pointer transition border ${data.hydrationChecked ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400' : 'bg-transparent border-white/20 hover:border-slate-400 text-transparent'}`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 fill-current text-current" />
            </button>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xl font-black font-mono text-white">
                {data.hydration} <span className="text-xs font-normal opacity-50">glasses</span>
              </span>
              <span className="text-[9px] text-slate-450 font-mono">
                {data.hydration >= WATER_GOAL ? 'Goal Surpassed! 🎉' : `${WATER_GOAL - data.hydration} left`}
              </span>
            </div>

            {/* Quick action buttons & water glass segments indicators */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white/5 border border-white/5 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={decrementHydration}
                  className="p-1 hover:bg-white/10 text-slate-300 rounded transition"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="px-2 text-[10px] font-mono font-bold text-slate-400">Ctrl</span>
                <button
                  type="button"
                  onClick={incrementHydration}
                  className="p-1 hover:bg-white/10 text-slate-300 rounded transition"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Mini relative progress bar */}
              <div className="flex-1 flex gap-0.5 h-2.5 items-center justify-start overflow-hidden px-1">
                {Array.from({ length: Math.max(WATER_GOAL, data.hydration) }).map((_, i) => (
                  <div 
                    key={i}
                    className={`h-full w-1 rounded-sm transition ${i < data.hydration ? 'bg-blue-400' : 'bg-white/10'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Unit 2: Sleep Tracker */}
        <div className={`p-4 rounded-xl border text-left flex flex-col justify-between transition relative overflow-hidden bg-white/5 ${data.sleepChecked ? 'border-emerald-500/25 bg-emerald-500/[0.02]' : 'border-white/5 hover:bg-white/[0.07]'}`}>
          
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${data.sleepChecked ? 'bg-emerald-400/20 text-emerald-400' : 'bg-purple-500/10 text-purple-400'}`}>
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Sleep Duration</h4>
                <p className="text-[9px] text-slate-400 font-mono">Goal: {SLEEP_GOAL.toFixed(1)} hrs</p>
              </div>
            </div>

            <button
              id="chk-sleep"
              onClick={() => updateField('sleepChecked', !data.sleepChecked)}
              className={`p-1 rounded cursor-pointer transition border ${data.sleepChecked ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400' : 'bg-transparent border-white/20 hover:border-slate-400 text-transparent'}`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 fill-current text-current" />
            </button>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xl font-black font-mono text-white">
                {data.sleep.toFixed(1)} <span className="text-xs font-normal opacity-50">hours</span>
              </span>
              <span className="text-[9px] text-slate-350 font-mono bg-white/5 px-1.5 py-0.5 rounded text-center">
                {data.sleep === 0 ? 'Not logged' : data.sleep < 6 ? '🥱 Light' : data.sleep < SLEEP_GOAL ? '😴 Adequate' : '⚡ Rested'}
              </span>
            </div>

            {/* Change values buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center bg-white/5 border border-white/5 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={decrementSleep}
                  className="p-1 hover:bg-white/10 text-slate-300 rounded transition"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="px-1.5 text-[9px] font-mono text-slate-400">0.5h</span>
                <button
                  type="button"
                  onClick={incrementSleep}
                  className="p-1 hover:bg-white/10 text-slate-300 rounded transition"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Sleep visual background bar */}
              <div className="flex-1 max-w-[80px] h-1 bg-white/5 rounded overflow-hidden relative mx-2">
                <div 
                  className="h-full bg-purple-400 rounded transition"
                  style={{ width: `${Math.min(100, (data.sleep / SLEEP_GOAL) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Unit 3: Active Minutes Tracker */}
        <div className={`p-4 rounded-xl border text-left flex flex-col justify-between transition relative overflow-hidden bg-white/5 ${data.activeChecked ? 'border-emerald-500/25 bg-emerald-500/[0.02]' : 'border-white/5 hover:bg-white/[0.07]'}`}>
          
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${data.activeChecked ? 'bg-emerald-400/20 text-emerald-400' : 'bg-orange-500/10 text-orange-400'}`}>
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Active Minutes</h4>
                <p className="text-[9px] text-slate-400 font-mono">Goal: {ACTIVE_GOAL} mins</p>
              </div>
            </div>

            <button
              id="chk-active"
              onClick={() => updateField('activeChecked', !data.activeChecked)}
              className={`p-1 rounded cursor-pointer transition border ${data.activeChecked ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400' : 'bg-transparent border-white/20 hover:border-slate-400 text-transparent'}`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 fill-current text-current" />
            </button>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xl font-black font-mono text-white">
                {data.activeMinutes} <span className="text-xs font-normal opacity-50">mins</span>
              </span>
              <span className="text-[9px] text-slate-450 font-mono">
                {data.activeMinutes >= ACTIVE_GOAL ? 'Target met! 🏃' : `${ACTIVE_GOAL - data.activeMinutes}m remaining`}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center bg-white/5 border border-white/5 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={decrementActive}
                  className="p-1 hover:bg-white/10 text-slate-300 rounded transition"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="px-1.5 text-[9px] font-mono text-slate-400">5m</span>
                <button
                  type="button"
                  onClick={incrementActive}
                  className="p-1 hover:bg-white/10 text-slate-300 rounded transition"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Progress dynamic line */}
              <div className="flex-1 max-w-[80px] h-1 bg-white/5 rounded overflow-hidden relative mx-2">
                <div 
                  className="h-full bg-orange-400 rounded transition animate-pulse"
                  style={{ width: `${Math.min(100, (data.activeMinutes / ACTIVE_GOAL) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Success notification panel */}
      <AnimatePresence>
        {completionPercent === 100 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 mt-5 text-left"
          >
            <Trophy className="w-5 h-5 text-yellow-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-white block">Amazing Job! Full Core Habits Locked! 🏆</span>
              <p className="text-[10px] text-slate-350">You've successfully finished hydration, active minutes, and sleep hours goals for today. Premium biological alignment achieved.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
