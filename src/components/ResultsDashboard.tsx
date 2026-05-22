import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CalculationResult, UserProfile } from '../types';
import { 
  Heart, 
  Sparkles, 
  Activity, 
  Info, 
  Coins, 
  ArrowRight, 
  TrendingUp, 
  Layers, 
  Flame, 
  Dumbbell,
  CheckCircle2,
  Lock,
  Scale,
  RefreshCw,
  Calculator
} from 'lucide-react';
import MetricChart from './MetricChart';
import SuggestionsPopup from './SuggestionsPopup';
import BiometricsEstimator from './BiometricsEstimator';
import DailyWellnessChecklist from './DailyWellnessChecklist';

interface ResultsDashboardProps {
  result: CalculationResult;
  onEditProfile: () => void;
  onUpdateWeightHeight: (weight: number, height: number) => void;
  isLoading?: boolean;
}

export default function ResultsDashboard({ result, onEditProfile, onUpdateWeightHeight, isLoading }: ResultsDashboardProps) {
  // Active selected metric to inspect
  const [activeMetric, setActiveMetric] = useState<'bmi' | 'bodyFat' | 'bmr_tdee' | 'waistToHeight'>('bmi');
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

  const isImperial = result.profile.unitSystem === 'imperial';
  const displayWeightUnit = isImperial ? 'lbs' : 'kg';
  const displayHeightUnit = isImperial ? 'inches' : 'cm';

  const [isRechecking, setIsRechecking] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [heightInput, setHeightInput] = useState('');
  const [recheckError, setRecheckError] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Estimator States
  const [isEstimatorOpen, setIsEstimatorOpen] = useState(false);
  const [estimatorInitialMode, setEstimatorInitialMode] = useState<'height' | 'weight'>('height');

  const startRechecking = () => {
    const currentWeight = isImperial 
      ? Math.round(result.profile.weight * 2.20462) 
      : result.profile.weight;
    
    const currentHeight = isImperial 
      ? Math.round(result.profile.height / 2.54) 
      : result.profile.height;

    setWeightInput(String(currentWeight));
    setHeightInput(String(currentHeight));
    setRecheckError('');
    setIsRechecking(true);
  };

  const handleOpenEstimator = (mode: 'height' | 'weight') => {
    // If they aren't already editing, start editing first so they can see the calculation put into input
    if (!isRechecking) {
      const currentWeight = isImperial 
        ? Math.round(result.profile.weight * 2.20462) 
        : result.profile.weight;
      
      const currentHeight = isImperial 
        ? Math.round(result.profile.height / 2.54) 
        : result.profile.height;

      setWeightInput(String(currentWeight));
      setHeightInput(String(currentHeight));
      setRecheckError('');
      setIsRechecking(true);
    }
    setEstimatorInitialMode(mode);
    setIsEstimatorOpen(true);
  };

  const handleApplyHeight = (heightCm: number) => {
    const val = isImperial ? Math.round(heightCm / 2.54) : Math.round(heightCm * 10) / 10;
    setHeightInput(String(val));
  };

  const handleApplyWeight = (weightKg: number) => {
    const val = isImperial ? Math.round(weightKg * 2.20462) : Math.round(weightKg * 10) / 10;
    setWeightInput(String(val));
  };

  const handleSaveRecheck = () => {
    setRecheckError('');
    const weightNum = parseFloat(weightInput);
    const heightNum = parseFloat(heightInput);

    if (isNaN(weightNum) || isNaN(heightNum)) {
      setRecheckError('Please enter valid numeric parameters.');
      return;
    }

    let metricWeight = weightNum;
    let metricHeight = heightNum;

    if (isImperial) {
      if (heightNum < 20 || heightNum > 110) {
        setRecheckError('Height must be between 20 and 110 inches.');
        return;
      }
      if (weightNum < 20 || weightNum > 1100) {
        setRecheckError('Weight must be between 20 and 1100 lbs.');
        return;
      }
      metricWeight = weightNum / 2.20462;
      metricHeight = heightNum * 2.54;
    } else {
      if (heightNum < 50 || heightNum > 260) {
        setRecheckError('Height must be between 50 and 260 cm.');
        return;
      }
      if (weightNum < 10 || weightNum > 500) {
        setRecheckError('Weight must be between 10 and 500 kg.');
        return;
      }
    }

    onUpdateWeightHeight(metricWeight, metricHeight);
    setIsRechecking(false);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const getMetricTitle = () => {
    switch (activeMetric) {
      case 'bmi': return 'Body Mass Index (BMI)';
      case 'bodyFat': return 'Body Fat Ratio Estimation';
      case 'bmr_tdee': return 'Metabolic Energetics (BMR vs TDEE)';
      case 'waistToHeight': return 'Visceral Waist-to-Height Ratio';
    }
  };

  const getMetricExplanation = () => {
    switch (activeMetric) {
      case 'bmi': return result.bmi.explanation;
      case 'bodyFat': return result.bodyFat?.explanation || 'No body fat details compiled.';
      case 'bmr_tdee': return `${result.bmr.explanation} \n\n${result.tdee.explanation}`;
      case 'waistToHeight': return result.waistToHeight?.explanation || 'Waist data not supplied. Focus on general BMI markers.';
    }
  };

  const activeCategory = () => {
    switch (activeMetric) {
      case 'bmi': return result.bmi.category;
      case 'bodyFat': return result.bodyFat?.category || 'N/A';
      case 'bmr_tdee': return `${result.tdee.value} kcal/day`;
      case 'waistToHeight': return result.waistToHeight?.category || 'N/A';
    }
  };

  const activeTipsLength = () => {
    switch (activeMetric) {
      case 'bmi': return result.bmi.tips.length;
      case 'bodyFat': return result.bodyFat?.tips.length || 0;
      case 'bmr_tdee': return result.tdee.tips.length;
      case 'waistToHeight': return result.waistToHeight?.tips.length || 0;
    }
  };

  return (
    <div className="w-full space-y-6 select-none relative z-10">
      
      {/* Onboarding Header status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">Profile Engaged</span>
            <span className="text-xs text-slate-550">•</span>
            <span className="text-xs text-slate-300 font-mono font-light">Goal: {result.profile.goal.replace('_', ' ')}</span>
          </div>
          <p className="text-xs text-slate-400 font-light leading-snug">
            Gender: {result.profile.gender} | Age: {result.profile.age} yrs | Height: {result.profile.unitSystem === 'metric' ? `${result.profile.height} cm` : `${Math.round(result.profile.height / 2.54)} inches`} | Weight: {result.profile.unitSystem === 'metric' ? `${result.profile.weight} kg` : `${Math.round(result.profile.weight * 2.20462)} lbs`}
          </p>
        </div>
        <button
          onClick={onEditProfile}
          className="text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white px-4 py-2.5 rounded-xl transition cursor-pointer self-start sm:self-auto shadow-sm"
        >
          Modify Profile & Target
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Bento Cards for Quick summary indices */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Body Stats Bento</h3>

          {/* Biometrics Quick Rechecker Card */}
          <div className="p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl text-left space-y-3 relative overflow-hidden">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 font-mono text-slate-300">Biometrics Quick Recheck</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEstimator('height')}
                  title="Estimate / calculate parameters via body anthropometry formulas"
                  className="p-1 bg-white/5 hover:bg-white/10 hover:text-emerald-300 text-slate-300 rounded border border-white/5 transition flex items-center justify-center cursor-pointer"
                >
                  <Calculator className="w-3 h-3" />
                </button>
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>

            {showSuccessToast ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-4 flex flex-col items-center justify-center text-center space-y-1.5"
              >
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                <span className="text-xs font-bold text-white">App Memory Updated!</span>
                <p className="text-[9px] text-slate-400">Newly checked parameters successfully saved local-first.</p>
              </motion.div>
            ) : !isRechecking ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 p-2 rounded-lg border border-white/[0.04] text-center">
                    <span className="text-[9px] text-slate-400 block font-mono uppercase">Current Weight</span>
                    <span className="text-xs font-bold text-white">
                      {isImperial 
                        ? `${Math.round(result.profile.weight * 2.20462)} lbs` 
                        : `${result.profile.weight} kg`}
                    </span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg border border-white/[0.04] text-center">
                    <span className="text-[9px] text-slate-400 block font-mono uppercase">Current Height</span>
                    <span className="text-xs font-bold text-white">
                      {isImperial 
                        ? `${Math.round(result.profile.height / 2.54)} in` 
                        : `${result.profile.height} cm`}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.04]">
                  <div className="text-[9px] text-slate-400 font-light flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                    Saved in App Memory
                  </div>
                  <button
                    onClick={startRechecking}
                    className="flex items-center gap-1 bg-white/5 hover:bg-white/10 hover:text-emerald-300 text-[10px] text-slate-300 px-2.5 py-1.5 rounded-lg border border-white/10 transition cursor-pointer font-medium"
                  >
                    <RefreshCw className="w-2.5 h-2.5 animate-spin-slow" /> Recheck
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {recheckError && (
                  <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[9px] rounded-lg">
                    {recheckError}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[9px] text-slate-400 block font-mono uppercase">Weight ({displayWeightUnit})</label>
                      <button
                        type="button"
                        onClick={() => handleOpenEstimator('weight')}
                        className="flex items-center gap-0.5 text-[8px] font-mono font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer bg-transparent border-none outline-none"
                      >
                        <Calculator className="w-2 h-2" /> Calc
                      </button>
                    </div>
                    <input
                      type="number"
                      step="any"
                      value={weightInput}
                      onChange={(e) => setWeightInput(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[9px] text-slate-400 block font-mono uppercase">Height ({displayHeightUnit})</label>
                      <button
                        type="button"
                        onClick={() => handleOpenEstimator('height')}
                        className="flex items-center gap-0.5 text-[8px] font-mono font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer bg-transparent border-none outline-none"
                      >
                        <Calculator className="w-2 h-2" /> Calc
                      </button>
                    </div>
                    <input
                      type="number"
                      step="any"
                      value={heightInput}
                      onChange={(e) => setHeightInput(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-1 border-t border-white/[0.04]">
                  <button
                    onClick={() => setIsRechecking(false)}
                    className="text-[10px] text-slate-400 hover:text-white px-2.5 py-1.5 rounded transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveRecheck}
                    className="bg-emerald-500/15 border border-emerald-500/20 hover:bg-emerald-500/25 text-emerald-300 text-[10px] font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                  >
                    Save & Recalc
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* BMI card */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            onClick={() => setActiveMetric('bmi')}
            className={`cursor-pointer p-4 rounded-xl border text-left transition relative overflow-hidden ${activeMetric === 'bmi' ? 'bg-emerald-500/10 text-white border-emerald-400/45 shadow-lg' : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10'}`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 font-mono text-slate-300 font-medium">Body Mass index (BMI)</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{result.bmi.value}</span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${activeMetric === 'bmi' ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-500/20' : 'bg-white/10 text-slate-350'}`}>
                {result.bmi.category}
              </span>
            </div>
            <p className="text-[10px] mt-1 text-slate-400">
              Ref range: 18.5 - 24.9 for height framework.
            </p>
          </motion.div>

          {/* Body Fat Estimation card */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            onClick={() => setActiveMetric('bodyFat')}
            className={`cursor-pointer p-4 rounded-xl border text-left transition relative overflow-hidden ${activeMetric === 'bodyFat' ? 'bg-emerald-500/10 text-white border-emerald-400/45 shadow-lg' : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10'}`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 font-mono text-slate-300 font-medium">Body Fat Ratio</span>
              <Dumbbell className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{result.bodyFat?.value}%</span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${activeMetric === 'bodyFat' ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-500/20' : 'bg-white/10 text-slate-350'}`}>
                {result.bodyFat?.category}
              </span>
            </div>
            <p className="text-[10px] mt-1 text-slate-400">
              Derived based on age, gender composition factor files.
            </p>
          </motion.div>

          {/* Metabolic Calories Card */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            onClick={() => setActiveMetric('bmr_tdee')}
            className={`cursor-pointer p-4 rounded-xl border text-left transition relative overflow-hidden ${activeMetric === 'bmr_tdee' ? 'bg-emerald-500/10 text-white border-emerald-400/45 shadow-lg' : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10'}`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 font-mono text-slate-300 font-medium">Metabolism Balance</span>
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
            <div className="flex justify-between items-end">
              <div>
                <span className="text-[9px] block uppercase tracking-wider opacity-50 text-slate-350">TDEE Needs</span>
                <span className="text-xl font-bold block text-white">{result.tdee.value} <span className="text-xs font-normal opacity-75 text-slate-300">kcal</span></span>
              </div>
              <div className="text-right">
                <span className="text-[9px] block uppercase tracking-wider opacity-50 text-slate-350">Resting BMR</span>
                <span className="text-sm font-bold block text-slate-200">{result.bmr.value} <span className="text-[10px] font-normal opacity-75 text-slate-400">kcal</span></span>
              </div>
            </div>
          </motion.div>

          {/* Waist to height ratio card handles if available, otherwise prompt locks */}
          {result.waistToHeight ? (
            <motion.div
              whileHover={{ scale: 1.01 }}
              onClick={() => setActiveMetric('waistToHeight')}
              className={`cursor-pointer p-4 rounded-xl border text-left transition relative overflow-hidden ${activeMetric === 'waistToHeight' ? 'bg-emerald-500/10 text-white border-emerald-400/45 shadow-lg' : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 font-mono text-slate-300 font-medium">Waist-To-Height Ratio</span>
                <Heart className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{result.waistToHeight.value}</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${activeMetric === 'waistToHeight' ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-500/30' : 'bg-white/10 text-slate-350'}`}>
                  {result.waistToHeight.category}
                </span>
              </div>
              <p className="text-[10px] mt-1 text-slate-400">
                Waist/Height benchmark index. Target {'<'} 0.50.
              </p>
            </motion.div>
          ) : (
            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-between opacity-50">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">Waist Index locked</span>
                <span className="text-xs text-slate-400">Unlock by entering waist in profile setup.</span>
              </div>
              <Lock className="w-4 h-4 text-slate-500" />
            </div>
          )}

          {/* Healthy weight range info bar */}
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-xl space-y-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block font-mono">Healthy Weight Boundaries</span>
              <p className="text-sm font-bold text-white leading-none mt-1">
                {result.healthyWeightRange.min} - {result.healthyWeightRange.max} {result.healthyWeightRange.unit}
              </p>
              <p className="text-[9px] text-slate-400 leading-snug font-light mt-0.5">
                Calculated ranges based on healthy BMI frames (18.5 - 24.9).
              </p>
            </div>
            {result.idealWeight && (
              <div className="pt-2 border-t border-emerald-500/10 grid grid-cols-2 gap-2 mt-1">
                <div>
                  <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 font-mono block">Devine Ideal Weight</span>
                  <span className="text-xs font-bold text-slate-200">{result.idealWeight.devine} {result.idealWeight.unit}</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 font-mono block">Robinson Ideal Weight</span>
                  <span className="text-xs font-bold text-slate-200">{result.idealWeight.robinson} {result.idealWeight.unit}</span>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Deep analysis viewer with charts and smart advice */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center bg-transparent p-2 border-b border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Deep Analytics Chart</h3>
            <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              Dynamic Scope
            </div>
          </div>

          <motion.div 
            key={activeMetric}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6"
          >
            {/* Header segment of active selection */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">{getMetricTitle()}</h4>
                <p className="text-xs text-slate-400 font-mono">Status Assessment: <span className="text-emerald-400 font-semibold">{activeCategory()}</span></p>
              </div>
              
              <button
                onClick={() => setIsSuggestionsOpen(true)}
                className="flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-[10px] sm:text-xs px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0 shadow-lg"
              >
                Get Suggestions ({activeTipsLength()})
              </button>
            </div>

            {/* Recharts chart render box */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <MetricChart metricType={activeMetric} result={result} />
            </div>

            {/* Assessment and text analysis */}
            <div className="space-y-2">
              <h5 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Info className="w-4 h-4 text-emerald-400" />
                Coach Analysis
              </h5>
              <p className="text-xs text-slate-300 leading-relaxed font-light whitespace-pre-line bg-white/5 p-4 rounded-xl border border-white/10">
                {getMetricExplanation()}
              </p>
            </div>
          </motion.div>
        </div>

      </div>

      <DailyWellnessChecklist />

      {/* Suggested Coach Modal drawer triggers */}
      <SuggestionsPopup 
        isOpen={isSuggestionsOpen}
        onClose={() => setIsSuggestionsOpen(false)}
        metricType={activeMetric}
        result={result}
      />

      <BiometricsEstimator
        isOpen={isEstimatorOpen}
        onClose={() => setIsEstimatorOpen(false)}
        gender={result.profile.gender}
        age={result.profile.age}
        currentHeightCm={result.profile.height}
        unitSystem={result.profile.unitSystem}
        onApplyHeight={handleApplyHeight}
        onApplyWeight={handleApplyWeight}
        initialMode={estimatorInitialMode}
      />
    </div>
  );
}
