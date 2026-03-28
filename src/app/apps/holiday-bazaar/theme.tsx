"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type ThemeName = "bazaar" | "party";

export type Palette = {
  bg: string;
  surface: string;
  surfaceHover: string;
  surfaceElevated: string;
  border: string;
  border2: string;
  borderActive: string;
  amber: string;
  amberDim: string;
  amberBorder: string;
  green: string;
  greenDim: string;
  greenBorder: string;
  cream: string;
  text: string;
  muted: string;
  subtle: string;
  danger: string;
  gradientAccent: string;
  fontMono: string;
  fontDisplay: string;
};

const BAZAAR: Palette = {
  bg: "#0D0800",
  surface: "rgba(255,255,255,0.04)",
  surfaceHover: "rgba(255,255,255,0.07)",
  surfaceElevated: "#1A1200",
  border: "rgba(255,255,255,0.09)",
  border2: "rgba(255,255,255,0.06)",
  borderActive: "rgba(240,180,40,0.6)",
  amber: "#F0B429",
  amberDim: "rgba(240,180,40,0.12)",
  amberBorder: "rgba(240,180,40,0.25)",
  green: "#4ADE80",
  greenDim: "rgba(74,222,128,0.12)",
  greenBorder: "rgba(74,222,128,0.25)",
  cream: "#F0E8D5",
  text: "rgba(255,255,255,0.88)",
  muted: "rgba(255,255,255,0.42)",
  subtle: "rgba(255,255,255,0.18)",
  danger: "#E85D5D",
  gradientAccent: "rgba(240,180,40,0.12)",
  fontMono: "var(--font-geist-mono)",
  fontDisplay: "var(--font-geist-sans)",
};

const PARTY: Palette = {
  bg: "#F2EDD8",
  surface: "rgba(24,18,10,0.05)",
  surfaceHover: "rgba(24,18,10,0.09)",
  surfaceElevated: "#EAE4CC",
  border: "rgba(24,18,10,0.12)",
  border2: "rgba(24,18,10,0.08)",
  borderActive: "rgba(59,191,191,0.65)",
  amber: "#3BBFBF",
  amberDim: "rgba(59,191,191,0.12)",
  amberBorder: "rgba(59,191,191,0.3)",
  green: "#9B8BB4",
  greenDim: "rgba(155,139,180,0.13)",
  greenBorder: "rgba(155,139,180,0.3)",
  cream: "#18120A",
  text: "#18120A",
  muted: "rgba(24,18,10,0.5)",
  subtle: "rgba(24,18,10,0.25)",
  danger: "#C0334D",
  gradientAccent: "rgba(59,191,191,0.1)",
  fontMono: "var(--font-dm-mono)",
  fontDisplay: "var(--font-archivo-black)",
};

const THEMES: Record<ThemeName, Palette> = { bazaar: BAZAAR, party: PARTY };

const ThemeContext = createContext<{
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  C: Palette;
}>({ theme: "bazaar", setTheme: () => {}, C: BAZAAR });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    if (typeof window === "undefined") return "bazaar";
    return localStorage.getItem("hb_theme") === "party" ? "party" : "bazaar";
  });

  function setTheme(t: ThemeName) {
    setThemeState(t);
    localStorage.setItem("hb_theme", t);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, C: THEMES[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeToggle() {
  const { theme, setTheme, C } = useTheme();
  return (
    <div
      style={{
        display: "inline-flex",
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: "100px",
        padding: "2px",
        gap: "2px",
      }}
    >
      {(["bazaar", "party"] as ThemeName[]).map((t) => (
        <button
          key={t}
          onClick={() => setTheme(t)}
          style={{
            padding: "0.2rem 0.6rem",
            borderRadius: "100px",
            border: "none",
            background: theme === t ? C.amber : "transparent",
            color: theme === t ? C.bg : C.muted,
            fontFamily: C.fontMono,
            fontSize: "0.6rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "background 0.15s, color 0.15s",
            minHeight: "28px",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
