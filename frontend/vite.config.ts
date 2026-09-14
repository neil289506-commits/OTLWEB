import { defineConfig } from "vite";

export default defineConfig({
  // 使用相對路徑，這樣無論部署在根網域（https://user.github.io/）
  // 或子路徑（https://user.github.io/repo/）都能正確載入資源，
  // 也方便本機用 file:// 直接開啟 dist/index.html 預覽。
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
});
