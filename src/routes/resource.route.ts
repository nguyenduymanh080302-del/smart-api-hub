import { Router, type Request, type Response } from "express";
import db from "../config/db";
import { validatePutBody } from "../validator/queryValidator";
import { inferSchema } from "../utils/inferSchema";

const router = Router();

const getExist = async (resource: string) => {
    return await db.schema.hasTable(resource as string)
}

router.get("/:resource", async (req: Request, res: Response) => {
    const { resource } = req.params;
    const { _fields, _page, _limit, _sort, _order, q, ...filters } = req.query;
    if (!resource) {
        return res.status(400).json({
            status: "error",
            message: "Resource is required"
        });
    }
    try {
        if (!await getExist(resource as string)) {
            return res.status(404).json({
                status: "error",
                message: "Resource not found"
            });
        }
        const fields = _fields ? String(_fields)?.split(",") : ["*"];
        const query = db(resource as string).select(fields);
        Object.entries(filters).forEach(([key, value]) => {
            const [column, operator] = key.split("_");

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

        const tableSchema = inferSchema().find(
            t => t.name === resource
        );

        if (q && tableSchema) {
            const searchableColumns = tableSchema.columns.filter(
                c => c.type === "string" || c.type === "text"
            );

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

        if (_sort) {
            query.orderBy(
                String(_sort),
                String(_order).toLowerCase() === "desc"
                    ? "desc"
                    : "asc"
            );
        }

        if (_page && _limit) {
            const page = Number(_page);
            const limit = Number(_limit);

            const offset = (page - 1) * limit;

            const [{ count }] = await db(resource as string)
                .count("* as count");

            res.setHeader("X-Total-Count", count);

            query.limit(limit).offset(offset);
        }


        const rows = await query;

        return res.status(200).json({
            data: rows,
        });
    } catch (error) {
        console.error(`${resource} DB ping failed: ${error}`);
        res.status(500).json({
            status: "error"
        });
    }
});

router.post("/:resource", async (req: Request, res: Response) => {
    const data = req.body;
    const { resource } = req.params;
    if (!resource) {
        return res.status(400).json({
            status: "error",
            message: "Resource is required"
        });
    }
    try {
        if (!await getExist(resource as string)) {
            return res.status(404).json({
                status: "error",
                message: "Resource not found"
            });
        }
        const result = await db(resource as string).insert(data);
        res.status(201).json({
            data: result,
        });
    } catch (error) {
        console.error(`${resource} DB ping failed: ${error}`);
        res.status(500).json({
            status: "error",
            data: [],
        });
    }
});

router.put("/:resource/:id", async (req: Request, res: Response) => {
    const data = req.body;
    const { resource, id } = req.params;

    if (!id) {
        return res.status(400).json({
            status: "error",
            message: "Resource ID is required"
        });
    }

    const validation = validatePutBody(resource as string, data);
    if (!validation.valid) {
        return res.status(400).json({
            status: "error",
            message: validation.message,
        });
    }
    if (!resource) {
        return res.status(400).json({
            status: "error",
            message: "Resource is required"
        });
    }



    try {
        const existTable = await getExist(resource as string);
        if (!existTable) {
            return res.status(404).json({
                status: "error",
                message: "Resource not found"
            });
        }
        const result = await db(resource as string).where({ id }).update({ ...data, updated_at: db.fn.now() });
        if (result === 0) {
            return res.status(404).json({
                status: "error",
                message: `Resource ${id} not found`
            });
        }
        res.status(200).json({
            data: result,
        });
    } catch (error) {
        console.error(`${resource} DB ping failed: ${error}`);
        res.status(500).json({
            status: "error",
            data: [],
        });
    }
});

router.patch("/:resource/:id", async (req: Request, res: Response) => {
    const data = req.body;
    const { resource, id } = req.params;

    if (!id) {
        return res.status(400).json({
            status: "error",
            message: "Resource ID is required"
        });
    }

    if (!resource) {
        return res.status(400).json({
            status: "error",
            message: "Resource is required"
        });
    }

    try {
        const exist = await getExist(resource as string);
        if (!exist) {
            return res.status(404).json({
                status: "error",
                message: "Resource not found"
            });
        }
        const result = await db(resource as string).where({ id }).update({ ...data, updated_at: db.fn.now() });
        if (result === 0) {
            return res.status(404).json({
                status: "error",
                message: `Resource ${id} not found`
            });
        }
        res.status(200).json({
            data: result,
        });
    } catch (error) {
        console.error(`${resource} DB ping failed: ${error}`);
        res.status(500).json({
            status: "error",
            data: [],
        });
    }
});

router.delete("/:resource/:id", async (req: Request, res: Response) => {
    const { resource, id } = req.params;

    if (!id) {
        return res.status(400).json({
            status: "error",
            message: "Resource ID is required"
        });
    }

    if (!resource) {
        return res.status(400).json({
            status: "error",
            message: "Resource is required"
        });
    }

    try {
        const exist = await getExist(resource as string);
        if (!exist) {
            return res.status(404).json({
                status: "error",
                message: "Resource not found"
            });
        }
        const result = await db(resource as string).where({ id }).delete();
        if (result === 0) {
            return res.status(404).json({
                status: "error",
                message: `Resource ${id} not found`
            });
        }
        res.status(200).json({
            data: result,
        });
    } catch (error) {
        console.error(`${resource} DB ping failed: ${error}`);
        res.status(500).json({
            status: "error",
            data: [],
        });
    }
});

export default router;