import React, { useState, useEffect } from 'react';

interface AICharacterProps {
  isTalking: boolean;
  message: string;
}

const AICharacter: React.FC<AICharacterProps> = ({ isTalking, message }) => {
  const [mouthPath, setMouthPath] = useState("M 40 70 L 60 70"); // Neutral mouth
  const [isBlinking, setIsBlinking] = useState(false);

  const talkingMouths = [
    "M 40 70 Q 50 75 60 70", // Slight curve
    "M 40 70 Q 50 80 60 70", // Open
    "M 45 70 Q 50 72 55 70", // 'o' shape
    "M 40 70 Q 50 75 60 70", // Slight curve
  ];

  useEffect(() => {
    let mouthInterval: number;
    let mouthIndex = 0;
    if (isTalking && message) {
      mouthInterval = window.setInterval(() => {
        setMouthPath(talkingMouths[mouthIndex]);
        mouthIndex = (mouthIndex + 1) % talkingMouths.length;
      }, 150); // Change mouth shape every 150ms for a smoother cycle
    } else {
      setMouthPath("M 40 70 L 60 70"); // Reset to neutral
    }

    return () => {
      if (mouthInterval) {
        clearInterval(mouthInterval);
      }
    };
  }, [isTalking, message]);
  
  useEffect(() => {
    // Random blinking interval
    const blinkInterval = setInterval(() => {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 150); // Blink duration
    }, Math.random() * 4000 + 2000); // Blink every 2-6 seconds

    return () => clearInterval(blinkInterval);
  }, []);


  return (
    <div className="flex items-end space-x-4 animate-float">
      <div className="relative">
        <svg width="100" height="100" viewBox="0 0 100 100" className="drop-shadow-lg">
          {/* Head */}
          <circle cx="50" cy="50" r="45" fill="url(#grad1)" stroke="#9F7AEA" strokeWidth="3" />
          <defs>
            <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" style={{ stopColor: '#a78bfa', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#6b21a8', stopOpacity: 1 }} />
            </radialGradient>
          </defs>

          {/* Eye */}
          <circle cx="50" cy="45" r="15" fill="#f0e6ff" />
          <circle cx="50" cy="45" r="8" fill="#1e293b" className={isBlinking ? 'hidden' : 'animate-pulse'}/>
          <circle cx="52" cy="42" r="3" fill="white" className={isBlinking ? 'hidden' : ''}/>

          {/* Eyelid for blinking */}
          <path d="M 35 45 Q 50 50 65 45" stroke="#6b21a8" strokeWidth="3" fill="#6b21a8" strokeLinecap="round" className={isBlinking ? '' : 'hidden'} />

          {/* Mouth */}
           <path d={mouthPath} stroke="#f0e6ff" strokeWidth="3" strokeLinecap="round" className="transition-all duration-100 ease-in-out" />
        </svg>
      </div>
      {message && (
        <div className="bg-purple-800/80 backdrop-blur-sm text-white p-5 rounded-lg rounded-bl-none max-w-sm border border-purple-500/50">
          <p className="text-base">{message}</p>
        </div>
      )}
    </div>
  );
};

export default AICharacter;