"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchPublicSettings, PublicSettings } from "@/lib/settings-service";

interface PlatformContextType {
  settings: PublicSettings | null;
  isLoading: boolean;
}

const PlatformContext = createContext<PlatformContextType>({ settings: null, isLoading: true });

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await fetchPublicSettings();
        setSettings(data);
      } catch (error) {
        console.error("Failed to load platform settings:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  return (
    <PlatformContext.Provider value={{ settings, isLoading }}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  return useContext(PlatformContext);
}
