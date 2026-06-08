import { useEffect } from "react";
import App from "@/app/App";

import initAutoRem from "../lib/auto-rem";
import { initViewport } from "@/lib/viewport";

export function AppProvider() {
  useEffect(() => {
    const cleanupAutorem = initAutoRem(1536, 16);
    const cleanupViewport = initViewport();
    return () => {
      cleanupAutorem();
      cleanupViewport();
    }
  }, []);

  return <App />;
}
