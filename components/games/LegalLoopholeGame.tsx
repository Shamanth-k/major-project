import React, { useState, useEffect } from 'react';
import { LegalLoopholeContent, PhishingDifficulty } from '../../types';
import { generateLegalLoophole, evaluateUserLoopholeResponse } from '../../services/aiService';
import AICharacter from '../AICharacter';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import LoadingSpinner from '../LoadingSpinner';

interface LegalLoopholeGameProps {
  onComplete: () => void;
  onLevelComplete: (levelNumber: number) => void;
}

const LegalLoopholeGame: React.FC<LegalLoopholeGameProps> = ({ onComplete, onLevelComplete }) => {
    const [content, setContent] = useState<LegalLoopholeContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [userLoophole, setUserLoophole] = useState('');
    const [userFix, setUserFix] = useState('');
    const [fullFeedback, setFullFeedback] = useState('');
    const [animatedFeedback, setAnimatedFeedback] = useState('');
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);
    const { user } = useAuth();
    const [currentLevel, setCurrentLevel] = useState(user?.level || 1);
    const [difficulty, setDifficulty] = useState<PhishingDifficulty>('easy');
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

    useEffect(() => {
        const fetchContent = async () => {
            setLoading(true);
            setIsFlipped(false);
            setUserLoophole('');
            setUserFix('');
            const data = await generateLegalLoophole(currentLevel, difficulty);
            setContent(data);
            setLoading(false);
            setFullFeedback(`Level ${currentLevel} Case File: Review the following statute and identify any exploitable loopholes.`);
        };
        fetchContent();
    }, [currentLevel, difficulty]);

    const handleSubmit = async () => {
        if (!content) return;
        setIsEvaluating(true);
        setFullFeedback("Consulting legal archives...");
        const aiFeedback = await evaluateUserLoopholeResponse(userLoophole, content.loopholeExplanation);
        setFullFeedback(aiFeedback);
        setIsFlipped(true);
        setIsEvaluating(false);
        onLevelComplete(currentLevel);
    };
    
    const handleNextLevel = () => {
        if (currentLevel < 50) {
            setCurrentLevel(prev => prev + 1);
        } else {
            onComplete();
        }
    };
    
    const handleAnalysisReveal = () => {
        if (content) {
            setFullFeedback(`The loophole is: ${content.loopholeExplanation} My suggestion to fix it would be: ${content.fixSuggestion}`);
        }
    };

    const handleDifficultyChange = (d: PhishingDifficulty) => {
        setDifficulty(d);
    }

    if (loading) {
        return <div className="w-full max-w-4xl p-6 h-[80vh] flex items-center justify-center"><LoadingSpinner /></div>;
    }

    if (!content) return <div>Error loading game.</div>;

    return (
        <div className="w-full max-w-4xl p-6 bg-gray-800/60 backdrop-blur-md rounded-2xl border border-yellow-500/30 shadow-2xl shadow-yellow-900/50 flex flex-col animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-orbitron text-yellow-300">Legal Loophole</h1>
                <button onClick={() => navigate('/')} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg text-sm">Back to Dashboard</button>
            </div>
            <div className="mb-4">
                <label className="block text-md font-orbitron text-gray-300 mb-2">Select Difficulty</label>
                <div className="flex bg-gray-900/50 rounded-lg p-1 border border-gray-700 max-w-sm">
                    {(['easy', 'medium', 'hard'] as PhishingDifficulty[]).map(d => (
                        <button key={d} onClick={() => handleDifficultyChange(d)} className={`flex-1 capitalize py-2 rounded-md text-sm font-semibold transition-all ${difficulty === d ? 'bg-yellow-600 text-white' : 'hover:bg-gray-700'}`}>{d}</button>
                    ))}
                </div>
             </div>
            <div className="flex-grow flex flex-col md:flex-row gap-6 min-h-[60vh]">
                 <div className="md:w-1/2 flex flex-col perspective-container">
                    <div className={`relative w-full h-full preserve-3d transition-transform duration-700 ${isFlipped ? 'rotate-y-180' : ''}`}>
                        {/* Front */}
                        <div className="absolute w-full h-full backface-hidden bg-gray-900/70 p-4 rounded-lg flex flex-col justify-between">
                            <div>
                                <h3 className="font-bold text-yellow-400 text-lg border-b border-yellow-800 pb-2 mb-2">Statute #{currentLevel}</h3>
                                <p className="text-gray-300 whitespace-pre-wrap overflow-y-auto no-scrollbar max-h-[40vh]">{content.lawText}</p>
                            </div>
                            <div className="mt-4">
                                <textarea value={userLoophole} onChange={e => setUserLoophole(e.target.value)} placeholder="Identify the loophole..." className="w-full h-20 bg-gray-900 p-2 rounded-md border border-gray-700 text-white mb-2"/>
                                <textarea value={userFix} onChange={e => setUserFix(e.target.value)} placeholder="Suggest a fix..." className="w-full h-20 bg-gray-900 p-2 rounded-md border border-gray-700 text-white"/>
                            </div>
                        </div>
                        {/* Back */}
                        <div className="absolute w-full h-full backface-hidden bg-gray-900/70 p-4 rounded-lg rotate-y-180 flex flex-col justify-between items-center text-center">
                             <div>
                                <h3 className="font-bold text-yellow-400 text-lg border-b border-yellow-800 pb-2 mb-2">Official Analysis</h3>
                                <p className="text-gray-300 mt-4">Listen to my report for the official legal analysis and suggested fix.</p>
                                <button onClick={handleAnalysisReveal} className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg">Replay Analysis</button>
                             </div>
                             <button onClick={handleNextLevel} className="mt-4 w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg">Proceed to Case #{currentLevel + 1}</button>
                        </div>
                    </div>
                 </div>
                 <div className="md:w-1/2 flex flex-col justify-between">
                    <div className="mb-4 min-h-[100px]">
                        <AICharacter isTalking={!!animatedFeedback} message={animatedFeedback} />
                    </div>
                    {!isFlipped ? (
                        <button onClick={handleSubmit} disabled={isEvaluating} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50">
                            {isEvaluating ? 'Analyzing...' : 'Submit Analysis'}
                        </button>
                    ) : (
                         <button onClick={onComplete} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg">End Session & See Report</button>
                    )}
                 </div>
            </div>
        </div>
    );
};

export default LegalLoopholeGame;