import { Exercise } from "./types";

export const EXERCISES_SEED: Partial<Exercise>[] = [
  // PEITO
  {
    name: "Supino Reto com Barra",
    muscleGroup: "Peito",
    equipment: "Barra",
    difficulty: "intermediario",
    videoUrl: "https://www.youtube.com/embed/rT7DgCr-3pg",
    warmup: "Faça 1-2 séries de 15-20 repetições com a barra vazia para lubrificar as articulações dos ombros e cotovelos.",
    instructions: "Deite no banco, segure a barra com pegada média. Desça até o peito e empurre.",
    commonErrors: "Bater a barra no peito, tirar as costas do banco."
  },
  {
    name: "Supino Inclinado com Halteres",
    muscleGroup: "Peito",
    equipment: "Halteres",
    difficulty: "intermediario",
    videoUrl: "https://www.youtube.com/embed/8iPEnn-ltC8",
    warmup: "Realize movimentos circulares com os braços e 1 série leve com halteres de baixo peso.",
    instructions: "Banco a 45 graus. Empurre os halteres para cima e desça controladamente.",
    commonErrors: "Ângulo do banco muito alto, descida muito rápida."
  },
  {
    name: "Crucifixo Reto",
    muscleGroup: "Peito",
    equipment: "Halteres",
    difficulty: "iniciante",
    videoUrl: "https://www.youtube.com/embed/eGjt4lk6g34",
    warmup: "Alongamento dinâmico leve para o peitoral e 1 série com peso mínimo.",
    instructions: "Abra os braços lateralmente com leve flexão nos cotovelos.",
    commonErrors: "Bater os halteres no topo, esticar demais os braços."
  },
  {
    name: "Crossover Polia Alta",
    muscleGroup: "Peito",
    equipment: "Polia",
    difficulty: "intermediario",
    videoUrl: "https://www.youtube.com/embed/W7S_vV7v_fM",
    warmup: "1 série de 20 repetições com carga mínima para sentir a contração muscular.",
    instructions: "Puxe os cabos de cima para baixo, cruzando as mãos na frente.",
    commonErrors: "Usar o peso do corpo, não controlar a volta."
  },
  // COSTAS
  {
    name: "Puxada Frontal Aberta",
    muscleGroup: "Costas",
    equipment: "Polia",
    difficulty: "iniciante",
    videoUrl: "https://www.youtube.com/embed/CAwf7n6Luuc",
    warmup: "Escápulas: faça movimentos de retração e depressão sem puxar o peso totalmente.",
    instructions: "Puxe a barra em direção ao peito, mantendo o tronco levemente inclinado.",
    commonErrors: "Puxar atrás da nuca, balançar o corpo."
  },
  {
    name: "Remada Curvada com Barra",
    muscleGroup: "Costas",
    equipment: "Barra",
    difficulty: "avancado",
    videoUrl: "https://www.youtube.com/embed/9efgcAjQW70",
    warmup: "Mobilidade de quadril e 1 série de 15 repetições apenas com a barra.",
    instructions: "Incline o tronco, puxe a barra em direção ao umbigo.",
    commonErrors: "Arredondar a coluna, usar impulso excessivo."
  },
  {
    name: "Remada Baixa com Triângulo",
    muscleGroup: "Costas",
    equipment: "Polia",
    difficulty: "iniciante",
    videoUrl: "https://www.youtube.com/embed/GZbfZ033f74",
    warmup: "1 série leve focando na ativação das costas.",
    instructions: "Puxe o triângulo em direção ao abdômen, estufando o peito.",
    commonErrors: "Encolher os ombros, esticar demais as pernas."
  },
  // PERNAS
  {
    name: "Agachamento Livre",
    muscleGroup: "Pernas",
    equipment: "Barra",
    difficulty: "avancado",
    videoUrl: "https://www.youtube.com/embed/SW_C1A-rejs",
    warmup: "Agachamento com peso do corpo (20 reps) e mobilidade de tornozelo.",
    instructions: "Desça o quadril como se fosse sentar, mantendo a coluna reta.",
    commonErrors: "Joelhos para dentro, tirar os calcanhares do chão."
  },
  {
    name: "Leg Press 45",
    muscleGroup: "Pernas",
    equipment: "Máquina",
    difficulty: "iniciante",
    videoUrl: "https://www.youtube.com/embed/q_S8_pD2q2o",
    warmup: "1 série de 20 repetições com 30% da carga de treino.",
    instructions: "Empurre a plataforma com os pés, sem estender totalmente os joelhos.",
    commonErrors: "Estender totalmente o joelho (lockout), tirar o quadril do banco."
  },
  {
    name: "Cadeira Extensora",
    muscleGroup: "Pernas",
    equipment: "Máquina",
    difficulty: "iniciante",
    videoUrl: "https://www.youtube.com/embed/YyvSfVjQZ9U",
    warmup: "1 série leve com isometria de 2 segundos no topo.",
    instructions: "Estenda as pernas controladamente.",
    commonErrors: "Movimento explosivo, não ajustar o banco."
  },
  // OMBRO
  {
    name: "Desenvolvimento com Halteres",
    muscleGroup: "Ombro",
    equipment: "Halteres",
    difficulty: "intermediario",
    videoUrl: "https://www.youtube.com/embed/qEwK6jnz8sA",
    warmup: "Manguito rotador: rotação interna e externa com halteres leves.",
    instructions: "Empurre os halteres acima da cabeça.",
    commonErrors: "Arquear demais as costas, descer pouco."
  },
  {
    name: "Elevação Lateral",
    muscleGroup: "Ombro",
    equipment: "Halteres",
    difficulty: "iniciante",
    videoUrl: "https://www.youtube.com/embed/Z57BaT_4_60",
    warmup: "1 série de 20 repetições com peso muito baixo.",
    instructions: "Eleve os braços lateralmente até a altura dos ombros.",
    commonErrors: "Subir acima dos ombros, usar impulso."
  },
  // BICEPS
  {
    name: "Rosca Direta com Barra W",
    muscleGroup: "Bíceps",
    equipment: "Barra",
    difficulty: "iniciante",
    videoUrl: "https://www.youtube.com/embed/LY1V6FeL790",
    warmup: "1 série de 15 repetições apenas com a barra W.",
    instructions: "Flexione os cotovelos trazendo a barra em direção aos ombros.",
    commonErrors: "Balançar o corpo, afastar os cotovelos do tronco."
  },
  // TRICEPS
  {
    name: "Tríceps Pulley",
    muscleGroup: "Tríceps",
    equipment: "Polia",
    difficulty: "iniciante",
    videoUrl: "https://www.youtube.com/embed/2-LAMcpzLNo",
    warmup: "1 série de 20 repetições com carga mínima.",
    instructions: "Empurre a barra para baixo mantendo os cotovelos fixos.",
    commonErrors: "Mover os cotovelos, usar o peso do corpo."
  }
];
