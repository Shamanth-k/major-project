import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import {
  PhishingEmail,
  LegalLoopholeContent,
  CyberJudgeCase,
  Assessment,
  GameType,
  LegislationSimulation,
  ChatMessage,
  PhishingDifficulty,
} from "../types";

// Mock data for development when API key is not available
const MOCK_PHISHING_EMAIL: PhishingEmail = {
  subject: "Urgent: Your Account Requires Verification!",
  sender: "secure-support@yourbank.net",
  body: "Dear customer, we've detected suspicious activity on your account. Please click the link below to verify your identity immediately to avoid suspension. http://yourbank-security-check.com/login",
  explanation:
    "This is a classic phishing attempt! The sender's email is unofficial, the link is suspicious, and they're trying to scare you into acting fast. Well spotted!",
  isPhishing: true,
};

const MOCK_LEGAL_LOOPHOLE: LegalLoopholeContent = {
  lawText:
    "All vehicles operating after sunset must have their headlights turned on. This includes all cars, trucks, and motorcycles.",
  loopholeExplanation:
    "The law is too specific, forgetting things like electric scooters, which are technically exempt.",
  fixSuggestion:
    "To fix this, the law should be broadened to include 'all motorized vehicles'.",
};

const MOCK_CYBER_JUDGE_CASE: CyberJudgeCase = {
  caseTitle: "State v. 'Nyx'",
  caseSummary:
    "A hacker known as 'Nyx' is accused of breaching the servers of a major corporation, 'OmniCorp', and leaking sensitive customer data.",
  prosecutionArgument:
    "We have digital forensics tracing the breach back to an IP address registered to the defendant. The leaked data matches OmniCorp's records exactly.",
  defenseArgument:
    "The IP address was routed through a public Wi-Fi network. Anyone could have performed the hack. There is no direct proof linking my client to the keyboard.",
  suggestedVerdictWithReasoning:
    "The court finds the defendant Guilty due to the overwhelming digital trail.",
};

const MOCK_SIMULATION: LegislationSimulation = {
  title: "On the Proposed 'Universal Basic Refreshment' Act",
  yearOne:
    "In the first year, cafes are swamped every Tuesday! A black market for 'premium beverage vouchers' has already popped up.",
  yearFive:
    "Five years in, the economy is now centered around beverages. The 'Great Cola Riot' is thankfully a distant memory.",
  yearTwenty:
    "Twenty years later, society is different. The 'Standard Beverage Unit' is a real currency. Historians are still arguing if this was a good idea.",
};

const MOCK_ASSESSMENT: Assessment = {
  questions: [
    {
      question: "What is a primary goal of a phishing attack?",
      options: [
        "To install antivirus",
        "To steal sensitive information",
        "To sell products",
        "To provide technical support",
      ],
      correctAnswerIndex: 1,
    },
    {
      question: "Which of these is a red flag for a phishing email?",
      options: [
        "A generic greeting like 'Dear Customer'",
        "An email from your boss",
        "A shipping confirmation",
        "A password reset link you requested",
      ],
      correctAnswerIndex: 0,
    },
  ],
};

const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY;
const useMock = !getApiKey();

const getAi = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("⚠️ VITE_GEMINI_API_KEY not found in environment variables");
    return null;
  }
  console.log("✅ Using Gemini API with key:", apiKey.substring(0, 10) + "...");
  return new GoogleGenAI({ apiKey });
};

export const generateAssessment = async (
  gameType: GameType,
  level: number
): Promise<Assessment> => {
  const ai = getAi();
  if (!ai) {
    console.log(`Using mock data for ${gameType} Assessment.`);
    return new Promise((resolve) =>
      setTimeout(() => resolve(MOCK_ASSESSMENT), 500)
    );
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate 2 multiple-choice assessment questions for a level ${level} pre-assessment for a game about '${gameType}'. The questions should test foundational knowledge. Format the response as a JSON object with a single key "questions", which is an array of objects, each with a "question" string, an "options" array of 4 strings, and a "correctAnswerIndex" number (0-3).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswerIndex: { type: Type.INTEGER },
                },
              },
            },
          },
        },
      },
    });
    return JSON.parse(response.text) as Assessment;
  } catch (error) {
    console.error("AI service error generating assessment:", error);
    return MOCK_ASSESSMENT; // Fallback to mock on error
  }
};

