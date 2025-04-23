// vitest.config.mjs
import { defineWorkersConfig, readD1Migrations } from "file:///Users/enchantcode/work/SourceCode/WebDev/Dist/financier/node_modules/@cloudflare/vitest-pool-workers/dist/config/index.cjs";
var __vite_injected_original_dirname = "/Users/enchantcode/work/SourceCode/WebDev/Dist/financier/backend";
var migrationRelPath = "src/migrations";
var migrations = await readD1Migrations(`${__vite_injected_original_dirname}/${migrationRelPath}`);
var vitest_config_default = defineWorkersConfig({
  resolve: { alias: { "@": `${__vite_injected_original_dirname}/src` } },
  test: {
    globals: true,
    setupFiles: [
      `${migrationRelPath}/apply_d1.ts`,
      "src/vitest.setup.ts"
    ],
    poolOptions: {
      workers: {
        main: "src/index.ts",
        miniflare: {
          d1Databases: ["D1"],
          bindings: {
            // NOTE: テスト用のマイグレーションを定義
            TEST_MIGRATIONS: migrations
          }
        },
        wrangler: {
          configPath: "./wrangler.toml",
          environment: "development"
        }
      }
    }
  }
});
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy5tanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvZW5jaGFudGNvZGUvd29yay9Tb3VyY2VDb2RlL1dlYkRldi9EaXN0L2ZpbmFuY2llci9iYWNrZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvZW5jaGFudGNvZGUvd29yay9Tb3VyY2VDb2RlL1dlYkRldi9EaXN0L2ZpbmFuY2llci9iYWNrZW5kL3ZpdGVzdC5jb25maWcubWpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9lbmNoYW50Y29kZS93b3JrL1NvdXJjZUNvZGUvV2ViRGV2L0Rpc3QvZmluYW5jaWVyL2JhY2tlbmQvdml0ZXN0LmNvbmZpZy5tanNcIjtpbXBvcnQgeyBkZWZpbmVXb3JrZXJzQ29uZmlnLCByZWFkRDFNaWdyYXRpb25zIH0gZnJvbSAnQGNsb3VkZmxhcmUvdml0ZXN0LXBvb2wtd29ya2Vycy9jb25maWcnXG5cbmNvbnN0IG1pZ3JhdGlvblJlbFBhdGggPSAnc3JjL21pZ3JhdGlvbnMnXG5cbmNvbnN0IG1pZ3JhdGlvbnMgPSBhd2FpdCByZWFkRDFNaWdyYXRpb25zKGAke19fZGlybmFtZX0vJHttaWdyYXRpb25SZWxQYXRofWApXG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZVdvcmtlcnNDb25maWcoe1xuICByZXNvbHZlOiB7IGFsaWFzOiB7ICdAJzogYCR7X19kaXJuYW1lfS9zcmNgIH0gfSxcbiAgdGVzdDoge1xuICAgIGdsb2JhbHM6IHRydWUsXG4gICAgc2V0dXBGaWxlczogW1xuICAgICAgYCR7bWlncmF0aW9uUmVsUGF0aH0vYXBwbHlfZDEudHNgLFxuICAgICAgJ3NyYy92aXRlc3Quc2V0dXAudHMnLFxuICAgIF0sXG4gICAgcG9vbE9wdGlvbnM6IHtcbiAgICAgIHdvcmtlcnM6IHtcbiAgICAgICAgbWFpbjogJ3NyYy9pbmRleC50cycsXG4gICAgICAgIG1pbmlmbGFyZToge1xuICAgICAgICAgIGQxRGF0YWJhc2VzOiBbJ0QxJ10sXG4gICAgICAgICAgYmluZGluZ3M6IHtcbiAgICAgICAgICAgIC8vIE5PVEU6IFx1MzBDNlx1MzBCOVx1MzBDOFx1NzUyOFx1MzA2RVx1MzBERVx1MzBBNFx1MzBCMFx1MzBFQ1x1MzBGQ1x1MzBCN1x1MzBFN1x1MzBGM1x1MzA5Mlx1NUI5QVx1N0ZBOVxuICAgICAgICAgICAgVEVTVF9NSUdSQVRJT05TOiBtaWdyYXRpb25zLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHdyYW5nbGVyOiB7XG4gICAgICAgICAgY29uZmlnUGF0aDogJy4vd3JhbmdsZXIudG9tbCcsXG4gICAgICAgICAgZW52aXJvbm1lbnQ6ICdkZXZlbG9wbWVudCcsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF3WCxTQUFTLHFCQUFxQix3QkFBd0I7QUFBOWEsSUFBTSxtQ0FBbUM7QUFFekMsSUFBTSxtQkFBbUI7QUFFekIsSUFBTSxhQUFhLE1BQU0saUJBQWlCLEdBQUcsZ0NBQVMsSUFBSSxnQkFBZ0IsRUFBRTtBQUU1RSxJQUFPLHdCQUFRLG9CQUFvQjtBQUFBLEVBQ2pDLFNBQVMsRUFBRSxPQUFPLEVBQUUsS0FBSyxHQUFHLGdDQUFTLE9BQU8sRUFBRTtBQUFBLEVBQzlDLE1BQU07QUFBQSxJQUNKLFNBQVM7QUFBQSxJQUNULFlBQVk7QUFBQSxNQUNWLEdBQUcsZ0JBQWdCO0FBQUEsTUFDbkI7QUFBQSxJQUNGO0FBQUEsSUFDQSxhQUFhO0FBQUEsTUFDWCxTQUFTO0FBQUEsUUFDUCxNQUFNO0FBQUEsUUFDTixXQUFXO0FBQUEsVUFDVCxhQUFhLENBQUMsSUFBSTtBQUFBLFVBQ2xCLFVBQVU7QUFBQTtBQUFBLFlBRVIsaUJBQWlCO0FBQUEsVUFDbkI7QUFBQSxRQUNGO0FBQUEsUUFDQSxVQUFVO0FBQUEsVUFDUixZQUFZO0FBQUEsVUFDWixhQUFhO0FBQUEsUUFDZjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
