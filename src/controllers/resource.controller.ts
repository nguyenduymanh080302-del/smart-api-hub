import { type Request, type Response } from "express";
import * as resourceService from "../services/resource.service";
import { validateResourceBody } from "../validator/resource.validator";

/**
 * Controller handler to retrieve a list of resource items.
 * Extracts parameters and delegates parsing & query logic to the ResourceService.
 */
export const getResource = async (req: Request, res: Response) => {
    const resource = req.params.resource as string;
    const { _fields, _page, _limit, _sort, _order, q, _expand, _embed, ...filters } = req.query;

    if (!resource) {
        return res.status(400).json({
            error: "Resource is required"
        });
    }

    try {
        if (!await resourceService.resourceExists(resource)) {
            return res.status(404).json({
                error: "Resource not found"
            });
        }

        // Parse list fields and pagination parameters
        const fields = _fields ? String(_fields).split(",") : undefined;
        const page = _page ? Number(_page) : undefined;
        const limit = _limit ? Number(_limit) : undefined;
        const expand = _expand ? String(_expand).split(",") : undefined;
        const embeds = _embed ? String(_embed).split(",") : undefined;

        const { rows, totalCount } = await resourceService.findMany(resource, {
            fields,
            filters,
            q: q ? String(q) : undefined,
            sort: _sort ? String(_sort) : undefined,
            order: _order ? String(_order) : undefined,
            page,
            limit,
            expand,
            embed: embeds
        });

        // Set pagination header if page and limit were set
        if (totalCount !== undefined) {
            res.setHeader("X-Total-Count", totalCount);
        }

        return res.status(200).json({
            data: rows,
        });
    } catch (error: any) {
        console.error(`${resource} DB query failed: ${error}`);
        return res.status(500).json({
            error: error.message || "Internal Server Error"
        });
    }
};

/**
 * Controller handler to retrieve a single resource item by its ID.
 * Supports optional relationship expansion via _expand and _embed query params.
 */
export const getResourceById = async (req: Request, res: Response) => {
    const resource = req.params.resource as string;
    const id = req.params.id as string;
    const { _expand, _embed } = req.query;

    if (!resource) {
        return res.status(400).json({ error: "Resource is required" });
    }

    if (!id) {
        return res.status(400).json({ error: "Resource ID is required" });
    }

    try {
        if (!await resourceService.resourceExists(resource)) {
            return res.status(404).json({ error: "Resource not found" });
        }

        const expand = _expand ? String(_expand).split(",") : undefined;
        const embed = _embed ? String(_embed).split(",") : undefined;

        const row = await resourceService.findById(resource, id, { expand, embed });
        if (!row) {
            return res.status(404).json({ error: `${resource} with id ${id} not found` });
        }

        return res.status(200).json({ data: row });
    } catch (error: any) {
        console.error(`${resource} DB findById failed: ${error}`);
        return res.status(500).json({ error: error.message || "Internal Server Error" });
    }
};

/**
 * Controller handler to insert a new resource record.
 */
export const createResource = async (req: Request, res: Response) => {
    const data = req.body;
    const resource = req.params.resource as string;

    if (!resource) {
        return res.status(400).json({
            error: "Resource is required"
        });
    }

    // 1. Zod schema validation for POST endpoint
    const validation = validateResourceBody(resource, data, false);
    if (!validation.valid) {
        return res.status(400).json({
            error: validation.message
        });
    }

    try {
        if (!await resourceService.resourceExists(resource)) {
            return res.status(404).json({
                error: "Resource not found"
            });
        }

        const result = await resourceService.create(resource, validation.data, req?.user?.id || 0);
        return res.status(201).json({
            data: result,
        });
    } catch (error: any) {
        console.error(`${resource} DB create failed: ${error}`);
        return res.status(500).json({
            error: error.message || "Internal Server Error",
            data: [],
        });
    }
};

/**
 * Controller handler to replace or update a resource record completely.
 */
export const updateResource = async (req: Request, res: Response) => {
    const data = req.body;
    const resource = req.params.resource as string;
    const id = req.params.id as string;

    if (!id) {
        return res.status(400).json({
            error: "Resource ID is required"
        });
    }

    if (!resource) {
        return res.status(400).json({
            error: "Resource is required"
        });
    }

    // 1. Zod schema validation for PUT endpoint (strict matching)
    const validation = validateResourceBody(resource, data, false);
    if (!validation.valid) {
        return res.status(400).json({
            error: validation.message
        });
    }

    try {
        if (!await resourceService.resourceExists(resource)) {
            return res.status(404).json({
                error: "Resource not found"
            });
        }

        const result = await resourceService.update(resource, id, validation.data, req?.user?.id || 0);
        if (result === 0) {
            return res.status(404).json({
                error: `Resource ${id} not found`
            });
        }

        return res.status(200).json({
            data: result,
        });
    } catch (error: any) {
        console.error(`${resource} DB update failed: ${error}`);
        return res.status(500).json({
            error: error.message || "Internal Server Error",
            data: [],
        });
    }
};

/**
 * Controller handler to partially update a resource record.
 */
export const patchResource = async (req: Request, res: Response) => {
    const data = req.body;
    const resource = req.params.resource as string;
    const id = req.params.id as string;

    if (!id) {
        return res.status(400).json({
            error: "Resource ID is required"
        });
    }

    if (!resource) {
        return res.status(400).json({
            error: "Resource is required"
        });
    }

    // 1. Zod schema validation for PATCH endpoint (partial fields allowed)
    const validation = validateResourceBody(resource, data, true);
    if (!validation.valid) {
        return res.status(400).json({
            error: validation.message
        });
    }

    try {
        if (!await resourceService.resourceExists(resource)) {
            return res.status(404).json({
                error: "Resource not found"
            });
        }

        const result = await resourceService.update(resource, id, validation.data, req?.user?.id || 0);
        if (result === 0) {
            return res.status(404).json({
                error: `Resource ${id} not found`
            });
        }

        return res.status(200).json({
            data: result,
        });
    } catch (error: any) {
        console.error(`${resource} DB patch failed: ${error}`);
        return res.status(500).json({
            error: error.message || "Internal Server Error",
            data: [],
        });
    }
};

/**
 * Controller handler to delete a resource record by its ID.
 */
export const deleteResource = async (req: Request, res: Response) => {
    const resource = req.params.resource as string;
    const id = req.params.id as string;

    if (!id) {
        return res.status(400).json({
            error: "Resource ID is required"
        });
    }

    if (!resource) {
        return res.status(400).json({
            error: "Resource is required"
        });
    }

    try {
        if (!await resourceService.resourceExists(resource)) {
            return res.status(404).json({
                error: "Resource not found"
            });
        }

        const result = await resourceService.deleteById(resource, id, req?.user?.id || 0);
        if (result === 0) {
            return res.status(404).json({
                error: `Resource ${id} not found`
            });
        }

        return res.status(200).json({
            data: result,
        });
    } catch (error: any) {
        console.error(`${resource} DB delete failed: ${error}`);
        return res.status(500).json({
            error: error.message || "Internal Server Error",
            data: [],
        });
    }
};
