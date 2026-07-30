"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../config/db"));
const router = (0, express_1.Router)();
/**
 * GET /health
 * Returns server status and real DB ping.
 */
router.get("/", async (_req, res) => {
    try {
        await db_1.default.raw("SELECT 1");
        res.json({
            status: "ok",
            db: "connected",
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error("[health] DB ping failed:", error);
        res.status(503).json({
            status: "error",
            db: "disconnected",
            timestamp: new Date().toISOString(),
        });
    }
});
exports.default = router;
