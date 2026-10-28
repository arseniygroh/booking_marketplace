"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { InboxConversation } from "@/types";
import { useNotifications } from "@/components/NotificationProvider";
import { formatDistanceToNow } from "date-fns";

export default function InboxPage() {
    const [conversations, setConversations] = useState<InboxConversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const {latestNotification} = useNotifications();

    useEffect(() => {
        async function fetchInbox() {
            try {
                const res = await fetch("http://localhost:8000/conversations/", {
                    credentials: "include",
                });
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || "Failed to load inbox");
                }
                setConversations(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }
        fetchInbox();
    }, []);

   
    useEffect(() => {
        if (!latestNotification) return;

        setConversations((prev) => {
            const exists = prev.some(
                (c) => c.conversation_id === latestNotification.conversation_id
            );

            if (!exists) {
                fetch("http://localhost:8000/conversations/", {credentials: "include"})
                    .then((res) => res.json())
                    .then((data) => {
                        if (Array.isArray(data)) setConversations(data);
                    });
                return prev;
            }
            const updated = prev.map((c) => {
                if (c.conversation_id === latestNotification.conversation_id) {
                    return {
                        ...c,
                        updated_at: latestNotification.created_at,
                        unread_count: c.unread_count + 1,
                        preview_message: {
                            content: latestNotification.preview,
                            created_at: latestNotification.created_at,
                            sender_id: latestNotification.sender_id,
                            is_read: false,
                        },
                    };
                }
                return c;
            });

            return updated.sort(
                (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            );
        });
    }, [latestNotification]);

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto p-8 space-y-4">
                <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
                {[1, 2, 3].map((n) => (
                    <div key={n} className="h-24 w-full bg-gray-100 rounded-2xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (error) {
        return <div className="max-w-4xl mx-auto p-8 text-red-600 font-medium">{error}</div>;
    }

    return (
        <main className="max-w-4xl mx-auto p-6 sm:p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Chat with hosts and guests about property bookings
                    </p>
                </div>
            </div>
            {conversations.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No conversations yet</h3>
                </div>
            ) : (
                <div className="space-y-3">
                    {conversations.map((conv) => {
                        const hasUnread = conv.unread_count > 0;
                        return (
                            <Link
                                key={conv.conversation_id}
                                href={`/messages/${conv.conversation_id}`}
                                className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all ${
                                    hasUnread
                                        ? "bg-blue-50/40 border-blue-200 hover:bg-blue-50/70 shadow-sm"
                                        : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/60"
                                }`}
                            >
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className="relative flex-shrink-0">
                                        <div className="relative w-14 h-14 rounded-full bg-blue-600 text-white font-bold text-lg uppercase flex items-center justify-center overflow-hidden shadow-sm">
                                            {conv.participant_info.avatar ? (
                                                <Image
                                                    src={conv.participant_info.avatar}
                                                    alt={conv.participant_info.username}
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                            ) : (
                                                conv.participant_info.username.charAt(0)
                                            )}
                                        </div>
                                        <span
                                            className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                                                conv.participant_info.is_online ? "bg-emerald-500" : "bg-gray-400"
                                            }`}
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h3 className={`text-base truncate ${hasUnread ? "font-bold text-gray-900" : "font-semibold text-gray-800"}`}>
                                                {conv.participant_info.username}
                                            </h3>
                                            <span className="text-gray-300">•</span>
                                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full truncate">
                                                {conv.property.title}
                                            </span>
                                        </div>

                                        <p className={`text-sm truncate ${hasUnread ? "font-semibold text-gray-900" : "text-gray-500"}`}>
                                            {conv.preview_message
                                                ? conv.preview_message.content
                                                : "Conversation started — say hello!"}
                                        </p>

                                        {conv.preview_message && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                {formatDistanceToNow(new Date(conv.preview_message.created_at), {
                                                    addSuffix: true,
                                                })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                                    {hasUnread && (
                                        <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                                            {conv.unread_count} new
                                        </span>
                                    )}

                                    {conv.property.primary_image && (
                                        <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-200 hidden sm:block">
                                            <Image
                                                src={conv.property.primary_image}
                                                alt={conv.property.title}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        </div>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </main>
    );
}