import React from "react";
import { useColorTheme } from "@/components/providers/color-context";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";

import { useState } from "react";

export default function ColorPreview() {
    const { theme } = useTheme();
    const colorThemeContext = useColorTheme();
    const colorTheme =
        theme === "dark"
            ? colorThemeContext?.darkTheme
            : colorThemeContext?.lightTheme;

    const [previewTheme, setPreviewTheme] = useState(theme === "dark");

    return (
        <>
            <div
                className={`${
                    previewTheme
                        ? "bg-[#0A0A0A] border text-white"
                        : "bg-white border text-[#0A0A0A]"
                } font-[family-name:var(--font-geist-mono)] text-sm mt-3 py-1 px-2 border rounded-sm whitespace-pre`}
            >
                <p style={{ color: "#" + colorTheme?.rules[1].foreground }}>
                    {"#check TP"}
                </p>
                <p>
                    a{" "}
                    <span
                        style={{ color: "#" + colorTheme?.rules[4].foreground }}
                    >
                        & !
                    </span>
                    a{" "}
                    <span
                        style={{ color: "#" + colorTheme?.rules[4].foreground }}
                    >
                        {"<->"}
                    </span>
                    <span
                        style={{ color: "#" + colorTheme?.rules[5].foreground }}
                    >
                        {" false"}
                    </span>
                </p>
                <p>
                    <span
                        style={{ color: "#" + colorTheme?.rules[6].foreground }}
                    >
                        {"1) "}
                    </span>
                    a{" "}
                    <span
                        style={{ color: "#" + colorTheme?.rules[4].foreground }}
                    >
                        & !
                    </span>
                    a
                </p>
                <p>
                    <span
                        style={{ color: "#" + colorTheme?.rules[6].foreground }}
                    >
                        {"2) "}
                    </span>
                    <span
                        style={{ color: "#" + colorTheme?.rules[5].foreground }}
                    >
                        {"false "}
                    </span>
                    <span
                        style={{ color: "#" + colorTheme?.rules[2].foreground }}
                    >
                        {"by "}
                    </span>
                    <span
                        style={{ color: "#" + colorTheme?.rules[3].foreground }}
                    >
                        {"contr"}
                    </span>
                    <span
                        style={{ color: "#" + colorTheme?.rules[0].foreground }}
                    >
                        {"  // Comments"}
                    </span>
                </p>
            </div>
            {/* <Switch
                checked={previewTheme}
                onCheckedChange={(checked) => {
                    setPreviewTheme(checked);
                }}
            /> */}
        </>
    );
}

// #check TP
// a & !a <-> false
// 1) a & !a
// 2) false    by contr
