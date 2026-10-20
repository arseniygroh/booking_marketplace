"use client"
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Profile, Property } from "@/types";

export default function UserProfilePage() {
    const {user_id} = useParams();
    const [profileInfo, setProfileInfo] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>();

    useEffect(() => {
        const getProfileInfo = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`http://localhost:8000/profile/${Number(user_id)}/`);
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || "Failed to fetch profile");
                }
                setProfileInfo(data);
            } catch(e: any) {
                setError(e.message);
            } finally {
                setIsLoading(false);
            }
        }
        getProfileInfo();
    }, [user_id]);

    if (isLoading) {
        return (
          <div className="flex justify-center items-center min-h-[calc(100vh-72px)] bg-gray-50">
            <h1 className="text-2xl text-gray-500 font-semibold animate-pulse">Loading profile...</h1>
          </div>
        );
    }
    
    if (error || !profileInfo) {
        return (
          <div className="flex justify-center items-center min-h-[calc(100vh-72px)] bg-gray-50">
            <h1 className="text-xl text-red-500 font-medium">{error || "Profile not found"}</h1>
          </div>
        );
    }

    return (
        <main className="min-h-[calc(100vh-72px)] bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-1">
                    <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm sticky top-8">
                        <div className="flex flex-col items-center text-center">
                            <div className="relative w-32 h-32 rounded-full overflow-hidden mb-5 ring-4 ring-gray-50 shadow-md">
                                {profileInfo.avatar ? (
                                    <Image 
                                        src={profileInfo.avatar} 
                                        alt={profileInfo.author.username} 
                                        fill 
                                        className="object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-5xl font-bold uppercase">
                                        {profileInfo.author.username.charAt(0)}
                                    </div>
                                )}
                            </div> 
                            <h1 className="text-3xl font-bold text-gray-900 mb-1">
                                {profileInfo.author.username}
                            </h1>
                            <p className="text-gray-500 font-medium mb-6">Host</p>
                            <div className="w-full space-y-4 pt-6 border-t border-gray-100 text-left">
                                {profileInfo.location && (
                                    <div className="flex items-center gap-3 text-gray-700">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        </svg>
                                        <span>Lives in <strong>{profileInfo.location}</strong></span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-gray-700">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                    </svg>
                                    <a href={`mailto:${profileInfo.author.email}`} className="hover:text-blue-600 transition-colors">
                                        {profileInfo.author.email}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2 space-y-10">
                    {profileInfo.bio && (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">About {profileInfo.author.username}</h2>
                            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {profileInfo.bio}
                                </p>
                            </div>
                        </div>
                    )}
                    <div className="border-t border-gray-200 pt-10">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">{profileInfo.author.username}'s Listings</h2>
                        {profileInfo.properties && profileInfo.properties.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {profileInfo.properties.map((property: Property) => (
                                    <Link key={property.id} href={`/properties/${property.id}`} className="group block">
                                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                                            <div className="relative w-full h-48 bg-gray-200 overflow-hidden">
                                                {property.primary_image ? (
                                                    <Image 
                                                        fill 
                                                        src={property.primary_image} 
                                                        alt={property.title} 
                                                        className="object-cover group-hover:scale-105 transition-transform duration-500" 
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">No Image</div>
                                                )}
                                            </div>
                                            <div className="p-5 flex flex-col flex-grow">
                                                <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{property.title}</h3>
                                                <p className="text-sm text-gray-500 mb-3 truncate">{property.location}</p>
                                                <div className="mt-auto flex justify-between items-end pt-3 border-t border-gray-100">
                                                    <span className="text-sm text-gray-500">Up to {property.max_guests} guests</span>
                                                    <div>
                                                        <span className="text-lg font-bold text-gray-900">${property.price}</span>
                                                        <span className="text-sm text-gray-500"> / night</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-sm">
                                <p className="text-gray-500">This host hasn't listed any properties yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}