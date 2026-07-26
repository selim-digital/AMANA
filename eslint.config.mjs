import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // App francophone : les apostrophes typographiques sont partout dans les
      // textes JSX. Cette règle purement cosmétique ne doit pas bloquer le build.
      "react/no-unescaped-entities": "off",
      // Hydratation depuis localStorage au montage (setState dans un effect vide)
      // = motif SSR-safe volontaire de cette app. Faux positif ici.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
