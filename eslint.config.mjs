// eslint.config.mjs - Configuración de ESLint con reglas de frontera arquitectónica para UI y App Router.
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/app/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    ignores: ["src/app/api/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "@supabase/*",
            "@/infrastructure/persistence/supabase/*",
            "@/infrastructure/database/*",
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
  ]),
     {
    rules: {
      "react/no-unescaped-entities": "off",
      "react/jsx-key": "off",
    },
  },
]);

export default eslintConfig;
