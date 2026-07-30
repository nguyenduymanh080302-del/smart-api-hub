import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

/**
 * Extended Express Request object to hold current authenticated user details.
 */
export interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        email: string;
        role: string;
    };
}

/**
 * Middleware to authenticate requests via JWT tokens in the Authorization Bearer header.
 * Responds with 401 on missing or invalid tokens.
 */
export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            error: "Access token is missing or invalid"
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            error: "Invalid token"
        });
    }
};

/**
 * Middleware to restrict route access only to users possessing the 'admin' role.
 * Responds with 403 Forbidden if the user is authenticated but not an admin.
 */
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({
            error: "Unauthorized"
        });
    }

    if (req.user.role !== "admin") {
        return res.status(403).json({
            error: "Forbidden: Admin role required"
        });
    }

    next();
};
