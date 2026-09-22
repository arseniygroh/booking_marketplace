import Link from "next/link";
import { ReactNode } from "react";

export default function ProfileLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-[calc(100vh-72px)] bg-gray-50 flex flex-col min-lg:flex-row">
            <aside className="w-full min-lg:w-64 bg-white border-r border-gray-200 flex-shrink-0 min-lg:min-h-[calc(100vh-72px)]">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 tracking-tight">Personal Cabinet</h2>
                    <nav className="flex flex-col gap-2">
                        <Link 
                            href="/profile" 
                            className="px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                            Profile Overview
                        </Link>
                        <Link 
                            href="/profile/bookings" 
                            className="px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                            My Bookings
                        </Link>
                        <Link 
                            href="/profile/properties" 
                            className="px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                            Host Properties
                        </Link>
                        <Link 
                            href="/profile/settings" 
                            className="px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                            Settings
                        </Link>
                    </nav>
                </div>
            </aside>
            <main className="flex-1 p-6 md:p-10 overflow-y-auto">
                <div className="max-w-5xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}