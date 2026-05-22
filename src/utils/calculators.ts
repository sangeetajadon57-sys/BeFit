import { UserProfile, CalculationResult, MetricRange } from '../types';

// Convert Imperial units to Metric
export function convertImperialToMetric(
  age: number,
  gender: 'male' | 'female',
  heightInches: number,
  weightLbs: number,
  waistInches?: number
) {
  const heightCm = heightInches * 2.54;
  const weightKg = weightLbs / 2.20462;
  const waistCm = waistInches ? waistInches * 2.54 : undefined;
  return { heightCm, weightKg, waistCm };
}

// Convert Metric units to Imperial
export function convertMetricToImperial(heightCm: number, weightKg: number, waistCm?: number) {
  const heightInches = heightCm / 2.54;
  const weightLbs = weightKg * 2.20462;
  const waistInches = waistCm ? waistCm / 2.54 : undefined;
  return { heightInches, weightLbs, waistInches };
}

export function calculateMetrics(profile: UserProfile): CalculationResult {
  const { age, gender, height, weight, waist, activityLevel, goal, unitSystem } = profile;
  
  // Convert heights to meters for BMI
  const heightM = height / 100;
  
  // 1. BMI Calculation
  const bmiValue = weight / (heightM * heightM);
  const roundedBmi = Math.round(bmiValue * 10) / 10;
  
  const bmiRanges: MetricRange[] = [
    { label: 'Underweight', min: 0, max: 18.4, color: '#38bdf8', description: 'Your body mass is lower than typical healthy benchmarks.' },
    { label: 'Healthy Weight', min: 18.5, max: 24.9, color: '#4ade80', description: 'Your weight is in an optimal balance with your height.' },
    { label: 'Overweight', min: 25.0, max: 29.9, color: '#facc15', description: 'Your weight is slightly higher than baseline heights standards.' },
    { label: 'Obese Range', min: 30.0, max: 100, color: '#f87171', description: 'Your metrics point toward elevated mass for height, posing health markers.' }
  ];
  
  let bmiCategory = 'Obese Range';
  let bmiRangeText = 'BMI >= 30.0';
  let bmiExplanation = '';
  let bmiTips: string[] = [];
  
  if (roundedBmi < 18.5) {
    bmiCategory = 'Underweight';
    bmiRangeText = 'Less than 18.5';
    bmiExplanation = 'Your custom BMI indicates you might benefit from nutritional support or building strength. Focus on energy-dense, premium-fuel meals and regular strength development.';
    bmiTips = [
      'Focus on nutrient-dense meals with nourishing healthy fats (avocados, nuts, seeds).',
      'Integrate light resistance training to stimulate healthy muscle mass generation.',
      'Sustain hydration with wellness-packed smoothies and pure water.',
      'Consider consulting a qualified nutritionist or healthcare provider to optimize your energy absorption.'
    ];
  } else if (roundedBmi >= 18.5 && roundedBmi < 25) {
    bmiCategory = 'Healthy Weight';
    bmiRangeText = '18.5 - 24.9';
    bmiExplanation = 'Superb balance! Your weight perfectly supports your frame. Keep nurturing this with fresh habits, sound sleep patterns, and active days.';
    bmiTips = [
      'Maintain your excellent routine with mixed cardiovascular and strength movements.',
      'Nourish your recovery with 7 to 9 hours of uninterrupted sleep every night.',
      'Stay hydrated, targeting 2.5 to 3 liters of fresh drinking water daily.',
      'Incorporate a colorful palette of micronutrient-dense whole foods.'
    ];
  } else if (roundedBmi >= 25 && roundedBmi < 30) {
    bmiCategory = 'Overweight';
    bmiRangeText = '25.0 - 29.9';
    bmiExplanation = 'Your mass is slightly in excess of standard benchmarks. A few small, nurturing lifestyle adjustments like micro-walks and continuous resistance work will yield tremendous benefits.';
    bmiTips = [
      'Enrich daily activity with an extra 20-30 minute active walk or active cycling.',
      'Increase protein intake slightly to stabilize blood sugar and support muscle tissue.',
      'Prioritize drinking water prior to meals to support optimal metabolic digestion.',
      'Integrate mindful breathing and portion adjustments rather than stressful food restriction.'
    ];
  } else {
    bmiCategory = 'Obese Range';
    bmiRangeText = '30.0 or higher';
    bmiExplanation = 'Prioritizing cardiovascular safety and movement variation can return your weight to an comfortable, low-stress range. This is about deep energy longevity, high joint comfort, and absolute vitality.';
    bmiTips = [
      'Engage in low-impact aerobics (swimming, elliptical, fast walking) to support joints.',
      'Incorporate consistent whole-body resistance workouts twice a week.',
      'Reduce processed added sugars entirely; focus on dynamic dietary fibers.',
      'Consult a compassionate therapist or fitness doctor to map a steady, sustainable progress plan.'
    ];
  }

  // 2. Body Fat Percentage (Formula: Deurenberg's BMI-based Estimation)
  // For adults: BF% = (1.20 * BMI) + (0.23 * Age) - (10.8 * Gender: male=1, female=0) - 5.4
  const genderFactor = gender === 'male' ? 1 : 0;
  const bfValue = (1.20 * roundedBmi) + (0.23 * age) - (10.8 * genderFactor) - 5.4;
  const roundedBf = Math.max(2, Math.round(bfValue * 10) / 10);
  
  let bfCategory = '';
  let bfRangeText = '';
  let bfExplanation = '';
  let bfTips: string[] = [];
  let bfRanges: MetricRange[] = [];
  
  if (gender === 'male') {
    bfRanges = [
      { label: 'Low/Essential', min: 2, max: 13.9, color: '#38bdf8', description: 'Minimal essential body lipids.' },
      { label: 'Fit/Athletic', min: 14.0, max: 17.9, color: '#4ade80', description: 'Excellent physical condition and efficiency.' },
      { label: 'Average', min: 18.0, max: 24.9, color: '#facc15', description: 'Good, healthy balanced body composition.' },
      { label: 'High Range', min: 25.0, max: 60, color: '#f87171', description: 'Excess body fat; higher cardiovascular work.' }
    ];
    
    if (roundedBf < 14) {
      bfCategory = 'Low/Essential';
      bfRangeText = '2% - 13.9%';
      bfExplanation = 'Your body fat is lean. Ensure you are getting adequate essential fatty acids to safeguard metabolic hormone production.';
      bfTips = [
        'Ensure a clean source of omega-3 fats from wild-caught cold-water fish, seeds, and extra virgin olive oil.',
        'Track physical energy levels closely to prevent cognitive fatigue or overtraining syndrome.',
        'Focus on complex carbohydrates to support intensive physical activities.'
      ];
    } else if (roundedBf >= 14 && roundedBf < 18) {
      bfCategory = 'Fit/Athletic';
      bfRangeText = '14.0% - 17.9%';
      bfExplanation = 'Incredibly athletic and operational body composition. This supports superior endurance, strength, and continuous daily agility.';
      bfTips = [
        'Maintain current training structure, blending compound lifts with cardio workouts.',
        'Vary macronutrients slightly to prevent plateauing or digestive adaptation.',
        'Track joint mobility and health as high muscle efficiency places stress on ligaments.'
      ];
    } else if (roundedBf >= 18 && roundedBf < 25) {
      bfCategory = 'Average';
      bfRangeText = '18.0% - 24.9%';
      bfExplanation = 'A healthy average range that allows excellent energy reserve and low metabolic stress. Sustainable for lifetime health.';
      bfTips = [
        'Combine resistance exercise with cardiovascular intervals.',
        'Keep dietary intake wholesome: 80% natural whole ingredients, 20% comfort treats.',
        'Prioritize progressive overload in strength routines to support lean physique building.'
      ];
    } else {
      bfCategory = 'High Range';
      bfRangeText = '25.0% or higher';
      bfExplanation = 'Elevated body lipid volume. Gradual wellness modifications will help reduce tissue fatigue and support vital organs.';
      bfTips = [
        'Increase daily walking steps organically—take stairs, cycle to nearby spots.',
        'Supplement your meals with robust proteins and fibers to stay full longer.',
        'Improve resistance training frequency to convert energy storage into lean tissue.'
      ];
    }
  } else {
    // Female body fat categories
    bfRanges = [
      { label: 'Low/Essential', min: 10, max: 20.9, color: '#38bdf8', description: 'Minimum lipophilic structure.' },
      { label: 'Fit/Athletic', min: 21.0, max: 24.9, color: '#4ade80', description: 'High athletic capability and metabolic tone.' },
      { label: 'Average', min: 25.0, max: 31.9, color: '#facc15', description: 'Healthy and normal biological range.' },
      { label: 'High Range', min: 32.0, max: 70, color: '#f87171', description: 'Increased storage percent; metabolic burden.' }
    ];
    
    if (roundedBf < 21) {
      bfCategory = 'Low/Essential';
      bfRangeText = '10% - 20.9%';
      bfExplanation = 'Lean composition. Females require sufficient essential fats to preserve natural reproductive endocrine health and skeletal strength.';
      bfTips = [
        'Prioritize high-value dietary fats like avocados, walnuts, eggs, and nut butters.',
        'Ensure calcium and vitamin D levels are sufficient to maintain outstanding bone density.',
        'If feeling continuous lethargy, seek a hormone baseline screen.'
      ];
    } else if (roundedBf >= 21 && roundedBf < 25) {
      bfCategory = 'Fit/Athletic';
      bfRangeText = '21.0% - 24.9%';
      bfExplanation = 'Highly conditioned composition. This level displays peak wellness, stellar physical capacities, and excellent muscular recovery.';
      bfTips = [
        'Support your recovery with sufficient amino acids from complete proteins.',
        'Keep stress markers low by introducing relaxing practices like restorative yoga or nature walks.',
        'Keep a steady training split with plenty of rest days built in.'
      ];
    } else if (roundedBf >= 25 && roundedBf < 32) {
      bfCategory = 'Average';
      bfRangeText = '25.0% - 31.9%';
      bfExplanation = 'A healthy balanced range with ideal energy retention and absolute physiological buffer. Very easy to sustain over decades.';
      bfTips = [
        'Vary your athletic actions: cycle, swim, hike, lift, or dance to engage all tissues.',
        'Incorporate fiber-rich foods like oats, apples, beans, and broccoli.',
        'Drink sufficient pure water to keep the skin glowing and promote nutrient transport.'
      ];
    } else {
      bfCategory = 'High Range';
      bfRangeText = '32.0% or higher';
      bfExplanation = 'Elevated overall storage. Introducing simple nutritious habits will slowly align body fat into an optimal, highly active range.';
      bfTips = [
        'Prioritize non-exercise physical movement (NEAT) such as cleaning, gardening, or walking.',
        'Shift carbohydrate intake to whole fibers, reducing processed options.',
        'Undertake resistance movements (free weights or bands) to amplify resting energy expenditure.'
      ];
    }
  }

  // 3. Basal Metabolic Rate (BMR) - Mifflin-St Jeor Equation
  let bmrValue = 0;
  if (gender === 'male') {
    bmrValue = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    bmrValue = (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }
  const roundedBmr = Math.round(bmrValue);
  
  const bmrExplanation = `This represents the absolute baseline energy (${roundedBmr} kcal) your vital organs require to function if you were completely resting in bed all day. Never restrict your general food intake below this number, as it can disrupt core biological systems and reduce hormonal activity.`;
  const bmrTips = [
    'View BMR as your absolute protective floor, not a ceiling to avoid.',
    'Fueling above your BMR prevents muscle wasting and long-term metabolic slowdown.',
    'Eating enough food keeps your thyroid and mental cognitive capacities operating beautifully.'
  ];

  // 4. Total Daily Energy Expenditure (TDEE)
  const activityFactors = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9
  };
  const factor = activityFactors[activityLevel] || 1.2;
  const tdeeValue = roundedBmr * factor;
  const roundedTdee = Math.round(tdeeValue);
  
  // Adjust recommendation energy intake tips based on goals
  let tdeeExplanation = '';
  let tdeeTips: string[] = [];
  
  if (goal === 'lose_fat') {
    const calorieTarget = Math.round(roundedTdee - 350);
    tdeeExplanation = `Your maintenance speed is estimated around ${roundedTdee} kcal. To gently reduce fat tissue without causing metabolic shock, your proposed daily wellness energy target is roughly ${calorieTarget} kcal. Keep it highly nutritious and nutrient-dense.`;
    tdeeTips = [
      'Maintain a modest calorie subtraction of 300 to 400 kcal below maintenance.',
      'Prioritize protein in every meal to preserve strength tissue and control satiety.',
      'Enjoy plentiful fiber (leafy greens, whole vegetables) for digestive health.',
      'Do not starve; sustainable body composition shifts take patience and kindness.'
    ];
  } else if (goal === 'build_muscle') {
    const calorieTarget = Math.round(roundedTdee + 300);
    tdeeExplanation = `To support building active muscle tissue and optimize physical repair, a gentle calorie addition is perfect. Your proposed muscle-building energy requirement is roughly ${calorieTarget} kcal.`;
    tdeeTips = [
      'Consume a supportive excess of 200 to 400 kcal over maintenance values.',
      'Aim for regular protein consumption spaced comfortably throughout your active day.',
      'Support intensive sessions with complex complex-carbohydrates (sweet potatoes, rice).',
      'Provide ample relaxation windows for your skeletal muscle cells to reform.'
    ];
  } else if (goal === 'improve_health') {
    tdeeExplanation = `To maintain beautiful cellular health and maximize energy, focus entirely on eating exactly at your maintenance levels (${roundedTdee} kcal) using premium whole foods, prioritizing physical stamina and peak cognitive focus.`;
    tdeeTips = [
      'Eat balanced energy amounts to match your daily activity requirements closely.',
      'Focus the menu on organic greens, essential omega oils, and wholesome complex carbohydrates.',
      'Introduce probiotic ferments (kefir, Greek yogurt, kimchi) for vibrant gut wellness.',
      'Vary your overall calorie sources with healthy fats and lean amino profiles.'
    ];
  } else {
    // Maintain weight
    tdeeExplanation = `To keep your active mass perfectly stable, target your maintenance calories of ${roundedTdee} kcal with simple portions and varied activity levels.`;
    tdeeTips = [
      'Consume around maintenance energy without stress or continuous counting.',
      'Listen to intuitive body markers of hunger and fullness.',
      'Maintain reliable workout practices to preserve dynamic bone and muscle integrity.'
    ];
  }

  // 5. Waist-to-Height Ratio (WHtR)
  let waistToHeightResult = undefined;
  if (waist) {
    const ratio = waist / height;
    const roundedRatio = Math.round(ratio * 100) / 100;
    
    let wCategory = '';
    let wRangeText = '';
    let wExplanation = '';
    let wTips: string[] = [];
    let wRanges: MetricRange[] = [];
    
    if (gender === 'male') {
      wRanges = [
        { label: 'Slim', min: 0, max: 0.42, color: '#38bdf8', description: 'Extremely lean profile.' },
        { label: 'Healthy', min: 0.43, max: 0.52, color: '#4ade80', description: 'Optimal fat distribution.' },
        { label: 'Overweight', min: 0.53, max: 0.57, color: '#facc15', description: 'Elevated lipid accumulation at the midsection.' },
        { label: 'High Risk', min: 0.58, max: 2.0, color: '#f87171', description: 'Elevated visceral fat risk factors.' }
      ];
      
      if (roundedRatio < 0.43) {
        wCategory = 'Slim';
        wRangeText = 'Less than 0.43';
        wExplanation = 'Your visceral abdominal fat markers are slim. Keep feeding your metabolism with abundant variety and physical compound training.';
        wTips = ['Enjoy abundant micronutrients.', 'Confirm you are building functional core integrity via full-body activities.'];
      } else if (roundedRatio >= 0.43 && roundedRatio < 0.53) {
        wCategory = 'Healthy';
        wRangeText = '0.43 - 0.52';
        wExplanation = 'Ideal waist-to-height balance. Highly supportive of cardiovascular wellness and low systemic abdominal organ stress.';
        wTips = ['Maintain your standard healthy habits.', 'Include planks and standard core support movements in your workouts.'];
      } else if (roundedRatio >= 0.53 && roundedRatio < 0.58) {
        wCategory = 'Overweight';
        wRangeText = '0.53 - 0.57';
        wExplanation = 'Moderate level of abdominal fat storage. Gradually focusing on nutritious steps and basic aerobics will benefit your cardiovascular metrics.';
        wTips = ['Reduce sugar-sweetened beverages.', 'Try moderately intensive interval cardio to support fat regulation.'];
      } else {
        wCategory = 'High Risk';
        wRangeText = '0.58 or higher';
        wExplanation = 'Increased abdominal lipid density. This shape is linked with higher cardiac workload. Sound wellness focus can improve this steadily.';
        wTips = ['Work to lower processed sodium and sugary simple syrups.', 'Perform non-jarring daily exercises.', 'Explore professional fitness tracking with your doctor.'];
      }
    } else {
      // Female
      wRanges = [
        { label: 'Slim', min: 0, max: 0.41, color: '#38bdf8', description: 'Extremely lean midsection.' },
        { label: 'Healthy', min: 0.42, max: 0.48, color: '#4ade80', description: 'Optimal abdominal lipid distribution.' },
        { label: 'Overweight', min: 0.49, max: 0.53, color: '#facc15', description: 'Elevated core storage indicators.' },
        { label: 'High Risk', min: 0.54, max: 2.0, color: '#f87171', description: 'Higher visceral accumulation.' }
      ];
      
      if (roundedRatio < 0.42) {
        wCategory = 'Slim';
        wRangeText = 'Less than 0.42';
        wExplanation = 'Your midsection measurements are slim. Sustainable and supportive.';
        wTips = ['Incorporate ample nourishing fats.', 'Maintain natural physical power levels.'];
      } else if (roundedRatio >= 0.42 && roundedRatio < 0.49) {
        wCategory = 'Healthy';
        wRangeText = '0.42 - 0.48';
        wExplanation = 'Excellent abdominal lipid balance. Very low cardiovascular risk markers, highly supportive of general dynamic wellness.';
        wTips = ['Practice mindful recovery and clean hydration.', 'Include core stabilizing workouts like yoga or Pilates.'];
      } else if (roundedRatio >= 0.49 && roundedRatio < 0.54) {
        wCategory = 'Overweight';
        wRangeText = '0.49 - 0.53';
        wExplanation = 'Increasing visceral fat distribution. Introducing standard resistance drills and brisk walking intervals will bring this to balance.';
        wTips = ['Increase soluble fiber from oats, flaxseeds, and greens.', 'Integrate basic strength weights twice weekly.'];
      } else {
        wCategory = 'High Risk';
        wRangeText = '0.54 or higher';
        wExplanation = 'Your abdominal waist indicates visceral weight density. Improving structural aerobic conditioning and dietary fiber will yield major cardioprotective success.';
        wTips = ['Integrate 30-minute daily walking rituals.', 'Reduce processed fast foods and optimize portion structure.', 'Consult a supportive healthcare guide.'];
      }
    }
    
    waistToHeightResult = {
      value: roundedRatio,
      category: wCategory,
      rangeText: wRangeText,
      ranges: wRanges,
      explanation: wExplanation,
      tips: wTips
    };
  }

  // 6. Healthy Weight Range based on healthy BMI boundaries (18.5 to 24.9)
  const minWeight = Math.round(18.5 * heightM * heightM * 10) / 10;
  const maxWeight = Math.round(24.9 * heightM * heightM * 10) / 10;
  
  let rangeMin = minWeight;
  let rangeMax = maxWeight;
  let displayUnit = 'kg';
  
  if (unitSystem === 'imperial') {
    rangeMin = Math.round(minWeight * 2.20462);
    rangeMax = Math.round(maxWeight * 2.20462);
    displayUnit = 'lbs';
  }

  // 7. Ideal Body Weight Calculations (Devine & Robinson Equations)
  const htInches = height / 2.54;
  const inchesOver5ft = Math.max(0, htInches - 60);
  let devineIbw = 0;
  let robinsonIbw = 0;
  
  if (gender === 'male') {
    devineIbw = 50.0 + (2.3 * inchesOver5ft);
    robinsonIbw = 52.0 + (1.9 * inchesOver5ft);
  } else {
    devineIbw = 45.5 + (2.3 * inchesOver5ft);
    robinsonIbw = 49.0 + (1.7 * inchesOver5ft);
  }

  let finalDevine = Math.round(devineIbw * 10) / 10;
  let finalRobinson = Math.round(robinsonIbw * 10) / 10;

  if (unitSystem === 'imperial') {
    finalDevine = Math.round(devineIbw * 2.20462);
    finalRobinson = Math.round(robinsonIbw * 2.20462);
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    profile,
    bmi: {
      value: roundedBmi,
      category: bmiCategory,
      rangeText: bmiRangeText,
      ranges: bmiRanges,
      explanation: bmiExplanation,
      tips: bmiTips
    },
    bodyFat: {
      value: roundedBf,
      category: bfCategory,
      rangeText: bfRangeText,
      ranges: bfRanges,
      explanation: bfExplanation,
      tips: bfTips
    },
    bmr: {
      value: roundedBmr,
      explanation: bmrExplanation,
      tips: bmrTips
    },
    tdee: {
      value: roundedTdee,
      explanation: tdeeExplanation,
      tips: tdeeTips
    },
    waistToHeight: waistToHeightResult,
    healthyWeightRange: {
      min: rangeMin,
      max: rangeMax,
      unit: displayUnit
    },
    idealWeight: {
      devine: finalDevine,
      robinson: finalRobinson,
      unit: displayUnit
    }
  };
}

