"use client";

import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { logout } from '@/store/authSlice';
import Link from "next/link";

export default function Header() {
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();

    const handleLogout = async () => {
        try {
            const response = await fetch('http://127.0.0.1:8000/logout/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: "include"
            });

            if (response.ok) {
                dispatch(logout());
            } else {
                throw new Error("Logout failed");
            }
        } catch (error: any) {
            alert(error.message);
        }
    };

    return (
        <header className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md">
            <Link href="/" className="text-2xl font-bold tracking-tight hover:text-blue-100 transition-colors">
                Booking Marketplace
            </Link>
            
            <nav>
                {isAuthenticated ? (
                    <div className="flex items-center gap-6">
                        <span className="font-medium text-blue-50">Welcome, {user?.username}</span>
                        <button 
                            onClick={handleLogout} 
                            className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors text-sm font-semibold shadow-sm"
                        >
                            Logout
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="hover:text-blue-200 transition-colors font-medium">
                            Log In
                        </Link>
                        <Link href="/register" className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors text-sm font-bold shadow-sm">
                            Sign Up
                        </Link>
                    </div>
                )}
            </nav>
        </header>
    );
}