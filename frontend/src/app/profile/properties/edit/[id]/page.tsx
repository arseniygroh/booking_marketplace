"use client";
import { useParams } from "next/navigation";
import PropertyForm from "@/components/PropertyForm";
import { useState, useEffect } from "react";
import { Property } from "@/types";

export default function EditPropertyPage() {
    const {id} = useParams();
    const [propertyToEdit, setPropertyToEdit] = useState<Property | null>(null);
    
    useEffect(() => {
        async function fetchProperty() {
            try {
                const res = await fetch(`http://localhost:8000/properties/${Number(id)}/`, {
                    credentials: "include",
                });
                
                if (!res.ok) {
                    throw new Error('Failed to fetch property');
                }
                
                const data = await res.json();
                setPropertyToEdit(data);
            } catch (e: any) {
                console.error(e.message);
            }
        }
        fetchProperty();
    }, [id]);
    

    return <PropertyForm key={propertyToEdit?.id} propertyToEdit={propertyToEdit}/>
}