// Height Estimation Models & Calculations
export interface HeightEstimationInputs {
  method: 'armSpan' | 'kneeHeight' | 'ulnaLength';
  gender: 'male' | 'female';
  age: number;
  armSpan?: number; // in cm
  kneeHeight?: number; // in cm
  ulnaLength?: number; // in cm
}

export function estimateHeight(inputs: HeightEstimationInputs): number {
  const { method, gender, age, armSpan, kneeHeight, ulnaLength } = inputs;
  let estimatedHeightCm = 170; // baseline fallback

  if (method === 'armSpan' && armSpan) {
    estimatedHeightCm = armSpan;
  } else if (method === 'kneeHeight' && kneeHeight) {
    if (gender === 'male') {
      estimatedHeightCm = 64.19 - (0.04 * age) + (2.02 * kneeHeight);
    } else {
      estimatedHeightCm = 70.25 - (0.08 * age) + (1.86 * kneeHeight);
    }
  } else if (method === 'ulnaLength' && ulnaLength) {
    if (gender === 'male') {
      if (age < 65) {
        estimatedHeightCm = (3.7 * ulnaLength) + 74;
      } else {
        estimatedHeightCm = (3.2 * ulnaLength) + 85;
      }
    } else {
      if (age < 65) {
        estimatedHeightCm = (3.5 * ulnaLength) + 80.5;
      } else {
        estimatedHeightCm = (3.3 * ulnaLength) + 84;
      }
    }
  }

  return Math.round(estimatedHeightCm * 10) / 10;
}

