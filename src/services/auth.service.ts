import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../config/db";
import { RegisterDto, LoginDto } from "../validator/auth.validator";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

/**
 * Registers a new user inside the database after hashing their password.
 * Checks for email duplication to prevent conflict.
 * 
 * @param body - The validated registration payload.
 * @returns The newly created user details (excluding password).
 */
export const register = async (body: RegisterDto) => {
    // Verify if the email is already in use
    const existing = await db("users").where({ email: body.email }).first();
    if (existing) {
        throw new Error("Email already registered");
    }

    // Hash password
    const hashed = await bcrypt.hash(body.password, 10);

    const [inserted] = await db("users")
        .insert({
            ...body,
            role: body.email === process.env.ADMIN_EMAIL ? "admin" : "user",
            password: hashed,
        })
        .returning(["id", "name", "email", "role", "isActive"]);

    return inserted;
};

/**
 * Authenticates a user with email and password, generating a JWT token on success.
 * 
 * @param body - The validated login payload.
 * @returns An object containing the user metadata and the authorization JWT token.
 */
export const login = async (body: LoginDto) => {
    const user = await db("users").where({ email: body.email }).first();
    if (!user) {
        throw new Error("Invalid email or password");
    }

    const match = await bcrypt.compare(body.password, user.password);
    if (!match) {
        throw new Error("Invalid email or password");
    }

    // Generate JWT access token containing ID, email, and role
    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "1d" }
    );

    // Return user object (excluding the hashed password) and JWT token
    const { password, ...userWithoutPassword } = user;
    return {
        user: userWithoutPassword,
        token,
    };
};