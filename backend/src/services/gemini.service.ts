import { GoogleGenAI } from "@google/genai";
import { GameType } from "../models/User.js";

interface Question {
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

interface AssessmentResponse {
  questions: Question[];
}

export class GeminiService {
  private genAI: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn(
        "⚠️ GEMINI_API_KEY not found. AI features will use mock data."
      );
    }
    this.genAI = new GoogleGenAI({ apiKey: apiKey || "" });
  }

  /**
   * Generate assessment questions for pre or post assessment
   */
  async generateAssessment(
    gameType: GameType,
    level: number,
    assessmentType: "pre" | "post",
    numberOfQuestions: number = 5
  ): Promise<Question[]> {
    try {
      const difficulty = assessmentType === "pre" ? "foundational" : "advanced";
      const gameContext = this.getGameContext(gameType);

      // Add multiple layers of randomization for unique questions
      const timestamp = Date.now();
      const randomSeed = Math.floor(Math.random() * 1000000);
      const uniqueId = `${timestamp}-${randomSeed}`;
      const sessionId = Math.random().toString(36).substring(7);

      // Random topic focus variations
      const topicVariations = [
        "Focus on practical real-world scenarios",
        "Include technical implementation details",
        "Emphasize case studies and examples",
        "Cover policy and compliance aspects",
        "Explore threat detection methods",
        "Address common security vulnerabilities",
        "Test incident response procedures",
        "Include risk assessment scenarios",
        "Cover legal framework applications",
        "Focus on prevention strategies",
      ];
      const randomTopicFocus =
        topicVariations[Math.floor(Math.random() * topicVariations.length)];

      // Random question style variations
      const questionStyles = [
        "Use 'what if' scenarios",
        "Include multiple-step reasoning",
        "Present real company examples",
        "Use comparative analysis",
        "Include data interpretation",
        "Present ethical dilemmas",
        "Use troubleshooting scenarios",
        "Include best practice identification",
      ];
      const randomStyle =
        questionStyles[Math.floor(Math.random() * questionStyles.length)];

      // Random context variations for more diversity
      const contexts = [
        "a large financial institution",
        "a healthcare provider",
        "an e-commerce platform",
        "a government agency",
        "a tech startup",
        "a retail business",
        "an educational institution",
        "a manufacturing company",
      ];
      const randomContext =
        contexts[Math.floor(Math.random() * contexts.length)];

      // Define question types and shuffle them for variety
      const questionTypes = [
        {
          type: "definition",
          starters: [
            "What is",
            "Define",
            "Explain the concept of",
            "What does the term",
          ],
        },
        {
          type: "scenario",
          starters: [
            "In a scenario where",
            "Imagine a situation where",
            "Consider a case where",
            "If a company",
          ],
        },
        {
          type: "comparison",
          starters: [
            "Which of the following",
            "Compare and identify",
            "Among these options",
            "Select the most accurate",
          ],
        },
        {
          type: "case-study",
          starters: [
            "A company has",
            "An organization",
            "A business encounters",
            "A team is facing",
          ],
        },
        {
          type: "critical-thinking",
          starters: [
            "When analyzing",
            "If you encounter",
            "How would you handle",
            "What is the best approach when",
          ],
        },
      ];

      // Shuffle array function
      const shuffleArray = <T>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      // Shuffle question types for this generation
      const shuffledTypes = shuffleArray(questionTypes);

      // Build dynamic question requirements
      const questionRequirements = shuffledTypes
        .map((type, index) => {
          const randomStarter =
            type.starters[Math.floor(Math.random() * type.starters.length)];
          return `- Question ${index + 1}: Start with "${randomStarter}..." (${
            type.type
          })`;
        })
        .join("\n");

      // Random prompt templates for variety
      const promptTemplates = [
        // Template 1: Detailed with emojis
        `🔴 CRITICAL: Request ID #${uniqueId} | Session: ${sessionId}
You MUST generate COMPLETELY NEW and UNIQUE questions. DO NOT repeat any questions from previous generations.

Generate ${numberOfQuestions} ORIGINAL multiple-choice questions for a ${difficulty} ${assessmentType}-assessment 
for "${gameContext.title}" at level ${level}.

📚 Game Context: ${gameContext.description}
🎯 Special Focus: ${randomTopicFocus} related to ${gameContext.focus}
📝 Question Style: ${randomStyle}
🏢 Example Context: Use scenarios from ${randomContext}

⚡ MANDATORY VARIETY REQUIREMENTS - DIFFERENT ORDER EACH TIME:
${questionRequirements}

🎲 RANDOMIZATION REQUIREMENTS:
- Use different industries/sectors for each question
- Vary the complexity within ${difficulty} level
- Mix question contexts (technical, legal, practical, theoretical)
- Use diverse real-world examples
- Include different attack vectors or scenarios
- Reference different technologies/platforms

✅ TECHNICAL REQUIREMENTS:
- EXACTLY ${numberOfQuestions} questions
- Each question has EXACTLY 4 options
- correctAnswerIndex must be 0-3
- Options should be plausible but only ONE correct
- Avoid obvious wrong answers

🚫 DO NOT:
- Repeat question patterns from previous generations
- Use generic examples
- Make questions too similar to each other
- Use the same question structure twice

Return ONLY valid JSON (no markdown, no code blocks, no extra text):
{
  "questions": [
    {
      "question": "Question text ending with ?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0
    }
  ]
}

🎯 Generate ${numberOfQuestions} UNIQUE questions NOW:`,

        // Template 2: Professional style
        `GENERATION REQUEST #${uniqueId} | SESSION: ${sessionId}

OBJECTIVE: Create ${numberOfQuestions} unique, varied multiple-choice questions for ${difficulty}-level ${assessmentType}-assessment.

SUBJECT: "${gameContext.title}" - Level ${level}
CONTEXT: ${gameContext.description}

SPECIALIZED FOCUS: ${randomTopicFocus} relating to ${gameContext.focus}
PRESENTATION STYLE: ${randomStyle}
SCENARIO SETTING: ${randomContext}

QUESTION STRUCTURE (randomized order for variety):
${questionRequirements}

DIVERSITY REQUIREMENTS:
* Each question must use different industry examples
* Vary difficulty within ${difficulty} parameters
* Balance technical, legal, practical, and theoretical aspects
* Include realistic, contemporary examples
* Reference varied technologies and methodologies

TECHNICAL SPECIFICATIONS:
* Total questions: ${numberOfQuestions}
* Options per question: 4
* Correct answer index: 0-3
* All options must be plausible
* Only one definitively correct answer per question

PROHIBITED:
* Repeating previous question patterns
* Generic or vague examples
* Similar structures across questions
* Obvious incorrect options

OUTPUT FORMAT - JSON only:
{
  "questions": [
    {
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0
    }
  ]
}

GENERATE NOW:`,

        // Template 3: Concise direct style
        `REQUEST: ${uniqueId} | ${sessionId}

Create ${numberOfQuestions} unique questions for ${gameContext.title} (Level ${level}, ${assessmentType}-assessment, ${difficulty} difficulty).

Context: ${gameContext.description}
Focus: ${randomTopicFocus} - ${gameContext.focus}
Style: ${randomStyle}
Setting: ${randomContext}

Question Pattern (SHUFFLED - varies each time):
${questionRequirements}

Requirements:
- Different industries per question
- Mixed contexts: technical/legal/practical/theoretical
- Realistic current examples
- Varied complexity within ${difficulty} level
- 4 plausible options each, 1 correct
- NO repetition of previous patterns

JSON format only:
{
  "questions": [
    {"question": "...", "options": ["A", "B", "C", "D"], "correctAnswerIndex": 0}
  ]
}

Generate:`,
      ];

      // Randomly select a prompt template
      const prompt =
        promptTemplates[Math.floor(Math.random() * promptTemplates.length)];

      const result = await this.genAI.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt,
        config: {
          temperature: 1.0, // Maximum randomness for varied questions
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      });

      const text = result.text || "";

      // Clean up the response to extract JSON
      let jsonText = text.trim();
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```\n?/g, "");
      }

      const parsed: AssessmentResponse = JSON.parse(jsonText);

      // Validate the response
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error("Invalid response format from Gemini");
      }

      // Ensure we have exactly the requested number of questions
      if (parsed.questions.length !== numberOfQuestions) {
        console.warn(
          `Expected ${numberOfQuestions} questions but got ${parsed.questions.length}. Using fallback.`
        );
        return this.getMockAssessment(gameType, numberOfQuestions);
      }

      // Validate each question has required fields
      for (const q of parsed.questions) {
        if (
          !q.question ||
          !q.options ||
          q.options.length !== 4 ||
          typeof q.correctAnswerIndex !== "number" ||
          q.correctAnswerIndex < 0 ||
          q.correctAnswerIndex > 3
        ) {
          console.warn("Invalid question format, using fallback");
          return this.getMockAssessment(gameType, numberOfQuestions);
        }
      }

      console.log(
        `Successfully generated ${parsed.questions.length} unique questions for ${gameType} level ${level} ${assessmentType}-assessment`
      );

      return parsed.questions;
    } catch (error) {
      console.error("Error generating assessment with Gemini:", error);
      // Return mock questions as fallback
      return this.getMockAssessment(gameType, numberOfQuestions);
    }
  }

  /**
   * Generate AI insights for user analytics
   */
  async generateAnalyticsInsights(
    gameType: GameType,
    preScore: number,
    postScore: number,
    weakAreas: string[],
    strengthAreas: string[]
  ): Promise<string> {
    try {
      const improvement = postScore - preScore;
      const gameContext = this.getGameContext(gameType);

      const prompt = `As an educational AI assistant, provide encouraging and insightful feedback for a student learning about ${
        gameContext.title
      }.

Student Performance:
- Pre-assessment score: ${preScore}%
- Post-assessment score: ${postScore}%
- Improvement: ${improvement}%
- Weak areas: ${weakAreas.join(", ") || "None identified"}
- Strong areas: ${strengthAreas.join(", ") || "General understanding"}

Provide a brief, encouraging 2-3 sentence insight that:
1. Acknowledges their progress or encourages improvement
2. Highlights specific achievements or areas needing focus
3. Offers a practical tip for continued learning

Keep it conversational, positive, and actionable.`;

      const result = await this.genAI.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt,
      });
      return result.text || this.getMockInsight(preScore, postScore);
    } catch (error) {
      console.error("Error generating insights with Gemini:", error);
      return this.getMockInsight(preScore, postScore);
    }
  }

  /**
   * Get game-specific context for better AI generation
   */
  private getGameContext(gameType: GameType): {
    title: string;
    description: string;
    focus: string;
  } {
    const contexts = {
      phishing: {
        title: "Phishing Detection",
        description:
          "Training users to identify and avoid phishing attacks and social engineering tactics",
        focus: "email security, red flags, URL inspection, sender verification",
      },
      loophole: {
        title: "Legal Loopholes",
        description:
          "Understanding legal loopholes in cyber law and how to identify gaps in legislation",
        focus:
          "legal analysis, critical thinking, policy gaps, regulatory compliance",
      },
      judge: {
        title: "Cyber Judge",
        description:
          "Making judgments on cybercrime cases based on evidence and legal precedent",
        focus:
          "legal reasoning, evidence evaluation, cyber law application, case analysis",
      },
      architect: {
        title: "Legislation Architect",
        description:
          "Designing and analyzing cybersecurity legislation and policy",
        focus:
          "policy design, long-term impact, regulatory frameworks, stakeholder considerations",
      },
      veo: {
        title: "VEO Creator",
        description: "Creating visual explanations of cybersecurity concepts",
        focus:
          "visual communication, concept explanation, educational content creation",
      },
      laws: {
        title: "Learn Laws",
        description: "Learning fundamental cybersecurity laws and regulations",
        focus:
          "legal knowledge, regulatory understanding, compliance requirements",
      },
    };

    return contexts[gameType];
  }

  /**
   * Fallback mock assessment data
   */
  private getMockAssessment(
    gameType: GameType,
    numberOfQuestions: number
  ): Question[] {
    const mockQuestions: Record<GameType, Question[]> = {
      phishing: [
        {
          question: "What is the primary goal of a phishing attack?",
          options: [
            "To install antivirus software",
            "To steal sensitive information",
            "To improve email security",
            "To provide technical support",
          ],
          correctAnswerIndex: 1,
        },
        {
          question: "Which of these is a common red flag in a phishing email?",
          options: [
            "Personalized greeting with your name",
            'Generic greeting like "Dear Customer"',
            "Email from a known contact",
            "Professional formatting",
          ],
          correctAnswerIndex: 1,
        },
        {
          question: "What should you do if you receive a suspicious email?",
          options: [
            "Click the link to verify",
            "Reply with your information",
            "Report it and delete it",
            "Forward it to friends",
          ],
          correctAnswerIndex: 2,
        },
        {
          question: "Which email address is most likely to be legitimate?",
          options: [
            "support@paypa1-security.com",
            "admin@bank-verify-urgent.net",
            "service@amazon.com",
            "security@g00gle-alert.com",
          ],
          correctAnswerIndex: 2,
        },
        {
          question: "What is spear phishing?",
          options: [
            "Fishing with a spear",
            "A targeted phishing attack on specific individuals",
            "A type of malware",
            "A legitimate security practice",
          ],
          correctAnswerIndex: 1,
        },
      ],
      loophole: [
        {
          question: "What is a legal loophole?",
          options: [
            "A door in a courthouse",
            "A gap or ambiguity in law that can be exploited",
            "A type of legal document",
            "A court procedure",
          ],
          correctAnswerIndex: 1,
        },
        {
          question: "Why do legal loopholes exist?",
          options: [
            "They are intentionally created",
            "Laws cannot cover every possible scenario",
            "Lawyers create them",
            "They are part of the constitution",
          ],
          correctAnswerIndex: 1,
        },
        {
          question: "How can legal loopholes be closed?",
          options: [
            "By ignoring them",
            "Through legislative amendments",
            "By judges only",
            "They cannot be closed",
          ],
          correctAnswerIndex: 1,
        },
        {
          question: "What is the principle of 'letter vs spirit' of the law?",
          options: [
            "Reading vs writing laws",
            "Following exact wording vs intended purpose",
            "Criminal vs civil law",
            "Federal vs state law",
          ],
          correctAnswerIndex: 1,
        },
        {
          question: "Who typically identifies legal loopholes?",
          options: [
            "Only judges",
            "Lawyers, scholars, and those affected by laws",
            "Police officers",
            "Politicians exclusively",
          ],
          correctAnswerIndex: 1,
        },
      ],
      judge: [
        {
          question: "What is the burden of proof in criminal cyber cases?",
          options: [
            "Preponderance of evidence",
            "Clear and convincing evidence",
            "Beyond reasonable doubt",
            "Probable cause",
          ],
          correctAnswerIndex: 2,
        },
        {
          question: "What is digital forensics?",
          options: [
            "Creating digital art",
            "Recovering and investigating electronic data for legal cases",
            "Writing computer programs",
            "Building websites",
          ],
          correctAnswerIndex: 1,
        },
        {
          question: "What is an IP address in cyber investigations?",
          options: [
            "Intellectual Property address",
            "A unique identifier for devices on a network",
            "Internet Protocol document",
            "A password",
          ],
          correctAnswerIndex: 1,
        },
        {
          question: "What does jurisdiction mean in cyber law?",
          options: [
            "The power of a court to hear a case",
            "Type of crime",
            "A legal document",
            "An investigation tool",
          ],
          correctAnswerIndex: 0,
        },
        {
          question: "What is the chain of custody in digital evidence?",
          options: [
            "A prisoner transport system",
            "Documentation of evidence handling to ensure integrity",
            "A type of blockchain",
            "A court filing procedure",
          ],
          correctAnswerIndex: 1,
        },
      ],
      architect: [
        {
          question:
            "What is the primary purpose of data protection legislation?",
          options: [
            "To increase government revenue",
            "To protect individual privacy rights",
            "To promote technology companies",
            "To restrict internet access",
          ],
          correctAnswerIndex: 1,
        },
        {
          question: "What does 'transparency' mean in legislation?",
          options: [
            "Laws written on clear paper",
            "Making laws clear and understandable to the public",
            "Secret government operations",
            "Corporate policies",
          ],
          correctAnswerIndex: 1,
        },
        {
          question: "Why is public consultation important in lawmaking?",
          options: [
            "It's not important",
            "To gather diverse perspectives and identify potential issues",
            "To delay the process",
            "For entertainment",
          ],
          correctAnswerIndex: 1,
        },
        {
          question: "What is a 'sunset clause' in legislation?",
          options: [
            "Laws that apply only at night",
            "Automatic expiration date for a law",
            "Laws about solar energy",
            "End of a legislative session",
          ],
          correctAnswerIndex: 1,
        },
        {
          question: "What are unintended consequences in legislation?",
          options: [
            "Typos in legal documents",
            "Unexpected effects that laws have beyond their intended purpose",
            "Deliberate loopholes",
            "Benefits of new laws",
          ],
          correctAnswerIndex: 1,
        },
      ],
      veo: [
        {
          question: "What makes an effective cybersecurity educational video?",
          options: [
            "Complex technical jargon",
            "Clear visuals and simple explanations",
            "Long duration",
            "No examples",
          ],
          correctAnswerIndex: 1,
        },
        {
          question: "Why is visual storytelling important in education?",
          options: [
            "It's not important",
            "It helps engage viewers and improve retention",
            "It's cheaper to produce",
            "To show off editing skills",
          ],
          correctAnswerIndex: 1,
        },
        {
          question: "What is the ideal length for an educational video?",
          options: [
            "Over 1 hour",
            "5-10 minutes for focused topics",
            "Under 30 seconds",
            "Exactly 1 minute",
          ],
          correctAnswerIndex: 1,
        },
        {
          question:
            "What should be included in a cybersecurity awareness video?",
          options: [
            "Only text slides",
            "Real-world examples and practical tips",
            "Complex code demonstrations",
            "Only background music",
          ],
          correctAnswerIndex: 1,
        },
        {
          question: "How can videos improve cybersecurity training?",
          options: [
            "They can't",
            "By demonstrating concepts visually and engaging learners",
            "By replacing all written materials",
            "By being entertaining only",
          ],
          correctAnswerIndex: 1,
        },
      ],
      laws: [
        {
          question: "What does GDPR stand for?",
          options: [
            "General Data Protection Regulation",
            "Global Digital Privacy Rule",
            "Government Data Processing Rights",
            "General Digital Protection Rights",
          ],
          correctAnswerIndex: 0,
        },
        {
          question: "What is the purpose of cybersecurity laws?",
          options: [
            "To ban computers",
            "To protect digital systems and data from unauthorized access",
            "To make internet expensive",
            "To monitor all citizens",
          ],
          correctAnswerIndex: 1,
        },
        {
          question: "What is 'right to be forgotten'?",
          options: [
            "Forgetting passwords",
            "Right to have personal data deleted",
            "Amnesia treatment",
            "Witness protection program",
          ],
          correctAnswerIndex: 1,
        },
        {
          question: "What does 'data breach notification' require?",
          options: [
            "Nothing",
            "Organizations must inform affected individuals when data is compromised",
            "Only informing the CEO",
            "Waiting 10 years to notify",
          ],
          correctAnswerIndex: 1,
        },
        {
          question: "What is 'consent' in data protection laws?",
          options: [
            "Automatic permission",
            "Freely given, informed agreement to data processing",
            "Something companies assume",
            "Not necessary",
          ],
          correctAnswerIndex: 1,
        },
      ],
    };

    const questions = mockQuestions[gameType] || mockQuestions.phishing;

    // If we don't have enough questions, repeat with variations
    if (questions.length < numberOfQuestions) {
      const repeated = [...questions];
      while (repeated.length < numberOfQuestions) {
        repeated.push(...questions);
      }
      return repeated.slice(0, numberOfQuestions);
    }

    return questions.slice(0, numberOfQuestions);
  }

  /**
   * Fallback mock insight
   */
  private getMockInsight(preScore: number, postScore: number): string {
    const improvement = postScore - preScore;
    if (improvement > 20) {
      return "Excellent progress! You've shown significant improvement, demonstrating strong learning and adaptation. Keep up the great work!";
    } else if (improvement > 0) {
      return "Good progress! You're moving in the right direction. Focus on reviewing the challenging areas to further strengthen your skills.";
    } else {
      return "Keep practicing! Learning takes time and repetition. Review the material and try again - you've got this!";
    }
  }
}

export default new GeminiService();
