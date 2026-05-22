import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserProfile, Gender, ActivityLevel, FitnessGoal, UnitSystem } from '../types';
import { User, Activity, Flame, Shield, ArrowRight, Compass, Calculator } from 'lucide-react';
import BiometricsEstimator from './BiometricsEstimator';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  initialProfile?: UserProfile;
}

export default function Onboarding({ onComplete, initialProfile }: OnboardingProps) {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(initialProfile?.unitSystem || 'metric');
  const [age, setAge] = useState<string>(initialProfile?.age ? String(initialProfile.age) : '28');
  const [gender, setGender] = useState<Gender>(initialProfile?.gender || 'male');
  
  // Height and weight state depends on current selected unit
  // If editing, use conversions or initial values
  const [heightMetric, setHeightMetric] = useState<string>(initialProfile?.height ? String(initialProfile.height) : '175');
  const [weightMetric, setWeightMetric] = useState<string>(initialProfile?.weight ? String(initialProfile.weight) : '70');
  const [waistMetric, setWaistMetric] = useState<string>(initialProfile?.waist ? String(initialProfile.waist) : '');
  
  // Imperial standard state default conversions: 175cm -> 5 feet, 9 inches
  const getFtAndIn = (cmVal: number) => {
    const totalInches = Math.round(cmVal / 2.54);
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return { feet, inches };
  };

  const initialFtIn = initialProfile?.height ? getFtAndIn(initialProfile.height) : { feet: 5, inches: 9 };
  const [heightFt, setHeightFt] = useState<string>(String(initialFtIn.feet));
  const [heightIn, setHeightIn] = useState<string>(String(initialFtIn.inches));

  const [weightImperial, setWeightImperial] = useState<string>(
    initialProfile?.weight ? String(Math.round(initialProfile.weight * 2.20462)) : '154'
  );
  const [waistImperial, setWaistImperial] = useState<string>(
    initialProfile?.waist ? String(Math.round(initialProfile.waist / 2.54)) : ''
  );

  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(initialProfile?.activityLevel || 'moderately_active');
  const [goal, setGoal] = useState<FitnessGoal>(initialProfile?.goal || 'improve_health');
  const [validationError, setValidationError] = useState<string>('');

  // Estimator States
  const [isEstimatorOpen, setIsEstimatorOpen] = useState(false);
  const [estimatorInitialMode, setEstimatorInitialMode] = useState<'height' | 'weight'>('height');

  const handleOpenEstimator = (mode: 'height' | 'weight') => {
    setEstimatorInitialMode(mode);
    setIsEstimatorOpen(true);
  };

  const currentHeightCm = unitSystem === 'metric' 
    ? (parseFloat(heightMetric) || 175) 
    : ((parseInt(heightFt, 10) || 0) * 12 + (parseFloat(heightIn) || 0)) * 2.54;

  const handleApplyHeight = (heightCm: number) => {
    setHeightMetric(String(Math.round(heightCm * 10) / 10));
    const totalIn = Math.round(heightCm / 2.54);
    setHeightFt(String(Math.floor(totalIn / 12)));
    setHeightIn(String(totalIn % 12));
  };

  const handleApplyWeight = (weightKg: number) => {
    setWeightMetric(String(Math.round(weightKg * 10) / 10));
    setWeightImperial(String(Math.round(weightKg * 2.20462)));
  };

  const handleUnitChange = (system: UnitSystem) => {
    setUnitSystem(system);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const parsedAge = parseInt(age);
    if (!parsedAge || parsedAge <= 0 || parsedAge > 120) {
      setValidationError('Please enter a realistic age between 1 and 120.');
      return;
    }

    let parsedHeight = 0;
    let parsedWeight = 0;
    let parsedWaist: number | undefined = undefined;

    if (unitSystem === 'metric') {
      parsedHeight = parseFloat(heightMetric);
      parsedWeight = parseFloat(weightMetric);
      parsedWaist = waistMetric ? parseFloat(waistMetric) : undefined;

      if (!parsedHeight || parsedHeight < 50 || parsedHeight > 260) {
        setValidationError('Please enter a valid height between 50 cm and 260 cm.');
        return;
      }
      if (!parsedWeight || parsedWeight < 10 || parsedWeight > 500) {
        setValidationError('Please enter a valid weight between 10 kg and 500 kg.');
        return;
      }
      if (parsedWaist !== undefined && (parsedWaist < 20 || parsedWaist > 250)) {
        setValidationError('Please enter a realistic waist circumference between 20 cm and 250 cm (or leave empty).');
        return;
      }
    } else {
      // Convert Imperial to Metric
      const feet = parseInt(heightFt, 10) || 0;
      const inches = parseFloat(heightIn) || 0;
      const heightInches = feet * 12 + inches;
      const weightLbs = parseFloat(weightImperial);
      const waistInches = waistImperial ? parseFloat(waistImperial) : undefined;

      if (heightInches < 20 || heightInches > 110) {
        setValidationError('Please enter a valid height between 1ft 8in and 9ft 2in.');
        return;
      }
      if (!weightLbs || weightLbs < 20 || weightLbs > 1100) {
        setValidationError('Please enter a valid weight between 20 and 1100 lbs.');
        return;
      }
      if (waistInches !== undefined && (waistInches < 8 || waistInches > 100)) {
        setValidationError('Please enter a realistic waist between 8 and 100 inches (or leave empty).');
        return;
      }

      parsedHeight = heightInches * 2.54;
      parsedWeight = weightLbs / 2.20462;
      parsedWaist = waistInches ? waistInches * 2.54 : undefined;
    }

    const profile: UserProfile = {
      age: parsedAge,
      gender,
      height: Math.round(parsedHeight * 10) / 10,
      weight: Math.round(parsedWeight * 10) / 10,
      waist: parsedWaist ? Math.round(parsedWaist * 10) / 10 : undefined,
      activityLevel,
      goal,
      unitSystem
    };

    onComplete(profile);
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-4 px-2 sm:px-6">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Banner Section */}
        <div className="bg-gradient-to-tr from-slate-950 to-indigo-950/80 p-6 sm:p-8 text-white relative border-b border-white/10">
          <div className="max-w-lg space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-mono">
              <Compass className="w-3.5 h-3.5" />
              Tailored Body Insights
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Let's build your Wellness Map.</h2>
            <p className="text-xs sm:text-sm text-slate-350 font-light leading-relaxed">
              We require simple parameters to calculate accurate metabolic indices and healthy ranges. Your logs are stored locally on your device in strict confidence.
            </p>
          </div>
          <div className="absolute right-4 bottom-4 opacity-5 hidden sm:block">
            <User className="w-32 h-32 text-white" />
          </div>
        </div>

        {/* Setup Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 select-none">
          {validationError && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-205 text-xs rounded-xl"
            >
              {validationError}
            </motion.div>
          )}

          {/* Unit Toggle & Age */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Unit System</label>
              <div className="grid grid-cols-2 gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => handleUnitChange('metric')}
                  className={`py-2 text-xs font-medium rounded-lg transition ${unitSystem === 'metric' ? 'bg-white/10 text-white shadow border border-white/10' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Metric (cm/kg)
                </button>
                <button
                  type="button"
                  onClick={() => handleUnitChange('imperial')}
                  className={`py-2 text-xs font-medium rounded-lg transition ${unitSystem === 'imperial' ? 'bg-white/10 text-white shadow border border-white/10' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Imperial (in/lb)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Gender</label>
              <div className="grid grid-cols-2 gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`py-2 text-xs font-medium rounded-lg transition ${gender === 'male' ? 'bg-emerald-500/25 text-emerald-300 shadow border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`py-2 text-xs font-medium rounded-lg transition ${gender === 'female' ? 'bg-emerald-500/25 text-emerald-300 shadow border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Female
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="user-age" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Age (Years)</label>
              <input
                id="user-age"
                type="number"
                min="1"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white/10 transition"
                required
              />
            </div>
          </div>

          {/* Biometrics Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Height {unitSystem === 'metric' ? '(cm)' : '(ft / in)'}
                </label>
                <button
                  type="button"
                  onClick={() => handleOpenEstimator('height')}
                  className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer bg-transparent border-none outline-none"
                >
                  <Calculator className="w-2.5 h-2.5" /> Calculate
                </button>
              </div>
              {unitSystem === 'metric' ? (
                <input
                  id="user-height"
                  type="number"
                  step="0.1"
                  value={heightMetric}
                  onChange={(e) => setHeightMetric(e.target.value)}
                  placeholder="e.g. 175"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white/10 transition"
                  required
                />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      id="user-height-ft"
                      type="number"
                      min="1"
                      max="9"
                      value={heightFt}
                      onChange={(e) => setHeightFt(e.target.value)}
                      placeholder="ft"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-8 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white/10 transition font-mono"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono pointer-events-none">ft</span>
                  </div>
                  <div className="relative">
                    <input
                      id="user-height-in"
                      type="number"
                      min="0"
                      max="11.9"
                      step="0.1"
                      value={heightIn}
                      onChange={(e) => setHeightIn(e.target.value)}
                      placeholder="in"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-8 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white/10 transition font-mono"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono pointer-events-none">in</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="user-weight" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Weight {unitSystem === 'metric' ? '(kg)' : '(lbs)'}
                </label>
                <button
                  type="button"
                  onClick={() => handleOpenEstimator('weight')}
                  className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer bg-transparent border-none outline-none"
                >
                  <Calculator className="w-2.5 h-2.5" /> Calculate
                </button>
              </div>
              <input
                id="user-weight"
                type="number"
                step="any"
                value={unitSystem === 'metric' ? weightMetric : weightImperial}
                onChange={(e) => unitSystem === 'metric' ? setWeightMetric(e.target.value) : setWeightImperial(e.target.value)}
                placeholder={unitSystem === 'metric' ? 'e.g. 70' : 'e.g. 154'}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white/10 transition"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="user-waist" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Waist {unitSystem === 'metric' ? '(cm)' : '(inches)'}
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Optional</span>
              </div>
              <input
                id="user-waist"
                type="number"
                step="any"
                value={unitSystem === 'metric' ? waistMetric : waistImperial}
                onChange={(e) => unitSystem === 'metric' ? setWaistMetric(e.target.value) : setWaistImperial(e.target.value)}
                placeholder={unitSystem === 'metric' ? 'e.g. 80' : 'e.g. 32'}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white/10 transition placeholder-slate-500"
              />
            </div>
          </div>

          <hr className="border-white/10" />

          {/* Activity Level & Fitness Goals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                Active Movement Rate
              </label>
              <div className="space-y-2">
                {[
                  { value: 'sedentary', label: 'Sedentary', desc: 'Minimal moving, desk occupation.' },
                  { value: 'lightly_active', label: 'Light Activity', desc: 'Basic walks or sport drills 1-3 days/week.' },
                  { value: 'moderately_active', label: 'Moderate Activity', desc: 'Gym sport regimes/activities 3-5 days/week.' },
                  { value: 'very_active', label: 'Very Active', desc: 'Heavy weight sports, physical routines 6-7 days/week.' },
                  { value: 'extremely_active', label: 'Extremely Active', desc: 'Intensive dynamic daily work or double workouts.' }
                ].map((act) => (
                  <label 
                    key={act.value}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left cursor-pointer transition ${activityLevel === act.value ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/5' : 'bg-white/5 border-white/5 hover:border-white/10 text-slate-300 hover:bg-white/10'}`}
                  >
                    <input
                      type="radio"
                      name="activity"
                      value={act.value}
                      checked={activityLevel === act.value}
                      onChange={() => setActivityLevel(act.value as ActivityLevel)}
                      className="mt-1 accent-emerald-400"
                    />
                    <div>
                      <span className="text-xs font-semibold block">{act.label}</span>
                      <span className="text-[10px] text-slate-400 font-light">{act.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-emerald-400" />
                Wellness Target
              </label>
              <div className="space-y-2">
                {[
                  { value: 'improve_health', label: 'Revitalize Overall Health', desc: 'Balanced macronutrients for stamina and lifespan.' },
                  { value: 'lose_fat', label: 'Gentle Fat Reduction', desc: 'Moderate caloric energy target for tissue tuning.' },
                  { value: 'build_muscle', label: 'Active Muscle Synthesis', desc: 'Proteins and tissue supporting gains.' },
                  { value: 'maintain', label: 'Sustain Balance', desc: 'Easy maintenance energy distribution.' }
                ].map((tg) => (
                  <label 
                    key={tg.value}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left cursor-pointer transition ${goal === tg.value ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/5' : 'bg-white/5 border-white/5 hover:border-white/10 text-slate-300 hover:bg-white/10'}`}
                  >
                    <input
                      type="radio"
                      name="goal"
                      value={tg.value}
                      checked={goal === tg.value}
                      onChange={() => setGoal(tg.value as FitnessGoal)}
                      className="mt-1 accent-emerald-400"
                    />
                    <div>
                      <span className="text-xs font-semibold block">{tg.label}</span>
                      <span className="text-[10px] text-slate-400 font-light">{tg.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Privacy & Setup completion disclaimer */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="text-[10px] sm:text-xs text-slate-400 font-normal leading-normal">
              <strong>Your Information is Secure:</strong> Be Fit AI values your physical and emotional safety. Biometric measurements are compiled strictly to support estimates. We never monetize, cache, or distribute personal body files. You can delete or clear your metrics cache down in Settings at any time.
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs px-6 py-3 rounded-xl transition shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-[1.01] cursor-pointer"
            >
              Compile Custom Map
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          </div>
        </form>
      </motion.div>

      <BiometricsEstimator
        isOpen={isEstimatorOpen}
        onClose={() => setIsEstimatorOpen(false)}
        gender={gender}
        age={parseInt(age) || 28}
        currentHeightCm={currentHeightCm}
        unitSystem={unitSystem}
        onApplyHeight={handleApplyHeight}
        onApplyWeight={handleApplyWeight}
        initialMode={estimatorInitialMode}
      />
    </div>
  );
}
