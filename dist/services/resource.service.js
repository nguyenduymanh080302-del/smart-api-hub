"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteById = exports.update = exports.create = exports.findMany = exports.resourceExists = void 0;
const db_1 = __importDefault(require("../config/db"));
const inferSchema_1 = require("../utils/inferSchema");
/**
 * Checks if a specific resource (table) exists in the database schema.
 *
 * @param resource - The name of the table to check.
 * @returns A promise that resolves to true if the table exists, false otherwise.
 */
const resourceExists = async (resource) => {
    return await db_1.default.schema.hasTable(resource);
};
exports.resourceExists = resourceExists;
/**
 * Queries resources from the database with advanced features like filtering, full-text search,
 * sorting, pagination, and relationship expanding/embedding.
 *
 * @param resource - The database table name.
 * @param options - The query parameters and configuration options.
 * @returns A promise resolving to the list of rows and optional total count for pagination.
 */
const findMany = async (resource, options) => {
    const { fields = ["*"], filters = {}, q, sort, order = "asc", page, limit, expand = [], embed = [] } = options;
    // Start with a basic select query on the target table/resource
    const query = (0, db_1.default)(resource).select(fields);
    // 1. Process custom filters (e.g. key_gte, key_lte, key_ne, key_like, or direct match)
    Object.entries(filters).forEach(([key, value]) => {
        const [column, operator] = key.split("_");
        switch (operator) {
            case "gte":
                // Greater than or equal to filter
                query.where(column, ">=", String(value));
                break;
            case "lte":
                // Less than or equal to filter
                query.where(column, "<=", String(value));
                break;
            case "ne":
                // Not equal to filter
                query.whereNot(column, value);
                break;
            case "like":
                // Case-insensitive wildcard match
                query.whereILike(column, `%${value}%`);
                break;
            default:
                // Exact match default filter
                query.where(column, value);
        }
    });
    // 2. Perform full-text search query across searchable string columns
    const tableSchema = (0, inferSchema_1.inferSchema)().find(t => t.name === resource);
    if (q && tableSchema) {
        // Retrieve columns that are string or text to target the search correctly
        const searchableColumns = tableSchema.columns.filter(c => c.type === "string" || c.type === "text");
        // Group the search constraints together in an OR block to avoid messing up AND filters
        query.andWhere(builder => {
            searchableColumns.forEach((column, index) => {
                if (index === 0) {
                    builder.whereILike(column.name, `%${q}%`);
                }
                else {
                    builder.orWhereILike(column.name, `%${q}%`);
                }
            });
        });
    }
    // 3. Apply sorting options
    if (sort) {
        query.orderBy(String(sort), String(order).toLowerCase() === "desc" ? "desc" : "asc");
    }
    // 4. Handle pagination and count calculation
    let totalCount;
    if (page && limit) {
        // Query the total number of records in this resource table
        const [{ count }] = await (0, db_1.default)(resource).count("* as count");
        totalCount = Number(count);
        // Apply pagination offsets and limits to the SQL query
        const offset = (page - 1) * limit;
        query.limit(limit).offset(offset);
    }
    // Execute the constructed Knex query
    const rows = await query;
    // 5. Resolve "expand" relationship (embed parent row based on foreign key match)
    // E.g., if resource is "posts", and expand is ["users"], matches posts.userId -> users.id
    for (const parentTable of expand) {
        const foreignKey = `${parentTable.slice(0, -1)}Id`;
        // Extract a unique list of parent IDs present in the current row results
        const ids = [
            ...new Set(rows
                .map(r => r[foreignKey])
                .filter(Boolean))
        ];
        if (ids.length === 0)
            continue;
        // Fetch parent records in bulk
        const parents = await (0, db_1.default)(parentTable).whereIn("id", ids);
        // Map parent rows by ID for O(1) retrieval
        const parentMap = new Map(parents.map(parent => [parent.id, parent]));
        // Assign parent object to each row
        rows.forEach(row => {
            row[parentTable] = parentMap.get(row[foreignKey]) ?? null;
        });
    }
    // 6. Resolve "embed" relationship (embed child rows based on parent key match)
    // E.g., if resource is "posts", and embed is ["comments"], matches comments.postId -> posts.id
    for (const childTable of embed) {
        const foreignKey = `${resource.slice(0, -1)}Id`;
        // Gather all parent IDs to find their children
        const ids = rows.map(r => r.id);
        if (ids.length === 0)
            continue;
        // Fetch child records in bulk where foreign key refers to one of our parent IDs
        const children = await (0, db_1.default)(childTable).whereIn(foreignKey, ids);
        // Group child rows by parent ID for O(1) mapping
        const grouped = children.reduce((acc, child) => {
            const key = child[foreignKey];
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(child);
            return acc;
        }, {});
        // Assign the array of child records to each parent row
        rows.forEach(row => {
            row[childTable] = grouped[row.id] ?? [];
        });
    }
    return { rows, totalCount };
};
exports.findMany = findMany;
/**
 * Inserts a new record into the specified resource table.
 *
 * @param resource - The table name.
 * @param data - The data payload to insert.
 * @returns A promise resolving to the database insertion result (usually insertion ID(s)).
 */
const create = async (resource, data) => {
    return await (0, db_1.default)(resource).insert(data);
};
exports.create = create;
/**
 * Updates an existing record in the specified table by its ID.
 * Automatically adds or updates the `updated_at` timestamp.
 *
 * @param resource - The table name.
 * @param id - The ID of the record to update.
 * @param data - The partial data payload.
 * @returns A promise resolving to the number of affected rows (0 if not found).
 */
const update = async (resource, id, data) => {
    return await (0, db_1.default)(resource)
        .where({ id })
        .update({
        ...data,
        updated_at: db_1.default.fn.now()
    });
};
exports.update = update;
/**
 * Deletes a record from the specified table by its ID.
 *
 * @param resource - The table name.
 * @param id - The ID of the record to delete.
 * @returns A promise resolving to the number of deleted rows (0 if not found).
 */
const deleteById = async (resource, id) => {
    return await (0, db_1.default)(resource)
        .where({ id })
        .delete();
};
exports.deleteById = deleteById;
