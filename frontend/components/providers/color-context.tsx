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

    // Load saved themes from local storage or use default themes
    const getInitialDarkTheme = () => {
        const savedDarkTheme = localStorage.getItem("darkThemeColors");
        return savedDarkTheme
            ? JSON.parse(savedDarkTheme)
            : {
                  rules: [
                      { token: "comment", foreground: "666666" },
                      { token: "constant.other", foreground: "569CD6" },
                      { token: "keyword", foreground: "aeaeeb" },
                      { token: "constant.language", foreground: "D99FF1" },
                      { token: "constant.numeric", foreground: "aeaeeb" },
                      { token: "string", foreground: "9AEFEA" },
                      { token: "variable.language", foreground: "9dcafa" },
                  ],
              };
    };

    const getInitialLightTheme = () => {
        const savedLightTheme = localStorage.getItem("lightThemeColors");
        return savedLightTheme
            ? JSON.parse(savedLightTheme)
            : {
                  rules: [
                      { token: "comment", foreground: "999999" },
                      { token: "constant.other", foreground: "267abf" },
                      { token: "keyword", foreground: "6f3fd9" },
                      { token: "constant.language", foreground: "b050d9" },
                      { token: "constant.numeric", foreground: "6f3fd9" },
                      { token: "string", foreground: "04b07c" },
                      { token: "variable.language", foreground: "0263cc" },
                  ],
              };
    };

    const [darkThemeColors, setDarkThemeColors] = useState(getInitialDarkTheme);
    const [lightThemeColors, setLightThemeColors] =
        useState(getInitialLightTheme);

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
            setDarkThemeColors((prev: any) => {
                const updatedTheme = {
                    ...prev,
                    rules: prev.rules.map((rule: any) =>
                        rule.token === token
                            ? { ...rule, foreground: colorHex.slice(1) }
                            : rule
                    ),
                };
                localStorage.setItem(
                    "darkThemeColors",
                    JSON.stringify(updatedTheme)
                );
                return updatedTheme;
            });
        } else {
            setLightThemeColors((prev: any) => {
                const updatedTheme = {
                    ...prev,
                    rules: prev.rules.map((rule: any) =>
                        rule.token === token
                            ? { ...rule, foreground: colorHex.slice(1) }
                            : rule
                    ),
                };
                localStorage.setItem(
                    "lightThemeColors",
                    JSON.stringify(updatedTheme)
                );
                return updatedTheme;
            });
        }
    };

    // Update the Monaco theme whenever the colors change
    useEffect(() => {
        monaco.editor.defineTheme("dark", darkTheme);
        monaco.editor.defineTheme("light", lightTheme);
    }, [darkThemeColors, lightThemeColors]);

    return (
        <ColorThemeContext.Provider
            value={{ updateColor, darkTheme, lightTheme }}
        >
            {children}
        </ColorThemeContext.Provider>
    );
};

export const useColorTheme = () => useContext(ColorThemeContext);
