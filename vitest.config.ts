import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
    test: {
        globals: true,
        environment: "node",
        setupFiles: ["dotenv/config"],
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
        // Run tests sequentially to avoid DB race conditions
        fileParallelism: false,
    },
    resolve: {
        alias: {
            "@": resolve(__dirname, "./src"),
        },
    },
});
