export type ReadingLevel = 'grades-2-4' | 'grades-5-7' | 'grades-8-plus';

export interface Topic {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  difficulty: string;
  readTime: string;
  pdbId?: string;
  uniprotId?: string;
  pubchemCid?: string;
  provenance: {
    source: string;
    type: 'Experimentally determined' | 'Predicted by model' | 'Literature curated';
    externalUrl: string;
    experimentalMethod?: string;
  };
  summary: string;
  fullContent: string;
  funFact: string;
  keyQuestions: string[];
  vocabulary: Array<{ term: string; definition: string }>;
  chemicalFormula?: string;
  molecularWeight?: string;
  iupacName?: string;
  hasMolecularStructure?: boolean;
  structureType?: 'molecule_3d' | 'dna_helix' | 'protein' | 'small_molecule';
  chemicalCompounds?: ChemicalCompoundInfo[];
  molecularLabels?: MolecularLabel[];
  sdfCoordinates?: string;
  svgDiagram2D?: string;
  molecularHighlights?: Array<{
    name: string;
    color: string;
    description: string;
  }>;
}

export interface ChemicalCompoundInfo {
  name: string;
  formula?: string;
  role: string;
  label: string;
  atoms?: string;
  color: string;
  description?: string;
}

export interface MolecularLabel {
  id: string;
  name: string;
  label: string;
  description: string;
  color: string;
  badge?: string;
  group?: string;
}

export interface Character {
  id: string;
  name: string;
  title: string;
  species: string;
  personality: string;
  backstory: string;
  conversationalStyle: string; // e.g. "Warm & Socratic", "Energetic & Futuristic", "Curious & Teamwork-driven", "Serene & Meditative"
  speechStyle: string;
  catchphrase: string;
  favoriteDiscovery: string;
  avatarEmoji: string;
  accentBg: string;
  accentText: string;
  accentBorder: string;
  voicePitch: number; // For Web Speech API synthesis
  voiceRate: number;
  greeting: string;
  statusTag?: string; // e.g. "Sofia Carter is ready"
  traits?: string[]; // e.g. ["Empathetic", "Patient", "Hands-on", "Explain-like-i'm-five", "Inclusive"]
  targetAge?: string; // e.g. "Ages 11 and above"
  avatarColor?: string;
}

export interface VocabularyItem {
  term: string;
  definition: string;
}

export interface MindMapNode {
  id: string;
  label: string;
  parentId?: string | null;
  description?: string;
}

export interface AudioDialogueTurn {
  speaker: string;
  text: string;
}

export interface NotebookSummary {
  overview: string;
  keyTakeaways: string[];
  whyItMatters: string;
  vocabulary: VocabularyItem[];
  mindMapNodes: MindMapNode[];
  audioDialogue: AudioDialogueTurn[];
}

export type QuestionType = 'multiple-choice' | 'short-answer';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[]; // for multiple-choice
  correctIndex?: number; // for multiple-choice (0-3)
  sampleAnswer?: string; // for short-answer
  keyConcepts?: string[]; // key terms or concepts to look for
  explanation: string;
  tutorCheer: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  characterId: string;
  text: string;
  citationQuotes?: string[];
  followUpQuestions?: string[];
  audioScript?: string;
  timestamp: number;
}

// Gamification Models
export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'curiosity' | 'mastery' | 'focus' | 'exploration';
  xpReward: number;
}

export interface TopicMastery {
  completed: boolean;
  quizScore: number;
  quizTotal: number;
  bestScorePercentage: number;
  quizzesTaken: number;
  questionsAsked: number;
  lastStudiedAt: number;
}

export interface ActivityEvent {
  id: string;
  type: 'quiz_completed' | 'question_asked' | 'audio_listened' | 'molecule_explored' | 'lesson_read';
  title: string;
  xpEarned: number;
  timestamp: number;
}

export interface StudentProgress {
  totalXp: number;
  level: number;
  levelTitle: string;
  streakDays: number;
  completedTopicIds: string[];
  topicMastery: Record<string, TopicMastery>;
  unlockedBadgeIds: string[];
  recentActivities: ActivityEvent[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  age: number;
  gradeLevel: ReadingLevel;
  avatar: string;
  selectedTutorId: string;
  interests: string[];
  learningGoals?: string[];
  createdAt: number;
}
