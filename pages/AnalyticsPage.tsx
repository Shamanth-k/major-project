import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../App";
import { useNavigate } from "react-router-dom";
import { GameType, User } from "../types";
import * as api from "../services/apiService";
import LoadingSpinner from "../components/LoadingSpinner";

// Analytics data structure from backend
interface AnalyticsData {
  _id: string;
  gameType: GameType;
  level: number;
  preAssessmentScore: number;
  postAssessmentScore: number;
  improvementPercentage: number;
  attempts: number;
  successRate: number;
  skillsImproved: string[];
  weakAreas: string[];
  strengthAreas: string[];
  badgesEarned: string[];
  aiGeneratedInsights: string;
  completionDate: Date;
}

interface UserAnalyticsResponse {
  overview: {
    totalGamesPlayed: number;
    totalLevelsCompleted: number;
    totalPlayTime: number;
    averageImprovement: number;
    totalBadges: number;
    badges: string[];
  };
  gameAnalytics: AnalyticsData[];
  recentAssessments: any[];
  progressByGame: any[];
}

const gameNames: Record<GameType, string> = {
  phishing: "Phishing Detective",
  loophole: "Legal Loophole",
  judge: "Cyber Judge",
  architect: "Legislation Architect",
  laws: "Learn Laws",
};
const gameColors: Record<GameType, string> = {
  phishing: "bg-blue-500",
  loophole: "bg-yellow-500",
  judge: "bg-gray-500",
  architect: "bg-green-500",
  laws: "bg-indigo-500",
};
const gameChartColors = {
  pre: "#a78bfa", // purple-400
  post: "#5eead4", // teal-300
};

