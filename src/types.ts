export type UserRole = 'client' | 'trainer' | 'admin';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  age?: number;
  height?: number;
  weight?: number;
  targetWeight?: number;
  dailyCalorieGoal?: number;
  fitnessGoal?: 'weight_loss' | 'muscle_gain' | 'maintenance';
  gender?: 'male' | 'female' | 'other';
  trainerId?: string;
  createdAt: string;
}

export interface WorkoutPlan {
  id?: string;
  title: string;
  exercises: Exercise[];
  assignedAt: string;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  notes?: string;
}

export interface DietPlan {
  id?: string;
  title: string;
  meals: Meal[];
  totalCalories: number;
  assignedAt: string;
}

export interface Meal {
  name: string;
  calories: number;
  description?: string;
}

export interface ProgressLog {
  id?: string;
  date: string;
  weight: number;
  caloriesConsumed: number;
  workoutCompleted: boolean;
  notes?: string;
}

export interface Message {
  id?: string;
  senderId: string;
  text: string;
  timestamp: any;
}
