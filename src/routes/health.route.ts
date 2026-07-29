import { Router, type Request, type Response } from "express";
import db from "../config/db";

const router = Router();

/**
 * GET /health
 * Returns server status and real DB ping.
 */
router.get("/", async (_req: Request, res: Response) => {
    try {
        await db.raw("SELECT 1");
        res.json({
            status: "ok",
            db: "connected",
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("[health] DB ping failed:", error);
        res.status(503).json({
            status: "error",
            db: "disconnected",
            timestamp: new Date().toISOString(),
        });
    }
});

export default router;
