import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
    test: {
        globals: true,
        environment: "node",
        setupFiles: ["src/tests/setup.ts"],
        coverage: {
            provider: "v8",
            reporter: ["text", "lcov", "html"],
            thresholds: {
                lines: 70,
                functions: 70,
                branches: 70,
                statements: 70,
            },
            include: ["src/**/*.ts"],
            exclude: ["src/knexfile.ts", "src/types/**"],
        },
        // Avoid running compiled files in dist directory
        exclude: ["**/node_modules/**", "**/dist/**"],
        // Run tests sequentially to avoid DB race conditions
        fileParallelism: false,
    },
    resolve: {
        alias: {
            "@": resolve(__dirname, "./src"),
        },
    },
});
