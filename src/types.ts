export type UserRole = "aluno" | "personal";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  xp: number;
  level: number;
  streak: number;
  lastWorkoutDate?: string;
  weight?: number;
  height?: number;
  age?: number;
  goal?: string;
  level_fitness?: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  difficulty: "iniciante" | "intermediario" | "avancado";
  videoUrl: string;
  warmup: string;
  instructions: string;
  commonErrors: string;
}

export interface WorkoutExercise {
  nome: string;
  series: number;
  reps: string;
  descanso: number;
}

export interface WorkoutDay {
  dia: string;
  grupo: string;
  exercicios: WorkoutExercise[];
}

export interface WorkoutPlan {
  id?: string;
  userId: string;
  division: string;
  createdAt: string;
  treinos: WorkoutDay[];
}

export interface WorkoutSession {
  id?: string;
  userId: string;
  workoutId: string;
  day: string;
  completedAt: string;
  xpEarned: number;
}
