import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // The codebase fetches data on mount via useEffect(() => { load(); }).
      // This strict compiler rule flags that pattern; keep it visible but non-blocking.
      "react-hooks/set-state-in-effect": "warn",
      // Underscore prefix marks intentionally unused values (e.g. destructuring to omit fields).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
  globalIgnores([
    "node_modules/**",
    ".next/**",
    ".netlify/**",
    ".test-ci/**",
    ".test-netlify-install/**",
    ".test-netlify2/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "foundry-landing.jsx",
    "var/**",
  ]),
]);

export default eslintConfig;
