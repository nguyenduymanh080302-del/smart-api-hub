import knexConfig from "../config/db";
import { inferSchema } from "../utils/inferSchema";
import { syncTable } from "./syncTable";

const auditSchema: TableSchema = {
    name: "audit_logs",
    columns: [
        { name: "id", type: "increments" },
        { name: "user_id", type: "integer" },
        { name: "action", type: "string" },
        { name: "resource_name", type: "string" },
        { name: "record_id", type: "integer" },
        { name: "timestamp", type: "timestamp", },
    ]
}

export async function migrate() {
    const schema = inferSchema();
    schema.push(auditSchema);
    for (const table of schema) {
        await syncTable(knexConfig, table);
    }

    console.log("Migration completed");
}