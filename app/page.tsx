"use client";

import type React from "react";
import { Waitlist } from "@clerk/nextjs";

export default function HomePage() {
  return (
    <div className="min-h-screen px-10 bg-background text-foreground flex flex-col items-center justify-center font-mono">
      <div className="flex flex-col items-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 text-primary">
          hack0.dev
        </h1>

        <p className="text-md md:text-lg mb-4 text-muted-foreground">
          Hackathons for builders. Like ACC but better.
        </p>

        <Waitlist />
      </div>

      <div className="absolute bottom-8 text-center">
        <p className="text-sm text-muted-foreground">
          #1 coming soon · no spam
        </p>
      </div>
    </div>
  );
}
