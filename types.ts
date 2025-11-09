export interface User {
  email: string;
  role: "user" | "admin";
  level: number;
  badges: string[];
  progress: {
    [key in GameType]?: {
      completedLevels: number[];
      assessments: {
        [level: number]: {
          pre?: number; // Score 0-100
          post?: number; // Score 0-100
        };
      };
    };
  };
}

export type GameType = "phishing" | "loophole" | "judge" | "architect" | "laws";
export type PhishingDifficulty = "easy" | "medium" | "hard";

export interface Game {
  id: GameType;
  title: string;
  description: string;
}

export interface AuthContextType {
  user: User | null;
  login: (
    email: string,
    password: string,
    role: "user" | "admin"
  ) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  completeLevel: (game: GameType, levelNumber: number) => void;
  recordAssessmentScore: (
    game: GameType,
    level: number,
    type: "pre" | "post",
    score: number
  ) => void;
  refreshProgress: () => Promise<void>;
}

// Assessment Types
export interface AssessmentQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
}
export interface Assessment {
  questions: AssessmentQuestion[];
}

// Phishing Game Types
export interface PhishingEmail {
  subject: string;
  sender: string;
  body: string;
  explanation: string;
  isPhishing: boolean; // true if phishing, false if legitimate
}

// Legal Loophole Game Types
export interface LegalLoopholeContent {
  lawText: string;
  loopholeExplanation: string;
  fixSuggestion: string;
}

// Cyber Judge Game Types
export interface CyberJudgeCase {
  caseTitle: string;
  caseSummary: string;
  prosecutionArgument: string;
  defenseArgument: string;
  suggestedVerdictWithReasoning: string;
}

// Legislation Architect Game Types
export interface LegislationSimulation {
  title: string;
  yearOne: string;
  yearFive: string;
  yearTwenty: string;
}

// Learn Laws Game Types
export interface LearnLawsTopic {
  title: string;
  description: string;
  type: "video" | "article";
  // if video, this is the YouTube video ID. If article, it's the full URL.
  resourceId: string;
}

// Chatbot Types
export interface ChatMessage {
  sender: "user" | "bot";
  text: string;
}
