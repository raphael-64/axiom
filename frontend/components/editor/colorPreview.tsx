import { useEffect } from "react";
import { useColorTheme } from "@/components/providers/color-context";
import { useTheme } from "next-themes";
import { Editor, BeforeMount } from "@monaco-editor/react";
import { registerGeorge } from "@/lib/lang";

const PREVIEW_CODE = `#check TP
a & !a <-> false
1) a & !a
2) false    by contr  // Comments`;

export default function ColorPreview() {
  const { theme, resolvedTheme } = useTheme();
  const colorThemeContext = useColorTheme();
  const colorTheme =
    resolvedTheme === "dark"
      ? colorThemeContext?.darkTheme
      : colorThemeContext?.lightTheme;

  const handleEditorWillMount: BeforeMount = (monaco) => {
    monaco.languages.register({ id: "george" });
    monaco.languages.setMonarchTokensProvider("george", {
      tokenizer: {
        root: [
          // Comments - must be before other rules
          [/\/\/.*$/, "comment"],

          // Entire lines starting with # should be colored
          [
            /^.*#(?:check\s+(?:PROP|ND|PC|Z|TP|ST|PREDTYPES|PRED|NONE)|[qua][ \t].*$)/,
            "constant.other",
          ],

          // Line numbers - must be before regular numbers
          [/^\s*(?:\d+|bc|ih)\)/, "variable.language"],

          // Numbers in references (after 'on') should be colored like line numbers
          [
            /\bon\s+((?:\d+|bc|ih)(?:\s*[,-]\s*(?:\d+|bc|ih))*)/g,
            "variable.language",
          ],

          // All other numbers in expressions should be white
          [/(?<![a-zA-Z])\d+(?![a-zA-Z])/, { token: "" }],

          // Keywords
          [
            /\b(by|on|forall|exists|schema|pred|end|proc|fun|assert|if|then|else|while|do)\b/,
            "keyword",
          ],

          // Built-in constants
          [/\b(true|false|empty|univ|N)\b/, "string"],

          // Language constants (proof rules)
          [
            /\b(and_i|and_e|or_i|or_e|lem|imp_e|not_e|not_not_i|not_not_e|iff_i|iff_e|trans|iff_mp|exists_i|forall_e|eq_i|eq_e|premise|raa|cases|imp_i|forall_i|exists_e|disprove|case|assume|for every|for some|and_nb|not_and_br|or_br|not_or_nb|imp_br|not_imp_nb|not_not_nb|iff_br|not_iff_br|forall_nb|not_forall_nb|exists_nb|not_exists_nb|closed|comm_assoc|contr|lem|impl|contrapos|simp1|simp2|distr|dm|neg|equiv|idemp|forall_over_and|exists_over_or|swap_vars|move_exists|move_forall|set|arith|Delta|Xi)\b/,
            "constant.language",
          ],

          // Operators
          [
            /\b(in|sube|sub|pow|union|inter|card|gen_U|dom|ran|id|iter|seq|compl)\b/,
            "constant.numeric",
          ],

          // Special symbols
          [/[&()+:;=\|\-<>?!*]|diff|prod/, "constant.numeric"],

          // Identifiers with numbers
          [/[a-zA-Z_]\w*/, "identifier"],

          // Standalone numbers
          [/\b\d+\b/, "variable.language"],
        ],
      },
    });
  };

  return (
    <div className="mt-3 border rounded-sm p-2 pointer-events-none select-none">
      <Editor
        className="h-[4.5rem] w-full readonly-editor"
        defaultValue={PREVIEW_CODE}
        defaultLanguage="george"
        beforeMount={handleEditorWillMount}
        theme={theme === "dark" ? "dark" : "light"}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          scrollbar: { vertical: "hidden", horizontal: "hidden" },
          folding: false,
          lineNumbersMinChars: 0,
          glyphMargin: false,
          contextmenu: false,
          renderLineHighlight: "none",
          scrollBeyondLastLine: false,
          domReadOnly: true,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
        }}
      />
    </div>
  );
}
