import React, { useState, useEffect } from "react";
import { PhishingEmail, PhishingDifficulty } from "../../types";
import {
  generatePhishingEmail,
  evaluateUserPhishingResponse,
} from "../../services/aiService";
import AICharacter from "../AICharacter";
import { useAuth } from "../../App";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../LoadingSpinner";

interface PhishingDetectiveGameProps {
  onComplete: () => void;
}

const LevelNode: React.FC<{
  level: number;
  isCompleted: boolean;
  isUnlocked: boolean;
  onClick: (level: number) => void;
}> = ({ level, isCompleted, isUnlocked, onClick }) => {
  const statusClasses = isCompleted
    ? "bg-purple-600 border-purple-400"
    : isUnlocked
    ? "bg-blue-500 border-blue-300 cursor-pointer hover:bg-blue-400 animate-pulse"
    : "bg-gray-700 border-gray-500 cursor-not-allowed";

  const handleClick = () => {
    if (isUnlocked) {
      onClick(level);
    }
  };

  return (
    <div className="flex items-center my-2">
      <div
        onClick={handleClick}
        className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-orbitron font-bold border-2 transition-all ${statusClasses}`}
      >
        {level}
      </div>
      {isCompleted && <div className="w-4 h-1 bg-purple-400 ml-2"></div>}
    </div>
  );
};

const PhishingDetectiveGame: React.FC<PhishingDetectiveGameProps> = ({
  onComplete,
}) => {
  const [email, setEmail] = useState<PhishingEmail | null>(null);
  const [loading, setLoading] = useState(false);
  const [userReason, setUserReason] = useState("");
  const [emailCache, setEmailCache] = useState<Map<string, PhishingEmail>>(
    new Map()
  );

  const [fullFeedback, setFullFeedback] = useState(
    "Select your difficulty and choose a mission from the map."
  );
  const [animatedFeedback, setAnimatedFeedback] = useState("");

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<PhishingDifficulty>("easy");

  const { user, completeLevel } = useAuth();
  const navigate = useNavigate();
  const completedLevels = user?.progress?.phishing?.completedLevels || [];
  const highestCompleted =
    completedLevels.length > 0 ? Math.max(...completedLevels) : 0;

  useEffect(() => {
    if (fullFeedback) {
      setAnimatedFeedback("");
      let i = 0;
      const interval = setInterval(() => {
        if (i < fullFeedback.length) {
          setAnimatedFeedback((prev) => fullFeedback.substring(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
        }
      }, 25); // typing speed
      return () => clearInterval(interval);
    }
  }, [fullFeedback]);

  const handleLevelSelect = async (level: number) => {
    setSelectedLevel(level);
    setLoading(true);
    setIsCardFlipped(false);
    setUserReason("");
    setFullFeedback("");
    setEmail(null);

    // Check cache first
    const cacheKey = `${level}-${difficulty}`;
    const cachedEmail = emailCache.get(cacheKey);

    if (cachedEmail) {
      console.log("Using cached email for level", level);
      setEmail(cachedEmail);
      setFullFeedback(
        `Mission ${level} Briefing: Analyze this incoming transmission for signs of deception.`
      );
      setLoading(false);
      return;
    }

    const timeoutPromise = new Promise<never>(
      (_, reject) =>
        setTimeout(() => reject(new Error("Request timed out")), 30000) // Increased to 30 seconds
    );

    try {
      const data = await Promise.race([
        generatePhishingEmail(level, difficulty),
        timeoutPromise,
      ]);
      const emailData = data as PhishingEmail;

      // Cache the email
      setEmailCache((prev) => new Map(prev).set(cacheKey, emailData));

      setEmail(emailData);
      setFullFeedback(
        `Mission ${level} Briefing: Analyze this incoming transmission for signs of deception.`
      );
    } catch (error) {
      console.error("Failed to load phishing email mission:", error);
      setFullFeedback(
        "Error: Unable to load mission data. Using backup scenario. Please try again later for AI-generated missions."
      );
      // Use a fallback email if AI fails
      setEmail({
        subject: "Urgent: Account Verification Required",
        sender: "security@paypa1.com",
        body: "Dear valued customer,\n\nYour account has been flagged for suspicious activity. Please verify your identity by clicking the link below within 24 hours or your account will be suspended.\n\nVerify Now: http://paypa1-secure.com/verify\n\nThank you,\nPayPal Security Team",
        explanation:
          "This is a phishing email! Notice the sender domain 'paypa1.com' uses the number '1' instead of 'l'. The URL is also suspicious and not the official PayPal domain. Legitimate companies never ask you to verify via email links.",
        isPhishing: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (choice: "phishing" | "legit") => {
    if (!email || selectedLevel === null) return;

    setIsEvaluating(true);
    setFullFeedback("Evaluating your analysis... Stand by.");

    // Check if user's choice matches the actual email type
    const userChoiceIsPhishing = choice === "phishing";
    const isCorrect = userChoiceIsPhishing === email.isPhishing;

    // Generate quick feedback without AI call for speed
    let quickFeedback = "";
    if (userReason.trim()) {
      quickFeedback = "Your analysis has been noted. ";
    }

    if (isCorrect) {
      setFullFeedback(
        `Correct! This was a ${
          email.isPhishing ? "malicious" : "legitimate"
        } transmission. ${quickFeedback}The full analysis is now available.`
      );
      completeLevel("phishing", selectedLevel);
    } else {
      setFullFeedback(
        `Incorrect. This was actually a ${
          email.isPhishing ? "phishing attempt" : "legitimate email"
        }. ${quickFeedback}Take a look at the full analysis to understand why.`
      );
    }

    setIsCardFlipped(true);
    setIsEvaluating(false);
  };

  const handleReturnToMap = () => {
    setSelectedLevel(null);
    setEmail(null);
    setFullFeedback("Select your next mission.");
  };

  const handleAnalysisReveal = () => {
    if (email) {
      setFullFeedback(`Analysis: ${email.explanation}`);
    }
  };

  const handleDifficultyChange = (d: PhishingDifficulty) => {
    setDifficulty(d);
  };

  if (selectedLevel === null) {
    return (
      <div className="w-full max-w-4xl p-6 bg-gray-800/60 backdrop-blur-md rounded-2xl border border-purple-500/30 shadow-2xl shadow-purple-900/50 flex flex-col animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-orbitron text-purple-300">
            Phishing Detective HQ
          </h1>
          <button
            onClick={() => navigate("/")}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
          >
            Back to Dashboard
          </button>
        </div>
        <AICharacter isTalking={true} message={animatedFeedback} />
        <div className="my-4">
          <label className="block text-lg font-orbitron text-gray-300 mb-2">
            Select Difficulty
          </label>
          <div className="flex bg-gray-900/50 rounded-lg p-1 border border-gray-700">
            {(["easy", "medium", "hard"] as PhishingDifficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => handleDifficultyChange(d)}
                className={`flex-1 capitalize py-2 rounded-md text-sm font-semibold transition-all ${
                  difficulty === d ? "bg-purple-600" : "hover:bg-gray-700"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[50vh] overflow-y-auto no-scrollbar border border-gray-700 rounded-lg p-4 bg-gray-900/30">
          <h2 className="text-xl font-orbitron text-center mb-4">
            Mission Map
          </h2>
          <div className="flex flex-col items-center">
            {Array.from({ length: 50 }, (_, i) => i + 1).map((level) => (
              <LevelNode
                key={level}
                level={level}
                isCompleted={completedLevels.includes(level)}
                isUnlocked={level <= highestCompleted + 1}
                onClick={handleLevelSelect}
              />
            ))}
          </div>
        </div>
        <button
          onClick={onComplete}
          className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg"
        >
          End Session & See Report
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full max-w-4xl p-6 h-[80vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!email) {
    return (
      <div className="w-full max-w-4xl p-6 bg-gray-800/60 backdrop-blur-md rounded-2xl border border-red-500/30 shadow-2xl shadow-red-900/50 flex flex-col animate-fade-in items-center">
        <h1 className="text-3xl font-orbitron text-red-300">
          Mission Load Failed
        </h1>
        <div className="my-8">
          <AICharacter isTalking={true} message={animatedFeedback} />
        </div>
        <button
          onClick={handleReturnToMap}
          className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg"
        >
          Return to Mission Map
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl p-6 bg-gray-800/60 backdrop-blur-md rounded-2xl border border-purple-500/30 shadow-2xl shadow-purple-900/50 flex flex-col animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-orbitron text-purple-300">
          Mission: Level {selectedLevel}
        </h1>
        <button
          onClick={() => navigate("/")}
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
        >
          Back to Dashboard
        </button>
      </div>
      <div className="flex-grow flex flex-col md:flex-row gap-6 min-h-[60vh]">
        <div className="md:w-1/2 flex flex-col perspective-container">
          <div
            className={`relative w-full h-full preserve-3d transition-transform duration-700 ${
              isCardFlipped ? "rotate-y-180" : ""
            }`}
          >
            <div className="absolute w-full h-full backface-hidden bg-gray-900/70 p-4 rounded-lg flex flex-col">
              <div className="border-b border-gray-700 pb-2 mb-2">
                <p className="text-sm text-gray-400">
                  From: <span className="text-gray-200">{email.sender}</span>
                </p>
                <p className="text-lg font-bold text-white">{email.subject}</p>
              </div>
              <div className="flex-grow text-gray-300 whitespace-pre-wrap overflow-y-auto no-scrollbar">
                {email.body}
              </div>
            </div>
            <div className="absolute w-full h-full backface-hidden bg-gray-900/70 p-4 rounded-lg rotate-y-180 flex flex-col justify-between items-center">
              <div className="text-center">
                <h3 className="font-bold text-purple-400 text-lg">
                  Threat Analysis
                </h3>
                <p className="text-gray-300 mt-4">
                  Listen to my report for the full breakdown of the phishing
                  attempt.
                </p>
                <button
                  onClick={handleAnalysisReveal}
                  className="mt-4 bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg"
                >
                  Replay Analysis
                </button>
              </div>
              <button
                onClick={handleReturnToMap}
                className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-transform duration-200 hover:scale-105"
              >
                Return to Mission Map
              </button>
            </div>
          </div>
        </div>

        <div className="md:w-1/2 flex flex-col justify-between">
          <div className="mb-4 min-h-[100px]">
            <AICharacter
              isTalking={!!animatedFeedback}
              message={animatedFeedback}
            />
          </div>

          {!isCardFlipped ? (
            <div>
              <textarea
                value={userReason}
                onChange={(e) => setUserReason(e.target.value)}
                placeholder="State your reasoning, Cadet."
                className="w-full h-24 bg-gray-900/70 p-2 rounded-md border border-gray-700 focus:ring-purple-500 focus:border-purple-500 mb-4 text-white"
                disabled={isEvaluating}
              />
              <div className="flex gap-4">
                <button
                  onClick={() => handleSubmit("phishing")}
                  disabled={isEvaluating}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 transition-all duration-200 hover:shadow-lg hover:shadow-red-500/50"
                >
                  Declare Phishing
                </button>
                <button
                  onClick={() => handleSubmit("legit")}
                  disabled={isEvaluating}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 transition-all duration-200 hover:shadow-lg hover:shadow-green-500/50"
                >
                  Declare Legitimate
                </button>
              </div>
              {isEvaluating && (
                <div className="text-center mt-4">
                  <LoadingSpinner />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-400">
              Analysis complete. Return to the map for your next mission.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhishingDetectiveGame;
