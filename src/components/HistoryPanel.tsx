import React from 'react';
import { motion } from 'motion/react';
import { Trash2, TrendingUp, Sparkles, Scale, Flame, Apple, RefreshCw, Calendar, CalendarMinus } from 'lucide-react';
import { CalculationResult } from '../types';

interface HistoryItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
  timestamp: string;
}

interface HistoryPanelProps {
  calcHistory: CalculationResult[];
  foodLogs: HistoryItem[];
  onDeleteCalc: (id: string) => void;
  onDeleteFood: (id: string) => void;
  onClearAll: () => void;
}

export default function HistoryPanel({
  calcHistory,
  foodLogs,
  onDeleteCalc,
  onDeleteFood,
  onClearAll
}: HistoryPanelProps) {

  // Sump up daily calories
  const totalCalories = foodLogs.reduce((sum, item) => sum + item.calories, 0);
  const totalProtein = foodLogs.reduce((sum, item) => sum + item.protein, 0);
  const totalCarbs = foodLogs.reduce((sum, item) => sum + item.carbs, 0);
  const totalFat = foodLogs.reduce((sum, item) => sum + item.fat, 0);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 select-none relative z-10">
      
      {/* Daily Progress summary aggregates */}
      {foodLogs.length > 0 && (
        <div className="bg-[#132226]/40 backdrop-blur-xl text-white rounded-2xl p-5 border border-white/10 shadow-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300 font-mono">Today's Nutrition Summary</h3>
              <p className="text-[10px] text-slate-400 font-light">Calculated totals across daily logged food scans.</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-400">{totalCalories} <span className="text-xs font-normal text-white">kcal</span></span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/[0.04]">
              <span className="text-[9px] text-slate-400 block font-mono uppercase">Protein</span>
              <span className="text-sm font-bold text-emerald-400">{totalProtein}g</span>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/[0.04]">
              <span className="text-[9px] text-slate-400 block font-mono uppercase">Carbs</span>
              <span className="text-sm font-bold text-amber-300">{totalCarbs}g</span>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/[0.04]">
              <span className="text-[9px] text-slate-400 block font-mono uppercase">Fat</span>
              <span className="text-sm font-bold text-rose-300">{totalFat}g</span>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Biometrics versus Food items */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Side: Biometric Track log */}
        <div className="md:col-span-6 space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 font-mono">
              <Scale className="w-4 h-4 text-emerald-450" />
              Calculators Log History ({calcHistory.length})
            </h3>
          </div>

          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
            {calcHistory.length > 0 ? (
              calcHistory.map((calc, idx) => (
                <motion.div
                  key={calc.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-start justify-between shadow-sm hover:bg-white/10 relative overflow-hidden transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-450 font-mono">
                        {new Date(calc.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} @ {new Date(calc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5 text-center text-[9px] leading-tight mt-1">
                      <div className="bg-white/5 p-1.5 rounded-lg border border-white/5">
                        <span className="text-slate-400 block uppercase tracking-wider font-mono text-[7px]">Weight</span>
                        <span className="font-bold text-emerald-300">
                          {calc.profile.unitSystem === 'imperial' 
                            ? `${Math.round(calc.profile.weight * 2.20462)} lb` 
                            : `${calc.profile.weight} kg`}
                        </span>
                      </div>
                      <div className="bg-white/5 p-1.5 rounded-lg border border-white/5">
                        <span className="text-slate-400 block uppercase tracking-wider font-mono text-[7px]">Height</span>
                        <span className="font-bold text-teal-300">
                          {calc.profile.unitSystem === 'imperial' 
                            ? `${Math.round(calc.profile.height / 2.54)} in` 
                            : `${calc.profile.height} cm`}
                        </span>
                      </div>
                      <div className="bg-white/5 p-1.5 rounded-lg border border-white/5">
                        <span className="text-slate-400 block uppercase tracking-wider font-mono text-[7px]">BMI</span>
                        <span className="font-bold text-white">{calc.bmi.value}</span>
                      </div>
                      <div className="bg-white/5 p-1.5 rounded-lg border border-white/5">
                        <span className="text-slate-400 block uppercase tracking-wider font-mono text-[7px]">Fat %</span>
                        <span className="font-bold text-amber-300">{calc.bodyFat ? `${calc.bodyFat.value}%` : 'N/A'}</span>
                      </div>
                      <div className="bg-white/5 p-1.5 rounded-lg border border-white/5">
                        <span className="text-slate-400 block uppercase tracking-wider font-mono text-[7px]">Kcal</span>
                        <span className="font-bold text-slate-200">{calc.tdee.value}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onDeleteCalc(calc.id)}
                    className="p-1 px-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-rose-400 transition cursor-pointer self-center"
                    aria-label="Delete metric calculation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 bg-white/5 border border-white/10 rounded-xl leading-relaxed">
                No biometric calculations compiled yet. Setup profile or calculate values to store entries.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Scanned Calories log */}
        <div className="md:col-span-6 space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 font-mono">
              <Apple className="w-4 h-4 text-emerald-450" />
              Scanned Food Tracker Log ({foodLogs.length})
            </h3>
          </div>

          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
            {foodLogs.length > 0 ? (
              foodLogs.map((food, idx) => (
                <motion.div
                  key={food.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between shadow-sm hover:bg-white/10 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-450 font-mono">
                        {new Date(food.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[10px] text-slate-400 font-light">• {food.portion}</span>
                    </div>
                    <h4 className="text-xs font-bold text-white leading-tight">{food.name}</h4>
                    <div className="flex gap-2 text-[9px] font-mono text-slate-400">
                      <span>P: <strong className="text-emerald-450">{food.protein}g</strong></span>
                      <span>C: <strong className="text-amber-400">{food.carbs}g</strong></span>
                      <span>F: <strong className="text-rose-400">{food.fat}g</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white bg-white/5 border border-white/5 px-2 py-1 rounded-lg">
                      {food.calories} <span className="text-[9px] font-normal text-slate-400">kcal</span>
                    </span>
                    <button
                      onClick={() => onDeleteFood(food.id)}
                      className="p-1 px-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                      aria-label="Delete food entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 bg-white/5 border border-white/10 rounded-xl leading-relaxed">
                No food calories logged today. Use our camera Food Scanner or Search dictionary to quickly record meals.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Action clear all button */}
      {(calcHistory.length > 0 || foodLogs.length > 0) && (
        <div className="flex justify-center pt-2 select-none">
          <button
            onClick={() => {
              if (window.confirm("Are you absolutely sure you want to clear your local history and logged parameters? This cannot be undone.")) {
                onClearAll();
              }
            }}
            className="flex items-center gap-1.5 border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/45 text-xs font-semibold px-4 py-2.5 rounded-xl transition cursor-pointer"
          >
            <CalendarMinus className="w-4 h-4" /> Clear All History Records
          </button>
        </div>
      )}

    </div>
  );
}
