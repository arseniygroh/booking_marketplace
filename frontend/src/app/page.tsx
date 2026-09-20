"use client"
import Image from "next/image";
import Link from "next/link";
import { Property } from "../../types";
import { useEffect, useState } from "react";

export default function Home() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getProperties() {
      try {
        const res = await fetch('http://127.0.0.1:8000/properties/');
        if (!res.ok) throw new Error("Something wrong happened with the request, try again later");
        const data = await res.json();
        setProperties(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false); 
      }
    }
    getProperties();
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <h1 className="text-2xl text-gray-500 font-semibold animate-pulse">Loading properties...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <h1 className="text-xl text-red-500 font-medium">{error}</h1>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto p-8">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 tracking-tight">
        Explore Available Properties
      </h1>
      
      {properties && properties.length > 0 ? (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {properties.map(prop => (
            <li key={prop.id} className="group">
              <Link href={`/properties/${prop.id}`} className="block h-full bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
                <div className="relative w-full h-64 overflow-hidden bg-gray-100">
                  {prop.primary_image ? (
                    <Image 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
                      src={prop.primary_image} 
                      alt={prop.title} 
                      unoptimized 
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No Image Available
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <h4 className="text-lg font-bold text-gray-900 line-clamp-1">
                      {prop.title}
                    </h4>
                    <span className="font-semibold text-lg text-gray-900 whitespace-nowrap">
                      ${prop.price}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {prop.description}
                  </p>
                  
                  <div className="mt-auto space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      {prop.location}
                    </p>
                    <p className="text-sm text-gray-500">
                      Up to {prop.max_guests} guests
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-20">
          <h2 className="text-2xl text-gray-600">No properties available right now.</h2>
        </div>
      )}
    </main>
  );
}
