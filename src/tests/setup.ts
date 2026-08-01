import dotenv from "dotenv";
import type { Knex } from "knex";
import { afterAll, beforeAll } from "vitest";

dotenv.config({
    path: ".env.development",
    override: true,
});

const getDb = async (): Promise<Knex> =>
    (await import("../config/db.js")).default as unknown as Knex;

beforeAll(async () => {
    const db = await getDb();
    await db.raw("SELECT 1");
});

afterAll(async () => {
    const db = await getDb();
    await db("posts").where("title", "like", "Test%").delete();
    await db("users").whereILike("email", "%@test.com").delete();

    await db.destroy();
});
