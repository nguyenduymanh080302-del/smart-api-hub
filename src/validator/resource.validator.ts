import { z } from "zod";
import { inferSchema } from "../utils/inferSchema";

/**
 * Dynamically builds a Zod schema based on the inferred database schema.
 * Strict validation ensures no unrecognized fields are submitted.
 * 
 * @param tableName - The resource table name.
 * @returns A Zod object schema, or null if the table doesn't exist.
 */
export const getResourceZodSchema = (tableName: string) => {
    const table = inferSchema().find(t => t.name === tableName);
    if (!table) return null;

    const shape: Record<string, z.ZodTypeAny> = {};

    table.columns.forEach(column => {
        // ID and timestamps are auto-managed and should not be input by users
        if (
            column.name === "id" ||
            column.name === "created_at" ||
            column.name === "updated_at"
        ) {
            return;
        }

        let typeSchema: z.ZodTypeAny;

        switch (column.type) {
            case "integer":
                typeSchema = z.number().int();
                break;
            case "float":
                typeSchema = z.number();
                break;
            case "boolean":
                typeSchema = z.boolean();
                break;
            case "increments":
                typeSchema = z.number().int();
                break;
            default:
                typeSchema = z.string();
        }

        shape[column.name] = typeSchema;
    });

    return z.object(shape).strict();
};

/**
 * Validates the body payload against the resource's inferred Zod schema.
 * 
 * @param tableName - The resource table name.
 * @param body - The payload to validate.
 * @param isPartial - Whether to allow partial updates (PATCH) where all fields are optional.
 */
export const validateResourceBody = (
    tableName: string,
    body: any,
    isPartial: boolean = false
) => {
    let schema = getResourceZodSchema(tableName);
    if (!schema) {
        return {
            valid: false,
            message: "Table schema not found"
        };
    }

    if (isPartial) {
        schema = schema.partial();
    }

    const result = schema.safeParse(body);
    if (!result.success) {
        const errorMsg = result.error.issues
            .map((e: any) => `${e.path.join(".")}: ${e.message}`)
            .join("; ");
        return {
            valid: false,
            message: errorMsg
        };
    }

    return {
        valid: true,
        data: result.data
    };
};
