import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  Calendar as CalendarIcon,
  Trophy, 
  Droplet, 
  Moon, 
  Sparkles,
  CheckCircle2,
  X,
  Apple,
  Award,
  Zap,
  Lock,
  Crown
} from 'lucide-react';

interface WellnessData {
  hydration: number;
  sleep: number;
  activeMinutes: number;
  hydrationChecked: boolean;
  sleepChecked: boolean;
  activeChecked: boolean;
}

interface WellnessCalendarHeatmapProps {
  completedDays: string[];
  currentData: WellnessData;
  todayStr: string;
}

const WATER_GOAL = 8;
const SLEEP_GOAL = 8.0;
const ACTIVE_GOAL = 30;

const MILESTONES = [
  { days: 7, label: "7-Day Devoted", color: "from-amber-600 to-orange-500", icon: "award", badgeText: "Bronze Spark" },
  { days: 14, label: "14-Day Fortitude", color: "from-indigo-600 to-blue-500", icon: "zap", badgeText: "Silver Ascent" },
  { days: 30, label: "30-Day Mastermind", color: "from-yellow-500 via-amber-400 to-emerald-500", icon: "crown", badgeText: "Golden Infinity" }
];

export default function WellnessCalendarHeatmap({ completedDays, currentData, todayStr }: WellnessCalendarHeatmapProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDayDoc, setSelectedDayDoc] = useState<{
    dateStr: string;
    score: number;
    data: WellnessData | null;
  } | null>(null);
  const [activeCelebration, setActiveCelebration] = useState<typeof MILESTONES[number] | null>(null);

  // Compute consecutive streak count accurately
  const computeCurrentStreak = () => {
    if (completedDays.length === 0) return 0;
    
    const completedSet = new Set(completedDays);
    const today = new Date();
    
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const todayStrVal = formatDate(today);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStrVal = formatDate(yesterday);
    
    let currentCheck = today;
    if (completedSet.has(todayStrVal)) {
      currentCheck = today;
    } else if (completedSet.has(yesterdayStrVal)) {
      currentCheck = yesterday;
    } else {
      return 0;
    }
    
    let streakCount = 0;
    while (true) {
      const formatted = formatDate(currentCheck);
      const isCompleted = completedSet.has(formatted);
      if (isCompleted) {
        streakCount++;
        currentCheck.setDate(currentCheck.getDate() - 1);
      } else {
        break;
      }
    }
    return streakCount;
  };

  const currentOverallStreak = computeCurrentStreak();

  // Watch for new milestones unlocked to trigger a spectacular celebration automatic toast
  useEffect(() => {
    if (completedDays.length === 0) return;
    
    const currentStreak = computeCurrentStreak();
    if (currentStreak === 0) return;

    // Find if the current streak exactly corresponds to or exceeds an achieved milestone that hasn't been notified yet
    const savedNotificationKey = 'wellness_notified_milestones_v2';
    let notified: number[] = [];
    try {
      const saved = localStorage.getItem(savedNotificationKey);
      if (saved) {
        notified = JSON.parse(saved);
      }
    } catch (e) {
      // fallback
    }

    const eligibleMilestone = MILESTONES.find(m => currentStreak >= m.days && !notified.includes(m.days));
    if (eligibleMilestone) {
      setActiveCelebration(eligibleMilestone);
      // Mark as notified in localStorage
      localStorage.setItem(savedNotificationKey, JSON.stringify([...notified, eligibleMilestone.days]));
    }
  }, [completedDays]);

  const activeYear = currentDate.getFullYear();
  const activeMonth = currentDate.getMonth(); // 0-indexed

  // Format month name
  const monthName = currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  // Get days in month
  const totalDaysInMonth = new Date(activeYear, activeMonth + 1, 0).getDate();
  // Get starting day of the week (0 = Sunday, 1 = Monday, etc.)
  const startDayOfWeek = new Date(activeYear, activeMonth, 1).getDay();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(activeYear, activeMonth - 1, 1));
    setSelectedDayDoc(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(activeYear, activeMonth + 1, 1));
    setSelectedDayDoc(null);
  };

  const handleResetToCurrentMonth = () => {
    setCurrentDate(new Date());
    setSelectedDayDoc(null);
  };

  // Helper to format date key
  const getDateKeyForDay = (dayNum: number) => {
    const formattedMonth = String(activeMonth + 1).padStart(2, '0');
    const formattedDay = String(dayNum).padStart(2, '0');
    return `${activeYear}-${formattedMonth}-${formattedDay}`;
  };

  // Helper to get daily score and data
  const getDayMetadata = (dayNum: number) => {
    const dateStr = getDateKeyForDay(dayNum);
    
    let dayData: WellnessData | null = null;
    
    // Check if it's today
    if (dateStr === todayStr) {
      dayData = currentData;
    } else {
      const saved = localStorage.getItem(`wellness_checklist_${dateStr}`);
      if (saved) {
        try {
          dayData = JSON.parse(saved);
        } catch (e) {
          // parse fallback
        }
      }
    }
    
    const isCompletedFully = completedDays.includes(dateStr);
    
    let score = 0;
    let detailLog = '';
    if (dayData) {
      const isWaterDone = dayData.hydrationChecked || dayData.hydration >= WATER_GOAL;
      const isSleepDone = dayData.sleepChecked || dayData.sleep >= SLEEP_GOAL;
      const isActiveDone = dayData.activeChecked || dayData.activeMinutes >= ACTIVE_GOAL;
      score = (isWaterDone ? 1 : 0) + (isSleepDone ? 1 : 0) + (isActiveDone ? 1 : 0);
      detailLog = `[dayData keys: hydration=${dayData.hydration}, sleep=${dayData.sleep}, activeMinutes=${dayData.activeMinutes}, hydrationChecked=${dayData.hydrationChecked}, sleepChecked=${dayData.sleepChecked}, activeChecked=${dayData.activeChecked}] isWaterDone: ${isWaterDone}, isSleepDone: ${isSleepDone}, isActiveDone: ${isActiveDone}`;
    } else if (isCompletedFully) {
      score = 3;
    }

    const initialScore = score;
    // Force score to 3 if marked as completed fully in history log (resolves empty-checklist override glitch)
    if (isCompletedFully) {
      score = 3;
    }
    
    // Add debugging console log to trace day metadata
    console.log(
      `[DEBUG getDayMetadata] Day: ${dayNum} (${dateStr}) | score: ${score} | isCompletedFully in history: ${isCompletedFully} | initial calculated score from metrics: ${initialScore} | ${detailLog || 'No dayData'}`
    );
    
    return { dateStr, score, data: dayData };
  };

  // Calculate stats for current visible month
  const getMonthStats = () => {
    let perfectDaysCount = 0;
    let partialDaysCount = 0;
    let maxStreak = 0;
    let currentTempStreak = 0;

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const { score, dateStr } = getDayMetadata(d);
      
      if (score === 3) {
        perfectDaysCount++;
        currentTempStreak++;
        if (currentTempStreak > maxStreak) {
          maxStreak = currentTempStreak;
        }
      } else {
        currentTempStreak = 0;
        if (score > 0) {
          partialDaysCount++;
        }
      }
    }

    return {
      perfectDays: perfectDaysCount,
      partialDays: partialDaysCount,
      totalStamps: perfectDaysCount + partialDaysCount,
      monthPeakStreak: maxStreak
    };
  };

  const monthStats = getMonthStats();

  // Create grid arrays
  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Handle cell selection
  const handleSelectCell = (dayNum: number) => {
    const meta = getDayMetadata(dayNum);
    setSelectedDayDoc(meta);
  };

  return (
    <div id="wellness-calendar-heatmap-card" className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 my-4 text-left relative overflow-hidden">
      
      {/* Absolute Celebratory Milestone Overlay inside WellnessCalendarHeatmap */}
      <AnimatePresence>
        {activeCelebration && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/95 z-40 rounded-2xl flex flex-col items-center justify-center p-6 text-center overflow-hidden"
          >
            {/* Ambient sunburst rays backdrop */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
              className={`absolute w-96 h-96 opacity-10 bg-gradient-to-r ${activeCelebration.color} rounded-full blur-2xl pointer-events-none`}
            />

            {/* Simulated virtual confetti particles using Framer Motion */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 24 }).map((_, pIdx) => {
                const angle = (pIdx / 24) * 360;
                const dist = 100 + Math.random() * 120;
                const rad = (angle * Math.PI) / 180;
                const tx = Math.cos(rad) * dist;
                const ty = Math.sin(rad) * dist;

                return (
                  <motion.div
                    key={pIdx}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 0.5 }}
                    animate={{ 
                      x: tx, 
                      y: ty, 
                      opacity: [1, 1, 0],
                      scale: [0.5, 1.2, 0.4],
                      rotate: [0, 180 + Math.random() * 180]
                    }}
                    transition={{ 
                      repeat: Infinity,
                      repeatDelay: 0.5 + Math.random() * 1.5,
                      duration: 1.5 + Math.random() * 1.5, 
                      ease: "easeOut" 
                    }}
                    className={`absolute left-1/2 top-1/2 -ml-1.5 -mt-1.5 w-3 h-3 rounded-full bg-gradient-to-r ${activeCelebration.color} opacity-75`}
                  />
                );
              })}
            </div>

            {/* Glowing Trophy Icon with bouncing scale */}
            <motion.div
              initial={{ scale: 0.3, rotate: -20 }}
              animate={{ scale: [0.8, 1.1, 1], rotate: [0, 10, 0] }}
              transition={{ type: "spring", damping: 10, stiffness: 100, delay: 0.1 }}
              className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${activeCelebration.color} p-4 text-white flex items-center justify-center shadow-lg relative z-10`}
            >
              <div className="absolute inset-0 bg-white/20 rounded-2xl blur-md -z-10 animate-pulse" />
              {activeCelebration.icon === 'award' && <Award className="w-10 h-10 stroke-[2.5]" />}
              {activeCelebration.icon === 'zap' && <Zap className="w-10 h-10 stroke-[2.5]" />}
              {activeCelebration.icon === 'crown' && <Crown className="w-10 h-10 stroke-[2.5]" />}
            </motion.div>

            {/* Title / Streak Content */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 space-y-2 relative z-10 max-w-sm"
            >
              <div className="text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full w-max mx-auto">
                Milestone Achievement Unlocked
              </div>
              <h3 className="text-xl font-black text-white">{activeCelebration.label}</h3>
              <p className="text-xs text-slate-350 leading-relaxed mt-2 p-1.5 bg-white/5 border border-white/5 rounded-xl">
                Congratulations! You reached a phenomenal <span className="font-bold text-emerald-400 font-mono text-[13px]">{activeCelebration.days}-day wellness streak</span>. Keeping your hydration, sleep, and active goals aligned builds lasting biometric resilience.
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={() => setActiveCelebration(null)}
              className={`mt-6 px-6 py-2.5 rounded-xl font-mono text-xs font-bold text-white bg-gradient-to-r ${activeCelebration.color} hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-white/10 transition cursor-pointer relative z-10`}
            >
              Awesome! Continue Journey
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Banner and Monthly Navigation Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">Habit Calendar Tracker</span>
          </div>
          <h4 className="text-sm font-bold text-white mt-1">Monthly Heatmap & Streaks</h4>
        </div>

        {/* Month Selector Buttons */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-start">
          <button 
            onClick={handleResetToCurrentMonth}
            className="text-[10px] bg-white/5 hover:bg-white/10 border border-white/5 hover:text-white text-slate-400 px-2.5 py-1.5 rounded-lg font-mono transition text-center"
          >
            Today
          </button>
          
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 rounded-xl p-1 shrink-0">
            <button
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-1 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-slate-200 px-2 select-none min-w-[124px] text-center">
              {monthName}
            </span>
            <button
              onClick={handleNextMonth}
              title="Next Month"
              className="p-1 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid containing Monthly Calendar Heatmap Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5">
        
        {/* Left Side: Days Grid Map */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Day of week captions */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-mono font-bold text-slate-500">
            {weekdays.map((day) => (
              <div key={day} className="py-1">{day}</div>
            ))}
          </div>

          {/* Core Calendar Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Blank places preceding the 1st of active month */}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div 
                key={`empty-${i}`} 
                className="aspect-square bg-transparent border border-transparent rounded-lg" 
              />
            ))}

            {/* Monthly day grid items */}
            {Array.from({ length: totalDaysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const { score, dateStr } = getDayMetadata(dayNum);
              const isCellToday = dateStr === todayStr;
              const isSelected = selectedDayDoc?.dateStr === dateStr;

              // Grid heatmap shading logic based on 0-3 score
              let fillClass = 'bg-slate-950/40 hover:bg-slate-900 border-white/[0.03] text-slate-400';
              let ringClass = '';

              if (score === 1) {
                fillClass = 'bg-emerald-500/10 border-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20';
              } else if (score === 2) {
                fillClass = 'bg-emerald-500/25 border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/35';
              } else if (score === 3) {
                fillClass = 'bg-emerald-500/50 border-emerald-400/40 text-emerald-50 shadow-[0_0_12px_rgba(16,185,129,0.15)] hover:bg-emerald-500/65 font-black';
              }

              if (isCellToday) {
                ringClass = 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#0a0f1e]';
              } else if (isSelected) {
                ringClass = 'ring-2 ring-emerald-400';
              }

              return (
                <button
                  key={`day-${dayNum}`}
                  onClick={() => handleSelectCell(dayNum)}
                  className={`aspect-square rounded-xl border flex flex-col items-center justify-center p-1 text-[10px] font-mono leading-none transition-all cursor-pointer relative ${fillClass} ${ringClass}`}
                  title={`${dateStr}: ${score}/3 Goals Met`}
                >
                  <span className="font-bold">{dayNum}</span>
                  
                  {/* Miniature score indicator bubbles on bottom */}
                  {score > 0 && (
                    <div className="flex gap-0.5 mt-1">
                      {Array.from({ length: score }).map((_, bIdx) => (
                        <div 
                          key={bIdx} 
                          className={`w-1 h-1 rounded-full ${score === 3 ? 'bg-emerald-100' : 'bg-emerald-400'}`} 
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

        </div>

        {/* Right Side: Detailed statistics block & Selected Day Inspector */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4">
          
          {/* Monthly calculations container */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3.5 text-left h-full">
            <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider block">Visible Monthly Analytics</span>
            
            <div className="grid grid-cols-2 gap-3.5">
              
              <div className="bg-white/5 p-3 rounded-xl border border-white/[0.03] text-left relative overflow-hidden">
                <span className="text-[9px] text-slate-450 font-mono block uppercase">Perfect Days</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black font-mono text-emerald-400">{monthStats.perfectDays}</span>
                  <span className="text-[10px] text-slate-400">stamps</span>
                </div>
                <Trophy className="absolute right-2.5 bottom-2.5 w-6 h-6 text-yellow-500/10 pointer-events-none" />
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-white/[0.03] text-left relative overflow-hidden">
                <span className="text-[9px] text-slate-450 font-mono block uppercase">Partial Habits</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black font-mono text-amber-405">{monthStats.partialDays}</span>
                  <span className="text-[10px] text-slate-450">days</span>
                </div>
                <Sparkles className="absolute right-2.5 bottom-2.5 w-6 h-6 text-emerald-500/10 pointer-events-none" />
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-white/[0.03] text-left relative overflow-hidden">
                <span className="text-[9px] text-slate-450 font-mono block uppercase">Total Active Days</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black font-mono text-indigo-400">{monthStats.totalStamps}</span>
                  <span className="text-[10px] text-slate-450">/ {totalDaysInMonth} Days</span>
                </div>
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-white/[0.03] text-left relative overflow-hidden">
                <span className="text-[9px] text-slate-450 font-mono block uppercase">Month Peak Streak</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black font-mono text-orange-400">{monthStats.monthPeakStreak}</span>
                  <span className="text-[10px] text-slate-450">consecutive</span>
                </div>
                <Flame className="absolute right-2.5 bottom-2.5 w-6 h-6 text-orange-500/10 pointer-events-none" />
              </div>

            </div>

            {/* Streak Milestone Achievements */}
            <div className="pt-3.5 border-t border-white/5 space-y-2">
              <span className="text-[10px] text-slate-300 font-mono uppercase tracking-wider block font-bold">Streak Milestone Badges</span>
              <div className="grid grid-cols-3 gap-2">
                {MILESTONES.map((milestone) => {
                  const isUnlocked = currentOverallStreak >= milestone.days;
                  const percent = Math.min(100, Math.round((currentOverallStreak / milestone.days) * 100));
                  
                  return (
                    <button
                      key={milestone.days}
                      onClick={() => {
                        if (isUnlocked) {
                          setActiveCelebration(milestone);
                        }
                      }}
                      className={`text-left p-2.5 rounded-xl border flex flex-col justify-between h-[100px] select-none transition-all group relative overflow-hidden ${
                        isUnlocked 
                          ? 'bg-gradient-to-br from-white/10 to-transparent border-white/10 hover:border-white/20 hover:scale-[1.03] active:scale-95 cursor-pointer shadow-md' 
                          : 'bg-white/[0.01] border-white/[0.03] opacity-55 cursor-default'
                      }`}
                    >
                      {/* Badge glow background */}
                      {isUnlocked && (
                        <div className={`absolute -right-3 -bottom-3 w-10 h-10 rounded-full blur-xl bg-gradient-to-r ${milestone.color} opacity-30 group-hover:opacity-50 transition-opacity`} />
                      )}
                      
                      <div className="flex justify-between items-start w-full gap-1">
                        <div className={`p-1 rounded-lg ${
                          isUnlocked 
                            ? 'bg-white/15 text-white shadow-sm' 
                            : 'bg-white/5 text-slate-500'
                        }`}>
                          {milestone.icon === 'award' && <Award className="w-3.5 h-3.5" />}
                          {milestone.icon === 'zap' && <Zap className="w-3.5 h-3.5" />}
                          {milestone.icon === 'crown' && <Crown className="w-3.5 h-3.5" />}
                        </div>
                        {isUnlocked ? (
                          <span className="text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1 py-0.5 rounded-md font-mono font-bold leading-none shrink-0 scale-90">MET</span>
                        ) : (
                          <div className="text-slate-500 shrink-0">
                            <Lock className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      <div className="mt-1.5 w-full">
                        <span className="text-[8px] text-slate-500 font-mono uppercase block truncate leading-none">{milestone.badgeText}</span>
                        <span className="text-[10px] font-black text-white mt-0.5 block truncate leading-tight">{milestone.label}</span>
                        
                        {/* Progress line if locked */}
                        {!isUnlocked ? (
                          <div className="mt-1.5">
                            <div className="flex justify-between items-center text-[8px] text-slate-500 font-mono leading-none mb-0.5">
                              <span>Progress</span>
                              <span>{currentOverallStreak}/{milestone.days}d</span>
                            </div>
                            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-550 rounded-full transition-all duration-500" 
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="text-[8px] text-slate-400 font-mono mt-1 font-semibold flex items-center gap-0.5 leading-none">
                            <Sparkles className="w-2.5 h-2.5 text-yellow-400 animate-pulse" />
                            <span className="group-hover:text-white transition-colors">Tap to Celebrate</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-[9px] text-slate-450 font-light leading-snug">
              Monthly stats calculate from all locally historical records registered on this device. Consistently submit checklists daily to grow streaks and perfect scores! Lasting change values require daily alignment.
            </p>
          </div>

          {/* Collapsible Selected Day Inspector Panel */}
          <AnimatePresence mode="wait">
            {selectedDayDoc && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 text-left space-y-3 relative"
              >
                <button
                  onClick={() => setSelectedDayDoc(null)}
                  className="absolute right-3 top-3 p-1 hover:bg-white/5 rounded-full transition text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                <div className="border-b border-white/5 pb-2">
                  <div className="text-[10px] text-indigo-400 font-mono font-bold uppercase">Biometric Day Inspector</div>
                  <h5 className="text-xs font-bold text-white mt-0.5">
                    {new Date(selectedDayDoc.dateStr).toLocaleDateString(undefined, {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </h5>
                </div>

                {selectedDayDoc.data ? (
                  <div className="space-y-2">
                    
                    {/* Water detail item */}
                    <div className="flex items-center justify-between bg-white/[0.02] p-2 rounded-lg text-xs">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Droplet className="w-3 h-3 text-blue-400" />
                        Hydration
                      </span>
                      <span className="font-mono text-slate-200 font-semibold">
                        {selectedDayDoc.data.hydration} / {WATER_GOAL} glasses 
                        {selectedDayDoc.data.hydrationChecked ? ' ✓' : ''}
                      </span>
                    </div>

                    {/* Sleep detail item */}
                    <div className="flex items-center justify-between bg-white/[0.02] p-2 rounded-lg text-xs">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Moon className="w-3 h-3 text-purple-400" />
                        Sleep
                      </span>
                      <span className="font-mono text-slate-200 font-semibold">
                        {selectedDayDoc.data.sleep.toFixed(1)} / {SLEEP_GOAL.toFixed(1)} hrs
                        {selectedDayDoc.data.sleepChecked ? ' ✓' : ''}
                      </span>
                    </div>

                    {/* Active minutes detail item */}
                    <div className="flex items-center justify-between bg-white/[0.02] p-2 rounded-lg text-xs">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Flame className="w-3 h-3 text-orange-400" />
                        Active Minutes
                      </span>
                      <span className="font-mono text-slate-200 font-semibold">
                        {selectedDayDoc.data.activeMinutes} / {ACTIVE_GOAL} mins
                        {selectedDayDoc.data.activeChecked ? ' ✓' : ''}
                      </span>
                    </div>

                    {/* Achievement status feedback line */}
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg font-mono font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 fill-none shrink-0" />
                      <span>{selectedDayDoc.score} of 3 wellness targets accomplished!</span>
                    </div>

                  </div>
                ) : (
                  <div className="py-2.5 text-center">
                    <span className="text-[11px] text-slate-400 italic block">No active metrics logged for this date.</span>
                    <p className="text-[9px] text-slate-500 mt-1 leading-normal">
                      Completed checks are stored automatically. Check individual habits fully or tap check on top to log logs manually.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

    </div>
  );
}
