import "dotenv/config";

import express, { type Express } from "express";
import healthRouter from "./routes/health.route";
import db from "./config/db";
import { migrate } from "./generator/migrate";

const app: Express = express();
const port = process.env.PORT ?? 3000;

// ─── Global Middlewares ───────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/health", healthRouter);

async function bootstrap() {
    try {
        // Verify database connection
        await db.raw("SELECT 1");
        console.log("Database connected.");

        // Auto migrate
        await migrate();

        // Start server
        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
// ─── Server ──────────────────────────────────────────────────────────────────
app.listen(port, () => {
    console.log(`[server] Running on http://localhost:${port}`);
});
