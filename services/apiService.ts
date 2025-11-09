import { User, GameType } from "../types";

/**
 * API Service - Connects to the Aetherium Guard Backend
 * All functions now make real API calls to the backend server
 */

// API Configuration
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Token management
const getToken = (): string | null => {
  return localStorage.getItem("aetherium-token");
};

const setToken = (token: string): void => {
  localStorage.setItem("aetherium-token", token);
};

const removeToken = (): void => {
  localStorage.removeItem("aetherium-token");
};

// API request helper
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    // Include validation details if available
    const errorMessage = data.error || data.message || "API request failed";
    const details = data.details
      ? ` - ${
          Array.isArray(data.details)
            ? data.details.map((d: any) => d.msg).join(", ")
            : data.details
        }`
      : "";
    throw new Error(errorMessage + details);
  }

  return data;
};

/**
 * Get user profile
 */
export const getUser = async (email: string): Promise<User | null> => {
  try {
    const data = await apiRequest("/auth/profile");

    // Load game progress
    const progressData = await apiRequest("/progress");
    const progress: User["progress"] = {};

    progressData.progress?.forEach((gameProgress: any) => {
      progress[gameProgress.gameType as GameType] = {
        completedLevels: gameProgress.completedLevels,
        assessments: {}, // Will be loaded when needed
      };
    });

    return {
      email: data.user.email,
      role: data.user.role,
      level: data.user.level,
      badges: data.user.badges,
      progress,
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
};

/**
 * Login user
 */
export const loginUser = async (
  email: string,
  password: string,
  role: "user" | "admin"
): Promise<User> => {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, role }),
  });

  setToken(data.token);

  // Map backend user format to frontend User type
  return {
    email: data.user.email,
    role: data.user.role,
    level: data.user.level,
    badges: data.user.badges,
    progress: {}, // Will be loaded separately
  };
};

/**
 * Google login
 */
export const loginWithGoogleAPI = async (): Promise<User> => {
  // This would integrate with Google OAuth
  // For now, return a mock implementation
  throw new Error(
    "Google login not implemented yet. Please use email/password login."
  );
};

/**
 * Sign up new user
 */
export const signupUser = async (
  email: string,
  password: string
): Promise<User> => {
  const data = await apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, role: "user" }),
  });

  setToken(data.token);

  return {
    email: data.user.email,
    role: data.user.role,
    level: data.user.level,
    badges: data.user.badges,
    progress: {},
  };
};

/**
 * Update user profile
 */
export const updateUser = async (user: User): Promise<User> => {
  const data = await apiRequest("/auth/profile", {
    method: "PUT",
    body: JSON.stringify({
      level: user.level,
      badges: user.badges,
    }),
  });

  return {
    email: data.user.email,
    role: data.user.role,
    level: data.user.level,
    badges: data.user.badges,
    progress: user.progress,
  };
};

/**
 * Get all users (admin only)
 */
export const getAllUsers = async (): Promise<User[]> => {
  const data = await apiRequest("/admin/users");
  return data.users.map((u: any) => ({
    email: u.email,
    role: u.role,
    level: u.level,
    badges: u.badges,
    progress: {},
  }));
};

/**
 * Game Progress APIs
 */
export const getAllGameProgress = async (): Promise<any> => {
  console.log("API: Fetching all game progress");
  const result = await apiRequest("/progress");
  console.log("API: All game progress response:", result);
  return result;
};

export const getGameProgress = async (gameType: GameType): Promise<any> => {
  return await apiRequest(`/progress/${gameType}`);
};

export const updateGameProgress = async (
  gameType: GameType,
  progressData: any
): Promise<any> => {
  return await apiRequest(`/progress/${gameType}`, {
    method: "PUT",
    body: JSON.stringify(progressData),
  });
};

export const completeLevel = async (
  gameType: GameType,
  level: number,
  score: number,
  timeSpent: number
): Promise<any> => {
  const payload = { level, score, timeSpent };
  console.log(`API: Completing level for ${gameType}:`, payload);
  const result = await apiRequest(`/progress/${gameType}/complete`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  console.log("API: Level completion response:", result);
  return result;
};

/**
 * Assessment APIs
 */
export const generateAssessment = async (
  gameType: GameType,
  level: number,
  assessmentType: "pre" | "post"
): Promise<any> => {
  return await apiRequest("/assessments/generate", {
    method: "POST",
    body: JSON.stringify({ gameType, level, assessmentType }),
  });
};

export const submitAssessment = async (
  assessmentId: string,
  answers: number[],
  timeSpent: number
): Promise<any> => {
  const payload = { assessmentId, answers, timeSpent };
  console.log("API: Submitting assessment:", payload);
  const result = await apiRequest("/assessments/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  console.log("API: Assessment submission response:", result);
  return result;
};

export const getAssessment = async (assessmentId: string): Promise<any> => {
  return await apiRequest(`/assessments/${assessmentId}`);
};

export const getGameAssessments = async (
  gameType: GameType,
  level: number
): Promise<any> => {
  return await apiRequest(`/assessments/${gameType}/${level}`);
};

/**
 * Analytics APIs
 */
export const getUserAnalytics = async (): Promise<any> => {
  return await apiRequest("/analytics");
};

export const getGameAnalytics = async (gameType: GameType): Promise<any> => {
  return await apiRequest(`/analytics/${gameType}`);
};

/**
 * Admin APIs
 */
export const getAdminDashboard = async (): Promise<any> => {
  return await apiRequest("/admin/dashboard");
};

export const getSystemAnalytics = async (): Promise<any> => {
  return await apiRequest("/admin/analytics");
};

export const getUserById = async (userId: string): Promise<any> => {
  return await apiRequest(`/admin/users/${userId}`);
};

export const updateUserAdmin = async (
  userId: string,
  updates: any
): Promise<any> => {
  return await apiRequest(`/admin/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
};

export const deleteUser = async (userId: string): Promise<any> => {
  return await apiRequest(`/admin/users/${userId}`, {
    method: "DELETE",
  });
};

/**
 * Leaderboard APIs
 */
export const getLeaderboard = async (): Promise<any> => {
  return await apiRequest("/leaderboard");
};

// Health check
export const checkAPIHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL.replace("/api", "")}/health`);
    return response.ok;
  } catch (error) {
    console.error("API health check failed:", error);
    return false;
  }
};
