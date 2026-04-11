import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** GitHub project pages use /repo-name/; user/org pages (username.github.io repo) use /. Set via BASE_PATH in CI. */
function appBase(): string {
  const raw = process.env.BASE_PATH?.trim();
  if (!raw || raw === "/") return "/";
  const withLeading = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}

export default defineConfig({
  base: appBase(),
  plugins: [react()],
});
