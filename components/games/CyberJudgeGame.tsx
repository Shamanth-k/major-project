import React, { useState, useEffect } from 'react';
import { CyberJudgeCase, PhishingDifficulty } from '../../types';
import { generateCyberJudgeCase, evaluateUserVerdict } from '../../services/aiService';
import AICharacter from '../AICharacter';
import { useAuth } from '../../App';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../LoadingSpinner';

interface CyberJudgeGameProps {
  onComplete: () => void;
  onLevelComplete: (levelNumber: number) => void;
}

const GavelIcon: React.FC<{ isStriking: boolean }> = ({ isStriking }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" 
        className={`w-12 h-12 text-yellow-600 transition-transform duration-300 ${isStriking ? 'rotate-[-45deg] translate-x-2 -translate-y-2' : 'rotate-0'}`}>
        <path fillRule="evenodd" d="M.75 2.25a.75.75 0 01.75.75v.54l1.838-.46a.75.75 0 01.662.032l5.25 2.625A.75.75 0 0110.5 6.75v.54l-1.838.46a.75.75 0 01-.662-.032L2.75 4.101A.75.75 0 012.25 3.54v-.54a.75.75 0 01-.75-.75.75.75 0 01-.75-.75zM12.75 2.25a.75.75 0 01.75.75v.54l1.838-.46a.75.75 0 01.662.032l5.25 2.625a.75.75 0 01.338.623v.54l-1.838.46a.75.75 0 01-.662-.032l-5.25-2.625a.75.75 0 01-.338-.624v-.54a.75.75 0 01.75-.75z" clipRule="evenodd" />
        <path d="M4.5 6.375a.75.75 0 01.75-.75h13.5a.75.75 0 010 1.5H5.25a.75.75 0 01-.75-.75zM4.5 8.625a.75.75 0 01.75-.75h13.5a.75.75 0 010 1.5H5.25a.75.75 0 01-.75-.75zM4.5 10.875a.75.75 0 01.75-.75h13.5a.75.75 0 010 1.5H5.25a.75.75 0 01-.75-.75zM4.5 13.125a.75.75 0 01.75-.75h13.5a.75.75 0 010 1.5H5.25a.75.75 0 01-.75-.75zM12 15.75a.75.75 0 00-.75.75v3a.75.75 0 001.5 0v-3a.75.75 0 00-.75-.75z" />
    </svg>
);


