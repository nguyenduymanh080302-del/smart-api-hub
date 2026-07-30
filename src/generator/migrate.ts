import knexConfig from "../config/db";
import { inferSchema } from "../utils/inferSchema";
import { syncTable } from "./syncTable";

export async function migrate() {
    const schema = inferSchema();

    for (const table of schema) {
        await syncTable(knexConfig, table);
    }

    console.log("Migration completed");
}