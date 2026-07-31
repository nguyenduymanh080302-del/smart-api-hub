import { Request, Response, NextFunction } from "express";

const LIMIT = 100;
const WINDOW_MS = 60 * 1000; // 1 minute

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const requests = new Map<string, RateLimitEntry>();

// Cleanup expired entries every minute
setInterval(() => {
    const now = Date.now();

    for (const [ip, entry] of requests.entries()) {
        if (now >= entry.resetTime) {
            requests.delete(ip);
        }
    }
}, WINDOW_MS);

export const rateLimit = (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();

    let entry = requests.get(ip);

    // First request or window expired
    if (!entry || now >= entry.resetTime) {
        entry = {
            count: 1,
            resetTime: now + WINDOW_MS,
        };

        requests.set(ip, entry);
    } else {
        entry.count++;
    }

    const remaining = Math.max(0, LIMIT - entry.count);

    res.setHeader("X-RateLimit-Limit", LIMIT);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader(
        "X-RateLimit-Reset",
        Math.ceil(entry.resetTime / 1000)
    );

    if (entry.count > LIMIT) {
        return res.status(429).json({
            status: "error",
            message: "Too Many Requests",
        });
    }

    next();
}