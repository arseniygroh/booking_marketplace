"use client";
import { useEffect, useState, useRef, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ConversationDetail, ChatMessage } from "@/types";
import { useNotifications } from "@/components/NotificationProvider";
import { format } from "date-fns";

export default function ChatRoomPage() {
    const params = useParams();
    const router = useRouter();
    const conversationId = params.id as string;

    const [conversation, setConversation] = useState<ConversationDetail | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [wsConnected, setWsConnected] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const {setUnreadCount} = useNotifications();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!conversationId) return;

        async function loadConversation() {
            try {
                const res = await fetch(`http://localhost:8000/conversations/${conversationId}/`, {
                    credentials: "include",
                });
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || "Failed to load conversation");
                }
                setConversation(data);
                setMessages(data.messages || []);

                const inboxRes = await fetch("http://localhost:8000/conversations/", {
                    credentials: "include",
                });
                if (inboxRes.ok) {
                    const inboxData = await inboxRes.json();
                    const totalUnread = inboxData.reduce(
                        (sum: number, conv: any) => sum + (conv.unread_count || 0), 0
                    );
                    setUnreadCount(totalUnread);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }

        loadConversation();
    }, [conversationId, setUnreadCount]);

    useEffect(() => {
        if (!conversation) return;

        const ws = new WebSocket(`ws://localhost:8000/ws/chat/${conversationId}/`);
        wsRef.current = ws;

        ws.onopen = () => {
            setWsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === "new_message") {
                    const incomingMsg: ChatMessage = data.message;

                    setMessages((prev) => {
                        if (prev.some((m) => m.id === incomingMsg.id)) return prev;
                        return [...prev, incomingMsg];
                    });

                    if (incomingMsg.sender_id === conversation.participant.id && ws.readyState === WebSocket.OPEN) {
                        ws.send(
                            JSON.stringify({
                                type: "mark_read",
                                message_id: incomingMsg.id,
                            })
                        );
                    }
                } else if (data.type === "message_read") {
                    const readMsgId: number = data.message_id;
                    setMessages((prev) =>
                        prev.map((m) => (m.id === readMsgId ? { ...m, is_read: true } : m))
                    );
                }
            } catch (err) {
                console.error("Failed to parse chat socket payload:", err);
            }
        };

        ws.onclose = () => {
            setWsConnected(false);
        };

        return () => {
            ws.close();
        };
    }, [conversationId, conversation?.participant.id]);

    const handleSendMessage = (e: FormEvent) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        wsRef.current.send(
            JSON.stringify({
                type: "send_message",
                content: trimmed,
            })
        );
        setInput("");
    };

    if (isLoading) {
        return <div className="max-w-4xl mx-auto p-8 text-gray-500">Loading chat...</div>;
    }

    if (error || !conversation) {
        return (
            <div className="max-w-4xl mx-auto p-8">
                <p className="text-red-600 font-medium mb-4">{error || "Chat not found"}</p>
                <button
                    onClick={() => router.push("/messages")}
                    className="text-blue-600 hover:underline font-medium"
                >
                    Back to Messages
                </button>
            </div>
        );
    }

    const {participant, property} = conversation;

    return (
        <main className="max-w-4xl mx-auto p-4 sm:p-6 h-[calc(100vh-80px)] flex flex-col">
            <div className="bg-white border border-gray-200 rounded-t-2xl p-4 sm:px-6 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3.5 min-w-0">
                    <Link
                        href="/messages"
                        className="p-2 -ml-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                        aria-label="Back to inbox"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div className="relative flex-shrink-0">
                        <div className="relative w-11 h-11 rounded-full bg-blue-600 text-white font-bold uppercase flex items-center justify-center overflow-hidden">
                            {participant.avatar ? (
                                <Image
                                    src={participant.avatar}
                                    alt={participant.username}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            ) : (
                                participant.username.charAt(0)
                            )}
                        </div>
                        <span
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                                participant.is_online ? "bg-emerald-500" : "bg-gray-400"
                            }`}
                        />
                    </div>
                    <div className="min-w-0">
                        <h2 className="font-bold text-gray-900 truncate">{participant.username}</h2>
                        <p className="text-xs text-gray-500 flex items-center gap-1.5">
                            <span className={participant.is_online ? "text-emerald-600 font-medium" : "text-gray-400"}>
                                {participant.is_online ? "Online" : "Offline — will see messages when back"}
                            </span>
                        </p>
                    </div>
                </div>
                <Link
                    href={`/properties/${property.id}`}
                    className="hidden sm:flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3.5 py-2 rounded-xl transition-colors text-right"
                >
                    <div>
                        <p className="text-xs font-semibold text-gray-900 truncate max-w-[180px]">
                            {property.title}
                        </p>
                        <p className="text-[11px] text-gray-500">${property.price} / night</p>
                    </div>
                </Link>
            </div>
            <div className="flex-1 bg-gray-50 border-x border-gray-200 p-4 sm:p-6 overflow-y-auto space-y-4">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                        <p className="text-sm font-medium text-gray-500">
                            Start your conversation with {participant.username}
                        </p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender_id !== participant.id;
                        return (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                            >
                                <div
                                    className={`max-w-[78%] sm:max-w-[65%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                                        isMe
                                            ? "bg-blue-600 text-white rounded-br-xs"
                                            : "bg-white text-gray-800 border border-gray-200 rounded-bl-xs"
                                    }`}
                                >
                                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                </div>
                                <div className="flex items-center gap-1 mt-1 px-1">
                                    <span className="text-[11px] text-gray-400">
                                        {format(new Date(msg.created_at), "HH:mm")}
                                    </span>
                                    {isMe && (
                                        <span
                                            className={`text-[11px] font-bold ${
                                                msg.is_read ? "text-blue-600" : "text-gray-400"
                                            }`}
                                            title={msg.is_read ? "Read" : "Sent"}
                                        >
                                            {msg.is_read ? "✓✓" : "✓"}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>
            <form
                onSubmit={handleSendMessage}
                className="bg-white border border-gray-200 rounded-b-2xl p-3 sm:p-4 flex items-center gap-3 shadow-sm"
            >
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Message ${participant.username}...`}
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
                <button
                    type="submit"
                    disabled={!input.trim() || !wsConnected}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold text-sm rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                    <span>Send</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </form>
        </main>
    );
}