// Weight Estimation Models & Calculations
export interface WeightEstimationInputs {
  method: 'targetBmi' | 'anthropometric';
  gender: 'male' | 'female';
  heightCm: number; // base height in cm required
  targetBmi?: number;
  muac?: number; // Mid-Upper Arm Circumference (cm)
  calfCirc?: number; // Calf Circumference (cm)
  kneeHeight?: number; // Knee Height (cm)
  subscapular?: number; // Subscapular Skinfold (mm), optional
}

export function estimateWeight(inputs: WeightEstimationInputs): number {
  const { method, gender, heightCm, targetBmi, muac, calfCirc, kneeHeight, subscapular } = inputs;
  let estimatedWeightKg = 70; // baseline fallback

  if (method === 'targetBmi' && targetBmi) {
    const heightM = heightCm / 100;
    estimatedWeightKg = targetBmi * (heightM * heightM);
  } else if (method === 'anthropometric' && muac && calfCirc && kneeHeight) {
    const skinfold = subscapular && subscapular > 0 ? subscapular : 12; // default skinfold if empty
    if (gender === 'male') {
      estimatedWeightKg = (1.73 * muac) + (0.98 * calfCirc) + (0.37 * skinfold) + (1.16 * kneeHeight) - 81.69;
    } else {
      estimatedWeightKg = (0.98 * muac) + (1.27 * calfCirc) + (0.40 * skinfold) + (0.87 * kneeHeight) - 62.35;
    }
  }

  return Math.round(estimatedWeightKg * 10) / 10;
}

