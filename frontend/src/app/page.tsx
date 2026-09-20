"use client"
import Image from "next/image";
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

  if (isLoading) return <h1>Loading data...</h1>;
  if (error) return <h1>{error}</h1>;

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Available Properties</h1>
      {properties && properties.length > 0 && (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map(prop => (
            <li key={prop.id} className="border rounded-lg p-4 shadow-sm">
              {prop.primary_image && (
                <div className="relative w-full h-48 mb-4">
                  <Image 
                    fill 
                    className="object-cover rounded-md"
                    src={prop.primary_image} 
                    alt={prop.title} 
                    unoptimized 
                  />
                </div>
              )}
              <h4 className="text-xl font-semibold">{prop.title}</h4>
              <p className="text-gray-600 mb-2">{prop.description}</p>
              <p className="font-medium">Located in {prop.location}</p>
              <p className="text-sm text-gray-500">Amenities: {prop.amenities?.join(", ") || "None"}</p>
              <p className="text-sm">Max guests: {prop.max_guests}</p>
              <p className="font-bold text-lg mt-2">${prop.price}/night</p>
              
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-semibold text-sm text-gray-700">Host Contact</h4>
                <p className="text-sm">{prop.owner.name}</p>
                <p className="text-sm text-blue-600">{prop.owner.email}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
