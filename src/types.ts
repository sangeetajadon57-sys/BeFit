export type Gender = 'male' | 'female';
export type UnitSystem = 'metric' | 'imperial';
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
export type FitnessGoal = 'lose_fat' | 'maintain' | 'build_muscle' | 'improve_health';

export interface UserProfile {
  age: number;
  gender: Gender;
  height: number; // in cm
  weight: number; // in kg
  waist?: number;  // in cm
  activityLevel: ActivityLevel;
  goal: FitnessGoal;
  unitSystem: UnitSystem;
}

export interface MetricRange {
  label: string;
  min: number;
  max: number;
  color: string; // Tailwind color class or hex
  description: string;
}

export interface CalculationResult {
  id: string;
  timestamp: string;
  profile: UserProfile;
  bmi: {
    value: number;
    category: string;
    rangeText: string;
    ranges: MetricRange[];
    explanation: string;
    tips: string[];
  };
  bodyFat?: {
    value: number;
    category: string;
    rangeText: string;
    ranges: MetricRange[];
    explanation: string;
    tips: string[];
  };
  bmr: {
    value: number;
    explanation: string;
    tips: string[];
  };
  tdee: {
    value: number;
    explanation: string;
    tips: string[];
  };
  waistToHeight?: {
    value: number;
    category: string;
    rangeText: string;
    ranges: MetricRange[];
    explanation: string;
    tips: string[];
  };
  healthyWeightRange: {
    min: number;
    max: number;
    unit: string;
  };
  idealWeight?: {
    devine: number;
    robinson: number;
    unit: string;
  };
}

export interface FoodScanResult {
  isFood: boolean;
  detectedFoodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portionEstimate: string;
  confidenceScore: number;
  suggestions: string[];
  rejectedReason?: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
