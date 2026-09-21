"use client"
import { useState, useEffect, FormEvent } from "react";
import { Property } from "../../../types";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useSelector } from 'react-redux';
import { RootState } from "@/store/store";

export default function BookingCreationPage() {
    const [property, setProperty] = useState<Property | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [checkIn, setCheckIn] = useState("");
    const [checkOut, setCheckOut] = useState("");
    const [bookingStatus, setBookingStatus] = useState<{
        loading: boolean;
        error: string | null;
        success: string | null;
    }>({ loading: false, error: null, success: null });

    const {user, isAuthenticated} = useSelector((state: RootState) => state.auth);
    const params = useParams();

    useEffect(() => {
        async function getProperty() {
            try {
                const res = await fetch(`http://127.0.0.1:8000/properties/${params.id}/`);
                const data = await res.json();
                if (!res.ok) {
                    const errorMsg = res.status === 404 ? data.error : "Something went wrong fetching the property.";
                    throw new Error(errorMsg);
                }
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

    const handleBooking = async (e: FormEvent) => {
        e.preventDefault();
        setBookingStatus({ loading: true, error: null, success: null });

        try {
            const payload = {
                property_id: property?.id,
                check_in: checkIn,
                check_out: checkOut,
                user_id: user?.id,
            };

            const res = await fetch(`http://127.0.0.1:8000/bookings/create/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to create booking");
            }

            setBookingStatus({
                loading: false,
                error: null,
                success: `Success! Booking ID: ${data.booking.id} confirmed for $${data.booking.total_price}.`
            });


            setCheckIn("");
            setCheckOut("");

        } catch (err: any) {
            setBookingStatus({ loading: false, error: err.message, success: null });
        }
    };

    if (isLoading) return <h1 className="p-8 text-xl">Loading data...</h1>;
    if (error) return <h1 className="p-8 text-xl text-red-500">{error}</h1>;
    if (!property) return null;

    return (
        <main className="max-w-6xl mx-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="md:col-span-2 space-y-6">
                <h1 className="text-4xl font-bold">{property.title}</h1>
                <p className="text-gray-500 text-lg">{property.location}</p>
                {property.images_urls && property.images_urls.length > 0 && (
                    <div className="relative w-full h-[400px] rounded-xl overflow-hidden shadow-md">
                        <Image
                            src={property.images_urls[0]}
                            alt={property.title}
                            fill
                            className="object-cover"
                            unoptimized
                        />
                    </div>
                )}
                <div className="prose max-w-none">
                    <h3 className="text-2xl font-semibold mt-6 mb-2">About this place</h3>
                    <p className="text-gray-700 leading-relaxed">{property.description}</p>
                </div>
                <div>
                    <h3 className="text-2xl font-semibold mb-3">Amenities</h3>
                    {property.amenities && property.amenities.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {property.amenities.map((amenity: string, idx: number) => (
                                <span key={idx} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                                    {amenity}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <div className="text-2xl text-gray-600">This property doesn't provide any amenities</div>
                    )}
                </div>
            </div>
            <div className="relative">
                <div className="sticky top-8 bg-white border rounded-2xl shadow-xl p-6">
                    <div className="mb-4">
                        <span className="text-3xl font-bold">${property.price}</span>
                        <span className="text-gray-500"> / night</span>
                    </div>
                    <form onSubmit={handleBooking} className="space-y-4">
                        <div className="flex flex-col space-y-2">
                            <label className="text-sm font-semibold uppercase text-gray-600">Check-In</label>
                            <input
                                type="date"
                                required
                                value={checkIn}
                                onChange={(e) => setCheckIn(e.target.value)}
                                className="border rounded-md p-2"
                            />
                        </div>
                        <div className="flex flex-col space-y-2">
                            <label className="text-sm font-semibold uppercase text-gray-600">Check-Out</label>
                            <input
                                type="date"
                                required
                                value={checkOut}
                                onChange={(e) => setCheckOut(e.target.value)}
                                className="border rounded-md p-2"
                            />
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
    );
}