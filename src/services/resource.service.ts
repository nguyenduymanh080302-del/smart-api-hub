import { clearResourceCache, getCache, setCache } from "../cache/memoryCache";
import db from "../config/db";
import { SENSITIVE_FIELDS } from "../utils/constant";
import { removeSensitiveFields } from "../utils/helper";
import { inferSchema } from "../utils/inferSchema";
import { writeAuditLog } from "./audit.service";

/**
 * Checks if a specific resource (table) exists in the database schema.
 * 
 * @param resource - The name of the table to check.
 * @returns A promise that resolves to true if the table exists, false otherwise.
 */
export const resourceExists = async (resource: string): Promise<boolean> => {
    return await db.schema.hasTable(resource);
};

/**
 * Queries resources from the database with advanced features like filtering, full-text search,
 * sorting, pagination, and relationship expanding/embedding.
 * 
 * @param resource - The database table name.
 * @param options - The query parameters and configuration options.
 * @returns A promise resolving to the list of rows and optional total count for pagination.
 */
export const findMany = async (resource: string, options: FindManyOptions): Promise<{ rows: any[]; totalCount?: number }> => {
    const cacheKey =
        `${resource}:${JSON.stringify(options)}`;

    const cached = getCache(cacheKey);

    if (cached) {
        return cached;
    }

    const tableSchema = inferSchema().find(t => t.name === resource);
    const { fields = ["*"], filters = {}, q, sort, order = "asc", page, limit, expand = [], embed = [] } = options;
    const selectedFields =
        fields.includes("*") && tableSchema
            ? tableSchema.columns
                .map(c => c.name)
                .filter(c => !SENSITIVE_FIELDS.includes(c))
            : fields.filter(f => !SENSITIVE_FIELDS.includes(f));
    const query = db(resource).select(selectedFields);

    Object.entries(filters).forEach(([key, value]) => {
        const [column, operator] = key.split("_");

        // Check if the operator is a valid filter operator
        switch (operator) {
            case "gte":
                query.where(column, ">=", String(value));
                break;

            case "lte":
                query.where(column, "<=", String(value));
                break;

            case "ne":
                query.whereNot(column, value);
                break;

            case "like":
                query.whereILike(column, `%${value}%`);
                break;

            default:
                query.where(column, value);
        }
    });

    // Perform full-text search query across searchable string columns
    if (q && tableSchema) {
        const searchableColumns = tableSchema.columns.filter(
            c => c.type === "string" || c.type === "text"
        );

        // Group the search constraints together in an OR block to avoid messing up AND filters
        query.andWhere(builder => {
            searchableColumns.forEach((column, index) => {
                if (index === 0) {
                    builder.whereILike(column.name, `%${q}%`);
                } else {
                    builder.orWhereILike(column.name, `%${q}%`);
                }
            });
        });
    }

    // Apply sorting options
    if (sort) {
        query.orderBy(String(sort), String(order).toLowerCase() === "desc" ? "desc" : "asc");
    }

    // Handle pagination and count calculation
    let totalCount: number | undefined;
    if (page && limit) {
        // Query the total number of records in this resource table
        const [{ count }] = await db(resource).count("* as count");
        totalCount = Number(count);

        // Apply pagination offsets and limits to the SQL query
        const offset = (page - 1) * limit;
        query.limit(limit).offset(offset);
    }

    // Execute the constructed Knex query
    const rows = await query;

    // Resolve "expand" relationship (embed parent row based on foreign key match)
    for (const parentTable of expand) {
        const foreignKey = `${parentTable.slice(0, -1)}_id`;

        // Extract a unique list of parent IDs present in the current row results
        const ids = [
            ...new Set(
                rows
                    .map(r => r[foreignKey])
                    .filter(Boolean)
            )
        ];

        if (ids.length === 0) continue;

        // Fetch parent records in bulk
        const parents = await db(parentTable).whereIn("id", ids);

        // Map parent rows by ID for O(1) retrieval
        const parentMap = new Map(
            parents.map(parent => [parent.id, parent])
        );

        // Assign parent object to each row
        rows.forEach(row => {
            const parent = parentMap.get(row[foreignKey]);
            row[parentTable] = parent ? removeSensitiveFields(parent) : null;
        });
    }

    // Resolve "embed" relationship (embed child rows based on parent key match)
    for (const childTable of embed) {
        const foreignKey = `${resource.slice(0, -1)}_id`;

        // Gather all parent IDs to find their children
        const ids = rows.map(r => r.id);

        if (ids.length === 0) continue;

        // Fetch child records in bulk where foreign key refers to one of our parent IDs
        const children = await db(childTable).whereIn(foreignKey, ids);

        // Group child rows by parent ID for O(1) mapping
        const grouped = children.reduce<Record<number, any[]>>(
            (acc, child) => {
                const key = child[foreignKey];
                if (!acc[key]) {
                    acc[key] = [];
                }
                acc[key].push(child);
                return acc;
            },
            {}
        );

        // Assign the array of child records to each parent row
        rows.forEach(row => {
            row[childTable] = (grouped[row.id] ?? []).map(removeSensitiveFields);
        });
    }

    const result = { rows, totalCount };

    setCache(cacheKey, result);

    return result;
};

