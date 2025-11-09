import React, {
  useState,
  createContext,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import GameContainer from "./pages/GameContainer";
import AnalyticsPage from "./pages/AnalyticsPage";
import SignupPage from "./pages/SignupPage";
import { User, GameType, AuthContextType } from "./types";
import * as api from "./services/apiService";
import LoadingSpinner from "./components/LoadingSpinner";

export const AuthContext = createContext<AuthContextType | null>(null);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const loggedInEmail = sessionStorage.getItem("aetherium-email");
      if (loggedInEmail) {
        try {
          // Fetch user data from backend
          const userData = await api.getUser(loggedInEmail);

          // Fetch all game progress from backend and merge with user data
          try {
            const response = await api.getAllGameProgress();
            console.log("Fetched game progress from database:", response);

            // Handle response that might be wrapped in { progress: [...] }
            const allProgress = Array.isArray(response)
              ? response
              : response.progress || [];

            if (!Array.isArray(allProgress)) {
              console.warn("Progress data is not an array:", allProgress);
              throw new Error("Invalid progress data format");
            }

            // Transform backend progress data to frontend format
            const progressMap: Record<string, any> = {};
            allProgress.forEach((progress: any) => {
              progressMap[progress.gameType] = {
                completedLevels: progress.completedLevels || [],
                currentLevel: progress.currentLevel || 1,
                totalScore: progress.totalScore || 0,
                timeSpent: progress.timeSpent || 0,
                assessments: progress.assessments || {},
              };
            });

            // Merge progress data with user data
            userData.progress = { ...userData.progress, ...progressMap };
            console.log("User data with merged progress:", userData);
          } catch (progressError) {
            console.warn(
              "Could not fetch game progress, using user data only:",
              progressError
            );
          }

          setUser(userData);
        } catch (error) {
          console.error("Failed to restore session:", error);
          sessionStorage.removeItem("aetherium-email");
          setUser(null);
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  const login = useCallback(
    async (
      email: string,
      password: string,
      role: "user" | "admin"
    ): Promise<void> => {
      const userData = await api.loginUser(email, password, role);

      // Fetch game progress from backend after login
      try {
        const response = await api.getAllGameProgress();
        console.log("Fetched game progress after login:", response);

        // Handle response that might be wrapped in { progress: [...] }
        const allProgress = Array.isArray(response)
          ? response
          : response.progress || [];

        if (!Array.isArray(allProgress)) {
          console.warn("Progress data is not an array:", allProgress);
          throw new Error("Invalid progress data format");
        }

        // Transform backend progress data to frontend format
        const progressMap: Record<string, any> = {};
        allProgress.forEach((progress: any) => {
          progressMap[progress.gameType] = {
            completedLevels: progress.completedLevels || [],
            currentLevel: progress.currentLevel || 1,
            totalScore: progress.totalScore || 0,
            timeSpent: progress.timeSpent || 0,
            assessments: progress.assessments || {},
          };
        });

        // Merge progress data with user data
        userData.progress = { ...userData.progress, ...progressMap };
        console.log("User logged in with progress data:", userData);
      } catch (progressError) {
        console.warn("Could not fetch game progress on login:", progressError);
      }

      setUser(userData);
      sessionStorage.setItem("aetherium-email", email);
    },
    []
  );

  const loginWithGoogle = useCallback(async (): Promise<void> => {
    const userData = await api.loginWithGoogleAPI(); // This is a placeholder
    setUser(userData);
    sessionStorage.setItem("aetherium-email", userData.email);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem("aetherium-email");
  }, []);

  const updateUserState = useCallback(async (updatedUser: User) => {
    setUser(updatedUser);
    await api.updateUser(updatedUser);
  }, []);

  const completeLevel = useCallback(
    async (game: GameType, levelNumber: number) => {
      // Don't track progress for creative games
      if (["laws", "architect"].includes(game)) return;

      try {
        // Save to backend first
        console.log("Saving level completion to backend:", {
          game,
          levelNumber,
          score: 100,
          timeSpent: 0,
        });

        const response = await api.completeLevel(game, levelNumber, 100, 0);
        console.log("Level completion saved successfully:", response);

        // Update local state with backend data
        setUser((prev) => {
          if (!prev) return null;

          const gameProgress = prev.progress[game]?.completedLevels || [];
          if (gameProgress.includes(levelNumber)) {
            return prev; // Level already completed
          }

          const newLevel = prev.level + 1;
          const newBadge = `Level ${levelNumber} ${game} Cleared`;

          const updatedUser = {
            ...prev,
            level: newLevel,
            badges: [...prev.badges, newBadge],
            progress: {
              ...prev.progress,
              [game]: {
                completedLevels: response.progress?.completedLevels || [
                  ...gameProgress,
                  levelNumber,
                ],
                currentLevel:
                  response.progress?.currentLevel || levelNumber + 1,
                totalScore:
                  response.progress?.totalScore ||
                  (prev.progress[game]?.totalScore || 0) + 100,
                timeSpent:
                  response.progress?.timeSpent ||
                  prev.progress[game]?.timeSpent ||
                  0,
                assessments: prev.progress[game]?.assessments || {},
              },
            },
          };

          // Update user in backend
          updateUserState(updatedUser);
          return updatedUser;
        });
      } catch (err) {
        console.error("Failed to save level completion:", err);
        // Still update local state on error for better UX
        setUser((prev) => {
          if (!prev) return null;

          const gameProgress = prev.progress[game]?.completedLevels || [];
          if (gameProgress.includes(levelNumber)) {
            return prev;
          }

          const newLevel = prev.level + 1;
          const newBadge = `Level ${levelNumber} ${game} Cleared`;

          return {
            ...prev,
            level: newLevel,
            badges: [...prev.badges, newBadge],
            progress: {
              ...prev.progress,
              [game]: {
                ...prev.progress[game],
                completedLevels: [...gameProgress, levelNumber],
              },
            },
          };
        });
      }
    },
    [updateUserState]
  );

  const recordAssessmentScore = useCallback(
    async (
      game: GameType,
      level: number,
      type: "pre" | "post",
      score: number
    ) => {
      setUser((prev) => {
        if (!prev) return null;

        const updatedUser = { ...prev };

        if (!updatedUser.progress[game]) {
          updatedUser.progress[game] = { completedLevels: [], assessments: {} };
        }
        if (!updatedUser.progress[game]!.assessments[level]) {
          updatedUser.progress[game]!.assessments[level] = {};
        }

        updatedUser.progress[game]!.assessments[level][type] = score;

        // Note: Assessment saving is handled by the assessment submission endpoint
        // No need to call separate API here as it's done in the assessment flow

        updateUserState(updatedUser);
        return updatedUser;
      });
    },
    [updateUserState]
  );

  // Function to refresh game progress from backend
  const refreshProgress = useCallback(async () => {
    if (!user) return;

    try {
      console.log("Refreshing game progress from backend...");
      const response = await api.getAllGameProgress();

      // Handle response that might be wrapped in { progress: [...] }
      const allProgress = Array.isArray(response)
        ? response
        : response.progress || [];

      if (!Array.isArray(allProgress)) {
        console.warn("Progress data is not an array:", allProgress);
        throw new Error("Invalid progress data format");
      }

      // Transform backend progress data to frontend format
      const progressMap: Record<string, any> = {};
      allProgress.forEach((progress: any) => {
        progressMap[progress.gameType] = {
          completedLevels: progress.completedLevels || [],
          currentLevel: progress.currentLevel || 1,
          totalScore: progress.totalScore || 0,
          timeSpent: progress.timeSpent || 0,
          assessments: progress.assessments || {},
        };
      });

      // Update user with fresh progress data
      setUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          progress: { ...prev.progress, ...progressMap },
        };
      });

      console.log("Game progress refreshed successfully");
    } catch (error) {
      console.error("Failed to refresh game progress:", error);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginWithGoogle,
        logout,
        completeLevel,
        recordAssessmentScore,
        refreshProgress,
      }}
    >
      <div className="bg-gray-900 text-white min-h-screen overflow-hidden">
        <div
          className="absolute inset-0 bg-repeat bg-center"
          style={{
            backgroundImage:
              'url(\'data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%231a202c" fill-opacity="0.4" fill-rule="evenodd"%3E%3Cpath d="M0 40L40 0H20L0 20M40 40V20L20 40"/%3E%3C/g%3E%3C/svg%3E\')',
            opacity: 0.5,
          }}
        ></div>
        <div className="relative z-10">
          <HashRouter>
            <Routes>
              <Route
                path="/login"
                element={user ? <Navigate to="/" /> : <LoginPage />}
              />
              <Route
                path="/signup"
                element={user ? <Navigate to="/" /> : <SignupPage />}
              />
              <Route
                path="/"
                element={user ? <DashboardPage /> : <Navigate to="/login" />}
              />
              <Route
                path="/analytics"
                element={user ? <AnalyticsPage /> : <Navigate to="/login" />}
              />
              <Route
                path="/game/:gameId"
                element={user ? <GameContainer /> : <Navigate to="/login" />}
              />
              <Route
                path="*"
                element={<Navigate to={user ? "/" : "/login"} />}
              />
            </Routes>
          </HashRouter>
        </div>
      </div>
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default App;
