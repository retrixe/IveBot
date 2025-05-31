import js from "@eslint/js";
import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";
import standardJsx from "eslint-config-standard-jsx";
import standardReact from "eslint-config-standard-react";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";
import pluginPromise from "eslint-plugin-promise";
import nodePlugin from "eslint-plugin-n";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

export default tseslint.config(
  {
    ignores: [
      ".pnp.cjs",
      ".pnp.loader.mjs",
      ".yarn",
      ".next",
      ".prettierrc.mjs",
      "*.config.{mjs,js}",
    ],
  },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  react.configs.flat.recommended,
  pluginPromise.configs["flat/recommended"],
  importPlugin.flatConfigs.recommended, // Could use TypeScript resolver
  nodePlugin.configs["flat/recommended-module"],
  {
    plugins: { "@next/next": nextPlugin },
    rules: nextPlugin.configs.recommended.rules,
  },
  {
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  { rules: standardJsx.rules },
  { rules: standardReact.rules },
  {
    settings: { react: { version: "detect" } },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/no-import-type-side-effects": ["error"],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          disallowTypeAnnotations: true,
          fixStyle: "inline-type-imports",
        },
      ],
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowAny: false,
          allowBoolean: false,
          allowNullish: false,
          allowNumber: true,
          allowRegExp: false,
          allowNever: false,
        },
      ],
      "promise/always-return": ["error", { ignoreLastCallback: true }],
      "n/no-missing-import": "off",
      "n/no-unsupported-features/node-builtins": "off",
      "n/no-unsupported-features/es-syntax": "off",
      "import/no-unresolved": "off",
      // FIXME: Re-enable the following rules!
      "no-empty": "off",
      "n/no-extraneous-import": "off",
      "@typescript-eslint/no-deprecated": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
    },
  },
  eslintPluginPrettierRecommended,
);
