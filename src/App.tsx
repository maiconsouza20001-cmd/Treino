import React, { useState, useEffect, useMemo } from "react";
import { 
  Dumbbell, 
  Trophy, 
  User, 
  Calendar, 
  Play, 
  CheckCircle2, 
  ChevronRight, 
  Plus, 
  Search, 
  Flame, 
  TrendingUp,
  LogOut,
  Info,
  Timer,
  ChevronLeft,
  Settings,
  Users,
  Github
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI } from "@google/genai";
import { 
  onAuthStateChanged, 
  User as FirebaseUser 
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  getDocs,
  writeBatch
} from "firebase/firestore";
import { auth, db, signInWithGoogle, logout } from "./firebase";
import { cn } from "./lib/utils";
import { 
  UserProfile, 
  WorkoutPlan, 
  Exercise, 
  WorkoutSession, 
  WorkoutDay,
  UserRole
} from "./types";
import { EXERCISES_SEED } from "./constants";

// --- Components ---

const Button = ({ 
  children, 
  className, 
  variant = "primary", 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "outline" | "ghost" }) => {
  const variants = {
    primary: "bg-[#00FF88] text-black hover:bg-[#00E67A]",
    secondary: "bg-zinc-800 text-white hover:bg-zinc-700",
    outline: "border border-[#00FF88] text-[#00FF88] hover:bg-[#00FF88]/10",
    ghost: "text-zinc-400 hover:text-white hover:bg-zinc-800"
  };
  
  return (
    <button 
      className={cn(
        "px-4 py-2 rounded-xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-2",
        "disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed disabled:active:scale-100",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={cn("bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4", className)}
  >
    {children}
  </div>
);

const ProgressBar = ({ progress, color = "#00FF88" }: { progress: number; color?: string }) => (
  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
    <motion.div 
      initial={{ width: 0 }}
      animate={{ width: `${Math.min(100, progress)}%` }}
      className="h-full"
      style={{ backgroundColor: color }}
    />
  </div>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"home" | "workouts" | "exercises" | "profile" | "admin">("home");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutPlan | null>(null);
  const [activeWorkoutDay, setActiveWorkoutDay] = useState<WorkoutDay | null>(null);
  const [workoutStatus, setWorkoutStatus] = useState<"idle" | "playing" | "completed">("idle");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [githubToken, setGithubToken] = useState<string | null>(localStorage.getItem("github_token"));
  const [githubUser, setGithubUser] = useState<any | null>(null);

  // GitHub OAuth Listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GITHUB_AUTH_SUCCESS') {
        const token = event.data.token;
        setGithubToken(token);
        localStorage.setItem("github_token", token);
        fetchGitHubUser(token);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (githubToken) {
      fetchGitHubUser(githubToken);
    }
  }, [githubToken]);

  const fetchGitHubUser = async (token: string) => {
    try {
      const response = await fetch("/api/github/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setGithubUser(data);
      } else {
        // Token might be invalid
        setGithubToken(null);
        localStorage.removeItem("github_token");
      }
    } catch (error) {
      console.error("Error fetching GitHub user:", error);
    }
  };

  const connectGitHub = async () => {
    try {
      const response = await fetch("/api/auth/github/url");
      const { url } = await response.json();
      window.open(url, "github_oauth", "width=600,height=700");
    } catch (error) {
      console.error("Error connecting to GitHub:", error);
    }
  };

  const disconnectGitHub = () => {
    setGithubToken(null);
    setGithubUser(null);
    localStorage.removeItem("github_token");
  };

  // Auth & Profile Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        } else {
          // New user setup
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            displayName: firebaseUser.displayName || "Atleta",
            photoURL: firebaseUser.photoURL || "",
            role: "aluno",
            xp: 0,
            level: 1,
            streak: 0,
          };
          await setDoc(doc(db, "users", firebaseUser.uid), newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Exercises Listener & Seeder
  useEffect(() => {
    const q = query(collection(db, "exercises"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const exList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exercise));
      setExercises(exList);
      
      // Seed if empty
      if (exList.length === 0 && profile?.role === "personal") {
        seedExercises();
      }
    });

    return () => unsubscribe();
  }, [profile]);

  // Current Workout Listener
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "workouts"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const latest = snapshot.docs.sort((a, b) => b.data().createdAt.localeCompare(a.data().createdAt))[0];
        setCurrentWorkout({ id: latest.id, ...latest.data() } as WorkoutPlan);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => 
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [exercises, searchQuery]);

  const currentExerciseIndex = useMemo(() => {
    if (!selectedExercise) return -1;
    return filteredExercises.findIndex(ex => ex.id === selectedExercise.id);
  }, [selectedExercise, filteredExercises]);

  const goToNextExercise = () => {
    if (currentExerciseIndex < filteredExercises.length - 1) {
      setSelectedExercise(filteredExercises[currentExerciseIndex + 1]);
    }
  };

  const goToPrevExercise = () => {
    if (currentExerciseIndex > 0) {
      setSelectedExercise(filteredExercises[currentExerciseIndex - 1]);
    }
  };

  const seedExercises = async () => {
    const batch = writeBatch(db);
    EXERCISES_SEED.forEach((ex) => {
      const newDoc = doc(collection(db, "exercises"));
      batch.set(newDoc, ex);
    });
    await batch.commit();
  };

  const handleGenerateWorkout = async (formData: any) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured in the environment.");
      }

      const ai = new GoogleGenAI({ apiKey });
      const { peso, altura, idade, objetivo, nivel, frequencia } = formData;

      const prompt = `Crie um treino de academia completo e eficiente baseado nos dados do usuário. 
      Dados: Peso: ${peso}kg, Altura: ${altura}cm, Idade: ${idade} anos, Objetivo: ${objetivo}, Nível: ${nivel}, Frequência: ${frequencia} dias por semana.
      Use divisão inteligente (AB, ABC ou Full Body). Inclua exercícios reais, séries, repetições e descanso. Foque em progressão e segurança.
      
      RETORNE APENAS O JSON NO FORMATO:
      {
        "divisao": "ABC",
        "treinos": [
          {
            "dia": "A",
            "grupo": "Peito + Triceps",
            "exercicios": [
              {
                "nome": "Supino reto",
                "series": 4,
                "reps": "8-12",
                "descanso": 60
              }
            ]
          }
        ]
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      let text = response.text;
      if (!text) throw new Error("AI returned empty response");

      // Clean up potential markdown formatting
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const data = JSON.parse(text);
      
      const workoutPlan: WorkoutPlan = {
        userId: user!.uid,
        division: data.divisao || data.division || "Personalizado",
        createdAt: new Date().toISOString(),
        treinos: data.treinos || []
      };
      
      await addDoc(collection(db, "workouts"), workoutPlan);
      alert("Treino gerado com sucesso!");
    } catch (error) {
      console.error("Error generating workout:", error);
      alert("Erro ao gerar treino. Verifique o console para mais detalhes.");
    }
  };

  const completeWorkout = async (day: WorkoutDay) => {
    if (!user || !profile) return;
    
    const xpEarned = 50;
    const newXp = profile.xp + xpEarned;
    const newLevel = Math.floor(newXp / 500) + 1;
    
    const today = new Date().toISOString().split('T')[0];
    const isConsecutive = profile.lastWorkoutDate === new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const newStreak = isConsecutive ? profile.streak + 1 : 1;

    await updateDoc(doc(db, "users", user.uid), {
      xp: newXp,
      level: newLevel,
      streak: newStreak,
      lastWorkoutDate: today
    });

    await addDoc(collection(db, "workout_sessions"), {
      userId: user.uid,
      workoutId: currentWorkout?.id,
      day: day.dia,
      completedAt: new Date().toISOString(),
      xpEarned
    });

    setWorkoutStatus("completed");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Dumbbell className="w-12 h-12 text-[#00FF88]" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-8"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-[#00FF88]/10 rounded-3xl flex items-center justify-center">
              <Dumbbell className="w-10 h-10 text-[#00FF88]" />
            </div>
            <h1 className="text-4xl font-bold tracking-tighter">FitAI <span className="text-[#00FF88]">Pro</span></h1>
            <p className="text-zinc-400">Treinos inteligentes gerados por IA. Evolua com tecnologia.</p>
          </div>
          
          <Button onClick={signInWithGoogle} className="w-full h-14 text-lg">
            Começar Agora
          </Button>
          
          <p className="text-xs text-zinc-500">Ao entrar, você concorda com nossos termos de uso.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white pb-24">
      {/* Header */}
      <header className="p-6 flex items-center justify-between sticky top-0 bg-[#0B0B0B]/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#00FF88]">
            <img src={profile?.photoURL} alt="Avatar" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-zinc-400">Olá, {profile?.displayName.split(' ')[0]}</h2>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
              <span className="text-xs font-bold">{profile?.streak} dias de streak</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-zinc-900 px-3 py-1 rounded-full flex items-center gap-2 border border-zinc-800">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-bold">Nível {profile?.level}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-2xl mx-auto space-y-8">
        <AnimatePresence mode="wait">
          {activeTab === "home" && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <Card className="bg-gradient-to-br from-[#00FF88]/20 to-transparent border-[#00FF88]/20">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold">Progresso do Nível</h3>
                    <p className="text-sm text-zinc-400">{profile?.xp % 500} / 500 XP para o Nível {profile!.level + 1}</p>
                  </div>
                  <TrendingUp className="text-[#00FF88]" />
                </div>
                <ProgressBar progress={(profile!.xp % 500) / 5} />
              </Card>

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Treino de Hoje</h3>
                  <Calendar className="w-5 h-5 text-zinc-500" />
                </div>
                
                {currentWorkout ? (
                  <div className="space-y-4">
                    {currentWorkout.treinos.map((day, idx) => (
                      <Card key={idx} className="flex items-center justify-between group cursor-pointer hover:border-[#00FF88]/50" onClick={() => {
                        setActiveWorkoutDay(day);
                        setWorkoutStatus("playing");
                      }}>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-[#00FF88] font-bold">
                            {day.dia}
                          </div>
                          <div>
                            <h4 className="font-bold">{day.grupo}</h4>
                            <p className="text-xs text-zinc-500">{day.exercicios.length} exercícios</p>
                          </div>
                        </div>
                        <Play className="w-5 h-5 text-zinc-500 group-hover:text-[#00FF88]" />
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
                      <Plus className="w-8 h-8 text-zinc-500" />
                    </div>
                    <div>
                      <h4 className="font-bold">Nenhum treino ativo</h4>
                      <p className="text-sm text-zinc-500">Gere um novo treino com nossa IA.</p>
                    </div>
                    <Button onClick={() => setActiveTab("workouts")} variant="outline">
                      Gerar Treino
                    </Button>
                  </Card>
                )}
              </section>
            </motion.div>
          )}

          {activeTab === "workouts" && (
            <motion.div 
              key="workouts"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold">Gerador de Treino IA</h2>
              <form 
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleGenerateWorkout(Object.fromEntries(formData));
                }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase font-bold">Peso (kg)</label>
                    <input name="peso" type="number" defaultValue={profile?.weight || 70} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 focus:border-[#00FF88] outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase font-bold">Altura (cm)</label>
                    <input name="altura" type="number" defaultValue={profile?.height || 175} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 focus:border-[#00FF88] outline-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase font-bold">Objetivo</label>
                  <select name="objetivo" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 focus:border-[#00FF88] outline-none">
                    <option value="hipertrofia">Hipertrofia</option>
                    <option value="emagrecimento">Emagrecimento</option>
                    <option value="resistencia">Resistência</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase font-bold">Nível</label>
                  <select name="nivel" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 focus:border-[#00FF88] outline-none">
                    <option value="iniciante">Iniciante</option>
                    <option value="intermediario">Intermediário</option>
                    <option value="avancado">Avançado</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase font-bold">Frequência (dias/semana)</label>
                  <input name="frequencia" type="number" defaultValue={3} min={1} max={7} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 focus:border-[#00FF88] outline-none" />
                </div>
                <Button type="submit" className="w-full h-14">
                  Gerar Treino com IA
                </Button>
              </form>
            </motion.div>
          )}

          {activeTab === "exercises" && (
            <motion.div 
              key="exercises"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Biblioteca</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input 
                    placeholder="Buscar exercício..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded-full pl-10 pr-4 py-2 text-sm focus:border-[#00FF88] outline-none"
                  />
                </div>
              </div>
              
              <div className="grid gap-4">
                {filteredExercises.map((ex) => (
                  <Card 
                    key={ex.id} 
                    className="flex gap-4 cursor-pointer hover:border-[#00FF88]/30 transition-colors"
                    onClick={() => setSelectedExercise(ex)}
                  >
                    <div className="w-20 h-20 bg-zinc-800 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Dumbbell className="text-zinc-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold">{ex.name}</h4>
                      <p className="text-xs text-zinc-500 mb-2">{ex.muscleGroup} • {ex.equipment}</p>
                      <div className="flex gap-2">
                        <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded uppercase font-bold text-zinc-400">{ex.difficulty}</span>
                      </div>
                    </div>
                    <div className="self-center p-2 text-zinc-500 hover:text-[#00FF88]">
                      <Info className="w-5 h-5" />
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "profile" && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#00FF88]">
                    <img src={profile?.photoURL} alt="Avatar" referrerPolicy="no-referrer" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-[#00FF88] text-black w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs">
                    {profile?.level}
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{profile?.displayName}</h2>
                  <p className="text-zinc-500">{profile?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="text-center">
                  <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                  <div className="text-xl font-bold">{profile?.streak}</div>
                  <div className="text-[10px] uppercase text-zinc-500 font-bold">Streak</div>
                </Card>
                <Card className="text-center">
                  <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                  <div className="text-xl font-bold">{profile?.xp}</div>
                  <div className="text-[10px] uppercase text-zinc-500 font-bold">Total XP</div>
                </Card>
              </div>

              <div className="space-y-4">
                <Button variant="secondary" className="w-full justify-start" onClick={() => {
                  if (profile?.role === "aluno") {
                    updateDoc(doc(db, "users", user.uid), { role: "personal" });
                  } else {
                    updateDoc(doc(db, "users", user.uid), { role: "aluno" });
                  }
                }}>
                  <Settings className="w-5 h-5" />
                  Mudar para Modo {profile?.role === "aluno" ? "Personal" : "Aluno"}
                </Button>

                {githubUser ? (
                  <Card className="flex items-center gap-4 p-3 bg-zinc-900/80 border-[#00FF88]/20">
                    <img src={githubUser.avatar_url} alt="GitHub Avatar" className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <div className="text-sm font-bold">{githubUser.name || githubUser.login}</div>
                      <div className="text-[10px] text-zinc-500 uppercase font-bold">GitHub Conectado</div>
                    </div>
                    <Button variant="ghost" className="h-8 px-2 text-[10px]" onClick={disconnectGitHub}>
                      Desconectar
                    </Button>
                  </Card>
                ) : (
                  <Button variant="secondary" className="w-full justify-start hover:border-[#00FF88]/30" onClick={connectGitHub}>
                    <Github className="w-5 h-5" />
                    Conectar ao GitHub
                  </Button>
                )}

                <Button variant="ghost" className="w-full justify-start text-red-500 hover:bg-red-500/10" onClick={logout}>
                  <LogOut className="w-5 h-5" />
                  Sair da Conta
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Workout Player Modal */}
      <AnimatePresence>
        {workoutStatus === "playing" && activeWorkoutDay && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="fixed inset-0 bg-[#0B0B0B] z-[100] p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
              <button onClick={() => setWorkoutStatus("idle")} className="p-2 bg-zinc-900 rounded-full">
                <ChevronLeft />
              </button>
              <h3 className="font-bold">Treino {activeWorkoutDay.dia} - {activeWorkoutDay.grupo}</h3>
              <div className="w-10" />
            </div>

            <div className="flex-1 overflow-y-auto space-y-6">
              {activeWorkoutDay.exercicios.map((ex, idx) => (
                <Card key={idx} className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold">{ex.nome}</h4>
                        <button 
                          onClick={() => {
                            const fullEx = exercises.find(e => e.name === ex.nome);
                            if (fullEx) setSelectedExercise(fullEx);
                          }}
                          className="p-1 text-zinc-500 hover:text-[#00FF88]"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[#00FF88] font-bold">{ex.series} séries x {ex.reps}</p>
                    </div>
                    <div className="bg-zinc-800 px-3 py-1 rounded-lg flex items-center gap-2">
                      <Timer className="w-4 h-4 text-zinc-500" />
                      <span className="text-sm font-bold">{ex.descanso}s</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {Array.from({ length: ex.series }).map((_, sIdx) => (
                      <button 
                        key={sIdx}
                        className="flex-1 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:border-[#00FF88] transition-colors"
                      >
                        {sIdx + 1}
                      </button>
                    ))}
                  </div>
                </Card>
              ))}
            </div>

            <div className="pt-6">
              <Button className="w-full h-14" onClick={() => completeWorkout(activeWorkoutDay)}>
                Finalizar Treino (+50 XP)
              </Button>
            </div>
          </motion.div>
        )}

        {workoutStatus === "completed" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[110] flex items-center justify-center p-6 text-center"
          >
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="space-y-6"
            >
              <div className="w-24 h-24 bg-[#00FF88] rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(0,255,136,0.3)]">
                <CheckCircle2 className="w-12 h-12 text-black" />
              </div>
              <h2 className="text-3xl font-bold">Treino Concluído!</h2>
              <p className="text-zinc-400">Você ganhou 50 XP e manteve seu streak.</p>
              <Button className="w-full" onClick={() => {
                setWorkoutStatus("idle");
                setActiveTab("home");
              }}>
                Continuar
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercise Detail Modal */}
      <AnimatePresence>
        {selectedExercise && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[120] flex items-center justify-center p-6"
            onClick={() => setSelectedExercise(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-video bg-black">
                {selectedExercise.videoUrl ? (
                  <iframe 
                    src={selectedExercise.videoUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={selectedExercise.name}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-700">
                    <Play className="w-12 h-12" />
                  </div>
                )}
                <button 
                  onClick={() => setSelectedExercise(null)}
                  className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white backdrop-blur-sm"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] bg-[#00FF88]/10 text-[#00FF88] px-2 py-0.5 rounded uppercase font-bold">
                      {selectedExercise.muscleGroup}
                    </span>
                    <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase font-bold">
                      {selectedExercise.difficulty}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold">{selectedExercise.name}</h3>
                  <p className="text-sm text-zinc-500">{selectedExercise.equipment}</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold uppercase text-orange-500/80 flex items-center gap-2">
                      <Flame className="w-4 h-4" /> Aquecimento
                    </h4>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      {selectedExercise.warmup}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-bold uppercase text-zinc-400 flex items-center gap-2">
                      <Info className="w-4 h-4" /> Execução Correta
                    </h4>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      {selectedExercise.instructions}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-bold uppercase text-red-500/80 flex items-center gap-2">
                      <Plus className="w-4 h-4 rotate-45" /> Erros Comuns
                    </h4>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      {selectedExercise.commonErrors}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-zinc-800 space-y-4">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase text-zinc-500 px-1">
                  <span>Navegar Exercícios</span>
                  <span>{currentExerciseIndex + 1} de {filteredExercises.length}</span>
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="secondary" 
                    className="flex-1 h-12" 
                    onClick={goToPrevExercise}
                    disabled={currentExerciseIndex <= 0}
                  >
                    <ChevronLeft className="w-4 h-4" /> Anterior
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="flex-1 h-12" 
                    onClick={goToNextExercise}
                    disabled={currentExerciseIndex >= filteredExercises.length - 1}
                  >
                    Próximo <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <Button variant="ghost" className="w-full" onClick={() => setSelectedExercise(null)}>
                  Fechar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800 px-6 py-4 flex justify-between items-center z-40">
        <button 
          onClick={() => setActiveTab("home")}
          className={cn("flex flex-col items-center gap-1", activeTab === "home" ? "text-[#00FF88]" : "text-zinc-500")}
        >
          <Dumbbell className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Início</span>
        </button>
        <button 
          onClick={() => setActiveTab("workouts")}
          className={cn("flex flex-col items-center gap-1", activeTab === "workouts" ? "text-[#00FF88]" : "text-zinc-500")}
        >
          <Calendar className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Treinos</span>
        </button>
        <button 
          onClick={() => setActiveTab("exercises")}
          className={cn("flex flex-col items-center gap-1", activeTab === "exercises" ? "text-[#00FF88]" : "text-zinc-500")}
        >
          <Search className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Explorar</span>
        </button>
        {profile?.role === "personal" && (
          <button 
            onClick={() => setActiveTab("admin")}
            className={cn("flex flex-col items-center gap-1", activeTab === "admin" ? "text-[#00FF88]" : "text-zinc-500")}
          >
            <Users className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase">Alunos</span>
          </button>
        )}
        <button 
          onClick={() => setActiveTab("profile")}
          className={cn("flex flex-col items-center gap-1", activeTab === "profile" ? "text-[#00FF88]" : "text-zinc-500")}
        >
          <User className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Perfil</span>
        </button>
      </nav>
    </div>
  );
}
