"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { usePathname, useRouter } from "next/navigation";
import { MessageNotification } from "@/types";


interface NotificationContextType {
    unreadCount: number;
    setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
    latestNotification: MessageNotification | null;
}

const NotificationContext = createContext<NotificationContextType>({
    unreadCount: 0,
    setUnreadCount: () => {},
    latestNotification: null,
});

export const useNotifications = () => useContext(NotificationContext);

export default function NotificationProvider({children}: {children: ReactNode}) {
    const {isAuthenticated} = useSelector((state: RootState) => state.auth);
    const [unreadCount, setUnreadCount] = useState(0);
    const [latestNotification, setLatestNotification] = useState<MessageNotification | null>(null);
    const [activeToast, setActiveToast] = useState<MessageNotification | null>(null);

    const pathname = usePathname();
    const router = useRouter();


    useEffect(() => {
        if (!isAuthenticated) {
            setUnreadCount(0);
            return;
        }
        async function fetchInitialUnread() {
            try {
                const res = await fetch("http://localhost:8000/conversations/", {
                    credentials: "include",
                });
                const data = await res.json();
                if (res.ok) {
                    const totalUnread = data.reduce(
                        (sum: number, conv: any) => sum + (conv.unread_count || 0),
                        0
                    );
                    setUnreadCount(totalUnread);
                } else {
                    throw new Error(data.error || "Failed to fetch unread count")
                }
            } catch (err: any) {
                alert(err.message);
            }
        }

        fetchInitialUnread();
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated) return;

        let ws: WebSocket | null = null;
        let heartbeatInterval: NodeJS.Timeout;
        let reconnectTimeout: NodeJS.Timeout;

        const connect = () => {
            ws = new WebSocket("ws://localhost:8000/ws/notifications/");

            ws.onopen = () => {
                heartbeatInterval = setInterval(() => {
                    if (ws?.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({type: "heartbeat"}));
                    }
                }, 30000);
            };

            ws.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data);
                    if (payload.type === "new_message_notification") {
                        const notif: MessageNotification = payload.data;
                        setLatestNotification(notif);

                        if (pathname !== `/messages/${notif.conversation_id}`) {
                            setUnreadCount((prev) => prev + 1);
                            setActiveToast(notif);
                            setTimeout(() => {
                                setActiveToast((current) =>
                                    current?.created_at === notif.created_at ? null : current
                                );
                            }, 5000);
                        }
                    }
                } catch (e) {
                    console.error("Error parsing WebSocket message:", e);
                }
            };

            ws.onclose = () => {
                clearInterval(heartbeatInterval);
                reconnectTimeout = setTimeout(connect, 3000);
            };
        };

        connect();

        return () => {
            clearInterval(heartbeatInterval);
            clearTimeout(reconnectTimeout);
            if (ws) {
                ws.onclose = null;
                ws.close();
            }
        };
    }, [isAuthenticated, pathname]);

    return (
        <NotificationContext.Provider value={{ unreadCount, setUnreadCount, latestNotification }}>
            {children}
            {activeToast && (
                <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 flex items-start gap-3.5 transition-all duration-300">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0 uppercase shadow-sm">
                        {activeToast.sender_username.charAt(0)}
                    </div>
                    <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => {
                            const targetId = activeToast.conversation_id;
                            setActiveToast(null);
                            router.push(`/messages/${targetId}`);
                        }}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-bold text-gray-900 truncate">
                                {activeToast.sender_username}
                            </p>
                            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                New
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate mb-1">
                            {activeToast.property_title}
                        </p>
                        <p className="text-sm text-gray-700 line-clamp-2">
                            {activeToast.preview}
                        </p>
                    </div>
                    <button
                        onClick={() => setActiveToast(null)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors"
                        aria-label="Close notification"
                    >
                        ✕
                    </button>
                </div>
            )}
        </NotificationContext.Provider>
    );
}