import React, { useState, useEffect } from 'react';
import { LegislationSimulation, PhishingDifficulty } from '../../types';
import { generateLegislationSimulation } from '../../services/aiService';
import AICharacter from '../AICharacter';
import { useAuth } from '../../App';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../LoadingSpinner';

interface LegislationArchitectGameProps {
  onComplete: () => void;
}

const LegislationArchitectGame: React.FC<LegislationArchitectGameProps> = ({ onComplete }) => {
    const [userLaw, setUserLaw] = useState('');
    const [simulation, setSimulation] = useState<LegislationSimulation | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [fullFeedback, setFullFeedback] = useState('Welcome, Architect. Propose a new law for the nation. I will simulate its potential impact.');
    const [animatedFeedback, setAnimatedFeedback] = useState('');
    const [difficulty, setDifficulty] = useState<PhishingDifficulty>('easy');

    const { user } = useAuth();
    const navigate = useNavigate();
    
    useEffect(() => {
        if (fullFeedback) {
            setAnimatedFeedback('');
            let i = 0;
            const interval = setInterval(() => {
                if (i < fullFeedback.length) {
                    setAnimatedFeedback(prev => fullFeedback.substring(0, i + 1));
                    i++;
                } else {
                    clearInterval(interval);
                }
            }, 25);
            return () => clearInterval(interval);
        }
    }, [fullFeedback]);

    const handleSubmit = async () => {
        if (!userLaw.trim()) {
            setFullFeedback("You must propose a law first.");
            return;
        }
        setIsLoading(true);
        setSimulation(null);
        setFullFeedback("Running complex socio-economic simulations... This may take a moment.");
        const result = await generateLegislationSimulation(userLaw, user?.level || 1, difficulty);
        setSimulation(result);
        setIsLoading(false);
        setFullFeedback(`The simulation for "${result.title}" is complete. Here are the projected outcomes...`);
    };
    
    const handleShowSimulation = (year: 'one' | 'five' | 'twenty') => {
        if(simulation) {
            if (year === 'one') setFullFeedback(`Year One: ${simulation.yearOne}`);
            if (year === 'five') setFullFeedback(`Year Five: ${simulation.yearFive}`);
            if (year === 'twenty') setFullFeedback(`Year Twenty: ${simulation.yearTwenty}`);
        }
    }
    
    const handleNewLaw = () => {
        setSimulation(null);
        setUserLaw('');
        setFullFeedback('A new legislative session has begun. Propose your next law.');
    }

    return (
        <div className="w-full max-w-4xl p-6 bg-gray-800/60 backdrop-blur-md rounded-2xl border border-green-500/30 shadow-2xl shadow-green-900/50 flex flex-col animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-orbitron text-green-300">Legislation Architect</h1>
                <button onClick={() => navigate('/')} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg text-sm">Back to Dashboard</button>
            </div>
            
            <div className="mb-4 min-h-[50px]">
                <AICharacter isTalking={!!animatedFeedback} message={animatedFeedback} />
            </div>

            <div className="bg-gray-900/50 p-4 rounded-lg">
                 <textarea
                    value={userLaw}
                    onChange={(e) => setUserLaw(e.target.value)}
                    placeholder="e.g., 'Mandate that all rooftops must be painted white to reflect sunlight.'"
                    className="w-full h-28 bg-gray-900 p-2 rounded-md border border-gray-700 text-white mb-4"
                    disabled={isLoading}
                />
                 <div className="mb-4">
                    <label className="block text-sm font-orbitron text-gray-300 mb-2">Simulation Complexity</label>
                    <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-600">
                        {(['easy', 'medium', 'hard'] as PhishingDifficulty[]).map(d => (
                            <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 capitalize py-2 rounded-md text-xs font-semibold transition-all ${difficulty === d ? 'bg-green-600 text-white' : 'hover:bg-gray-700'}`}>{d}</button>
                        ))}
                    </div>
                </div>
                <button onClick={handleSubmit} disabled={isLoading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50">
                    {isLoading ? 'Simulating...' : 'Enact Law & See Consequences'}
                </button>
            </div>

            <div className="mt-6 flex-grow">
                {isLoading && <LoadingSpinner />}
                {simulation && (
                    <div className="space-y-4 animate-fade-in text-center">
                        <h2 className="text-2xl font-orbitron text-center text-green-400">{simulation.title}</h2>
                        <p className="text-gray-400">Select a time period to review my simulation findings.</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => handleShowSimulation('one')} className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg">Year 1</button>
                            <button onClick={() => handleShowSimulation('five')} className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg">Year 5</button>
                            <button onClick={() => handleShowSimulation('twenty')} className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg">Year 20</button>
                        </div>
                         <div className="flex justify-center gap-4 mt-4">
                             <button onClick={handleNewLaw} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Propose New Law</button>
                             <button onClick={onComplete} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg">End Session</button>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default LegislationArchitectGame;