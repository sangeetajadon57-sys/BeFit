import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Ruler, 
  Calculator, 
  Sparkles, 
  Check, 
  HelpCircle, 
  Scale, 
  Info,
  ChevronRight
} from 'lucide-react';
import { 
  estimateHeight, 
  estimateWeight, 
  HeightEstimationInputs, 
  WeightEstimationInputs,
  calculateIdealWeightSpecial
} from '../utils/calculators';

interface BiometricsEstimatorProps {
  isOpen: boolean;
  onClose: () => void;
  gender: 'male' | 'female';
  age: number;
  currentHeightCm: number;
  unitSystem: 'metric' | 'imperial';
  onApplyHeight: (heightCm: number) => void;
  onApplyWeight: (weightKg: number) => void;
  initialMode?: 'height' | 'weight';
}

export default function BiometricsEstimator({
  isOpen,
  onClose,
  gender,
  age,
  currentHeightCm,
  unitSystem,
  onApplyHeight,
  onApplyWeight,
  initialMode = 'height'
}: BiometricsEstimatorProps) {
  const [activeTab, setActiveTab] = useState<'height' | 'weight'>(initialMode);
  
  // Height Estimation state
  const [heightMethod, setHeightMethod] = useState<'armSpan' | 'kneeHeight' | 'ulnaLength'>('armSpan');
  const [armSpanInput, setArmSpanInput] = useState('');
  const [kneeHeightInputStature, setKneeHeightInputStature] = useState('');
  const [ulnaLengthInput, setUlnaLengthInput] = useState('');
  
  // Weight Estimation state
  const [weightMethod, setWeightMethod] = useState<'clinicalIdeal' | 'targetBmi' | 'anthropometric'>('clinicalIdeal');
  const [selectedIdealFormula, setSelectedIdealFormula] = useState<'recommended' | 'devine' | 'robinson' | 'miller' | 'hamwi' | 'ageAdjusted'>('recommended');
  const [targetBmiInput, setTargetBmiInput] = useState('22');
  const [muacInput, setMuacInput] = useState('');
  const [calfCircInput, setCalfCircInput] = useState('');
  const [kneeHeightInputWeight, setKneeHeightInputWeight] = useState('');
  const [subscapularInput, setSubscapularInput] = useState('');

  // Local parameter overrides inside Calculator
  const [calcHeight, setCalcHeight] = useState('');
  const [calcAge, setCalcAge] = useState('');
  const [calcGender, setCalcGender] = useState<'male' | 'female'>('male');
  const [isCalculating, setIsCalculating] = useState(false);
  const [showCalculationSuccess, setShowCalculationSuccess] = useState(false);

  // Computed results state
  const [calculatedHeight, setCalculatedHeight] = useState<number | null>(null);
  const [calculatedWeight, setCalculatedWeight] = useState<number | null>(null);
  const [errorText, setErrorText] = useState('');

  const isImperial = unitSystem === 'imperial';

  // Sync initialMode & weight input overrides when modal opens/changes
  useEffect(() => {
    setActiveTab(initialMode);
    setErrorText('');
    if (initialMode === 'weight') {
      setWeightMethod('clinicalIdeal');
    }
    if (isOpen) {
      // Pre-fill local fields with the baseline values from the outer app state
      const initialHeightVal = isImperial 
        ? Math.round(currentHeightCm / 2.54).toString()
        : currentHeightCm.toString();
      setCalcHeight(initialHeightVal);
      setCalcAge(age.toString());
      setCalcGender(gender);
    }
  }, [initialMode, isOpen, currentHeightCm, age, gender, isImperial]);

  // Handle Height Computation
  useEffect(() => {
    if (activeTab !== 'height') return;
    setErrorText('');

    let val = 0;
    if (heightMethod === 'armSpan') {
      val = parseFloat(armSpanInput);
      if (isNaN(val) || val <= 0) {
        setCalculatedHeight(null);
        return;
      }
      // If imperial is active, user is entering inches. Convert to cm for internal estimate height logic.
      const cmVal = isImperial ? val * 2.54 : val;
      const res = estimateHeight({
        method: 'armSpan',
        gender,
        age,
        armSpan: cmVal
      });
      setCalculatedHeight(res);
    } else if (heightMethod === 'kneeHeight') {
      val = parseFloat(kneeHeightInputStature);
      if (isNaN(val) || val <= 0) {
        setCalculatedHeight(null);
        return;
      }
      const cmVal = isImperial ? val * 2.54 : val;
      const res = estimateHeight({
        method: 'kneeHeight',
        gender,
        age,
        kneeHeight: cmVal
      });
      setCalculatedHeight(res);
    } else if (heightMethod === 'ulnaLength') {
      val = parseFloat(ulnaLengthInput);
      if (isNaN(val) || val <= 0) {
        setCalculatedHeight(null);
        return;
      }
      const cmVal = isImperial ? val * 2.54 : val;
      const res = estimateHeight({
        method: 'ulnaLength',
        gender,
        age,
        ulnaLength: cmVal
      });
      setCalculatedHeight(res);
    }
  }, [activeTab, heightMethod, armSpanInput, kneeHeightInputStature, ulnaLengthInput, gender, age, isImperial]);

  // Handle Weight Computation
  useEffect(() => {
    if (activeTab !== 'weight') return;
    setErrorText('');

    const parsedH = parseFloat(calcHeight);
    const parsedA = parseInt(calcAge, 10);
    if (isNaN(parsedH) || parsedH <= 0 || isNaN(parsedA) || parsedA <= 0) {
      setCalculatedWeight(null);
      return;
    }

    const heightInCm = isImperial ? parsedH * 2.54 : parsedH;

    if (weightMethod === 'clinicalIdeal') {
      const results = calculateIdealWeightSpecial(heightInCm, parsedA, calcGender);
      if (selectedIdealFormula === 'recommended') {
        setCalculatedWeight(results.recommendedKg);
      } else if (selectedIdealFormula === 'devine') {
        setCalculatedWeight(results.devineKg);
      } else if (selectedIdealFormula === 'robinson') {
        setCalculatedWeight(results.robinsonKg);
      } else if (selectedIdealFormula === 'miller') {
        setCalculatedWeight(results.millerKg);
      } else if (selectedIdealFormula === 'hamwi') {
        setCalculatedWeight(results.hamwiKg);
      } else if (selectedIdealFormula === 'ageAdjusted') {
        setCalculatedWeight(results.ageAdjustedBmiKg);
      }
    } else if (weightMethod === 'targetBmi') {
      const bmi = parseFloat(targetBmiInput);
      if (isNaN(bmi) || bmi < 10 || bmi > 60) {
        setCalculatedWeight(null);
        return;
      }
      const res = estimateWeight({
        method: 'targetBmi',
        gender: calcGender,
        heightCm: heightInCm,
        targetBmi: bmi
      });
      setCalculatedWeight(res);
    } else if (weightMethod === 'anthropometric') {
      const muac = parseFloat(muacInput);
      const calf = parseFloat(calfCircInput);
      const knee = parseFloat(kneeHeightInputWeight);
      const sub = parseFloat(subscapularInput);

      if (isNaN(muac) || muac <= 0 || isNaN(calf) || calf <= 0 || isNaN(knee) || knee <= 0) {
        setCalculatedWeight(null);
        return;
      }

      // Convert imperials to cm for the formula inputs
      const muacCm = isImperial ? muac * 2.54 : muac;
      const calfCm = isImperial ? calf * 2.54 : calf;
      const kneeCm = isImperial ? knee * 2.54 : knee;
      // Subscapular is skinfold thickness in millimeters (kept in mm always)
      const subMm = isNaN(sub) || sub < 2 ? undefined : sub;

      const res = estimateWeight({
        method: 'anthropometric',
        gender: calcGender,
        heightCm: heightInCm,
        muac: muacCm,
        calfCirc: calfCm,
        kneeHeight: kneeCm,
        subscapular: subMm
      });
      setCalculatedWeight(res);
    }
  }, [
    activeTab, 
    weightMethod, 
    selectedIdealFormula,
    targetBmiInput, 
    muacInput, 
    calfCircInput, 
    kneeHeightInputWeight, 
    subscapularInput, 
    calcGender, 
    calcAge,
    calcHeight, 
    isImperial
  ]);

  const handleManualCalculate = () => {
    setIsCalculating(true);
    setShowCalculationSuccess(false);

    const parsedH = parseFloat(calcHeight);
    const parsedA = parseInt(calcAge, 10);
    if (isNaN(parsedH) || parsedH <= 0) {
      setErrorText('Please enter a valid height.');
      setIsCalculating(false);
      return;
    }
    if (isNaN(parsedA) || parsedA <= 0) {
      setErrorText('Please enter a valid age.');
      setIsCalculating(false);
      return;
    }

    setTimeout(() => {
      setIsCalculating(false);
      setShowCalculationSuccess(true);
      setTimeout(() => setShowCalculationSuccess(false), 2500);
    }, 450);
  };

  const applyHeightResult = () => {
    if (calculatedHeight === null) return;
    onApplyHeight(calculatedHeight);
    onClose();
  };

  const applyWeightResult = () => {
    if (calculatedWeight === null) return;
    onApplyWeight(calculatedWeight);
    onClose();
  };

  if (!isOpen) return null;

  // Dynamically compute medical ideals block based on user's manual calculator parameters
  const parsedHForIdeals = parseFloat(calcHeight);
  const customH = isNaN(parsedHForIdeals) ? 170 : (isImperial ? parsedHForIdeals * 2.54 : parsedHForIdeals);
  const customA = parseInt(calcAge, 10) || 28;
  const customG = calcGender || 'male';
  const ideals = calculateIdealWeightSpecial(customH, customA, customG);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-[#111e21] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden select-none"
        >
          {/* Header */}
          <div className="p-4 bg-white/[0.03] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/15 rounded-lg border border-emerald-500/20 text-emerald-300">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Biometrics Estimator</h3>
                <p className="text-[10px] text-slate-400 font-mono">Calculate Body Stats via Anthropometry</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
              aria-label="Close estimator popup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Selector Tabs */}
          <div className="p-3 bg-white/[0.01] border-b border-white/5 grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setActiveTab('height');
                setCalculatedWeight(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold tracking-wide transition ${
                activeTab === 'height'
                  ? 'bg-emerald-500/15 border border-emerald-500/20 text-emerald-300'
                  : 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Ruler className="w-3.5 h-3.5" /> Calculate Height
            </button>
            <button
              onClick={() => {
                setActiveTab('weight');
                setCalculatedHeight(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold tracking-wide transition ${
                activeTab === 'weight'
                  ? 'bg-emerald-500/15 border border-emerald-500/20 text-emerald-300'
                  : 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Scale className="w-3.5 h-3.5" /> Calculate Weight
            </button>
          </div>

          <div className="p-5 space-y-4 max-h-[420px] overflow-y-auto">
            {activeTab === 'height' ? (
              <div className="space-y-4">
                {/* Height estimation sub-selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 block font-mono uppercase tracking-wider">Height Formula Method</label>
                  <div className="grid grid-cols-3 gap-1.5 bg-white/5 p-1 rounded-lg border border-white/5">
                    <button
                      type="button"
                      onClick={() => setHeightMethod('armSpan')}
                      className={`py-1.5 text-[10px] font-medium rounded transition ${heightMethod === 'armSpan' ? 'bg-white/10 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Arm Span
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeightMethod('kneeHeight')}
                      className={`py-1.5 text-[10px] font-medium rounded transition ${heightMethod === 'kneeHeight' ? 'bg-white/10 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Knee Height
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeightMethod('ulnaLength')}
                      className={`py-1.5 text-[10px] font-medium rounded transition ${heightMethod === 'ulnaLength' ? 'bg-white/10 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Ulna Length
                    </button>
                  </div>
                </div>

                {/* Instructions Box */}
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-slate-350 leading-relaxed">
                    {heightMethod === 'armSpan' && "Standard arm span length (distance from fingertip to fingertip with arms fully outstretched sideways) correlates 1:1 with height and is clinically used as a primary substitute."}
                    {heightMethod === 'kneeHeight' && "Chumlea equation: Estimations use knee height (distance from ankle bone up to top joint of knee, bent 90°) to predict stature regardless of vertebral compression."}
                    {heightMethod === 'ulnaLength' && "BAPEN standard: Measures the distance from the point of the elbow (olecranon) to the middle of the wrist bone (styloid process) to estimate full body height."}
                  </div>
                </div>

                {/* Inputs based on selection */}
                <div className="space-y-3">
                  {heightMethod === 'armSpan' && (
                    <div>
                      <label className="text-[10px] text-slate-450 block font-mono uppercase mb-1">Arm Span Length ({isImperial ? 'inches' : 'cm'})</label>
                      <input
                        type="number"
                        step="any"
                        placeholder={isImperial ? "e.g. 68" : "e.g. 173"}
                        value={armSpanInput}
                        onChange={(e) => setArmSpanInput(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  )}

                  {heightMethod === 'kneeHeight' && (
                    <div>
                      <label className="text-[10px] text-slate-450 block font-mono uppercase mb-1">Knee Height ({isImperial ? 'inches' : 'cm'})</label>
                      <input
                        type="number"
                        step="any"
                        placeholder={isImperial ? "e.g. 20" : "e.g. 51"}
                        value={kneeHeightInputStature}
                        onChange={(e) => setKneeHeightInputStature(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  )}

                  {heightMethod === 'ulnaLength' && (
                    <div>
                      <label className="text-[10px] text-slate-450 block font-mono uppercase mb-1">Ulna Bone Length ({isImperial ? 'inches' : 'cm'})</label>
                      <input
                        type="number"
                        step="any"
                        placeholder={isImperial ? "e.g. 10.5" : "e.g. 26.5"}
                        value={ulnaLengthInput}
                        onChange={(e) => setUlnaLengthInput(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  )}
                </div>

                {/* Live Height Results Panel */}
                {calculatedHeight !== null && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1"
                  >
                    <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 font-mono">Calculated Stature Estimate</span>
                    <h4 className="text-xl font-bold text-white leading-tight">
                      {isImperial 
                        ? `${Math.round(calculatedHeight / 2.54)} inches` 
                        : `${calculatedHeight} cm`}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-light">Based on {heightMethod === 'armSpan' ? 'Arm Span' : heightMethod === 'kneeHeight' ? 'Knee Height' : 'Ulna Bone'} parameters for a {age}y {gender}.</p>
                  </motion.div>
                )}
              </div>
            ) : (
              // Weight Tab
              <div className="space-y-4">
                {/* Weight formula sub-selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 block font-mono uppercase tracking-wider">Weight Formula Method</label>
                  <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
                    <button
                      type="button"
                      onClick={() => setWeightMethod('clinicalIdeal')}
                      className={`py-1.5 text-[10px] font-medium rounded transition ${weightMethod === 'clinicalIdeal' ? 'bg-white/10 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Medical Ideal (Best)
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeightMethod('targetBmi')}
                      className={`py-1.5 text-[10px] font-medium rounded transition ${weightMethod === 'targetBmi' ? 'bg-white/10 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Target BMI
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeightMethod('anthropometric')}
                      className={`py-1.5 text-[10px] font-medium rounded transition ${weightMethod === 'anthropometric' ? 'bg-white/10 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Circumference
                    </button>
                  </div>
                </div>

                {/* Instructions box */}
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-slate-350 leading-relaxed">
                    {weightMethod === 'clinicalIdeal' && `Accurate Clinical Models: Calculates ideal weight targets by matching your exact Height (${calcHeight || '?'} ${isImperial ? 'in' : 'cm'}), Age (${calcAge || '?'} years), and Gender (${calcGender}) across gold-standard scientific equations.`}
                    {weightMethod === 'targetBmi' && "Calculate weight based on your current physical Height and a selected BMI coefficient. Enter a target index (healthy standard: 18.5 - 24.9) to learn your ideal body mass weight."}
                    {weightMethod === 'anthropometric' && "Chumlea Body Weights: Leverages Mid-Arm Cap circumference, Knee High measurements, and Calf circumference measurements to mathematically estimate total body weight within premium precision ranges."}
                  </div>
                </div>

                {/* Core parameters input fields */}
                <div id="calculator-core-inputs" className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-2.5">
                  <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider block font-bold">1. Calculator Parameters</span>
                  <div className="grid grid-cols-3 gap-2 text-left">
                    {/* Gender switcher */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 block font-mono uppercase">Gender</label>
                      <div className="grid grid-cols-2 gap-0.5 bg-slate-950/40 p-0.5 rounded-lg border border-white/5">
                        <button
                          type="button"
                          onClick={() => setCalcGender('male')}
                          className={`py-1 text-[9px] font-bold rounded transition cursor-pointer ${calcGender === 'male' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                          Male
                        </button>
                        <button
                          type="button"
                          onClick={() => setCalcGender('female')}
                          className={`py-1 text-[9px] font-bold rounded transition cursor-pointer ${calcGender === 'female' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                          Fem
                        </button>
                      </div>
                    </div>

                    {/* Age field */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 block font-mono uppercase font-semibold">Age (years)</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={calcAge}
                        onChange={(e) => setCalcAge(e.target.value)}
                        className="w-full bg-slate-950/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-center"
                      />
                    </div>

                    {/* Height field */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 block font-mono uppercase font-semibold">Height ({isImperial ? 'in' : 'cm'})</label>
                      <input
                        type="number"
                        step="0.1"
                        min="10"
                        max="300"
                        value={calcHeight}
                        onChange={(e) => setCalcHeight(e.target.value)}
                        className="w-full bg-slate-950/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-center"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {weightMethod === 'clinicalIdeal' && (
                    <div className="space-y-3 text-left">
                      <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">Select Clínical Model to Apply:</div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {/* 1. Recommended (Composite Age-Adjusted) */}
                        <button
                          type="button"
                          onClick={() => setSelectedIdealFormula('recommended')}
                          className={`p-2.5 rounded-xl border text-left transition relative cursor-pointer flex flex-col justify-between ${
                            selectedIdealFormula === 'recommended'
                              ? 'bg-emerald-500/15 border-emerald-400/50 text-white'
                              : 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-start w-full gap-1">
                            <span className="text-[9px] font-bold tracking-wide uppercase text-emerald-400">Recommended Blend</span>
                            {selectedIdealFormula === 'recommended' && <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-0.5" />}
                          </div>
                          <div className="mt-2">
                            <div className="text-sm font-bold font-mono">
                              {isImperial 
                                ? `${Math.round(ideals.recommendedKg * 2.20462)} lbs` 
                                : `${ideals.recommendedKg} kg`}
                            </div>
                            <span className="text-[8px] text-slate-400 block leading-tight mt-1">Multi-factor blend optimized for {gender} at age {age}.</span>
                          </div>
                        </button>

                        {/* 2. Age-Adjusted Healthy BMI */}
                        <button
                          type="button"
                          onClick={() => setSelectedIdealFormula('ageAdjusted')}
                          className={`p-2.5 rounded-xl border text-left transition relative cursor-pointer flex flex-col justify-between ${
                            selectedIdealFormula === 'ageAdjusted'
                              ? 'bg-emerald-500/15 border-emerald-400/50 text-white'
                              : 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-start w-full gap-1">
                            <span className="text-[9px] font-bold tracking-wide uppercase text-slate-300">Longevity BMI Target</span>
                            {selectedIdealFormula === 'ageAdjusted' && <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-0.5" />}
                          </div>
                          <div className="mt-2">
                            <div className="text-sm font-bold font-mono">
                              {isImperial 
                                ? `${Math.round(ideals.ageAdjustedBmiKg * 2.20462)} lbs` 
                                : `${ideals.ageAdjustedBmiKg} kg`}
                            </div>
                            <span className="text-[8px] text-slate-400 block leading-tight mt-1">Targets optimal metabolic reserve for {age}y decadal biology.</span>
                          </div>
                        </button>

                        {/* 3. Robinson Formula */}
                        <button
                          type="button"
                          onClick={() => setSelectedIdealFormula('robinson')}
                          className={`p-2.5 rounded-xl border text-left transition relative cursor-pointer flex flex-col justify-between ${
                            selectedIdealFormula === 'robinson'
                              ? 'bg-emerald-500/15 border-emerald-400/50 text-white'
                              : 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-start w-full gap-1">
                            <span className="text-[9px] font-bold tracking-wide uppercase text-slate-400">Robinson (1983)</span>
                            {selectedIdealFormula === 'robinson' && <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-0.5" />}
                          </div>
                          <div className="mt-2">
                            <div className="text-sm font-bold font-mono">
                              {isImperial 
                                ? `${Math.round(ideals.robinsonKg * 2.20462)} lbs` 
                                : `${ideals.robinsonKg} kg`}
                            </div>
                            <span className="text-[8px] text-slate-405 block leading-tight mt-1">Refined consensus demographic equation model.</span>
                          </div>
                        </button>

                        {/* 4. Devine Formula */}
                        <button
                          type="button"
                          onClick={() => setSelectedIdealFormula('devine')}
                          className={`p-2.5 rounded-xl border text-left transition relative cursor-pointer flex flex-col justify-between ${
                            selectedIdealFormula === 'devine'
                              ? 'bg-emerald-500/15 border-emerald-400/50 text-white'
                              : 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-start w-full gap-1">
                            <span className="text-[9px] font-bold tracking-wide uppercase text-slate-400">Devine (1974)</span>
                            {selectedIdealFormula === 'devine' && <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-0.5" />}
                          </div>
                          <div className="mt-2">
                            <div className="text-sm font-bold font-mono">
                              {isImperial 
                                ? `${Math.round(ideals.devineKg * 2.20462)} lbs` 
                                : `${ideals.devineKg} kg`}
                            </div>
                            <span className="text-[8px] text-slate-450 block leading-tight mt-1">Standard medical dosing benchmark standard.</span>
                          </div>
                        </button>

                        {/* 5. Miller Formula */}
                        <button
                          type="button"
                          onClick={() => setSelectedIdealFormula('miller')}
                          className={`p-2.5 rounded-xl border text-left transition relative cursor-pointer flex flex-col justify-between ${
                            selectedIdealFormula === 'miller'
                              ? 'bg-emerald-500/15 border-emerald-400/50 text-white'
                              : 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-start w-full gap-1">
                            <span className="text-[9px] font-bold tracking-wide uppercase text-slate-400">Miller (1983)</span>
                            {selectedIdealFormula === 'miller' && <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-0.5" />}
                          </div>
                          <div className="mt-2">
                            <div className="text-sm font-bold font-mono">
                              {isImperial 
                                ? `${Math.round(ideals.millerKg * 2.20462)} lbs` 
                                : `${ideals.millerKg} kg`}
                            </div>
                            <span className="text-[8px] text-slate-450 block leading-tight mt-1">Proportional cellular-volume formula standards.</span>
                          </div>
                        </button>

                        {/* 6. Hamwi Formula */}
                        <button
                          type="button"
                          onClick={() => setSelectedIdealFormula('hamwi')}
                          className={`p-2.5 rounded-xl border text-left transition relative cursor-pointer flex flex-col justify-between ${
                            selectedIdealFormula === 'hamwi'
                              ? 'bg-emerald-500/15 border-emerald-400/50 text-white'
                              : 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-start w-full gap-1">
                            <span className="text-[9px] font-bold tracking-wide uppercase text-slate-400">Hamwi (1964)</span>
                            {selectedIdealFormula === 'hamwi' && <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />}
                          </div>
                          <div className="mt-2">
                            <div className="text-sm font-bold font-mono">
                              {isImperial 
                                ? `${Math.round(ideals.hamwiKg * 2.20462)} lbs` 
                                : `${ideals.hamwiKg} kg`}
                            </div>
                            <span className="text-[8px] text-slate-450 block leading-tight mt-1">Historical weight & body frame metric tracker.</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {weightMethod === 'targetBmi' && (
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-450 block font-mono uppercase">Target BMI Value (Index)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 21.7"
                        value={targetBmiInput}
                        onChange={(e) => setTargetBmiInput(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  )}

                  {weightMethod === 'anthropometric' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] text-slate-400 block font-mono uppercase mb-0.5">Arm Circ (MUAC) ({isImperial ? 'in' : 'cm'})</label>
                        <input
                          type="number"
                          step="any"
                          placeholder={isImperial ? "e.g. 12" : "e.g. 30.5"}
                          value={muacInput}
                          onChange={(e) => setMuacInput(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 block font-mono uppercase mb-0.5">Calf Circumference ({isImperial ? 'in' : 'cm'})</label>
                        <input
                          type="number"
                          step="any"
                          placeholder={isImperial ? "e.g. 13.5" : "e.g. 34"}
                          value={calfCircInput}
                          onChange={(e) => setCalfCircInput(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 block font-mono uppercase mb-0.5">Knee Height ({isImperial ? 'in' : 'cm'})</label>
                        <input
                          type="number"
                          step="any"
                          placeholder={isImperial ? "e.g. 20" : "e.g. 51"}
                          value={kneeHeightInputWeight}
                          onChange={(e) => setKneeHeightInputWeight(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 block font-mono uppercase mb-0.5">Subscapular Skinfold (mm) <span className="opacity-50">Opt</span></label>
                        <input
                          type="number"
                          step="any"
                          placeholder="e.g. 15"
                          value={subscapularInput}
                          onChange={(e) => setSubscapularInput(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Manual Calculate Interactive Trigger button */}
                <div className="pt-2 pb-1">
                  <button
                    type="button"
                    onClick={handleManualCalculate}
                    disabled={isCalculating}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition duration-200 text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isCalculating ? (
                      <span className="flex items-center gap-1.5">
                        <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                        Calculating body mass...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5" />
                        Calculate Weight
                      </span>
                    )}
                  </button>
                </div>

                {/* Live Weight Results Panel */}
                {calculatedWeight !== null && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1"
                  >
                    <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 font-mono">Calculated Mass Estimate</span>
                    <h4 className="text-xl font-bold text-white leading-tight">
                      {isImperial 
                        ? `${Math.round(calculatedWeight * 2.20462)} lbs` 
                        : `${calculatedWeight} kg`}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-light">
                      {weightMethod === 'clinicalIdeal'
                        ? `Matches selected ideal ${selectedIdealFormula === 'recommended' ? 'composite' : selectedIdealFormula} model target (for ${calcAge}y ${calcGender}).`
                        : weightMethod === 'targetBmi' 
                          ? `Matches healthy target body mass ratio (at ${calcHeight}${isImperial ? 'in' : 'cm'} height).`
                          : "Constructed dynamically via Chumlea equation."
                      }
                    </p>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="p-4 bg-white/[0.02] border-t border-white/10 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg transition"
            >
              Close
            </button>
            {activeTab === 'height' ? (
              <button
                disabled={calculatedHeight === null}
                onClick={applyHeightResult}
                className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/25 hover:bg-emerald-500/25 enabled:text-emerald-300 disabled:opacity-40 text-xs font-semibold px-4 py-2 rounded-lg transition disabled:cursor-not-allowed cursor-pointer"
              >
                <Check className="w-4 h-4" /> Apply Height
              </button>
            ) : (
              <button
                disabled={calculatedWeight === null}
                onClick={applyWeightResult}
                className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/25 hover:bg-emerald-500/25 enabled:text-emerald-300 disabled:opacity-40 text-xs font-semibold px-4 py-2 rounded-lg transition disabled:cursor-not-allowed cursor-pointer"
              >
                <Check className="w-4 h-4" /> Apply Weight
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
