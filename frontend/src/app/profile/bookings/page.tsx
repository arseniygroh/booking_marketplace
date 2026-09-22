"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Booking } from "@/types";
import Image from "next/image";

export default function BookingsPage() {
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            router.replace('/login');
            return;
        }

        const fetchBookings = async () => {
            try {
                const res = await fetch('http://localhost:8000/bookings/my/', {
                    credentials: "include",
                });
                
                if (!res.ok) {
                    throw new Error('Failed to fetch bookings');
                }
                
                const data = await res.json();
                setBookings(data);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [isAuthenticated, router]);

   
    if (!isAuthenticated) return null;

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-72px)] flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[calc(100vh-72px)] flex items-center justify-center bg-gray-50">
                <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-200 font-medium">
                    Error: {error}
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-[calc(100vh-72px)] bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight">
                    My Bookings
                </h1>

                {bookings.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-200">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings yet!</h3>
                        <p className="text-gray-500 mb-6">Time to dust off your bags and start planning your next adventure.</p>
                        <Link 
                            href="/"
                            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                        >
                            Explore Properties
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {bookings.map((booking) => (
                            <div key={booking.booking_id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                                <div className="relative w-full h-56 bg-gray-200">
                                    {booking.primary_image ? (
                                        <Image 
                                            fill 
                                            src={booking.primary_image} 
                                            alt={booking.title} 
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                            No Image Available
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-gray-800 uppercase tracking-wide shadow-sm">
                                        {booking.status}
                                    </div>
                                </div>
                                <div className="p-6 flex flex-col flex-grow">
                                    <h2 className="text-xl font-bold text-gray-900 mb-1 truncate">
                                        {booking.title}
                                    </h2>
                                    <p className="text-sm text-gray-500 mb-4 truncate">
                                        {booking.location}
                                    </p>

                                    <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 border border-gray-100">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Check-in:</span>
                                            <span className="font-semibold text-gray-900">{new Date(booking.check_in).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Check-out:</span>
                                            <span className="font-semibold text-gray-900">{new Date(booking.check_out).toLocaleDateString()}</span>
                                        </div>
                                        <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between">
                                            <span className="font-medium text-gray-900">Total</span>
                                            <span className="font-bold text-blue-600">${booking.total_price}</span>
                                        </div>
                                    </div>
                                    <div className="mt-auto">
                                        <Link 
                                            href={`/properties/${booking.id}`}
                                            className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-2.5 rounded-lg transition-colors"
                                        >
                                            View Property Details
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}