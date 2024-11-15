import React, { createContext, useContext, useState, useEffect } from "react";
import { useTheme } from "next-themes";
import * as monaco from "monaco-editor";
import type { editor } from "monaco-editor";

// import { darkThemeOld, lightThemeOld } from "@/lib/colors";

const ColorThemeContext = createContext<ColorThemeContextType | null>(null);

import { ReactNode } from "react";

interface ColorThemeContextType {
    updateColor: (token: string, colorHex: string) => void;
    darkTheme: editor.IStandaloneThemeData;
    lightTheme: editor.IStandaloneThemeData;
}

interface ColorThemeProviderProps {
    children: ReactNode;
}

export const ColorThemeProvider = ({ children }: ColorThemeProviderProps) => {
    const { theme } = useTheme();

    // Create state for custom dark and light themes
    const [darkThemeColors, setDarkThemeColors] = useState({
        rules: [
            { token: "comment", foreground: "666666" },
            { token: "constant.other", foreground: "569CD6" },
            { token: "keyword", foreground: "aeaeeb" },
            { token: "constant.language", foreground: "D99FF1" },
            { token: "constant.numeric", foreground: "aeaeeb" },
            { token: "string", foreground: "9AEFEA" },
            { token: "variable.language", foreground: "9dcafa" },
        ],
    });

    const [lightThemeColors, setLightThemeColors] = useState({
        rules: [
            { token: "comment", foreground: "999999" },
            { token: "constant.other", foreground: "267abf" },
            { token: "keyword", foreground: "6f3fd9" },
            { token: "constant.language", foreground: "b050d9" },
            { token: "constant.numeric", foreground: "6f3fd9" },
            { token: "string", foreground: "04b07c" },
            { token: "variable.language", foreground: "0263cc" },
        ],
    });

    const darkTheme: editor.IStandaloneThemeData = {
        base: "vs-dark",
        inherit: true,
        rules: darkThemeColors.rules,
        colors: {
            "editor.background": "#0A0A0A",
        },
    };

    const lightTheme: editor.IStandaloneThemeData = {
        base: "vs",
        inherit: true,
        rules: lightThemeColors.rules,
        colors: {
            "editor.background": "#FFFFFF",
        },
    };

    // Function to update colors for a specific token
    const updateColor = (token: string, colorHex: string) => {
        if (theme === "dark") {
            setDarkThemeColors((prev) => ({
                ...prev,
                rules: prev.rules.map((rule) =>
                    rule.token === token
                        ? { ...rule, foreground: colorHex.slice(1) }
                        : rule
                ),
            }));
        } else {
            setLightThemeColors((prev) => ({
                ...prev,
                rules: prev.rules.map((rule) =>
                    rule.token === token
                        ? { ...rule, foreground: colorHex.slice(1) }
                        : rule
                ),
            }));
        }
    };

    // Update the Monaco theme whenever the colors change
    useEffect(() => {
        console.log("Updating Monaco theme");
        monaco.editor.defineTheme("dark", darkTheme);
        monaco.editor.defineTheme("light", lightTheme);
        console.log(darkTheme);
        console.log(lightTheme);
        // monaco.editor.setTheme(theme === "dark" ? "dark" : "light");
    }, [darkThemeColors, lightThemeColors, theme]);

    return (
        <ColorThemeContext.Provider
            value={{ updateColor, darkTheme, lightTheme }}
        >
            {children}
        </ColorThemeContext.Provider>
    );
};

export const useColorTheme = () => useContext(ColorThemeContext);
