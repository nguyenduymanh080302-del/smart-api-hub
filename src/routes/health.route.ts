import { Router, type Request, type Response } from "express";
import db from "../config/db";

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health Check
 *     description: Checks whether the API server and PostgreSQL database are running.
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Server and database are healthy.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 db:
 *                   type: string
 *                   example: connected
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: Database is unavailable.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 db:
 *                   type: string
 *                   example: disconnected
 *                 timestamp:
 *                   type: string
 *                   format: date-time
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