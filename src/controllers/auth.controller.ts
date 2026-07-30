import { type Request, type Response } from "express";
import * as authService from "../services/auth.service";
import { RegisterSchema, LoginSchema } from "../validator/auth.validator";

/**
 * Controller handler for user registration.
 * Validates request payload against RegisterSchema and registers the user.
 */
export const register = async (req: Request, res: Response) => {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
        const errMsg = parsed.error.issues
            .map((e: any) => `${e.path.join(".")}: ${e.message}`)
            .join("; ");
        return res.status(400).json({
            error: errMsg
        });
    }

    try {
        const user = await authService.register(parsed.data);
        return res.status(201).json({
            data: user
        });
    } catch (error: any) {
        // Handle database or duplication errors
        return res.status(400).json({
            error: error.message
        });
    }
};

/**
 * Controller handler for user login.
 * Validates request payload against LoginSchema, authenticates, and returns a JWT token.
 */
export const login = async (req: Request, res: Response) => {
    // 1. Validate credentials payload
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
        const errMsg = parsed.error.issues
            .map((e: any) => `${e.path.join(".")}: ${e.message}`)
            .join("; ");
        return res.status(400).json({
            error: errMsg
        });
    }

    try {
        // 2. Delegate auth checks to AuthService
        const result = await authService.login(parsed.data);
        return res.status(200).json({
            data: result
        });
    } catch (error: any) {
        // Handle credential mismatch or unknown user email
        return res.status(401).json({
            error: error.message
        });
    }
};