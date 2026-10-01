"use client";
import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { Amenity, ImageSelection } from "@/types";
import { useRouter } from "next/navigation";


export default function CreatePropertyPage() {
    const [availableAmenities, setAvailableAmenities] = useState<Amenity[]>([]);
    const [selectedAmenities, setSelectedAmenities] = useState<number[]>([]);
    const [images, setImages] = useState<ImageSelection[]>([]);
    const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(0);
    const router = useRouter();

    useEffect(() => {
        const fetchAmenities = async () => {
            try {
                const response = await fetch("http://localhost:8000/amenities/");
                if (!response.ok) {
                    throw new Error("Failed to fetch amenities");
                }
                const data: Amenity[] = await response.json();
                setAvailableAmenities(data);
            } catch (error) {
                console.error("Error fetching amenities:", error);
            }
        };

        fetchAmenities();
    }, []);

    const handleAmenityToggle = (id: number) => {
        setSelectedAmenities(prev => 
            prev.includes(id) 
                ? prev.filter(amenityId => amenityId !== id) 
                : [...prev, id]
        );
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        images.forEach(img => URL.revokeObjectURL(img.previewUrl));
        const filesArray = Array.from(e.target.files);
    
        const newImages = filesArray.map(file => ({
            file,
            previewUrl: URL.createObjectURL(file)
        }));

        setImages(newImages);
        setPrimaryImageIndex(0);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        
        selectedAmenities.forEach(id => {
            formData.append('amenities', id.toString());
        });
        images.forEach(img => {
            formData.append('images', img.file);
        });

        formData.append('primary_image_index', primaryImageIndex.toString());
        console.log("FormData entries:", Array.from(formData.entries()));
        
        try {
            const res = await fetch('http://localhost:8000/properties/create/', {
                method: 'POST',
                credentials: 'include',
                body: formData, 
            });

            if (!res.ok) throw new Error("Failed to create property");
            
            const data = await res.json();
            alert(data.message);
            router.push('/profile/properties');
            
        } catch (error: any) {
            alert(error.message);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Create a New Property</h1>
            <p className="text-gray-500 text-lg mb-6">Fill out the form below to add a new property to your hosting portfolio.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Property Name</label>
                    <input required type="text" id="title" name="title" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea id="description" name="description" rows={4} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></textarea>
                </div>
                <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
                    <input required type="location" id="location" name="location" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price</label>
                    <input step={0.1} required type="number" min={1} id="price" name="price" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="maxGuests" className="block text-sm font-medium text-gray-700">Maximum guests</label>
                    <input required type="number" id="maxGuests" name="max_guests" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
                <div className="border-t border-gray-200 pt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Amenities</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {availableAmenities.map((amenity) => (
                            <label key={amenity.id} className="flex items-center space-x-3 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    checked={selectedAmenities.includes(amenity.id)}
                                    onChange={() => handleAmenityToggle(amenity.id)}
                                />
                                <span className="text-gray-700 text-sm">{amenity.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="border-t border-gray-200 pt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Property Images</label>
                    <input 
                        required 
                        type="file" 
                        multiple 
                        accept="image/*"
                        onChange={handleImageChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
                    />
                    {images.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {images.map((img, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => setPrimaryImageIndex(idx)}
                                    className={`relative h-32 rounded-lg overflow-hidden cursor-pointer border-4 transition-all ${
                                        primaryImageIndex === idx ? 'border-blue-600 shadow-md' : 'border-transparent hover:border-blue-300'
                                    }`}
                                >
                                    <Image
                                        src={img.previewUrl}
                                        alt={`Preview ${idx}`}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                    {primaryImageIndex === idx && (
                                        <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                                            Cover Image
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    <p className="mt-2 text-xs text-gray-500">Click any image preview to set it as the cover.</p>
                </div>
                <div className="pt-4">
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors shadow-sm">
                        Publish Listing
                    </button>
                </div>
            </form>
        </div>
    );
}