import React, { useState } from 'react';
import { useAuth } from '../App';
import { Link, useNavigate } from 'react-router-dom';
import * as api from '../services/apiService';

const GoogleIcon = () => (
    <svg className="w-4 h-4 mr-2" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
        <path fill="currentColor" d="M488 261.8C488 403.3 381.5 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-72.2 72.2C322 108.8 286.7 96 248 96c-88.8 0-160 71.2-160 160s71.2 160 160 160c94.4 0 135.3-72.4 140.8-109.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
    </svg>
);

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && password.trim()) {
      setIsLoading(true);
      setError(null);
      try {
        await api.signupUser(email, password);
        // FIX: The 'login' function requires a 'role' argument. Since this is the signup page, the role is always 'user'.
        await login(email, password, 'user');
        navigate('/');
      } catch (err: any) {
        setError(err.message || 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleGoogleSignup = async () => {
      setIsGoogleLoading(true);
      setError(null);
      try {
          await loginWithGoogle(); // The API should handle signup/login in one go
      } catch (err: any) {
          setError(err.message || "Google signup failed.");
      } finally {
          setIsGoogleLoading(false);
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl shadow-purple-500/20 border border-purple-500/30">
        <div className="text-center">
          <h1 className="text-4xl font-bold font-orbitron text-purple-400">CREATE ACCOUNT</h1>
          <p className="mt-2 text-gray-300">Join the Aetherium Guard.</p>
        </div>

        {error && <p className="text-center text-red-400 bg-red-900/50 p-3 rounded-lg animate-fade-in">{error}</p>}

        <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="relative">
                <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="peer bg-gray-900/50 border border-gray-700 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 placeholder-transparent" placeholder="Email Address" />
                <label htmlFor="email" className="absolute text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-gray-800 px-2 peer-focus:px-2 peer-focus:text-purple-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-1">Email Address</label>
            </div>
            <div className="relative">
                <input id="password" name="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="peer bg-gray-900/50 border border-gray-700 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 placeholder-transparent" placeholder="Password"/>
                <label htmlFor="password" className="absolute text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-gray-800 px-2 peer-focus:px-2 peer-focus:text-purple-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-1">Password</label>
            </div>
            <div>
                <button type="submit" disabled={isLoading || isGoogleLoading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-gray-900 transition-transform duration-200 hover:scale-105 disabled:opacity-50">
                    {isLoading ? <span className="w-5 h-5 border-2 border-dashed border-white rounded-full animate-spin"></span> : 'Create Account'}
                </button>
            </div>
        </form>

        <div className="flex items-center justify-center space-x-2">
            <hr className="w-full border-gray-600"/>
            <span className="text-gray-400 text-xs">OR</span>
            <hr className="w-full border-gray-600"/>
        </div>

        <button onClick={handleGoogleSignup} disabled={isLoading || isGoogleLoading} className="group relative w-full flex justify-center items-center py-3 px-4 border border-gray-600 text-sm font-medium rounded-md text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-900 transition-transform duration-200 hover:scale-105 disabled:opacity-50">
            {isGoogleLoading ? <span className="w-5 h-5 border-2 border-dashed border-white rounded-full animate-spin"></span> : <><GoogleIcon /> Sign up with Google</>}
        </button>

        <p className="text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-purple-400 hover:text-purple-300">
                Log In
            </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