export const generatePhishingEmail = async (
  level: number,
  difficulty: PhishingDifficulty
): Promise<PhishingEmail> => {
  const ai = getAi();
  if (!ai) {
    console.log("Using mock data for Phishing Email.");
    return new Promise((resolve) =>
      setTimeout(() => resolve(MOCK_PHISHING_EMAIL), 500)
    );
  }

  const difficultyPrompt = {
    easy: "The email should have several obvious red flags like typos, generic greetings, and suspicious links.",
    medium:
      "The email should be more convincing, with one or two subtle red flags, like a slightly incorrect domain name or an unusual but plausible request.",
    hard: "The email should be very convincing and sophisticated, mimicking a real email closely. The red flag could be a single, hard-to-spot detail in the email header, a link that looks legitimate but has a Unicode character substitution, or a very well-crafted social engineering tactic.",
  };

  // Randomly decide if this email should be phishing or legitimate (70% phishing, 30% legit)
  const isPhishing = Math.random() < 0.7;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: `Generate a unique ${
        isPhishing ? "phishing" : "legitimate"
      } email for a level ${level} cybersecurity game. The difficulty is '${difficulty}'. ${
        difficultyPrompt[difficulty]
      } ${
        isPhishing
          ? "This should be a PHISHING email with red flags."
          : "This should be a LEGITIMATE email that looks professional and trustworthy."
      } Format the response as a JSON object with keys: "subject", "sender", "body", "explanation" (the explanation should be short, conversational, and friendly, as if spoken by an AI assistant, explaining ${
        isPhishing ? "the red flags" : "why this is legitimate"
      } in 2-3 sentences), and "isPhishing" (boolean, ${isPhishing}).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            sender: { type: Type.STRING },
            body: { type: Type.STRING },
            explanation: { type: Type.STRING },
            isPhishing: { type: Type.BOOLEAN },
          },
        },
      },
    });

    console.log("Gemini API Response:", response);

    if (!response || !response.text) {
      throw new Error("Invalid response from Gemini API");
    }

    const parsedEmail = JSON.parse(response.text) as PhishingEmail;
    console.log("Parsed email:", parsedEmail);

    return parsedEmail;
  } catch (error) {
    console.error("AI service error generating phishing email:", error);
    return MOCK_PHISHING_EMAIL; // Fallback to mock on error
  }
};

export const evaluateUserPhishingResponse = async (
  userReason: string,
  correctExplanation: string
): Promise<string> => {
  const ai = getAi();
  if (!ai)
    return new Promise((resolve) =>
      setTimeout(
        () =>
          resolve(
            "That's a good observation! Keep an eye out for those details."
          ),
        500
      )
    );

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-lite",
    contents: `A user is playing a phishing detection game. Their reasoning for their choice was: "${userReason}". The correct explanation is: "${correctExplanation}". Evaluate if the user's reasoning is correct, partially correct, or incorrect. Provide a short, encouraging, and educational response to the user in a conversational tone, acting as a helpful AI assistant. Maximum 3 sentences.`,
  });
  return response.text || "Good effort! Keep learning.";
};

export const generateLegalLoophole = async (
  level: number,
  difficulty: PhishingDifficulty
): Promise<LegalLoopholeContent> => {
  const ai = getAi();
  if (!ai)
    return new Promise((resolve) =>
      setTimeout(() => resolve(MOCK_LEGAL_LOOPHOLE), 500)
    );
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-lite",
    contents: `Generate a fictional, short law for a legal education game at difficulty level ${level} for a '${difficulty}' challenge. The law must contain a subtle logical loophole. Also provide a one-sentence explanation of the loophole and a one-sentence suggestion on how to fix it. These must be very short and suitable for an AI assistant to speak. Format the response as a JSON object with keys: "lawText", "loopholeExplanation", and "fixSuggestion".`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          lawText: { type: Type.STRING },
          loopholeExplanation: { type: Type.STRING },
          fixSuggestion: { type: Type.STRING },
        },
      },
    },
  });
  return JSON.parse(response.text) as LegalLoopholeContent;
};

export const evaluateUserLoopholeResponse = async (
  userLoophole: string,
  actualLoophole: string
): Promise<string> => {
  const ai = getAi();
  if (!ai)
    return new Promise((resolve) =>
      setTimeout(
        () =>
          resolve(
            "An interesting take on the law. Here's the official analysis."
          ),
        500
      )
    );
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-lite",
    contents: `In a legal game, a user suggested a loophole: "${userLoophole}". The actual loophole is: "${actualLoophole}". Briefly evaluate if the user was correct, partially correct, or on the wrong track in a single, encouraging sentence.`,
  });
  return response.text || "An interesting take!";
};

