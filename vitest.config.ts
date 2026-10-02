import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Mirror the "@/..." path alias from tsconfig so tests can import app code
// that uses it.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
});
