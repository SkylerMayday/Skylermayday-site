import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  // Vite 8 uses the oxc/rolldown transform pipeline, not esbuild — an
  // `esbuild.jsx` option here is silently ignored ("oxc options will be
  // used and esbuild options will be ignored"). Explicit `oxc.jsx` is
  // required because tsconfig.json's `"jsx": "preserve"` (needed for
  // Next's own SWC build, see spec §1 — do not change it) would otherwise
  // be auto-discovered and leave JSX untransformed, which breaks SSR
  // module execution of .tsx test files with "Unexpected JSX expression".
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          // Not narrowed to "lib/**/*.test.ts" (as the original spec drafted
          // it): the pre-existing suite also has *.test.ts files outside
          // lib/ (app/api/contact/route.test.ts,
          // app/api/stream-analyser/__tests__/audio-proxy.test.ts,
          // data/discord-commands.test.ts) that the old flat
          // include: ["**/*.test.ts"] config covered. Narrowing to lib/
          // silently dropped 32 tests from the run — caught by actually
          // running the suite and diffing the count against the documented
          // 165-test baseline. Kept at the original repo-wide glob so
          // nothing existing loses coverage; no overlap with the
          // "components" project below since *.test.ts and *.test.tsx are
          // mutually exclusive by extension.
          include: ["**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "components",
          environment: "jsdom",
          // Repo-wide on purpose, not scoped to components/: a .test.tsx
          // added anywhere else (e.g. app/) would otherwise be silently
          // skipped with no warning — it would simply never run. Same
          // no-overlap reasoning as the "unit" project above: *.test.ts and
          // *.test.tsx are mutually exclusive by extension, so no file can
          // be collected by both projects.
          include: ["**/*.test.tsx"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
    ],
  },
});
