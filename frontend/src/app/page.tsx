"use client"

import { useEffect, useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  
  useEffect(() => {
    async function testApi() {
      const res = await fetch('http://127.0.0.1:8000/test', { cache: 'no-store' });
      const data = await res.json();
      setMessage(data.message);
    }
    testApi();
  }, [])

  return (
    <h1>{message}</h1>
  );
}
