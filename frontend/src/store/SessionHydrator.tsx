"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setCredentials } from "@/store/authSlice";

export function SessionHydrator({ children }: { children: React.ReactNode }) {
    const dispatch = useDispatch();

    useEffect(() => {
        async function checkSession() {
            try {
                const res = await fetch("http://127.0.0.1:8000/me/", {
                    credentials: "include", 
                });
                
                if (res.ok) {
                    const data = await res.json();
                    dispatch(setCredentials(data.user));
                }
            } catch (error) {
                console.error("Session check failed", error);
            }
        }
        checkSession();
    }, [dispatch]);

    return <>{children}</>;
}