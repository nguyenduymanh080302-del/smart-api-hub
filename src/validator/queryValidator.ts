import { Knex } from "knex";
import { inferSchema } from "../utils/inferSchema";

export const validatePutBody = (tableName: string, body: Record<string, unknown>) => {
    const table = inferSchema().find(t => t.name === tableName);

    if (!table) {
        return {
            valid: false,
            message: "Table not found",
        };
    }

    // Ignore auto-generated columns
    const allowedFields = table.columns
        .filter(c =>
            c.name !== "id" &&
            c.name !== "created_at" &&
            c.name !== "updated_at"
        )
        .map(c => c.name);

    const bodyFields = Object.keys(body);

    // Check for invalid fields
    const invalidFields = bodyFields.filter(
        field => !allowedFields.includes(field)
    );

    if (invalidFields.length > 0) {
        return {
            valid: false,
            message: `Invalid field(s): ${invalidFields.join(", ")}`,
        };
    }

    // Check for missing fields
    const missingFields = allowedFields.filter(
        field => !bodyFields.includes(field)
    );

    if (missingFields.length > 0) {
        return {
            valid: false,
            message: `Missing field(s): ${missingFields.join(", ")}`,
        };
    }

    return {
        valid: true,
    };
};


