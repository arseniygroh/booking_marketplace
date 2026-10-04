"use client"
import { useState, useEffect, FormEvent } from "react";
import { Amenity, Property } from "../../../types";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { RootState } from "@/store/store";
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { parseISO, format } from 'date-fns';
import getCookie from "@/cookies"; 
import { closeModal, openModal } from "@/store/modalSlice";
import { useDispatch, useSelector } from "react-redux";
import Modal from "@/components/Modal";

export default function BookingCreationPage() {
    const [property, setProperty] = useState<Property | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [checkIn, setCheckIn] = useState<Date | null>(null);
    const [checkOut, setCheckOut] = useState<Date | null>(null);
    const [bookingStatus, setBookingStatus] = useState<{
        loading: boolean;
        error: string | null;
        success: string | null;
    }>({ loading: false, error: null, success: null });
    const [unavailableDates, setUnavailableDates] = useState<Date[]>([]);

    const {isAuthenticated} = useSelector((state: RootState) => state.auth);
    const {isOpen} = useSelector((state: RootState) => state.modal);
    const params = useParams();
    const dispatch = useDispatch();
    const router = useRouter();

    useEffect(() => {
        async function getProperty() {
            try {
                const res = await fetch(`http://localhost:8000/properties/${params.id}/`);
                const data = await res.json();
                if (!res.ok) {
                    const errorMsg = res.status === 404 ? data.error : "Something went wrong fetching the property.";
                    throw new Error(errorMsg);
                }
                console.log(data);
                setProperty(data);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setIsLoading(false);
            }
        }
        if (params.id) {
            getProperty();
        }
    }, [params.id]);

    useEffect(() => {
        const fetchBookedDates = async () => {
            try {
                const res = await fetch(`http://localhost:8000/properties/${params.id}/booked-dates/`);
                if (res.ok) {
                    const data = await res.json();
                    const blockedDates = data.unavailable_dates.map((dateStr: string) => parseISO(dateStr));
                    setUnavailableDates(blockedDates);
                }
            } catch (error) {
                console.error("Failed to load booked dates");
            }
        };
        fetchBookedDates();
    }, [params.id]);

    const handleBooking = async (e: FormEvent) => {
        e.preventDefault();
        
        if (!checkIn || !checkOut) {
            setBookingStatus({ loading: false, error: "Please select both check-in and check-out dates.", success: null });
            return;
        }
        setBookingStatus({ loading: true, error: null, success: null });

        try {
            const payload = {
                property_id: property?.id,
                check_in: format(checkIn, 'yyyy-MM-dd'),
                check_out: format(checkOut, 'yyyy-MM-dd'),
            };
            const csrfToken = getCookie('csrftoken') || '';

            const res = await fetch(`http://localhost:8000/bookings/create/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrfToken 
                },
                credentials: "include", 
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to create booking");
            }

            setBookingStatus({
                loading: false,
                error: null,
                success: `Success!`
            });

            setCheckIn(null);
            setCheckOut(null);
            dispatch(openModal());

        } catch (err: any) {
            setBookingStatus({ loading: false, error: err.message, success: null });
        }
    };

    if (isLoading) return <h1 className="p-8 text-xl">Loading data...</h1>;
    if (error) return <h1 className="p-8 text-xl text-red-500">{error}</h1>;
    if (!property) return null;
    console.log(property);
    

    return (
        <>
            <Modal title="Booking Request Sent" isOpen={isOpen} onClose={() => dispatch(closeModal())}>
                <div className="flex flex-col items-center text-center pt-2 pb-4">
                    <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4 ring-8 ring-amber-50/50">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Awaiting Host Approval</h3>
                    <p className="text-gray-600 mb-8 px-2 leading-relaxed">
                        Your booking is currently in <span className="font-semibold text-amber-600">pending mode</span>. The host has been notified, and you can track or manage this request in your profile.
                    </p>
                    <div className="flex flex-col-reverse sm:flex-row justify-center w-full gap-3 mt-2">
                        <button 
                            onClick={() => dispatch(closeModal())} 
                            className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                        >
                            Close
                        </button>
                        <button 
                            onClick={() => {
                                dispatch(closeModal());
                                router.push("/profile/bookings");
                            }} 
                            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                        >
                            View My Bookings
                        </button>
                    </div>
                </div>
            </Modal>
            <main className="max-w-6xl mx-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="md:col-span-2 space-y-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">{property.title}</h1>
                        <p className="text-gray-500 text-lg">{property.location}</p>
                    </div>
                    {property.images && property.images.length > 0 && (
                        <div className="relative w-full h-[400px] rounded-xl overflow-hidden shadow-md">
                            <Image
                                src={property.images[property.primary_image_index ?? 0].previewUrl}
                                alt={property.title}
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        </div>
                    )}
                    <div className="prose max-w-none">
                        <h3 className="text-2xl font-semibold mb-3 text-gray-900">About this place</h3>
                        <p className="text-gray-700 leading-relaxed">
                            {property.description ? property.description : "No description provided."}
                        </p>
                    </div>
                    <div>
                        <h3 className="text-2xl font-semibold mb-4 text-gray-900">Amenities</h3>
                        {property.amenities && property.amenities.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {property.amenities.map((amenity: Amenity, idx: number) => (
                                    <span key={idx} className="bg-gray-100 text-gray-800 px-3 py-1.5 rounded-full text-sm font-medium">
                                        {amenity.name}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <div className="text-gray-500 italic">This property doesn't have any listed amenities yet.</div>
                        )}
                    </div>
                    <div className="border-t border-gray-200 pt-6 space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">Guest Capacity</h3>
                            <p className="text-gray-700">
                                Comfortably accommodates up to <span className="font-bold text-blue-600">{property.max_guests}</span> guests.
                            </p>
                        </div>

                        <div className="flex items-center text-sm text-gray-500 pt-2">
                            <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            <span>
                                Listed on {new Date(property.created_at).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                            </span>
                        </div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 sm:p-8 mt-4">
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">Meet your host</h3>
                        
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold uppercase shadow-sm flex-shrink-0">
                                {property.owner.username.charAt(0)}
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-gray-900">{property.owner.username}</p>
                                <p className="text-sm text-gray-500">Property Owner</p>
                            </div>
                        </div>
                        
                        <div className="pt-5 border-t border-gray-200">
                            <a 
                                href={`mailto:${property.owner.email}`} 
                                className="inline-flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors group w-fit"
                            >
                                <div className="p-2 bg-white rounded-full shadow-sm border border-gray-200 group-hover:border-blue-200 group-hover:bg-blue-50 transition-colors">
                                    <svg className="w-5 h-5 text-gray-500 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                    </svg>
                                </div>
                                <span className="font-medium">{property.owner.email}</span>
                            </a>
                        </div>
                    </div>
                </div>
                <div className="relative">
                    <div className="sticky top-8 bg-white border rounded-2xl shadow-xl p-6">
                        <div className="mb-4">
                            <span className="text-3xl font-bold">${property.price}</span>
                            <span className="text-gray-500"> / night</span>
                        </div>
                        <form onSubmit={handleBooking} className="space-y-4">
                            <div className="flex gap-4 mb-4">
                                <div className="w-1/2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Check-in</label>
                                    <DatePicker
                                        selected={checkIn}
                                        onChange={(date: Date | null) => setCheckIn(date)}
                                        excludeDates={unavailableDates}
                                        minDate={new Date()}
                                        selectsStart
                                        startDate={checkIn}
                                        endDate={checkOut}
                                        placeholderText="Select date"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                                    />
                                </div>
                                <div className="w-1/2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Check-out</label>
                                    <DatePicker
                                        selected={checkOut}
                                        onChange={(date: Date | null) => setCheckOut(date)}
                                        excludeDates={unavailableDates}
                                        minDate={checkIn || new Date()} 
                                        selectsEnd
                                        startDate={checkIn}
                                        endDate={checkOut}
                                        placeholderText="Select date"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                                    />
                                </div>
                            </div>
                            {bookingStatus.error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                                    {bookingStatus.error}
                                </div>
                            )}
                            {bookingStatus.success && (
                                <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">
                                    {bookingStatus.success}
                                </div>
                            )}
                            <button 
                                type='submit' 
                                disabled={bookingStatus.loading || !isAuthenticated}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed mt-4"
                            >
                                {bookingStatus.loading ? "Processing..." : (isAuthenticated ? "Reserve" : "Log in to Reserve")}
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        </>
    );
}