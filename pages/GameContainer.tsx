import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GameType, Assessment, AssessmentQuestion } from "../types";
import { useAuth } from "../App";
import * as api from "../services/apiService";
import PhishingDetectiveGame from "../components/games/PhishingDetectiveGame";
import LegalLoopholeGame from "../components/games/LegalLoopholeGame";
import CyberJudgeGame from "../components/games/CyberJudgeGame";
import LegislationArchitectGame from "../components/games/LegislationArchitectGame";
import LearnLawsGame from "../components/games/LearnLawsGame";
import LoadingSpinner from "../components/LoadingSpinner";

const gameComponents = {
  phishing: PhishingDetectiveGame,
  loophole: LegalLoopholeGame,
  judge: CyberJudgeGame,
  architect: LegislationArchitectGame,
  laws: LearnLawsGame,
};

const AssessmentForm: React.FC<{
  title: string;
  questions: AssessmentQuestion[];
  assessmentId?: string;
  onSubmit: (
    score: number,
    answers?: number[],
    assessmentId?: string,
    timeSpent?: number
  ) => void;
  buttonText: string;
  onSkip?: () => void;
}> = ({ title, questions, assessmentId, onSubmit, buttonText, onSkip }) => {
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [startTime] = useState<number>(Date.now());

  const handleAnswerChange = (qIndex: number, aIndex: number) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: aIndex }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let correctCount = 0;
    questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswerIndex) {
        correctCount++;
      }
    });
    const score = Math.round((correctCount / questions.length) * 100);
    const timeSpent = Math.round((Date.now() - startTime) / 1000); // Time in seconds
    const answersArray = questions.map((_, index) => answers[index] ?? -1);

    onSubmit(score, answersArray, assessmentId, timeSpent);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in">
      <div className="bg-gray-800 p-8 rounded-lg shadow-2xl shadow-purple-900/50 max-w-lg w-full border border-purple-500/30">
        <h2 className="text-2xl font-orbitron mb-4 text-purple-300">{title}</h2>
        <p className="text-gray-300 mb-6">
          This short assessment will help tailor your learning experience.
          Please answer the following questions to the best of your ability.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 mb-8 max-h-[50vh] overflow-y-auto pr-4">
            {questions.map((q, index) => (
              <div key={index}>
                <p className="block text-gray-300 mb-3 font-semibold">
                  {index + 1}. {q.question}
                </p>
                <div className="space-y-2">
                  {q.options.map((option, optionIndex) => (
                    <label
                      key={optionIndex}
                      className="flex items-center space-x-3 p-3 bg-gray-900/50 rounded-lg border border-gray-700 hover:bg-gray-700/50 transition-colors cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={optionIndex}
                        className="form-radio h-5 w-5 text-purple-600 bg-gray-700 border-gray-600 focus:ring-purple-500"
                        onChange={() => handleAnswerChange(index, optionIndex)}
                        required
                      />
                      <span className="text-gray-200">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-transform duration-200 hover:scale-105"
            >
              {buttonText}
            </button>
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="px-6 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition-transform duration-200 hover:scale-105"
              >
                Skip
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

const GameContainer: React.FC = () => {
  const { gameId } = useParams<{ gameId: GameType }>();
  const [gameState, setGameState] = useState<
    "pre-assessment" | "playing" | "post-assessment"
  >("pre-assessment");
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loadingAssessment, setLoadingAssessment] = useState(true);
  const [lastPlayedLevel, setLastPlayedLevel] = useState<number>(1);
  const { user, recordAssessmentScore, refreshProgress } = useAuth();
  const navigate = useNavigate();

  // Refresh progress when entering game to ensure we have latest data
  useEffect(() => {
    if (refreshProgress) {
      refreshProgress();
    }
  }, [refreshProgress]);

  const GameComponent = gameId ? gameComponents[gameId] : null;
  const isCreativeGame = gameId === "architect" || gameId === "laws";

  useEffect(() => {
    if (isCreativeGame) {
      setGameState("playing");
      setLoadingAssessment(false); // Set loading to false for creative games
      return;
    }
    if (!gameId || gameState === "playing") return;

    const fetchAssessment = async () => {
      setLoadingAssessment(true);
      try {
        // Fetch assessment based on the level the user is about to play
        const levelForAssessment =
          gameState === "post-assessment" ? lastPlayedLevel : user?.level || 1;
        const assessmentType = gameState === "post-assessment" ? "post" : "pre";

        console.log("Fetching assessment:", {
          gameId,
          levelForAssessment,
          assessmentType,
        });

        // Generate assessment from backend API
        const data = await api.generateAssessment(
          gameId,
          levelForAssessment,
          assessmentType
        );

        console.log("Assessment data received:", data);

        // Store assessment ID for submission
        if (data && data.assessment) {
          const assessmentData = data.assessment;
          setAssessment({
            questions: assessmentData.questions || [],
            id: assessmentData._id || assessmentData.id,
          });
        } else if (data && data.questions) {
          // Handle case where data IS the assessment
          setAssessment({
            questions: data.questions || [],
            id: data._id || data.id,
          });
        } else {
          console.error("Invalid assessment data structure:", data);
          throw new Error("Invalid assessment data received");
        }
      } catch (error) {
        console.error("Failed to generate assessment:", error);
        // On error, skip assessment and go directly to playing
        console.log("Skipping assessment due to error, proceeding to game");
        setGameState("playing");
      } finally {
        setLoadingAssessment(false);
      }
    };
    fetchAssessment();
  }, [gameId, user?.level, gameState, isCreativeGame, lastPlayedLevel]);

  const handlePreAssessmentSubmit = async (
    score: number,
    answers?: number[],
    assessmentId?: string,
    timeSpent?: number
  ) => {
    if (gameId && user) {
      // Submit assessment to backend
      if (assessmentId && answers && timeSpent !== undefined) {
        try {
          console.log("Submitting pre-assessment:", {
            assessmentId,
            answersCount: answers.length,
            timeSpent,
          });
          await api.submitAssessment(assessmentId, answers, timeSpent);
          console.log("Pre-assessment submitted successfully");
        } catch (error: any) {
          // If assessment already submitted, that's okay - continue
          if (error.message && error.message.includes("already submitted")) {
            console.log("Assessment already submitted, continuing...");
          } else {
            console.error("Failed to submit pre-assessment:", error);
          }
        }
      } else {
        console.warn("Missing assessment submission data:", {
          assessmentId,
          hasAnswers: !!answers,
          timeSpent,
        });
      }

      // Assuming pre-assessment is for the user's current level
      const levelToRecord =
        gameId === "phishing" || gameId === "loophole" || gameId === "judge"
          ? (user.progress[gameId]?.completedLevels.length || 0) + 1
          : user.level;
      recordAssessmentScore(gameId, levelToRecord, "pre", score);
      setLastPlayedLevel(levelToRecord);

      // Refresh progress to get updated assessment data
      if (refreshProgress) {
        refreshProgress().catch((err) =>
          console.warn("Failed to refresh progress after pre-assessment:", err)
        );
      }
    }
    setGameState("playing");
  };

  const handleGameComplete = () => {
    if (isCreativeGame) {
      navigate("/");
    } else {
      setGameState("post-assessment");
    }
  };

  const handlePostAssessmentComplete = async (
    score: number,
    answers?: number[],
    assessmentId?: string,
    timeSpent?: number
  ) => {
    if (gameId) {
      // Submit assessment to backend
      if (assessmentId && answers && timeSpent !== undefined) {
        try {
          console.log("Submitting post-assessment:", {
            assessmentId,
            answersCount: answers.length,
            timeSpent,
          });
          await api.submitAssessment(assessmentId, answers, timeSpent);
          console.log(
            "Post-assessment submitted successfully - analytics should be updated"
          );
        } catch (error) {
          console.error("Failed to submit post-assessment:", error);
        }
      } else {
        console.warn("Missing post-assessment submission data:", {
          assessmentId,
          hasAnswers: !!answers,
          timeSpent,
        });
      }

      recordAssessmentScore(gameId, lastPlayedLevel, "post", score);

      // Refresh progress to get updated analytics and assessment data
      if (refreshProgress) {
        refreshProgress()
          .then(() => {
            console.log(
              "Progress and analytics refreshed after post-assessment"
            );
          })
          .catch((err) => {
            console.warn(
              "Failed to refresh progress after post-assessment:",
              err
            );
          });
      }
    }
    navigate("/");
  };

  if (!gameId || !GameComponent) {
    return (
      <div className="text-red-500 text-2xl">Error: Game module not found.</div>
    );
  }

  const renderContent = () => {
    if (loadingAssessment && !isCreativeGame && gameState !== "playing") {
      return <LoadingSpinner />;
    }

    if (gameState === "pre-assessment") {
      if (
        !assessment ||
        !assessment.questions ||
        assessment.questions.length === 0
      ) {
        // If assessment failed to load, skip to playing
        console.warn("Assessment not available, proceeding to game");
        setGameState("playing");
        return <LoadingSpinner />;
      }

      return (
        <AssessmentForm
          title={`Pre-Assessment: ${
            gameId.charAt(0).toUpperCase() + gameId.slice(1)
          }`}
          questions={assessment.questions}
          assessmentId={assessment.id}
          onSubmit={handlePreAssessmentSubmit}
          buttonText="Start Mission"
          onSkip={() => {
            console.log("Skipping pre-assessment");
            setGameState("playing");
          }}
        />
      );
    }

    if (gameState === "post-assessment") {
      if (
        !assessment ||
        !assessment.questions ||
        assessment.questions.length === 0
      ) {
        // If assessment failed to load, go back to dashboard
        console.warn("Post-assessment not available, returning to dashboard");
        navigate("/");
        return <LoadingSpinner />;
      }

      return (
        <AssessmentForm
          title={`Post-Assessment: Well Done!`}
          questions={assessment.questions}
          assessmentId={assessment.id}
          onSubmit={handlePostAssessmentComplete}
          buttonText="Return to Dashboard"
        />
      );
    }

    if (gameState === "playing") {
      const onLevelComplete = (levelNum: number) => {
        setLastPlayedLevel(levelNum);
        // We now use post-assessment to complete the level officially.
      };

      // FIX: Pass the correct props to each game component to avoid type errors.
      switch (gameId) {
        case "phishing":
          return <PhishingDetectiveGame onComplete={handleGameComplete} />;
        case "loophole":
          return (
            <LegalLoopholeGame
              onComplete={handleGameComplete}
              onLevelComplete={onLevelComplete}
            />
          );
        case "judge":
          return (
            <CyberJudgeGame
              onComplete={handleGameComplete}
              onLevelComplete={onLevelComplete}
            />
          );
        case "architect":
          return <LegislationArchitectGame onComplete={handleGameComplete} />;
        case "laws":
          return <LearnLawsGame onComplete={handleGameComplete} />;
        default:
          return <LoadingSpinner />;
      }
    }

    return <LoadingSpinner />;
  };

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center p-4">
      {renderContent()}
    </div>
  );
};

export default GameContainer;
