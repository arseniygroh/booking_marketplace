"use client";

import { useActionState, useEffect } from 'react';
import { FormState } from '@/types';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@/store/authSlice';
import { useRouter } from 'next/navigation';

async function loginAction(prevState: FormState, formData: FormData): Promise<FormState> {
    try {
        const email = formData.get("email");
        const password = formData.get("password");
        const payload = { email, password };
        
        const res = await fetch('http://localhost:8000/login/', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(payload),
        });
        
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Login failed");
        }

        return {
            success: true,
            message: data.message,
            user: data.user
        };

    } catch (e: any) {
        return {
            success: false,
            message: e.message,
            user: null,
        };
    }
}

async function registerAction(prevState: FormState, formData: FormData): Promise<FormState> {
    try {
        const email = formData.get("email");
        const username = formData.get("username");
        const password = formData.get("password");
        const confirmPassword = formData.get("confirmPassword");

        const payload = { email, username, password, confirmPassword };
        
        const res = await fetch('http://localhost:8000/register/', { 
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Registration failed");
        }

        return {
            success: true,
            message: data.message,
            user: data.user,
        };
    } catch (e: any) {
        return {
            success: false,
            message: e.message,
            user: null,
        };
    }
}

const initialState: FormState = { success: null, message: "", user: null };

export default function AuthForm({ isLogin }: { isLogin: boolean }) {
    const [state, formAction, isPending] = useActionState(isLogin ? loginAction : registerAction, initialState);
    const dispatch = useDispatch();
    const router = useRouter();

    useEffect(() => {
        if (state.success && state.user) {
            dispatch(setCredentials(state.user));
            router.push("/");
        }
    }, [state, dispatch, router]);

    return (
        <div className="w-full max-w-md mx-auto mt-12 bg-white p-8 border border-gray-200 rounded-2xl shadow-lg">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">
                {isLogin ? "Welcome back" : "Create an account"}
            </h2>

            <form action={formAction} className="space-y-5">
                {!isLogin && (
                    <div>
                        <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-1">
                            Your Name
                        </label>
                        <input 
                            type="text" 
                            id='username' 
                            name='username' 
                            required 
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                            placeholder="John Doe"
                        />
                    </div>
                )}
                
                <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                        Email Address
                    </label>
                    <input 
                        id='email' 
                        type="email" 
                        name='email' 
                        required 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                        placeholder="you@example.com"
                    />
                </div>
                
                <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
                        Password
                    </label>
                    <input 
                        id='password' 
                        type="password" 
                        name='password' 
                        required 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                        placeholder="••••••••"
                    />
                </div>

                {!isLogin && (
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-1">
                            Confirm Password
                        </label>
                        <input 
                            id='confirmPassword' 
                            type="password" 
                            name='confirmPassword' 
                            required 
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                )}

                <button 
                    type='submit' 
                    disabled={isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed mt-4"
                >
                    {isPending ? "Submitting..." : (isLogin ? "Log In" : "Sign Up")}
                </button>
            </form>
            {state.message && (
                <div className={`mt-6 p-4 rounded-lg text-sm font-medium ${
                    state.success 
                        ? "bg-green-50 text-green-800 border border-green-200" 
                        : "bg-red-50 text-red-800 border border-red-200"
                }`}>
                    {state.message}
                </div>
            )}
        </div>    
    );
}