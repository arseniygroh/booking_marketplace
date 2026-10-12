"use client";
import { useState, useEffect } from "react";
import { BookingTimerProps } from "@/types";

export default function BookingTimer({createdAt, onExpire}: BookingTimerProps) {
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const expirationTime = new Date(createdAt).getTime() + 5 * 60 * 1000;

        const updateTimer = () => {
            const now = new Date().getTime();
            const difference = expirationTime - now;

            if (difference <= 0) {
                setTimeLeft(0);
                setIsExpired(true);
                onExpire();
            } else {
                setTimeLeft(Math.floor(difference / 1000));
            }
        };

        updateTimer();
        const intervalId = setInterval(updateTimer, 1000);

        return () => clearInterval(intervalId);
    }, [createdAt, onExpire]);

    if (isExpired) {
        return <span className="text-red-600 font-bold text-sm">Expired</span>;
    }

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const isWarning = timeLeft < 60;

    return (
        <div className={`flex items-center gap-1.5 font-mono font-bold text-sm ${isWarning ? 'text-red-600 animate-pulse' : 'text-amber-600'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
    );
}