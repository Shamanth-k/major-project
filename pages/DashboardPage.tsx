import React, { useState, useEffect } from "react";
import { useAuth } from "../App";
import { useNavigate } from "react-router-dom";
import { GameType } from "../types";
import ChatBot from "../components/ChatBot";
import * as api from "../services/apiService";

const GamePlanet: React.FC<{
  level: number | string;
  title: string;
  gameId: GameType;
  planetClass: string;
  onClick: (id: GameType) => void;
}> = ({ level, title, gameId, planetClass, onClick }) => (
  <div
    className="flex flex-col items-center my-16 group cursor-pointer"
    onClick={() => onClick(gameId)}
  >
    <div
      className={`relative w-48 h-48 md:w-64 md:h-64 preserve-3d group-hover:animate-pulse`}
    >
      <div
        className={`w-full h-full rounded-full ${planetClass} transition-all duration-500 transform group-hover:scale-110`}
      ></div>
    </div>
    <h3 className="mt-4 text-xl font-orbitron text-white">
      {typeof level === "number" ? `Mission Hub` : level}
    </h3>
    <p className="text-purple-300">{title}</p>
  </div>
);

const UserDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await api.getLeaderboard();
        setLeaderboard(data.leaderboard || []);
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      } finally {
        setLoadingLeaderboard(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const handleGameSelect = (id: GameType) => {
    navigate(`/game/${id}`);
  };

  const handleLogout = () => {
    logout();
  };

  const handleAnalyticsClick = () => {
    navigate("/analytics");
  };

  return (
    <div className="p-4 md:p-8 relative">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-orbitron">Welcome, Cadet</h1>
          <p className="text-purple-400 text-sm">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-transform duration-200 hover:scale-105"
        >
          Logout
        </button>
      </header>

      <div className="flex flex-col md:flex-row mt-8 gap-8">
        <main className="w-full md:w-3/4">
          <h2 className="text-2xl font-orbitron mb-4 text-center">
            Select Mission
          </h2>
          <div className="h-[70vh] overflow-y-auto no-scrollbar perspective-container">
            <div className="flex flex-col-reverse items-center justify-start">
              <GamePlanet
                level={user?.level || 1}
                title="Phishing Detective"
                gameId="phishing"
                planetClass="bg-gradient-to-br from-blue-400 to-purple-600 shadow-lg shadow-purple-500/50"
                onClick={handleGameSelect}
              />
              <GamePlanet
                level={(user?.level || 1) + 1}
                title="Legal Loophole"
                gameId="loophole"
                planetClass="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 shadow-lg shadow-orange-500/50"
                onClick={handleGameSelect}
              />
              <GamePlanet
                level={(user?.level || 1) + 2}
                title="Cyber Judge"
                gameId="judge"
                planetClass="bg-gradient-to-br from-gray-200 to-gray-500 shadow-lg shadow-gray-400/50"
                onClick={handleGameSelect}
              />
              <GamePlanet
                level={(user?.level || 1) + 3}
                title="Legislation Architect"
                gameId="architect"
                planetClass="bg-gradient-to-br from-green-300 to-teal-600 shadow-lg shadow-green-500/50"
                onClick={handleGameSelect}
              />
              <GamePlanet
                level="Educational"
                title="Learn Laws"
                gameId="laws"
                planetClass="bg-gradient-to-br from-indigo-400 to-cyan-600 shadow-lg shadow-cyan-500/50"
                onClick={handleGameSelect}
              />
            </div>
          </div>
        </main>
        <aside className="w-full md:w-1/4 p-4 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-purple-500/30 flex flex-col">
          <h2 className="text-xl font-orbitron mb-4">Cadet Profile</h2>
          <div className="space-y-4 flex-grow">
            <div>
              <h3 className="font-semibold">Overall Level</h3>
              <p className="text-3xl font-orbitron text-purple-400">
                {user?.level}
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Badges Earned</h3>
              <div className="flex flex-wrap gap-2 mt-2 max-h-48 overflow-y-auto no-scrollbar">
                {user?.badges && user.badges.length > 0 ? (
                  user.badges.map((badge) => (
                    <span
                      key={badge}
                      className="bg-purple-500 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full"
                    >
                      {badge}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">No badges yet.</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold">Leaderboard</h3>
              {loadingLeaderboard ? (
                <p className="text-sm text-gray-400 mt-2">Loading...</p>
              ) : leaderboard.length > 0 ? (
                <ul className="text-sm text-gray-300 mt-2 space-y-1">
                  {leaderboard.map((entry) => (
                    <li
                      key={entry.rank}
                      className={
                        entry.isCurrentUser
                          ? "text-purple-300 font-semibold"
                          : ""
                      }
                    >
                      {entry.rank}.{" "}
                      {entry.isCurrentUser
                        ? `${entry.email} (You)`
                        : entry.email}{" "}
                      - Lvl {entry.level}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 mt-2">No users yet.</p>
              )}
            </div>
          </div>
          <button
            onClick={handleAnalyticsClick}
            className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-transform duration-200 hover:scale-105"
          >
            View Full Analytics
          </button>
        </aside>
      </div>
      <ChatBot />
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="p-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-orbitron">Admin Panel</h1>
          <p className="text-purple-400 text-sm">{user?.email}</p>
        </div>
        <button
          onClick={logout}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-transform duration-200 hover:scale-105"
        >
          Logout
        </button>
      </header>
      <div className="mt-8 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-purple-500/30 p-6">
        <h2 className="text-xl font-orbitron mb-4">User Analytics Overview</h2>
        <p className="text-gray-400 mb-4">
          This table shows a brief overview. For detailed graphs and performance
          metrics, please visit the full analytics dashboard.
        </p>
        <button
          onClick={() => navigate("/analytics")}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition-transform duration-200 hover:scale-105"
        >
          Go to Full Analytics Dashboard
        </button>
      </div>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === "admin") {
    return <AdminDashboard />;
  }
  return <UserDashboard />;
};

export default DashboardPage;