// Highly accurate multicriteria Ideal Weight Estimator incorporating Height, Age, and Gender
export interface IdealWeightSpecialOutput {
  devineKg: number;
  robinsonKg: number;
  millerKg: number;
  hamwiKg: number;
  ageAdjustedBmiKg: number;
  recommendedKg: number;
}

export function calculateIdealWeightSpecial(
  heightCm: number,
  age: number,
  gender: 'male' | 'female'
): IdealWeightSpecialOutput {
  const heightInches = heightCm / 2.54;
  const inchesOver5ft = Math.max(0, heightInches - 60);

  // 1. Devine Equation (1974)
  let devineKg = 0;
  if (gender === 'male') {
    devineKg = 50.0 + (2.3 * inchesOver5ft);
  } else {
    devineKg = 45.5 + (2.3 * inchesOver5ft);
  }

  // 2. Robinson Equation (1983)
  let robinsonKg = 0;
  if (gender === 'male') {
    robinsonKg = 52.0 + (1.9 * inchesOver5ft);
  } else {
    robinsonKg = 49.0 + (1.7 * inchesOver5ft);
  }

  // 3. Miller Equation (1983)
  let millerKg = 0;
  if (gender === 'male') {
    millerKg = 56.2 + (1.41 * inchesOver5ft);
  } else {
    millerKg = 53.1 + (1.36 * inchesOver5ft);
  }

  // 4. Hamwi Equation (1964)
  let hamwiKg = 0;
  if (gender === 'male') {
    hamwiKg = 48.0 + (2.7 * inchesOver5ft);
  } else {
    hamwiKg = 45.5 + (2.2 * inchesOver5ft);
  }

  // 5. Age-Adjusted Healthy BMI Target (Dynamic metabolic reserve adjusted for age decades)
  // Studies show that a slightly higher BMI target is highly beneficial for longevity as age increases.
  let targetBmi = 21.7; // Baseline healthy target
  if (age < 18) {
    targetBmi = gender === 'male' ? 20.2 : 19.6;
  } else if (age >= 18 && age <= 24) {
    targetBmi = gender === 'male' ? 21.4 : 20.8;
  } else if (age >= 25 && age <= 34) {
    targetBmi = gender === 'male' ? 22.0 : 21.4;
  } else if (age >= 35 && age <= 44) {
    targetBmi = gender === 'male' ? 22.6 : 22.0;
  } else if (age >= 45 && age <= 54) {
    targetBmi = gender === 'male' ? 23.2 : 22.6;
  } else if (age >= 55 && age <= 64) {
    targetBmi = gender === 'male' ? 23.8 : 23.2;
  } else { // age >= 65 (vital metabolic reserve/bone protection)
    targetBmi = gender === 'male' ? 24.5 : 23.9;
  }

  const heightM = heightCm / 100;
  const ageAdjustedBmiKg = targetBmi * (heightM * heightM);

  // Blend Recommended weight dynamically:
  // - Younger adults rely confidently on classic Devine/Robinson formulas.
  // - Adults over 40 gradually benefit from slightly higher metabolic reserve weights.
  let recommendedKg = devineKg;
  if (age < 40) {
    // Balanced blend of modern medical standards
    recommendedKg = (devineKg + robinsonKg + millerKg) / 3;
  } else {
    // Dynamic age-adjusted blending
    const bmiWeight = Math.min(0.85, 0.3 + (age - 40) * 0.02);
    recommendedKg = (devineKg * (1 - bmiWeight)) + (ageAdjustedBmiKg * bmiWeight);
  }

  return {
    devineKg: Math.round(devineKg * 10) / 10,
    robinsonKg: Math.round(robinsonKg * 10) / 10,
    millerKg: Math.round(millerKg * 10) / 10,
    hamwiKg: Math.round(hamwiKg * 10) / 10,
    ageAdjustedBmiKg: Math.round(ageAdjustedBmiKg * 10) / 10,
    recommendedKg: Math.round(recommendedKg * 10) / 10
  };
}