const LineChart: React.FC<{
  title: string;
  data: { label: string; pre: number; post: number }[];
}> = ({ title, data }) => {
  if (data.length === 0) {
    return null; // Don't render if no data
  }

  const chartWidth = 600;
  const chartHeight = 200;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  const getYPosition = (value: number) => {
    return paddingTop + plotHeight - (value / 100) * plotHeight;
  };

  const getXPosition = (index: number) => {
    const spacing = plotWidth / (data.length > 1 ? data.length - 1 : 1);
    return paddingLeft + spacing * index;
  };

  // Generate path data for pre-assessment line
  const preLinePath = data
    .map((item, index) => {
      const x = getXPosition(index);
      const y = getYPosition(item.pre);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  // Generate path data for post-assessment line (only include points with data)
  const postLineData = data.filter((d) => d.post > 0);
  const postLinePath =
    postLineData.length > 0
      ? data
          .map((item, index) => {
            if (item.post === 0) return null;
            const x = getXPosition(index);
            const y = getYPosition(item.post);
            const originalIndex = data.findIndex((d) => d === item);
            const prevHasPost =
              originalIndex > 0 && data[originalIndex - 1].post > 0;
            return `${!prevHasPost ? "M" : "L"} ${x} ${y}`;
          })
          .filter((p) => p !== null)
          .join(" ")
      : "";

  return (
    <div className="w-full bg-gray-900/50 p-4 rounded-lg mt-4">
      <h3 className="text-lg font-orbitron mb-2 text-purple-300">{title}</h3>
      <div className="flex justify-end items-center mb-4 space-x-4 text-xs">
        <div className="flex items-center">
          <div
            className="w-3 h-3 rounded-full mr-1"
            style={{ backgroundColor: gameChartColors.pre }}
          ></div>
          Pre-Assessment
        </div>
        <div className="flex items-center">
          <div
            className="w-3 h-3 rounded-full mr-1"
            style={{ backgroundColor: gameChartColors.post }}
          ></div>
          Post-Assessment
        </div>
      </div>
      <div className="relative w-full" style={{ height: `${chartHeight}px` }}>
        <svg
          width="100%"
          height={chartHeight}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="xMidYMid meet"
          className="overflow-visible"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((value) => (
            <g key={value}>
              <line
                x1={paddingLeft}
                y1={getYPosition(value)}
                x2={chartWidth - paddingRight}
                y2={getYPosition(value)}
                stroke="#374151"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <text
                x={paddingLeft - 10}
                y={getYPosition(value)}
                fill="#9CA3AF"
                fontSize="12"
                textAnchor="end"
                alignmentBaseline="middle"
              >
                {value}
              </text>
            </g>
          ))}

          {/* Pre-assessment line */}
          {data.length > 1 && (
            <path
              d={preLinePath}
              fill="none"
              stroke={gameChartColors.pre}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Post-assessment line */}
          {postLineData.length > 1 && (
            <path
              d={postLinePath}
              fill="none"
              stroke={gameChartColors.post}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data points and labels for pre-assessment */}
          {data.map((item, index) => (
            <g key={`pre-${index}`}>
              <circle
                cx={getXPosition(index)}
                cy={getYPosition(item.pre)}
                r="5"
                fill={gameChartColors.pre}
                stroke="#1f2937"
                strokeWidth="2"
              />
              <text
                x={getXPosition(index)}
                y={getYPosition(item.pre) - 12}
                fill={gameChartColors.pre}
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
              >
                {item.pre}%
              </text>
            </g>
          ))}

          {/* Data points and labels for post-assessment */}
          {data.map(
            (item, index) =>
              item.post > 0 && (
                <g key={`post-${index}`}>
                  <circle
                    cx={getXPosition(index)}
                    cy={getYPosition(item.post)}
                    r="5"
                    fill={gameChartColors.post}
                    stroke="#1f2937"
                    strokeWidth="2"
                  />
                  <text
                    x={getXPosition(index)}
                    y={getYPosition(item.post) + 20}
                    fill={gameChartColors.post}
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {item.post}%
                  </text>
                </g>
              )
          )}

          {/* X-axis labels */}
          {data.map((item, index) => (
            <text
              key={`label-${index}`}
              x={getXPosition(index)}
              y={chartHeight - 10}
              fill="#9CA3AF"
              fontSize="12"
              textAnchor="middle"
            >
              {item.label}
            </text>
          ))}

          {/* Y-axis label */}
          <text
            x={15}
            y={chartHeight / 2}
            fill="#9CA3AF"
            fontSize="12"
            textAnchor="middle"
            transform={`rotate(-90, 15, ${chartHeight / 2})`}
          >
            Score (%)
          </text>
        </svg>
      </div>
    </div>
  );
};

const PieChart: React.FC<{
  data: { name: string; value: number; color: string }[];
}> = ({ data }) => {
  if (data.every((d) => d.value === 0)) {
    return (
      <div className="text-center text-gray-500 mt-8">
        No missions completed yet.
      </div>
    );
  }

  let cumulativePercent = 0;
  const segments = data.map((segment) => {
    const percent = segment.value;
    const startAngle = cumulativePercent;
    cumulativePercent += percent;
    return { ...segment, startAngle, endAngle: cumulativePercent };
  });

  const getCoordinates = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-4">
      <svg viewBox="-1 -1 2 2" className="w-40 h-40 transform -rotate-90">
        {segments.map((segment) => {
          const [startX, startY] = getCoordinates(segment.startAngle / 100);
          const [endX, endY] = getCoordinates(segment.endAngle / 100);
          const largeArcFlag = segment.value > 50 ? 1 : 0;
          const pathData = `M ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`;
          return (
            <path
              key={segment.name}
              d={pathData}
              stroke={segment.color}
              strokeWidth="0.3"
              fill="transparent"
            />
          );
        })}
      </svg>
      <div className="text-sm">
        {data.map((item) => (
          <div key={item.name} className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
            <span>
              {item.name}: {item.value.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const UserAnalytics: React.FC<{ user: User }> = ({ user }) => {
  const [analyticsData, setAnalyticsData] =
    useState<UserAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const assessmentGames = ["phishing", "loophole", "judge"] as const;

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const data = await api.getUserAnalytics();
        console.log("Fetched analytics from backend:", data);
        setAnalyticsData(data.analytics);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const chartData = useMemo(() => {
    if (!analyticsData) {
      console.log("No analytics data available");
      return {};
    }

    console.log(
      "Processing chart data from analytics:",
      analyticsData.gameAnalytics
    );

    const data: {
      [key in GameType]?: { label: string; pre: number; post: number }[];
    } = {};

    // Group analytics by game type
    assessmentGames.forEach((game) => {
      const gameAnalytics = analyticsData.gameAnalytics.filter(
        (a) => a.gameType === game
      );
      console.log(`Analytics for ${game}:`, gameAnalytics);
      if (gameAnalytics.length > 0) {
        data[game] = gameAnalytics.map((a) => ({
          label: `Lvl ${a.level}`,
          pre: a.preAssessmentScore || 0,
          post: a.postAssessmentScore || 0,
        }));
      }
    });

    console.log("Final chart data:", data);
    return data;
  }, [analyticsData]);

  const overallStats = useMemo(() => {
    if (!analyticsData) {
      return {
        averageImprovement: 0,
        totalMissions: 0,
        totalPlayTime: 0,
        totalBadges: 0,
      };
    }

    return {
      averageImprovement: analyticsData.overview.averageImprovement,
      totalMissions: analyticsData.overview.totalLevelsCompleted,
      totalPlayTime: Math.round(analyticsData.overview.totalPlayTime / 60), // Convert to minutes
      totalBadges: analyticsData.overview.totalBadges,
    };
  }, [analyticsData]);

  const pieChartData = useMemo(() => {
    if (!analyticsData) return [];

    const progressByGame = analyticsData.progressByGame;
    const total = progressByGame.reduce(
      (sum, p) => sum + p.completedLevels.length,
      0
    );

    if (total === 0) return [];

    return assessmentGames
      .map((game) => {
        const gameProgress = progressByGame.find((p) => p.gameType === game);
        const completedLevels = gameProgress?.completedLevels.length || 0;
        return {
          name: gameNames[game],
          value: (completedLevels / total) * 100,
          color: gameColors[game].replace("bg-", "#").slice(0, 7),
        };
      })
      .filter((item) => item.value > 0);
  }, [analyticsData]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-purple-500/30">
        <h2 className="text-2xl font-orbitron mb-4">Cadet Profile</h2>
        <p className="text-purple-300 break-words">{user.email}</p>
        <div className="space-y-4 mt-4">
          <div>
            <p className="text-gray-400">Overall Level</p>
            <p className="text-5xl font-orbitron text-purple-400">
              {user.level}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Badges Earned</p>
            <div className="flex flex-wrap gap-2 mt-2 max-h-60 overflow-y-auto no-scrollbar">
              {user.badges.length > 0 ? (
                user.badges.map((badge, i) => (
                  <span
                    key={i}
                    className="bg-purple-500 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  >
                    {badge}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-500">No badges yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-purple-500/30 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl font-orbitron mb-4">Overall Performance</h2>
          <div className="space-y-4">
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Avg. Score Improvement</p>
              <p
                className={`text-3xl font-orbitron ${
                  overallStats.averageImprovement > 0
                    ? "text-green-400"
                    : "text-gray-300"
                }`}
              >
                +{overallStats.averageImprovement.toFixed(1)}%
              </p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Total Missions Completed</p>
              <p className="text-3xl font-orbitron text-purple-400">
                {overallStats.totalMissions}
              </p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Badges Earned</p>
              <p className="text-3xl font-orbitron text-yellow-400">
                {overallStats.totalBadges}
              </p>
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-orbitron mb-4">Mission Distribution</h2>
          <PieChart data={pieChartData} />
        </div>
      </div>
      <div className="lg:col-span-3 bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-purple-500/30">
        <h2 className="text-2xl font-orbitron mb-4">Performance by Module</h2>
        {loading ? (
          <div className="text-center text-gray-400 py-8">
            Loading charts...
          </div>
        ) : Object.keys(chartData).length > 0 ? (
          assessmentGames.map(
            (game) =>
              chartData[game] && (
                <LineChart
                  key={game}
                  title={gameNames[game]}
                  data={chartData[game]!}
                />
              )
          )
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">
              No assessment data to display yet.
            </p>
            <p className="text-gray-600 text-sm">
              Complete pre-assessments in missions to see your performance
              graphs!
            </p>
          </div>
        )}
      </div>

      {/* AI Insights and Detailed Analytics */}
      {analyticsData && analyticsData.gameAnalytics.length > 0 && (
        <div className="lg:col-span-3 space-y-6">
          {analyticsData.gameAnalytics.map((analytics) => (
            <div
              key={analytics._id}
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-purple-500/30"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-orbitron text-purple-300">
                    {gameNames[analytics.gameType]} - Level {analytics.level}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {analytics.completionDate ? (
                      <>
                        Completed:{" "}
                        {new Date(
                          analytics.completionDate
                        ).toLocaleDateString()}
                      </>
                    ) : (
                      "Pre-assessment completed"
                    )}
                  </p>
                </div>
                <div className="text-right">
                  {analytics.improvementPercentage > 0 ? (
                    <>
                      <p className="text-2xl font-bold text-green-400">
                        +{analytics.improvementPercentage.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-400">Improvement</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xl font-bold text-blue-400">
                        Pre-Test Only
                      </p>
                      <p className="text-xs text-gray-400">
                        Complete post-test
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-900/50 p-3 rounded">
                  <p className="text-xs text-gray-400">Pre-Assessment</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {analytics.preAssessmentScore}%
                  </p>
                </div>
                <div className="bg-gray-900/50 p-3 rounded">
                  <p className="text-xs text-gray-400">Post-Assessment</p>
                  <p className="text-2xl font-bold text-teal-400">
                    {analytics.postAssessmentScore > 0
                      ? `${analytics.postAssessmentScore}%`
                      : "Pending"}
                  </p>
                </div>
                <div className="bg-gray-900/50 p-3 rounded">
                  <p className="text-xs text-gray-400">Success Rate</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {analytics.successRate.toFixed(1)}%
                  </p>
                </div>
              </div>

              {analytics.aiGeneratedInsights && (
                <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-4 rounded-lg mb-4">
                  <h4 className="text-sm font-semibold text-purple-300 mb-2">
                    🤖 AI Insights
                  </h4>
                  <p className="text-sm text-gray-300">
                    {analytics.aiGeneratedInsights}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analytics.strengthAreas.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-green-400 mb-2">
                      💪 Strengths
                    </h4>
                    <ul className="space-y-1">
                      {analytics.strengthAreas.map((area, i) => (
                        <li
                          key={i}
                          className="text-xs text-gray-300 flex items-start"
                        >
                          <span className="text-green-400 mr-1">✓</span> {area}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analytics.weakAreas.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-yellow-400 mb-2">
                      📚 Areas to Improve
                    </h4>
                    <ul className="space-y-1">
                      {analytics.weakAreas.map((area, i) => (
                        <li
                          key={i}
                          className="text-xs text-gray-300 flex items-start"
                        >
                          <span className="text-yellow-400 mr-1">!</span> {area}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analytics.skillsImproved.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-cyan-400 mb-2">
                      🎯 Skills Improved
                    </h4>
                    <ul className="space-y-1">
                      {analytics.skillsImproved.map((skill, i) => (
                        <li
                          key={i}
                          className="text-xs text-gray-300 flex items-start"
                        >
                          <span className="text-cyan-400 mr-1">↑</span> {skill}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {analytics.badgesEarned.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <h4 className="text-sm font-semibold text-yellow-300 mb-2">
                    🏆 Badges Earned
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analytics.badgesEarned.map((badge, i) => (
                      <span
                        key={i}
                        className="bg-yellow-500/20 text-yellow-300 text-xs px-3 py-1 rounded-full border border-yellow-500/30"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AnalyticsPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [allUsers, setAllUsers] = useState<User[] | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.role === "admin") {
      api.getAllUsers().then((users) => {
        setAllUsers(users);
        setLoading(false);
      });
    } else if (currentUser) {
      setSelectedUser(currentUser);
      setLoading(false);
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="min-h-screen p-4 md:p-8 animate-fade-in">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-orbitron text-purple-300">
            Analytics Dashboard
          </h1>
          <p className="text-gray-400">
            {currentUser.role === "admin"
              ? "Administrator View"
              : `Cadet: ${currentUser.email}`}
          </p>
        </div>
        <button
          onClick={() => navigate("/")}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-transform duration-200 hover:scale-105"
        >
          Back to Dashboard
        </button>
      </header>

      {currentUser.role === "admin" && (
        <div className="mb-6 bg-gray-800/50 p-4 rounded-lg border border-purple-500/30">
          <label
            htmlFor="user-select"
            className="block mb-2 text-sm font-medium text-gray-300"
          >
            Select User to View Analytics
          </label>
          <select
            id="user-select"
            onChange={(e) =>
              setSelectedUser(
                allUsers?.find((u) => u.email === e.target.value) || null
              )
            }
            className="bg-gray-900 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
          >
            <option value="">-- Select a User --</option>
            {allUsers?.map((u) => (
              <option key={u.email} value={u.email}>
                {u.email}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedUser ? (
        <UserAnalytics user={selectedUser} />
      ) : (
        currentUser.role === "admin" && (
          <div className="text-center text-gray-400">
            Please select a user to view their analytics.
          </div>
        )
      )}
    </div>
  );
};

export default AnalyticsPage;
