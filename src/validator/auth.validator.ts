import { z } from "zod";

export const RegisterSchema = z.object({
    name: z.string().min(3, "Name is required"),
    email: z.email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    isActive: z.boolean().optional().default(true),
    role: z.string().optional().default("user")
});

export const LoginSchema = z.object({
    email: z.email("Invalid email format"),
    password: z.string().min(1, "Password is required")
});

export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
