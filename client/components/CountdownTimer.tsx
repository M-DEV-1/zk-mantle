"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
    endTime: Date | string;
    onExpire?: () => void;
    className?: string;
}

export function CountdownTimer({ endTime, onExpire, className }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const end = typeof endTime === 'string' ? new Date(endTime) : endTime;

        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const difference = end.getTime() - now;
            return Math.max(0, Math.floor(difference / 1000));
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            const remaining = calculateTimeLeft();
            setTimeLeft(remaining);

            if (remaining <= 0 && !isExpired) {
                setIsExpired(true);
                onExpire?.();
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [endTime, onExpire, isExpired]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate urgency level for styling
    const getUrgencyColor = () => {
        if (isExpired || timeLeft <= 0) return "text-neutral-500";
        if (timeLeft <= 30) return "text-red-500";
        if (timeLeft <= 60) return "text-orange-500";
        if (timeLeft <= 120) return "text-amber-500";
        return "text-emerald-500";
    };

    const getBackgroundColor = () => {
        if (isExpired || timeLeft <= 0) return "bg-neutral-500/10";
        if (timeLeft <= 30) return "bg-red-500/10";
        if (timeLeft <= 60) return "bg-orange-500/10";
        if (timeLeft <= 120) return "bg-amber-500/10";
        return "bg-emerald-500/10";
    };

    if (isExpired || timeLeft <= 0) {
        return (
            <span className={cn(
                "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium",
                "bg-neutral-500/10 text-neutral-500",
                className
            )}>
                Expired
            </span>
        );
    }

    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-mono font-medium tabular-nums",
            getBackgroundColor(),
            getUrgencyColor(),
            className
        )}>
            <svg
                className="w-3.5 h-3.5 animate-pulse"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path strokeLinecap="round" strokeWidth="2" d="M12 6v6l4 2" />
            </svg>
            {formatTime(timeLeft)}
        </span>
    );
}
