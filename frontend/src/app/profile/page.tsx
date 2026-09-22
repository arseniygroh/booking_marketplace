"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import Link from "next/link";

export default function ProfileOverviewPage() {
    const {user} = useSelector((state: RootState) => state.auth);

    if (!user) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-10">
            <div className="flex items-center gap-6 mb-10 max-[550px]:flex-col">
                <div className="h-24 w-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-4xl font-bold uppercase shadow-inner">
                    {user.username ? user.username.charAt(0) : "U"}
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1 max-[550px]:text-center">
                        Welcome, {user.username || "Traveler"}!
                    </h1>
                    <p className="text-gray-500 text-lg">Manage your account and hosted properties.</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-100 rounded-xl p-6 bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h3>
                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between border-b border-gray-200 pb-2 flex-wrap">
                            <span className="text-gray-500">Username</span>
                            <span className="font-medium text-gray-900">{user.username}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 pb-2 flex-wrap">
                            <span className="text-gray-500">Email Address</span>
                            <span className="font-medium text-gray-900">{user.email || "Not provided"}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 pb-2 flex-wrap">
                            <span className="text-gray-500">Role</span>
                            <span className="font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Guest & Host</span>
                        </div>
                    </div>
                </div>
                <div className="border border-gray-100 rounded-xl p-6 bg-gray-50 flex flex-col justify-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Access</h3>
                    <p className="text-gray-500 text-sm mb-6">Jump directly to your reservations or manage the properties you are hosting.</p>
                    <div className="flex flex-col gap-3">
                        <Link 
                            href="/profile/bookings" 
                            className="w-full text-center bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold py-2.5 rounded-lg transition-colors"
                        >
                            View My Bookings
                        </Link>
                        <Link 
                            href="/profile/properties" 
                            className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
                        >
                            Manage Host Properties
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}