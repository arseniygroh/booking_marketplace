"use client";

import { RootState } from "@/store/store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Booking } from "@/types";
import Image from "next/image";
import getCookie from "@/cookies";
import BookingTimer from "@/components/BookingTimer";
import Modal from "@/components/Modal";
import { closeModal, openModal } from "@/store/modalSlice";
import { useDispatch, useSelector } from "react-redux";
import ReviewForm from "@/components/ReviewForm";

export default function BookingsPage() {
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCancelling, setIsCancelling] = useState<number | null>(null);
    const {isOpen} = useSelector((state: RootState) => state.modal);
    const dispatch = useDispatch();

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

    const handleCancelBooking = async (bookingId: number) => {
        if (!confirm("Are you sure you want to cancel this booking?")) return;

        setIsCancelling(bookingId);
        try {
            const csrfToken = getCookie('csrftoken') || ''; 

            const res = await fetch(`http://localhost:8000/bookings/${bookingId}/cancel/`, {
                method: 'POST',
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                },
            });
            
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to cancel booking');
            }
            
            setBookings(prevBookings => 
                prevBookings.map(b => 
                    b.booking_id === bookingId ? { ...b, status: 'CANCELLED' } : b
                )
            );
            
        } catch (e: any) {
            alert(e.message);
        } finally {
            setIsCancelling(null);
        }
    };

    const handleConfirmBooking = async (bookingId: number) => {
        try {
            const csrfToken = getCookie('csrftoken') || ''; 
            const res = await fetch(`http://localhost:8000/bookings/${bookingId}/confirm/`, {
                method: 'POST',
                credentials: "include",
                headers: {'X-CSRFToken': csrfToken},
            });
            
            const data = await res.json();
            
            if (data.status) {
                setBookings(prev => prev.map(b => 
                    b.booking_id === bookingId ? { ...b, status: data.status } : b
                ));
            }
    
            if (!res.ok) throw new Error(data.error);
            alert(data.message);
            
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleBookingExpired = async (bookingId: number) => {
        try {
            const csrfToken = getCookie('csrftoken') || '';
            const res = await fetch(`http://localhost:8000/bookings/${bookingId}/expire/`, {
                method: 'POST',
                credentials: "include",
                headers: {'X-CSRFToken': csrfToken},
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to expire booking');
            }
            setBookings(prev => prev.map(b => 
                b.booking_id === bookingId ? { ...b, status: 'EXPIRED' } : b
            ));
        } catch (e: any) {
           alert(e.message);
        }
    }

    const getStatusStyles = (status: string) => {
        switch (status.toUpperCase()) {
            case 'CONFIRMED':
                return 'bg-green-100 text-green-800 ring-green-200';
            case 'PENDING':
                return 'bg-amber-100 text-amber-800 ring-amber-200';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800 ring-red-200';
            default:
                return 'bg-gray-100 text-gray-800 ring-gray-200';
        }
    };

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
        <>
        <Modal isOpen={isOpen} onClose={() => {dispatch(closeModal()); setCurrentBooking(null)}}>
            <div className="relative p-2 sm:p-4">
            {currentBooking && (
                <ReviewForm 
                    propertyTitle={currentBooking.title} 
                    bookingId={currentBooking.booking_id} 
                    onSuccess={() => {
                        setTimeout(() => {
                            dispatch(closeModal());
                            setCurrentBooking(null);
                            router.push(`/properties/${currentBooking.id}`);
                        }, 2000);
                    }}
                />
            )}
            </div>
        </Modal>
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
                                        <Image fill src={booking.primary_image} alt={booking.title} className="object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">No Image</div>
                                    )}
                                    <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm ring-1 ${getStatusStyles(booking.status)}`}>
                                        {booking.status}
                                    </div>
                                </div>
                                
                                <div className="p-6 flex flex-col flex-grow">
                                    <h2 className="text-xl font-bold text-gray-900 mb-1 truncate">{booking.title}</h2>
                                    <p className="text-sm text-gray-500 mb-4 truncate">{booking.location}</p>

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
                                    
                                    <div className="mt-auto space-y-3">
                                        {booking.status === 'PENDING' && (
                                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 flex justify-between items-center">
                                                <span className="text-sm text-amber-800 font-medium">Time to confirm:</span>
                                                <BookingTimer 
                                                    createdAt={booking.created_at} 
                                                    onExpire={() => {handleBookingExpired(booking.booking_id)}} 
                                                />
                                            </div>
                                        )}
                                        {booking.status === 'PENDING' && (
                                            <button 
                                                onClick={() => handleConfirmBooking(booking.booking_id)}
                                                className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-sm"
                                            >
                                                Confirm Reservation
                                            </button>
                                        )}
                                        {!["CANCELLED", "EXPIRED", "COMPLETED"].includes(booking.status) && (
                                            <button 
                                                onClick={() => handleCancelBooking(booking.booking_id)}
                                                disabled={isCancelling === booking.booking_id}
                                                className="block w-full text-center bg-white border border-red-200 hover:bg-red-50 text-red-600 font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                {isCancelling === booking.booking_id ? "Cancelling..." : "Cancel Booking"}
                                            </button>
                                        )}
                                        {booking.status === 'COMPLETED' && (
                                            <button 
                                                onClick={() => {dispatch(openModal()); setCurrentBooking(booking)}}
                                                className="group w-full flex items-center justify-center gap-2 bg-white border-2 border-blue-600 hover:bg-blue-50 text-blue-700 font-bold py-2.5 rounded-lg transition-all shadow-sm active:scale-[0.98]"
                                            >
                                                <svg 
                                                    className="w-5 h-5 text-blue-600 group-hover:text-blue-700 transition-colors" 
                                                    fill="none" 
                                                    stroke="currentColor" 
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                </svg>
                                                Leave a Review
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
        </>
    );
}