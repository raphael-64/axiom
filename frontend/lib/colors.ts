import type { editor } from "monaco-editor";

export const darkThemeRules = [
    { token: "comment", foreground: "666666" },
    { token: "constant.other", foreground: "569CD6" }, // "#check x"
    { token: "keyword", foreground: "aeaeeb" }, // "forall", "exists", "by"
    { token: "constant.language", foreground: "D99FF1" },
    { token: "constant.numeric", foreground: "aeaeeb" }, // "(", "=>"
    { token: "string", foreground: "9AEFEA" }, // "true false"
    { token: "variable.language", foreground: "9dcafa" }, // line & rule numbers: "15), "on 12-20"
];

export const darkThemeOld: editor.IStandaloneThemeData = {
    base: "vs-dark",
    inherit: true,
    rules: darkThemeRules,
    colors: {
        "editor.background": "#0A0A0A",
    },
};

export const lightThemeRules = [
    { token: "comment", foreground: "999999" },
    { token: "constant.other", foreground: "267abf" }, // "#check x"
    { token: "keyword", foreground: "6f3fd9" }, // "forall", "exists", "by"
    { token: "constant.language", foreground: "b050d9" }, // rules
    { token: "constant.numeric", foreground: "6f3fd9" }, // "(", "=>"
    { token: "string", foreground: "04b07c" }, // "true" 'false'
    { token: "variable.language", foreground: "0263cc" }, // line & rule numbers: "15), "on 12-20"
];

export const lightThemeOld: editor.IStandaloneThemeData = {
    base: "vs",
    inherit: true,
    rules: lightThemeRules,
    colors: {
        "editor.background": "#FFFFFF",
    },
};

// export const darkColors = darkTheme.rules;
// export const lightColors = lightTheme.rules;
// console.log(darkColors.map((rule) => rule.token));

export const getRandomColor = () => {
    const colors = [
        "#3B82F6", // blue-500
        "#EC4899", // pink-500
        "#EF4444", // red-500
        "#F97316", // orange-500
        "#EAB308", // yellow-500
        "#22C55E", // green-500
        "#06B6D4", // cyan-500
        "#6366F1", // indigo-500
        "#A855F7", // purple-500
        "#D946EF", // fuchsia-500
    ];
    return colors[Math.floor(Math.random() * colors.length)];
};
