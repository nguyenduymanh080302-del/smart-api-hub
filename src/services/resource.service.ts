import db from "../config/db";
import { inferSchema } from "../utils/inferSchema";

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
    const { fields = ["*"], filters = {}, q, sort, order = "asc", page, limit, expand = [], embed = [] } = options;

    const query = db(resource).select(fields);

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
    const tableSchema = inferSchema().find(t => t.name === resource);
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
        const foreignKey = `${parentTable.slice(0, -1)}Id`;

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
            row[parentTable] = parentMap.get(row[foreignKey]) ?? null;
        });
    }

    // Resolve "embed" relationship (embed child rows based on parent key match)
    for (const childTable of embed) {
        const foreignKey = `${resource.slice(0, -1)}Id`;

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
            row[childTable] = grouped[row.id] ?? [];
        });
    }

    return { rows, totalCount };
};

/**
 * Inserts a new record into the specified resource table.
 * 
 * @param resource - The table name.
 * @param data - The data payload to insert.
 * @returns A promise resolving to the database insertion result (usually insertion ID(s)).
 */
export const create = async (resource: string, data: any): Promise<any> => {
    return await db(resource).insert(data).returning("*");
};

/**
 * Updates an existing record in the specified table by its ID.
 * 
 * @param resource - The table name.
 * @param id - The ID of the record to update.
 * @param data - The partial data payload.
 * @returns A promise resolving to the number of affected rows (0 if not found).
 */
export const update = async (resource: string, id: string, data: any): Promise<number> => {
    return await db(resource)
        .where({ id })
        .update({
            ...data,
            updated_at: db.fn.now()
        });
};

/**
 * Deletes a record from the specified table by its ID.
 * 
 * @param resource - The table name.
 * @param id - The ID of the record to delete.
 * @returns A promise resolving to the number of deleted rows (0 if not found).
 */
export const deleteById = async (resource: string, id: string): Promise<number> => {
    return await db(resource).where({ id }).delete();
};
