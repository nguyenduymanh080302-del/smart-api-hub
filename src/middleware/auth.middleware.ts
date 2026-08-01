import { RequestHandler } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export const authenticate: RequestHandler = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({
            error: "Access token is missing or invalid"
        });
        return;
    }

    try {
        req.user = jwt.verify(
            authHeader.substring(7),
            JWT_SECRET
        ) as Express.Request["user"];

        next();
    } catch {
        res.status(401).json({
            error: "Invalid token"
        });
    }
};

export const requireAdmin: RequestHandler = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            error: "Unauthorized"
        });
        return;
    }

    if (req.user.role !== "admin") {
        res.status(403).json({
            error: "Forbidden: Admin role required"
        });
        return;
    }

    next();
};