const CyberJudgeGame: React.FC<CyberJudgeGameProps> = ({ onComplete, onLevelComplete }) => {
    const [caseFile, setCaseFile] = useState<CyberJudgeCase | null>(null);
    const [loading, setLoading] = useState(true);
    const [userReasoning, setUserReasoning] = useState('');
    const [fullFeedback, setFullFeedback] = useState('');
    const [animatedFeedback, setAnimatedFeedback] = useState('');
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [verdictSubmitted, setVerdictSubmitted] = useState(false);
    const { user, completeLevel } = useAuth(); // using completeLevel from auth
    const [currentLevel, setCurrentLevel] = useState(user?.level || 1);
    const [difficulty, setDifficulty] = useState<PhishingDifficulty>('easy');
    const [isStriking, setIsStriking] = useState(false);
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
        const fetchCase = async () => {
            setLoading(true);
            setVerdictSubmitted(false);
            setUserReasoning('');
            const data = await generateCyberJudgeCase(currentLevel, difficulty);
            setCaseFile(data);
            setLoading(false);
            setFullFeedback(`Case #${currentLevel}: The court is in session. Review the evidence and deliver your verdict.`);
        };
        fetchCase();
    }, [currentLevel, difficulty]);

    const handleSubmit = async (verdict: 'Guilty' | 'Not Guilty') => {
        if (!caseFile) return;
        
        setIsStriking(true);
        setTimeout(() => setIsStriking(false), 300);

        setIsEvaluating(true);
        setFullFeedback("The jury is deliberating...");
        const aiFeedback = await evaluateUserVerdict(verdict, userReasoning, caseFile.suggestedVerdictWithReasoning);
        setFullFeedback(aiFeedback);
        setVerdictSubmitted(true);
        setIsEvaluating(false);
        // We pass the level to the parent, but completion is now handled by post-assessment
        onLevelComplete(currentLevel); 
        completeLevel('judge', currentLevel);
    };

    const handleNextCase = () => {
        if (currentLevel < 50) {
            setCurrentLevel(prev => prev + 1);
        } else {
            onComplete();
        }
    };
    
    const handleDifficultyChange = (d: PhishingDifficulty) => {
        setDifficulty(d);
    }

    if (loading) {
        return <div className="w-full max-w-5xl p-6 h-[80vh] flex items-center justify-center"><LoadingSpinner /></div>;
    }
    if (!caseFile) return <div>Error loading case.</div>;

    return (
        <div className="w-full max-w-5xl p-6 bg-gray-800/60 backdrop-blur-md rounded-2xl border border-gray-400/30 shadow-2xl shadow-gray-700/50 flex flex-col animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-orbitron text-gray-200">Cyber Judge</h1>
                 <button onClick={() => navigate('/')} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg text-sm">Back to Dashboard</button>
            </div>
             <div className="mb-4">
                <label className="block text-md font-orbitron text-gray-300 mb-2">Select Difficulty</label>
                <div className="flex bg-gray-900/50 rounded-lg p-1 border border-gray-700 max-w-sm">
                    {(['easy', 'medium', 'hard'] as PhishingDifficulty[]).map(d => (
                        <button key={d} onClick={() => handleDifficultyChange(d)} className={`flex-1 capitalize py-2 rounded-md text-sm font-semibold transition-all ${difficulty === d ? 'bg-gray-500 text-white' : 'hover:bg-gray-700'}`}>{d}</button>
                    ))}
                </div>
             </div>
            
            <div className="bg-gray-900/50 p-4 rounded-lg mb-4">
                <h2 className="text-xl font-orbitron text-yellow-500">{caseFile.caseTitle}</h2>
                <p className="text-gray-300 mt-1">{caseFile.caseSummary}</p>
            </div>

            <div className="flex-grow grid md:grid-cols-2 gap-4">
                <div className="bg-red-900/30 p-4 rounded-lg border border-red-700/50">
                    <h3 className="font-bold text-red-300 text-lg">Prosecution's Argument</h3>
                    <p className="text-gray-300 mt-2">{caseFile.prosecutionArgument}</p>
                </div>
                <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-700/50">
                    <h3 className="font-bold text-blue-300 text-lg">Defense's Argument</h3>
                    <p className="text-gray-300 mt-2">{caseFile.defenseArgument}</p>
                </div>
            </div>

            <div className="mt-4">
                {verdictSubmitted ? (
                    <div className="bg-gray-900/50 p-4 rounded-lg text-center">
                         <p className="text-gray-300 mt-2">The official verdict has been recorded. Listen to my summary.</p>
                        <div className="flex gap-4 justify-center">
                            <button onClick={handleNextCase} className="mt-4 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Next Case</button>
                            <button onClick={onComplete} className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg">End Session</button>
                             <button onClick={() => setFullFeedback(caseFile.suggestedVerdictWithReasoning)} className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg">Replay Verdict</button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <textarea value={userReasoning} onChange={(e) => setUserReasoning(e.target.value)} placeholder="State your reasoning for the verdict..." className="w-full h-24 bg-gray-900 p-2 rounded-md border border-gray-700 text-white mb-4" disabled={isEvaluating} />
                        <div className="flex items-center justify-center gap-4">
                            <button onClick={() => handleSubmit('Guilty')} disabled={isEvaluating} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg">Guilty</button>
                            <GavelIcon isStriking={isStriking} />
                            <button onClick={() => handleSubmit('Not Guilty')} disabled={isEvaluating} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg">Not Guilty</button>
                        </div>
                    </div>
                )}
            </div>
             <div className="mt-4 min-h-[50px]">
                <AICharacter isTalking={!!animatedFeedback} message={animatedFeedback} />
            </div>

        </div>
    );
};

export default CyberJudgeGame;