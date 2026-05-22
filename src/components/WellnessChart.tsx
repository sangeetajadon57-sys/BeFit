import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Droplet, Moon, Flame, Trophy } from 'lucide-react';

interface WellnessData {
  hydration: number;
  sleep: number;
  activeMinutes: number;
  hydrationChecked: boolean;
  sleepChecked: boolean;
  activeChecked: boolean;
}

interface WellnessChartProps {
  completedDays: string[];
  currentData: WellnessData;
  todayStr: string;
}

const WATER_GOAL = 8;
const SLEEP_GOAL = 8.0;
const ACTIVE_GOAL = 30;

export default function WellnessChart({ completedDays, currentData, todayStr }: WellnessChartProps) {
  
  // Retrieve the past 7 days of wellness records
  const getWeeklyChartData = () => {
    const chartData = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dateVal = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${dateVal}`;
      
      // Label formats
      const shortLabel = d.toLocaleDateString(undefined, { weekday: 'short' }); // "Mon", "Tue"
      const dateLabel = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); // "May 22"
      
      let dayData: WellnessData = {
        hydration: 0,
        sleep: 0,
        activeMinutes: 0,
        hydrationChecked: false,
        sleepChecked: false,
        activeChecked: false,
      };
      
      if (i === 0 && todayStr === dateStr) {
        dayData = currentData;
      } else {
        const saved = localStorage.getItem(`wellness_checklist_${dateStr}`);
        if (saved) {
          try {
            dayData = JSON.parse(saved);
          } catch (e) {
            // fallback
          }
        }
      }
      
      const isWaterDone = dayData.hydrationChecked || dayData.hydration >= WATER_GOAL;
      const isSleepDone = dayData.sleepChecked || dayData.sleep >= SLEEP_GOAL;
      const isActiveDone = dayData.activeChecked || dayData.activeMinutes >= ACTIVE_GOAL;
      
      chartData.push({
        name: shortLabel,
        fullDate: dateLabel,
        dateKey: dateStr,
        isToday: i === 0,
        // Values are 1 (completed) or 0 (incomplete) so stacked bar chart sums up to max 3
        Hydration: isWaterDone ? 1 : 0,
        Sleep: isSleepDone ? 1 : 0,
        Active: isActiveDone ? 1 : 0,
        // Raw values for tooltip metrics
        hydrationRaw: dayData.hydration,
        sleepRaw: dayData.sleep,
        activeRaw: dayData.activeMinutes,
        isWaterDone,
        isSleepDone,
        isActiveDone
      });
    }
    
    return chartData;
  };

  const chartData = getWeeklyChartData();
  
  // Calculate aggregate stats for past 7 days
  const totalCompletedHabits = chartData.reduce((acc, curr) => {
    return acc + curr.Hydration + curr.Sleep + curr.Active;
  }, 0);
  
  const completionEfficiency = Math.round((totalCompletedHabits / 21) * 100) || 0;

  return (
    <div id="wellness-analytics-chart-container" className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 my-2 text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/5">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">7-Day Completion Analytics</span>
          <h4 className="text-xs font-bold text-slate-200 mt-0.5">Habit Performance History</h4>
        </div>
        
        {/* Statistics highlights */}
        <div className="flex items-center gap-3">
          <div className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1.5">
            <Trophy className="w-3 h-3 text-amber-400" />
            <span>Efficiency: {completionEfficiency}%</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            <span className="text-white font-bold">{totalCompletedHabits}</span> / 21 Tasks Met
          </div>
        </div>
      </div>

      {/* Styled Color Guide/Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-4 text-[10px] font-mono">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-blue-500 shadow-sm" />
          <span className="text-slate-300">Hydration (💧)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-purple-500 shadow-sm" />
          <span className="text-slate-300">Sleep (🌙)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-orange-500 shadow-sm" />
          <span className="text-slate-300">Activity (🔥)</span>
        </div>
        <div className="ml-auto text-slate-500 text-[9px] hidden sm:inline">
          *Height represents total completed habits (0-3)
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="h-48 w-full select-none">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
          >
            <XAxis 
              dataKey="name" 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={{ stroke: '#ffffff0d' }}
              tick={({ x, y, payload }) => {
                const item = chartData[payload.index];
                return (
                  <text 
                    x={x} 
                    y={y + 12} 
                    fill={item.isToday ? '#34d399' : '#94a3b8'} 
                    fontSize={10} 
                    textAnchor="middle" 
                    fontWeight={item.isToday ? 'bold' : 'normal'}
                    className="font-mono"
                  >
                    {payload.value}{item.isToday ? ' (Today)' : ''}
                  </text>
                );
              }}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={10} 
              axisLine={false} 
              tickLine={false} 
              domain={[0, 3]}
              ticks={[0, 1, 2, 3]}
              className="font-mono"
            />
            <Tooltip
              cursor={{ fill: 'rgba(255, 255, 255, 0.04)', radius: 6 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const dObj = payload[0].payload;
                  const total = dObj.Hydration + dObj.Sleep + dObj.Active;
                  
                  return (
                    <div className="bg-slate-950/95 backdrop-blur-md border border-white/10 text-white p-3.5 rounded-xl shadow-2xl text-xs space-y-2.5 min-w-[200px] text-left">
                      <div className="pb-1 border-b border-white/10 flex justify-between items-center">
                        <span className="font-bold text-slate-200">{dObj.fullDate}</span>
                        {dObj.isToday && (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-md font-mono font-bold">Today</span>
                        )}
                      </div>
                      
                      {/* Metric lines with status bullet */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <Droplet className="w-3 h-3 text-blue-400 fill-blue-400/20" />
                            Hydration
                          </span>
                          <span className={`${dObj.isWaterDone ? 'text-blue-400 font-bold' : 'text-slate-500'}`}>
                            {dObj.isWaterDone ? 'Done ✓' : 'Incomplete'} ({dObj.hydrationRaw}/{WATER_GOAL})
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <Moon className="w-3 h-3 text-purple-400 fill-purple-400/20" />
                            Sleep
                          </span>
                          <span className={`${dObj.isSleepDone ? 'text-purple-400 font-bold' : 'text-slate-500'}`}>
                            {dObj.isSleepDone ? 'Done ✓' : 'Incomplete'} ({dObj.sleepRaw.toFixed(1)}h/{SLEEP_GOAL}h)
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <Flame className="w-3 h-3 text-orange-400 fill-orange-400/20" />
                            Activity
                          </span>
                          <span className={`${dObj.isActiveDone ? 'text-orange-400 font-bold' : 'text-slate-500'}`}>
                            {dObj.isActiveDone ? 'Done ✓' : 'Incomplete'} ({dObj.activeRaw}m/{ACTIVE_GOAL}m)
                          </span>
                        </div>
                      </div>

                      {/* Summary footer */}
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-400">Task Score:</span>
                        <span className="font-black text-emerald-400">{total} / 3 Completed</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Stacked Bars representing completion status with custom styling */}
            <Bar dataKey="Hydration" stackId="habits" fill="#3b82f6" radius={chartData.every(d => d.Sleep === 0 && d.Active === 0) ? [4, 4, 0, 0] : [0, 0, 0, 0]} barSize={24} />
            <Bar dataKey="Sleep" stackId="habits" fill="#a855f7" radius={chartData.every(d => d.Active === 0) ? [4, 4, 0, 0] : [0, 0, 0, 0]} barSize={24} />
            <Bar dataKey="Active" stackId="habits" fill="#f97316" radius={[4, 4, 0, 0]} barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