export const generateCyberJudgeCase = async (
  level: number,
  difficulty: PhishingDifficulty
): Promise<CyberJudgeCase> => {
  const ai = getAi();
  if (!ai)
    return new Promise((resolve) =>
      setTimeout(() => resolve(MOCK_CYBER_JUDGE_CASE), 500)
    );
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-lite",
    contents: `Create a short, fictional court case summary for a 'Cyber Judge' game at difficulty level ${level} for a '${difficulty}' challenge. The case should be a cybercrime. Present brief arguments from prosecution and defense. Format as a JSON object with keys: "caseTitle", "caseSummary", "prosecutionArgument", "defenseArgument", and "suggestedVerdictWithReasoning" (this must be a single, decisive sentence summarizing the verdict).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          caseTitle: { type: Type.STRING },
          caseSummary: { type: Type.STRING },
          prosecutionArgument: { type: Type.STRING },
          defenseArgument: { type: Type.STRING },
          suggestedVerdictWithReasoning: { type: Type.STRING },
        },
      },
    },
  });
  return JSON.parse(response.text) as CyberJudgeCase;
};

export const evaluateUserVerdict = async (
  userVerdict: string,
  userReasoning: string,
  suggestedVerdict: string
): Promise<string> => {
  const ai = getAi();
  if (!ai)
    return new Promise((resolve) =>
      setTimeout(
        () =>
          resolve(
            "The court appreciates your judgment. Here is the official verdict."
          ),
        500
      )
    );
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-lite",
    contents: `In a cyber judge game, a user rendered a verdict of '${userVerdict}' with the reasoning: "${userReasoning}". The suggested verdict was: "${suggestedVerdict}". Briefly evaluate the user's verdict in one respectful sentence while providing the official outcome.`,
  });
  return response.text || "Your judgment has been noted.";
};

export const generateLegislationSimulation = async (
  law: string,
  level: number,
  difficulty: PhishingDifficulty
): Promise<LegislationSimulation> => {
  const ai = getAi();
  if (!ai)
    return new Promise((resolve) =>
      setTimeout(() => resolve(MOCK_SIMULATION), 500)
    );
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-lite",
    contents: `A user has proposed the following law for a level ${level} simulation at '${difficulty}' difficulty: "${law}". As an AI political and social simulator, analyze the potential real-world consequences. Present the analysis as a narrative simulation. Format the response as a JSON object with keys: "title", "yearOne", "yearFive", and "yearTwenty". Each year's description should be a short, engaging, narrative summary (max 2-3 sentences).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          yearOne: { type: Type.STRING },
          yearFive: { type: Type.STRING },
          yearTwenty: { type: Type.STRING },
        },
      },
    },
  });
  return JSON.parse(response.text || "{}") as LegislationSimulation;
};

export const streamChatResponse = async (
  history: ChatMessage[],
  newMessage: string,
  onChunk: (chunk: string) => void
) => {
  const ai = getAi();
  if (!ai) {
    const mockResponse =
      "This is a mock response from the chatbot. API key is not configured.";
    let i = 0;
    const interval = setInterval(() => {
      if (i < mockResponse.length) {
        onChunk(
          mockResponse.slice(
            0,
            i + 5 > mockResponse.length ? mockResponse.length : i + 5
          )
        );
        i += 5;
      } else {
        clearInterval(interval);
      }
    }, 100);
    return;
  }

  const fullPrompt = [...history, { sender: "user", text: newMessage }]
    .map((m) => `${m.sender}: ${m.text}`)
    .join("\n");

  try {
    const response = await ai.models.generateContentStream({
      model: "gemini-2.0-flash-lite",
      contents: fullPrompt,
      config: {
        systemInstruction:
          "You are the friendly AI assistant for Aetherium Guard, a gamified training platform. Your purpose is to help users learn about cybersecurity and law through the platform's simulations. If asked who you are, identify yourself as the Aetherium Guard assistant.",
      },
    });

    let accumulatedText = "";
    for await (const chunk of response) {
      accumulatedText += chunk.text;
      onChunk(accumulatedText);
    }
  } catch (error: any) {
    console.error("Chat API error:", error);

    // Handle quota exceeded error
    if (
      error?.message?.includes("429") ||
      error?.message?.includes("quota") ||
      error?.message?.includes("RESOURCE_EXHAUSTED")
    ) {
      onChunk(
        "⚠️ I'm experiencing high demand right now. The Aetherium Guard platform offers interactive cybersecurity and legal training through games like Phishing Detective, Legal Loophole, Cyber Judge, and Legislation Architect. Feel free to explore the games while I recover!"
      );
    } else {
      onChunk(
        "I apologize, but I'm having trouble connecting right now. Please try exploring the training simulations in the meantime!"
      );
    }
  }
};
