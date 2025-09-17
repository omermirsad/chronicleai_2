// Fix: Import React and FC type
import React, { FC } from 'react';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';
import { BookOpenIcon } from './Icons';

// Fix: Use FC type for functional component
const Auth: FC = () => {
  return (
    <div className="min-h-screen bg-rose-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full mx-auto">
        <div className="flex justify-center items-center gap-2 mb-8">
            <BookOpenIcon className="w-10 h-10 text-rose-600"/>
            <h1 className="text-3xl font-bold text-stone-800 tracking-tight">Chronicle AI</h1>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-md border border-stone-200">
            <h2 className="text-2xl font-bold text-center text-stone-800 mb-2">Welcome</h2>
            <p className="text-center text-stone-600 mb-6">Sign in to continue your journey of self-reflection.</p>
            <SupabaseAuth
              supabaseClient={supabase}
              appearance={{ 
                theme: ThemeSupa,
                style: {
                    button: {
                        background: 'rgb(244 63 94)',
                        color: 'white',
                        borderColor: 'rgb(244 63 94)',
                    },
                    anchor: {
                        color: 'rgb(220 38 38)'
                    }
                }
               }}
              providers={['google', 'github']}
              theme="light"
              socialLayout="horizontal"
            />
        </div>
      </div>
    </div>
  );
};

export default Auth;
