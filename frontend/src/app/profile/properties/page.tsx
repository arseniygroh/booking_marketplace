"use client";

import { useState, useEffect } from "react";
import { Property } from "@/types";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PropertiesPage() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        async function fetchProperties() {
            try {
                const res = await fetch('http://localhost:8000/properties/my/', {
                    credentials: "include",
                });
                
                if (!res.ok) {
                    if (res.status === 401) {
                        router.replace('/login');
                        return;
                    }
                    throw new Error('Failed to fetch your properties');
                }
                
                const data = await res.json();
                setProperties(data);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        fetchProperties();
    }, [router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-200 font-medium">
                Error: {error}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Host Properties</h1>
                    <p className="text-gray-500 mt-1">Manage your listings, update details, or add new places.</p>
                </div>
                <Link 
                    href="/profile/properties/new"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors shadow-sm whitespace-nowrap"
                >
                    + List New Property
                </Link>
            </div>
            {properties.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">You have no properties listed</h3>
                    <p className="text-gray-500 mb-6">List your first space today.</p>
                </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property: Property) => (
                    <div key={property.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                        <div className="relative w-full h-48 bg-gray-200 flex-shrink-0">
                            {property.primary_image ? (
                                <Image
                                    src={property.primary_image}
                                    alt={property.title}
                                    className="object-cover"
                                    fill
                                    unoptimized
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                                    No Image
                                </div>
                            )}
                            <span className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-xs font-bold text-gray-900 shadow-sm">
                                ${property.price}<span className="font-normal text-gray-500">/nt</span>
                            </span>
                        </div>
            
                        <div className="p-5 flex flex-col flex-grow">
                            <h2 className="text-lg font-bold text-gray-900 truncate mb-1">{property.title}</h2>
                            <p className="text-sm text-gray-500 mb-3 truncate">{property.location}</p>
            
                            <p className="text-gray-600 text-sm line-clamp-2 mb-4 flex-grow">
                                {property.description}
                            </p>
            
                            <div className="flex flex-wrap gap-2 mb-5">
                                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                                    Up to {property.max_guests} guests
                                </span>
                                {property.amenities?.slice(0, 2).map((amenity, idx) => (
                                    <span key={idx} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                                        {amenity}
                                    </span>
                                ))}
                                {property.amenities && property.amenities.length > 2 && (
                                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                                        +{property.amenities.length - 2} more
                                    </span>
                                )}
                            </div>
            
                            <div className="mt-auto flex gap-3 pt-4 border-t border-gray-100">
                                <button className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold py-2 rounded-lg transition-colors text-sm border border-gray-200">
                                    Edit
                                </button>
                                <button className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2 rounded-lg transition-colors text-sm border border-red-100">
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            )}
        </div>
    );
}