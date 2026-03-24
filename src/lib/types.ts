export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  age: number | null;
  gender: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  bmi: number | null;
  goal: "cut" | "bulk" | "recomp" | "maintain" | null;
  diet_type: string | null;
  calorie_target: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  training_philosophy: string | null;
  onboarded: boolean;
  created_at: string;
}

export interface Meal {
  id: string;
  user_id: string;
  photo_url: string | null;
  name: string;
  description: string | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  logged_at: string;
  created_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  notes: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  exercises: Exercise[];
}

export interface Exercise {
  id: string;
  workout_id: string;
  name: string;
  order_index: number;
  sets: ExerciseSet[];
}

export interface ExerciseSet {
  id: string;
  exercise_id: string;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  rpe: number | null;
  completed: boolean;
}

export interface Program {
  id: string;
  user_id: string;
  name: string;
  philosophy: string;
  weeks: number;
  days_per_week: number;
  program_data: ProgramWeek[];
  active: boolean;
  created_at: string;
}

export interface ProgramWeek {
  week: number;
  days: ProgramDay[];
}

export interface ProgramDay {
  day: number;
  name: string;
  exercises: ProgramExercise[];
}

export interface ProgramExercise {
  name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes?: string;
}

export interface DietPlan {
  id: string;
  user_id: string;
  name: string;
  diet_type: string;
  calorie_target: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  meals_per_day: number;
  plan_data: DietDay[];
  active: boolean;
  created_at: string;
}

export interface DietDay {
  day: string;
  meals: DietMeal[];
}

export interface DietMeal {
  name: string;
  foods: string[];
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface ProgressEntry {
  id: string;
  user_id: string;
  photo_url: string | null;
  weight_kg: number | null;
  body_fat_pct: number | null;
  notes: string | null;
  logged_at: string;
  created_at: string;
}
