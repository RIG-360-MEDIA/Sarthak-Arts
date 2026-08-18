"use client";
import { useEffect, useState } from "react";

const STORAGE_KEY = "sa_visited";

export function ReturningGreeting() {
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) {
        setReturning(true);
      }
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
  }, []);

  if (!returning) return null;

  return (
    <div className="sa-returning">
      Welcome back to the workshop.
    </div>
  );
}