/**
 * Retrieves a single record from the specified resource table by its ID.
 * Supports relationship expanding and embedding like findMany.
 *
 * @param resource - The database table name.
 * @param id - The ID of the record to retrieve.
 * @param options - Optional expand/embed relationship options.
 * @returns A promise resolving to the row, or null if not found.
 */
export const findById = async (resource: string, id: string, options: Pick<FindManyOptions, "expand" | "embed"> = {}): Promise<any | null> => {
    const cacheKey = `${resource}:${id}`;

    const cached = getCache(cacheKey);

    if (cached) {
        return cached;
    }

    const { expand = [], embed = [] } = options;
    const tableSchema = inferSchema().find(t => t.name === resource);
    const selectedFields = tableSchema
        ? tableSchema.columns
            .map(c => c.name)
            .filter(c => !SENSITIVE_FIELDS.includes(c))
        : ["*"];
    const row = await db(resource).select(selectedFields).where({ id }).first();
    if (!row) return null;

    // Resolve "expand" relationship (embed parent row based on foreign key match)
    for (const parentTable of expand) {
        const foreignKey = `${parentTable.slice(0, -1)}_id`;
        const parentId = row[foreignKey];
        if (!parentId) {
            row[parentTable] = null;
            continue;
        }
        const parent = await db(parentTable).where({ id: parentId }).first();
        row[parentTable] = parent ? removeSensitiveFields(parent) : null;
    }

    // Resolve "embed" relationship (embed child rows based on parent key match)
    for (const childTable of embed) {
        const foreignKey = `${resource.slice(0, -1)}_id`;
        const children = await db(childTable).where({ [foreignKey]: row.id });
        row[childTable] = children.map(removeSensitiveFields);
    }

    setCache(cacheKey, row);
    return row;
};

/**
 * Inserts a new record into the specified resource table.
 * 
 * @param resource - The table name.
 * @param data - The data payload to insert.
 * @returns A promise resolving to the database insertion result (usually insertion ID(s)).
 */
export const create = async (resource: string, data: any, userId: number): Promise<any> => {

    if (!userId) {
        throw new Error("Authentication failed");
    }

    const [result] = await db(resource)
        .insert(data)
        .returning("*");

    if (result) {
        clearResourceCache(resource);
        await writeAuditLog({ userId, action: "CREATE", resource, recordId: result.id });
    }

    return result;
};

/**
 * Updates an existing record in the specified table by its ID.
 * 
 * @param resource - The table name.
 * @param id - The ID of the record to update.
 * @param data - The partial data payload.
 * @returns A promise resolving to the number of affected rows (0 if not found).
 */
export const update = async (resource: string, id: string, data: any, userId: number): Promise<number> => {
    if (!userId) {
        throw new Error("Authentication failed");
    }

    const safeData = Object.fromEntries(
        Object.entries(data).filter(
            ([key]) => !SENSITIVE_FIELDS.includes(key)
        )
    );

    const affected = await db(resource)
        .where({ id })
        .update({
            ...safeData,
            updated_at: db.fn.now(),
        });

    if (affected > 0) {
        clearResourceCache(resource);
        await writeAuditLog({ userId, action: "UPDATE", resource, recordId: Number(id) });
    }

    return affected;
};

/**
 * Deletes a record from the specified table by its ID.
 * 
 * @param resource - The table name.
 * @param id - The ID of the record to delete.
 * @returns A promise resolving to the number of deleted rows (0 if not found).
 */
export const deleteById = async (resource: string, id: string, userId: number): Promise<number> => {
    if (!userId) {
        throw new Error("Authentication/Authorization failed");
    }
    const affected = await db(resource)
        .where({ id })
        .del();

    if (affected > 0) {
        clearResourceCache(resource);
        await writeAuditLog({ userId, action: "DELETE", resource, recordId: Number(id) });
    }

    return affected;
};
