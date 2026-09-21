"use client";

import AuthForm from "@/components/AuthForm";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RegisterPage() {
    const {isAuthenticated} = useSelector((state: RootState) => state.auth);
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated) {
            router.replace("/");
        }
    }, [isAuthenticated, router]);

    if (isAuthenticated) return null;

    return (
        <main className="min-h-[calc(100vh-72px)] flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md">
                <AuthForm isLogin={false} />
            </div>
        </main>
    );
}