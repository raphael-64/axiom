"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/providers/theme-provider";
import dynamic from "next/dynamic";
import { Toaster } from "@/components/ui/sonner";

const ColorThemeProvider = dynamic(
  () => import("./color-context").then((mod) => mod.ColorThemeProvider),
  {
    ssr: false,
  }
);

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <ColorThemeProvider>
          {children}
          <Toaster />
        </ColorThemeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
