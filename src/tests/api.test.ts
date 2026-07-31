import { beforeAll, describe, expect, it } from "vitest";
import { api } from "../config/api";
import { testAdmin, testUser } from "./testData";

describe("Smart API Hub Integration Tests", () => {
    let userToken: string;
    let adminToken: string;
    let createdPostId: number;

    beforeAll(() => {
        // The application grants admin access only to the configured admin email.
        process.env.ADMIN_EMAIL = testAdmin.email;
    });

    // ─── AUTHENTICATION TESTS ──────────────────────────────────────────────────

    it("1. POST /auth/register - Success (Register User)", async () => {
        const res = await api
            .post("/auth/register")
            .send({
                ...testUser
            });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("data");
        expect(res.body.data).toHaveProperty("id");
        expect(res.body.data.email).toBe(testUser.email);
        expect(res.body.data.role).toBe("user");
        expect(res.body.data).not.toHaveProperty("password");
    });

    it("2. POST /auth/register - Fail (Validation error / Bad input)", async () => {
        const res = await api
            .post("/auth/register")
            .send({
                name: "", // name empty
                email: "invalid-email-format",
                password: "123" // password too short
            });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error");
        expect(res.body.error).toContain("email");
        expect(res.body.error).toContain("password");
    });

    it("3. POST /auth/register - Fail (Duplicate email)", async () => {
        const res = await api
            .post("/auth/register")
            .send({
                name: "Test Duplicate",
                email: testUser.email,
                password: testUser.password
            });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error");
        expect(res.body.error).toContain("already registered");
    });

    it("4. POST /auth/register - Success (Register Admin)", async () => {
        const res = await api
            .post("/auth/register")
            .send({
                ...testAdmin
            });

        expect(res.status).toBe(201);
        expect(res.body.data.role).toBe("admin");
    });

    it("5. POST /auth/login - Success (Get User Token)", async () => {
        const res = await api
            .post("/auth/login")
            .send({
                email: testUser.email,
                password: testUser.password
            });

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty("token");
        userToken = res.body.data.token;
    });

    it("6. POST /auth/login - Success (Get Admin Token)", async () => {
        const res = await api
            .post("/auth/login")
            .send({
                email: testAdmin.email,
                password: testAdmin.password
            });

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty("token");
        adminToken = res.body.data.token;
    });

    it("7. POST /auth/login - Fail (Wrong password)", async () => {
        const res = await api
            .post("/auth/login")
            .send({
                email: testUser.email,
                password: "wrongpassword"
            });

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty("error");
        expect(res.body.error).toBe("Invalid email or password");
    });

    it("8. POST /auth/login - Fail (Non-existent user email)", async () => {
        const res = await api
            .post("/auth/login")
            .send({
                email: "nobody@example.com",
                password: testUser.password
            });

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty("error");
    });

    // ─── RESOURCE ROUTE TESTS (CRUD & PROTECTION) ──────────────────────────────

    it("9. GET /posts - Success (Public Read)", async () => {
        const res = await api
            .get("/posts");

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("data");
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("10. POST /posts - Fail (Unauthorized, missing token)", async () => {
        const res = await api
            .post("/posts")
            .send({
                title: "Unauthorized Post",
                content: "Cannot post this",
                userId: 1
            });

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty("error");
        expect(res.body.error).toContain("token");
    });

    it("11. POST /posts - Fail (Validation error, strict/invalid key)", async () => {
        const res = await api
            .post("/posts")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                title: "Invalid Post Key",
                content: "Content",
                userId: 1,
                nonExistentColumn: "bad_value" // strict validation should fail
            });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error");
        expect(res.body.error).toContain("Unrecognized key");
    });

    it("12. POST /posts - Success (Authenticated write)", async () => {
        const res = await api
            .post("/posts")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                title: "Test Post Title",
                content: "Test post content",
                userId: 1
            });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("data");
        // knex returns array of primary keys or objects
        const insertRes = res.body.data;
        createdPostId = typeof insertRes[0] === "object" ? insertRes[0].id : insertRes[0];
        expect(createdPostId).toBeDefined();
    });

    it("13. DELETE /posts/:id - Fail (Forbidden, User deleting)", async () => {
        const res = await api
            .delete(`/posts/${createdPostId}`)
            .set("Authorization", `Bearer ${userToken}`);

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty("error");
        expect(res.body.error).toContain("Admin role required");
    });

    it("14. DELETE /posts/:id - Success (Admin deleting)", async () => {
        const res = await api
            .delete(`/posts/${createdPostId}`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
    });

    it("15. GET /nonexistenttable - Fail (404 Not Found)", async () => {
        const res = await api
            .get("/nonexistenttable");

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty("error");
        expect(res.body.error).toBe("Resource not found");
    });

    describe("[A]. Rate Limiter", () => {
        it("should return 429 after 100 requests", async () => {
            for (let i = 0; i < 100; i++) {
                await api.get("/health");
            }

            const res = await api.get("/health");

            expect(res.status).toBe(429);
            expect(res.body.message).toBe("Too Many Requests");
        });
    });
});
