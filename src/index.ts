import "dotenv/config";

import express, { type Express, type Request, type Response, type NextFunction } from "express";
import healthRouter from "./routes/health.route";
import resourceRouter from "./routes/resource.route";
import authRouter from "./routes/auth.route";
import db from "./config/db";
import { migrate } from "./generator/migrate";
import { setupSwagger } from "./config/swagger";
import { rateLimit } from "./middleware/rateLimit.middleware";

const app: Express = express();

// ─── Global Middlewares 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

setupSwagger(app);

app.use(rateLimit);
app.use("/health", healthRouter);
app.use("/auth", authRouter);
app.use("/", resourceRouter);

// ─── Global Error Handler 
// Responds with format: { "error": "message" }
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("[global-error-handler]:", err);

    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
        error: err.message || "Internal Server Error"
    });
});

async function bootstrap() {
    try {
        // Verify database connection
        await db.raw("SELECT 1");
        console.log("Database connected.");

        // Auto migrate
        await migrate();

        // Start server only if not in a testing environment
        if (process.env.NODE_ENV !== "test") {
            const PORT = process.env.PORT || 9999;
            app.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
            });
        }

    } catch (err) {
        console.error("Bootstrap error:", err);
        process.exit(1);
    }
}

// Start bootstrapping the app
bootstrap();

export { app };
