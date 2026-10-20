"use client";
import { RootState } from "@/store/store";
import { useState, useEffect, FormEvent } from "react";
import { useSelector } from "react-redux";
import { Profile } from "@/types";
import { useRouter } from "next/navigation";
import Image from "next/image";
import getCookie from "@/cookies";

export default function ProfileSettingsPage() {
    const {user, isAuthenticated} = useSelector((state: RootState) => state.auth);
    const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
    const [error, setError] = useState<string>();
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    
    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, router]);

    useEffect(() => {
        if (!user?.id) return;
        
        const getProfileInfo = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`http://localhost:8000/profile/${user.id}/`);
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || "Failed to fetch profile details");
                }
                setCurrentProfile(data);
            } catch(e: any) {
                setError(e.message);
            } finally {
                setIsLoading(false);
            }
        }
        getProfileInfo();
    }, [user?.id]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const csrfToken = getCookie('csrftoken') || '';
        try {
            const res = await fetch("http://localhost:8000/profile/edit/", {
                method: "POST",
                credentials: "include",
                headers: {
                    "X-CSRFToken": csrfToken,
                },
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Faild to update profile settigs. Try again later");
            router.push(`/user/${user?.id}`);
        } catch (e: any) {
            setError(e.message);
        }
    }

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const tempUrl = URL.createObjectURL(file);
            setPreviewUrl(tempUrl);
        }
    };

    if (isLoading) {
        return (
          <div className="flex justify-center items-center min-h-[calc(100vh-72px)] bg-gray-50">
            <h1 className="text-2xl text-gray-500 font-semibold animate-pulse">Loading profile...</h1>
          </div>
        );
    }

    if (error || !currentProfile) {
        return (
          <div className="flex justify-center items-center min-h-[calc(100vh-72px)] bg-gray-50">
            <h1 className="text-xl text-red-500 font-medium">{error}</h1>
          </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-72px)] bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Profile Settings</h1>
                    <p className="text-gray-500 mt-2">Update your public identity and host details.</p>
                </div>
                <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                    <form className="p-8 sm:p-10" onSubmit={handleSubmit}>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-10 pb-10 border-b border-gray-100">
                            <div className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-gray-50 shadow-sm flex-shrink-0 bg-gray-100">
                                {(previewUrl || currentProfile.avatar) ? (
                                    <Image 
                                        src={previewUrl || currentProfile.avatar || ''} 
                                        alt={currentProfile.author.username} 
                                        fill 
                                        className="object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-4xl font-bold uppercase">
                                        {currentProfile.author.username.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-semibold text-gray-900 mb-2">Profile Picture</label>
                                <p className="text-sm text-gray-500 mb-4">
                                    A clear photo helps build trust with guests.
                                </p>
                                <label 
                                    htmlFor="avatar-upload" 
                                    className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer shadow-sm"
                                >
                                    <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                                    </svg>
                                    Upload new picture
                                </label>
                                <input 
                                    id="avatar-upload" 
                                    type="file" 
                                    name="avatar"
                                    accept="image/*"
                                    className="hidden" 
                                    onChange={handleAvatarChange}
                                />
                            </div>
                        </div>
                        <div className="mb-8">
                            <label htmlFor="location" className="block text-sm font-semibold text-gray-900 mb-2">
                                Location
                            </label>
                            <input
                                id="location"
                                type="text"
                                name="location"
                                defaultValue={currentProfile.location || ""}
                                placeholder="Kyiv, Ukraine"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition-shadow"
                            />
                            <p className="text-xs text-gray-500 mt-2">Where do you currently live?</p>
                        </div>
                        <div className="mb-10">
                            <label htmlFor="bio" className="block text-sm font-semibold text-gray-900 mb-2">
                                About You
                            </label>
                            <textarea
                                id="bio"
                                name="bio"
                                rows={5}
                                defaultValue={currentProfile.bio || ""}
                                placeholder="Tell guests a little about yourself..."
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition-shadow resize-y"
                            />
                        </div>
                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-6 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}