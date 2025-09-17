// Fix: Import React types FC, useState, FormEvent
import React, { useState, FC, FormEvent } from 'react';
import { BookOpenIcon, GithubIcon, GoogleIcon, AppleIcon } from './Icons';
import { User } from '../types';

interface AuthProps {
  onAuthSuccess: (user: User) => void;
}

// Fix: Use FC type for functional component
const Auth: FC<AuthProps> = ({ onAuthSuccess }) => {
  // Fix: Add generic type to useState
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateInputs = () => {
    // Email validation
    if (!email.trim()) {
      return "Email address is required.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address.";
    }
  
    // Password validation
    if (!password.trim()) {
      return "Password is required.";
    }
  
    // Stricter validation for sign-up
    if (isSignUp) {
      if (password.length < 8) {
        return "Password must be at least 8 characters long.";
      }
      if (!/[a-z]/.test(password)) {
        return "Password must contain at least one lowercase letter.";
      }
      if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter.";
      }
      if (!/[0-9]/.test(password)) {
        return "Password must contain at least one number.";
      }
      if (!/[^a-zA-Z0-9]/.test(password)) {
          return "Password must contain at least one special character (e.g., !@#$%).";
      }
    }
    
    return null; // No errors
  };

  const handleAuth = async (provider: 'email' | 'github' | 'google' | 'apple') => {
    setIsLoading(true);
    setError(null);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In a real app, you'd have different logic for each provider.
    // Here, we just mock a successful login.
    switch (provider) {
        case 'email':
            if (isSignUp) {
                console.log("Mock sign up successful with:", email);
                onAuthSuccess({ id: new Date().toISOString(), email });
            } else {
                // Mock sign-in logic
                if (email === 'test@example.com' && password === 'password') {
                    console.log("Mock sign in successful for:", email);
                    onAuthSuccess({ id: '123', email: 'test@example.com' });
                } else {
                    setError("Invalid email or password.");
                }
            }
            break;
        case 'github':
            console.log("Mock GitHub sign in successful.");
            onAuthSuccess({ id: 'gh-456', email: 'github-user@example.com' });
            break;
        case 'google':
             console.log("Mock Google sign in successful.");
            onAuthSuccess({ id: 'goog-789', email: 'google-user@example.com' });
            break;
        case 'apple':
            console.log("Mock Apple sign in successful.");
            onAuthSuccess({ id: 'appl-012', email: 'apple-user@example.com' });
            break;
    }

    setIsLoading(false);
  }

  // Fix: Use FormEvent type for event parameter
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }
    handleAuth('email');
  };

  return (
    <div className="min-h-screen bg-rose-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full mx-auto">
        <div className="flex justify-center items-center gap-2 mb-8">
            <BookOpenIcon className="w-10 h-10 text-rose-600"/>
            <h1 className="text-3xl font-bold text-stone-800 tracking-tight">Chronicle AI</h1>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-md border border-stone-200">
            <h2 className="text-2xl font-bold text-center text-stone-800 mb-2">{isSignUp ? 'Create an Account' : 'Welcome Back'}</h2>
            <p className="text-center text-stone-600 mb-6">{isSignUp ? 'Start your journey of self-reflection.' : 'Sign in to continue your journal.'}</p>
            
            {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</p>}
            
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1">Email address</label>
                    <input 
                        type="email" 
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                        required
                        autoComplete="email"
                    />
                </div>
                <div className="mb-6">
                     <div className="flex items-center justify-between mb-1">
                        <label htmlFor="password"  className="block text-sm font-medium text-stone-700">Password</label>
                        {!isSignUp && (
                            <button type="button" onClick={() => alert("Forgot Password functionality to be implemented.")} className="text-sm font-medium text-rose-600 hover:text-rose-500">
                                Forgot password?
                            </button>
                        )}
                    </div>
                    <input 
                        type="password" 
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                        required
                        autoComplete={isSignUp ? "new-password" : "current-password"}
                    />
                </div>
                <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-rose-500 text-white font-bold py-2 px-4 rounded-md hover:bg-rose-600 transition duration-300 disabled:bg-rose-300 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                </button>
            </form>
            
            <div className="mt-6">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-stone-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-stone-500">Or continue with</span>
                    </div>
                </div>

                <div className="mt-6 space-y-3">
                    <button 
                        onClick={() => handleAuth('github')} 
                        disabled={isLoading}
                        className="w-full flex justify-center items-center gap-3 py-2 px-4 border border-stone-300 rounded-md shadow-sm text-sm font-medium text-stone-700 bg-white hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <GithubIcon className="w-5 h-5" />
                        Continue with GitHub
                    </button>
                    <button 
                        onClick={() => handleAuth('google')} 
                        disabled={isLoading}
                        className="w-full flex justify-center items-center gap-3 py-2 px-4 border border-stone-300 rounded-md shadow-sm text-sm font-medium text-stone-700 bg-white hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <GoogleIcon className="w-5 h-5" />
                        Continue with Google
                    </button>
                    <button 
                        onClick={() => handleAuth('apple')} 
                        disabled={isLoading}
                        className="w-full flex justify-center items-center gap-3 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <AppleIcon className="w-5 h-5" />
                        Continue with Apple
                    </button>
                </div>
            </div>

            <p className="mt-8 text-center text-sm text-stone-600">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                <button onClick={() => { setIsSignUp(!isSignUp); setError(null); }} className="font-medium text-rose-600 hover:text-rose-500 ml-1">
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
