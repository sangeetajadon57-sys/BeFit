import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Sparkles, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { CalculationResult } from '../types';

interface SuggestionsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  metricType: 'bmi' | 'bodyFat' | 'bmr' | 'tdee' | 'waistToHeight';
  result: CalculationResult;
}

export default function SuggestionsPopup({ isOpen, onClose, metricType, result }: SuggestionsPopupProps) {
  const [showLearnMore, setShowLearnMore] = useState(false);

  // Extract info based on selected type
  let title = '';
  let categoryStr = '';
  let explanation = '';
  let tips: string[] = [];
  let color = 'indigo';
  let learnMoreContent = '';

  if (metricType === 'bmi') {
    title = 'Body Mass Index (BMI)';
    categoryStr = result.bmi.category;
    explanation = result.bmi.explanation;
    tips = result.bmi.tips;
    color = result.bmi.category === 'Healthy Weight' ? 'emerald' : 
            result.bmi.category === 'Underweight' ? 'sky' : 
            result.bmi.category === 'Overweight' ? 'amber' : 'rose';
    learnMoreContent = `
      BMI is a baseline screening ratio of mass to height, defined as body weight in kilograms divided by the square of body height in meters (kg/m²).
      
      While widely used as a risk indicator for cardiovascular health, please remember that BMI does not directly evaluate body fat or distinguish muscle mass. Highly athletic or modular individuals with robust muscular composition might list as "overweight" or "obese" despite showing optimal metabolic parameters. Use BMI alongside Body Fat % and Waist-to-Height calculations for a professional multi-perspective composition analysis.
    `;
  } else if (metricType === 'bodyFat' && result.bodyFat) {
    title = 'Body Fat Percentage';
    categoryStr = result.bodyFat.category;
    explanation = result.bodyFat.explanation;
    tips = result.bodyFat.tips;
    color = result.bodyFat.category.includes('Fit') ? 'emerald' : 
            result.bodyFat.category.includes('Low') ? 'sky' : 
            result.bodyFat.category.includes('Average') ? 'amber' : 'rose';
    learnMoreContent = `
      Body lipid ratio represents the aggregate mass of adipose tissue (body fat) divided by total body weight. This is divided into essential structural fat (hormone control, thermal regulation, and cell building) and storage adipose tissue.
      
      Optimal ranges fluctuate biologically depending on age and biological gender. Keeping body fat in standard guidelines drastically lowers visceral organ burdens and protects baseline cardiovascular vitality.
    `;
  } else if (metricType === 'bmr') {
    title = 'Basal Metabolic Rate (BMR)';
    categoryStr = `${result.bmr.value} kcal/day`;
    explanation = result.bmr.explanation;
    tips = result.bmr.tips;
    color = 'indigo';
    learnMoreContent = `
      BMR measures the exact count of thermal calories your body naturally expends to support standard vital homeostatic functions (cell division, cerebral thoughts, respiratory respiration, kidney clearance, and persistent cardiac motion) at complete rest.
      
      Your resting metabolism is heavily modified by active skeletal muscle fibers. Enhancing muscle volume progressively through compound strength exercises automatically elevates your daily resting BMR, allowing you to consume more calories while enjoying comfortable weight maintenance.
    `;
  } else if (metricType === 'tdee') {
    title = 'Estimated Energy Needed (TDEE)';
    categoryStr = `${result.tdee.value} kcal/day`;
    explanation = result.tdee.explanation;
    tips = result.tdee.tips;
    color = 'violet';
    learnMoreContent = `
      Total Daily Energy Expenditure is the aggregate thermal calorie requirements of your body over 24 hours. This includes:
      1. Basal metabolic speed (60-70% of total needs)
      2. The thermic work of digesting your nutrients (TEF, approx 10%)
      3. Physical sport exercise energy
      4. General non-exercise motion (NEAT - typing, standing, gardening).
      
      Modulating calorie intake gently based on your calculated TDEE facilitates safe, comfortable, and sustainable weight alterations without inducing physical organ starvation, fatigue, or stress.
    `;
  } else if (metricType === 'waistToHeight' && result.waistToHeight) {
    title = 'Waist-to-Height Ratio (WHtR)';
    categoryStr = result.waistToHeight.category;
    explanation = result.waistToHeight.explanation;
    tips = result.waistToHeight.tips;
    color = result.waistToHeight.category === 'Healthy' ? 'emerald' : 
            result.waistToHeight.category === 'Slim' ? 'sky' : 
            result.waistToHeight.category === 'Overweight' ? 'amber' : 'rose';
    learnMoreContent = `
      Waist-to-Height ratio is a reliable indicator of abdominal (visceral) lipid concentration. Visceral fat builds around vital organs and releases metabolic inflammatory proteins. 
      
      Keeping your waist circumference under 50% of your current height is a powerful wellness buffer to prevent arterial stiffening, optimize natural blood glucose tolerances, and support long-term heart longevity.
    `;
  }
  // Soft theme coloring helper
  const getColorClasses = (c: string) => {
    switch (c) {
      case 'emerald': return { bg: 'bg-emerald-500/5', text: 'text-slate-300', border: 'border-emerald-500/20', badge: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20', bullet: 'text-emerald-400' };
      case 'sky': return { bg: 'bg-sky-500/5', text: 'text-slate-300', border: 'border-sky-500/20', badge: 'bg-sky-500/10 text-sky-300 border border-sky-500/20', bullet: 'text-sky-400' };
      case 'amber': return { bg: 'bg-amber-500/5', text: 'text-slate-300', border: 'border-amber-500/20', badge: 'bg-amber-500/10 text-amber-300 border border-amber-500/20', bullet: 'text-amber-400' };
      case 'rose': return { bg: 'bg-rose-500/5', text: 'text-slate-300', border: 'border-rose-500/20', badge: 'bg-rose-500/10 text-rose-300 border border-rose-500/20', bullet: 'text-rose-400' };
      case 'violet': return { bg: 'bg-violet-500/5', text: 'text-slate-300', border: 'border-violet-500/20', badge: 'bg-violet-500/10 text-violet-300 border border-violet-500/20', bullet: 'text-violet-400' };
      default: return { bg: 'bg-indigo-500/5', text: 'text-slate-300', border: 'border-indigo-500/20', badge: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20', bullet: 'text-indigo-400' };
    }
  };

  const scheme = getColorClasses(color);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop screen mask */}
          <motion.div
            id="backdrop-mask"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          {/* Bottom Sheet for mobile / Modal for desktop */}
          <motion.div
            id="suggestions-modal"
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.5 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-full max-w-lg bg-[#0b1519]/95 backdrop-blur-2xl border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-lg text-slate-950">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm sm:text-base">{title} Advice</h3>
                  <p className="text-xs text-slate-400 font-mono">Expert Wellness Suggestions</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1 px-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                aria-label="Close suggestions window"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 select-none text-slate-300">
              
              {/* Category Showcase Badge */}
              <div className={`p-4 rounded-xl border ${scheme.bg} ${scheme.border} space-y-2`}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Status</span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${scheme.badge}`}>
                    {categoryStr}
                  </span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed font-normal">
                  {explanation}
                </p>
              </div>

              {/* Tips Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Actionable Wellness Routines (3-5 tips)
                </h4>
                <ul className="space-y-2.5">
                  {tips.map((tip, idx) => (
                    <motion.li 
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed font-normal"
                    >
                      <span className={`mt-0.5 font-bold text-sm ${scheme.bullet}`}>•</span>
                      <span>{tip}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Expansion "Learn More" */}
              <div className="pt-2 border-t border-white/10">
                <button
                  onClick={() => setShowLearnMore(!showLearnMore)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition py-2 cursor-pointer font-mono"
                >
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Learn more & Medical basis
                  </span>
                  {showLearnMore ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                <AnimatePresence>
                  {showLearnMore && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 text-xs text-slate-350 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/10 whitespace-pre-line font-normal">
                        {learnMoreContent.trim()}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

            {/* Bottom button actions */}
            <div className="p-4 bg-white/5 border-t border-white/10 flex gap-2">
              <button
                onClick={onClose}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl transition shadow shadow-slate-950/20 cursor-pointer"
              >
                Acknowledge suggestions
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
