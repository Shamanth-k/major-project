import React from 'react';

const LoadingSpinner: React.FC<{ message?: string; className?: string }> = ({ message, className }) => (
  <div className={`flex flex-col items-center justify-center text-center p-4 ${className}`}>
    <div className="relative w-32 h-32 flex items-center justify-center">
      <div className="absolute inset-0 border border-indigo-400/40 rounded-lg" />
      <div className="w-12 h-12 border-4 border-dashed border-purple-400 rounded-full animate-spin" />
    </div>
    {message && <p className="mt-4 text-purple-300 font-orbitron">{message}</p>}
  </div>
);

export default LoadingSpinner;
