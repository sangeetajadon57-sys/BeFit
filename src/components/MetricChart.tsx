import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceArea
} from 'recharts';
import { CalculationResult } from '../types';

interface MetricChartProps {
  metricType: 'bmi' | 'bodyFat' | 'bmr_tdee' | 'waistToHeight';
  result: CalculationResult;
}

export default function MetricChart({ metricType, result }: MetricChartProps) {
  if (metricType === 'bmi') {
    const value = result.bmi.value;
    const ranges = result.bmi.ranges;
    
    // Prepare data for progress visualization
    return (
      <div className="w-full space-y-4">
        <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
          <span>Underweight ({'<'}18.5)</span>
          <span className="text-emerald-400 font-medium font-bold">Healthy (18.5 - 24.9)</span>
          <span>Obese ({'>'}30)</span>
        </div>
        
        {/* Multi-segmented visual gauge bar */}
        <div className="relative h-6 w-full bg-white/5 border border-white/10 rounded-full overflow-hidden flex shadow-inner">
          <div className="h-full bg-sky-400/40" style={{ width: '18.5%' }} title="Underweight" />
          <div className="h-full bg-emerald-500/40" style={{ width: '25%' }} title="Healthy" />
          <div className="h-full bg-amber-400/40" style={{ width: '15%' }} title="Overweight" />
          <div className="h-full bg-rose-500/40 flex-1" title="Obese Range" />
          
          {/* User's cursor pointer */}
          {/* Calculate relative position: map 10 to 40 BMI range onto 0% to 100% */}
          {(() => {
            const minBmi = 12;
            const maxBmi = 38;
            const percentage = Math.max(0, Math.min(100, ((value - minBmi) / (maxBmi - minBmi)) * 100));
            return (
              <div 
                className="absolute top-0 bottom-0 w-2.5 bg-white border-2 border-emerald-400 rounded-full shadow-lg shadow-emerald-500/20 transform -translate-x-1/2 transition-all duration-1000"
                style={{ left: `${percentage}%` }}
              />
            );
          })()}
        </div>

        <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/10">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">Your BMI Value</span>
            <span className="text-xl font-bold text-white">{value}</span>
          </div>
          <div className="text-right">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">Classification</span>
            <span 
              className="text-sm font-semibold rounded-full px-3 py-1 inline-block"
              style={{ 
                color: ranges.find(r => r.label === result.bmi.category)?.color === '#4ade80' ? '#6ee7b7' : 
                       ranges.find(r => r.label === result.bmi.category)?.color === '#38bdf8' ? '#7dd3fc' : 
                       ranges.find(r => r.label === result.bmi.category)?.color === '#facc15' ? '#fde047' : '#fda4af',
                backgroundColor: `${ranges.find(r => r.label === result.bmi.category)?.color}1E`
              }}
            >
              {result.bmi.category}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (metricType === 'bodyFat' && result.bodyFat) {
    const value = result.bodyFat.value;
    const ranges = result.bodyFat.ranges;
    
    // Find the current category color or a fallback
    const matchedRange = ranges.find(r => result.bodyFat && value >= r.min && value <= r.max);
    const color = matchedRange?.color || '#cbd5e1';

    return (
      <div className="w-full space-y-4">
        {/* Category breakdown grids */}
        <div className="grid grid-cols-4 gap-1 text-[10px] sm:text-xs font-mono text-slate-400 text-center">
          {ranges.map((r) => (
            <div key={r.label} className="truncate" style={{ color: r.color }}>
              {r.label} <span className="block text-[9px] text-slate-550">({r.min}-{r.max}%)</span>
            </div>
          ))}
        </div>

        {/* Navy/Marine custom composable health bar tracker */}
        <div className="relative h-6 w-full bg-white/5 border border-white/10 rounded-full overflow-hidden flex shadow-inner">
          {ranges.map((r, idx) => {
            // Estimate percentage width based on standard max
            const totalWidth = ranges[ranges.length - 1].max;
            const partWidth = ((r.max - r.min) / totalWidth) * 100;
            return (
              <div 
                key={r.label}
                className="h-full opacity-40" 
                style={{ 
                  width: `${partWidth}%`,
                  backgroundColor: r.color 
                }} 
              />
            );
          })}

          {/* User value marker */}
          {(() => {
            const maxBf = ranges[ranges.length - 1].max;
            const percentage = Math.max(0, Math.min(100, (value / maxBf) * 100));
            return (
              <div 
                className="absolute top-0 bottom-0 w-2.5 bg-white border-2 border-emerald-400 rounded-full shadow-lg shadow-emerald-500/25 transform -translate-x-1/2 transition-all duration-1000"
                style={{ left: `${percentage}%` }}
              />
            );
          })()}
        </div>

        <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/10">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">Body Lipid Ratio</span>
            <span className="text-xl font-bold text-white">{value}%</span>
          </div>
          <div className="text-right">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">Composition Category</span>
            <span 
              className="text-sm font-semibold rounded-full px-3 py-1 inline-block text-[#93c5fd]"
              style={{ 
                color: color === '#4ade80' ? '#6ee7b7' : 
                       color === '#facc15' ? '#fde047' : 
                       color === '#38bdf8' ? '#7dd3fc' : color, 
                backgroundColor: `${color}1E`
              }}
            >
              {result.bodyFat.category}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (metricType === 'bmr_tdee') {
    // Recharts visualization for BMR vs TDEE
    const data = [
      {
        name: 'Basal Needs (BMR)',
        calories: result.bmr.value,
        fill: '#818cf8',
        description: 'Vital baseline organic functions (brain, heartbeat, breathing).'
      },
      {
        name: 'Daily Expenditure (TDEE)',
        calories: result.tdee.value,
        fill: '#34d399',
        description: 'Energy burned including your activity and moving habits.'
      }
    ];

    return (
      <div className="w-full space-y-4">
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
            >
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const dataObj = payload[0].payload;
                    return (
                      <div className="bg-slate-950/90 backdrop-blur-md border border-white/10 text-white p-3 rounded-lg shadow-xl text-xs space-y-1 max-w-xs">
                        <p className="font-semibold">{dataObj.name}</p>
                        <p className="text-emerald-400 font-bold">{dataObj.calories} kcal/day</p>
                        <p className="text-[10px] text-slate-400 leading-normal">{dataObj.description}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="calories" radius={[8, 8, 0, 0]} barSize={40}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center sm:text-left">
          <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <span className="text-xs font-semibold text-indigo-300 block mb-0.5">Basal Rate (BMR)</span>
            <span className="text-lg font-bold text-white">{result.bmr.value} <span className="text-xs text-slate-400 font-normal">kcal/day</span></span>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <span className="text-xs font-semibold text-emerald-300 block mb-0.5">Active Total (TDEE)</span>
            <span className="text-lg font-bold text-white">{result.tdee.value} <span className="text-xs text-slate-400 font-normal">kcal/day</span></span>
          </div>
        </div>
      </div>
    );
  }

  if (metricType === 'waistToHeight' && result.waistToHeight) {
    const value = result.waistToHeight.value;
    const ranges = result.waistToHeight.ranges;
    
    const matchedRange = ranges.find(r => result.waistToHeight && value >= r.min && value <= r.max);
    const color = matchedRange?.color || '#cbd5e1';

    return (
      <div className="w-full space-y-4">
        <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
          <span>Slim ({'<'}0.42)</span>
          <span className="text-emerald-400">Healthy (0.42 - 0.49)</span>
          <span>Visceral Risk ({'>'}0.53)</span>
        </div>

        {/* Abdominal lipid segment bar */}
        <div className="relative h-6 w-full bg-white/5 border border-white/10 rounded-full overflow-hidden flex shadow-inner">
          <div className="h-full bg-sky-400/40" style={{ width: '42%' }} title="Slim" />
          <div className="h-full bg-emerald-500/40" style={{ width: '10%' }} title="Healthy" />
          <div className="h-full bg-amber-400/40" style={{ width: '5%' }} title="Overweight" />
          <div className="h-full bg-rose-500/40 flex-1" title="High Risk" />

          {/* User marker positioning */}
          {(() => {
            const minW = 0.30;
            const maxW = 0.65;
            const percentage = Math.max(0, Math.min(100, ((value - minW) / (maxW - minW)) * 100));
            return (
              <div 
                className="absolute top-0 bottom-0 w-2.5 bg-white border-2 border-emerald-400 rounded-full shadow-lg shadow-emerald-500/25 transform -translate-x-1/2 transition-all duration-1000"
                style={{ left: `${percentage}%` }}
              />
            );
          })()}
        </div>

        <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/10">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">Waist-Height Ratio</span>
            <span className="text-xl font-bold text-white">{value}</span>
          </div>
          <div className="text-right">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">Status</span>
            <span 
              className="text-sm font-semibold rounded-full px-3 py-1 inline-block"
              style={{ 
                color: color === '#4ade80' ? '#6ee7b7' : 
                       color === '#facc15' ? '#fde047' : 
                       color === '#38bdf8' ? '#7dd3fc' : color, 
                backgroundColor: `${color}1E`
              }}
            >
              {result.waistToHeight.category}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
