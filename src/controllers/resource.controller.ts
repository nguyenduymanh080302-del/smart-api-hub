import { type Request, type Response } from "express";
import * as resourceService from "../services/resource.service";
import { validatePutBody } from "../validator/queryValidator";

/**
 * Controller handler to retrieve a list of resource items.
 * Extracts parameters and delegates parsing & query logic to the ResourceService.
 */
export const getResource = async (req: Request, res: Response) => {
    const resource = req.params.resource as string;
    const { _fields, _page, _limit, _sort, _order, q, _expand, _embed, ...filters } = req.query;

    if (!resource) {
        return res.status(400).json({
            status: "error",
            message: "Resource is required"
        });
    }

    try {
        if (!await resourceService.resourceExists(resource)) {
            return res.status(404).json({
                status: "error",
                message: "Resource not found"
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
    } catch (error) {
        console.error(`${resource} DB ping failed: ${error}`);
        return res.status(500).json({
            status: "error"
        });
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
            status: "error",
            message: "Resource is required"
        });
    }

    try {
        if (!await resourceService.resourceExists(resource)) {
            return res.status(404).json({
                status: "error",
                message: "Resource not found"
            });
        }

        const result = await resourceService.create(resource, data);
        return res.status(201).json({
            data: result,
        });
    } catch (error) {
        console.error(`${resource} DB ping failed: ${error}`);
        return res.status(500).json({
            status: "error",
            data: [],
        });
    }
};

/**
 * Controller handler to replace or update a resource record completely.
 * Includes payload field validation.
 */
export const updateResource = async (req: Request, res: Response) => {
    const data = req.body;
    const resource = req.params.resource as string;
    const id = req.params.id as string;

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

    // Validate the complete PUT request payload structure against schema
    const validation = validatePutBody(resource, data);
    if (!validation.valid) {
        return res.status(400).json({
            status: "error",
            message: validation.message,
        });
    }

    try {
        if (!await resourceService.resourceExists(resource)) {
            return res.status(404).json({
                status: "error",
                message: "Resource not found"
            });
        }

        const result = await resourceService.update(resource, id, data);
        if (result === 0) {
            return res.status(404).json({
                status: "error",
                message: `Resource ${id} not found`
            });
        }

        return res.status(200).json({
            data: result,
        });
    } catch (error) {
        console.error(`${resource} DB ping failed: ${error}`);
        return res.status(500).json({
            status: "error",
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
        if (!await resourceService.resourceExists(resource)) {
            return res.status(404).json({
                status: "error",
                message: "Resource not found"
            });
        }

        // Direct update logic handles patch fields
        const result = await resourceService.update(resource, id, data);
        if (result === 0) {
            return res.status(404).json({
                status: "error",
                message: `Resource ${id} not found`
            });
        }

        return res.status(200).json({
            data: result,
        });
    } catch (error) {
        console.error(`${resource} DB ping failed: ${error}`);
        return res.status(500).json({
            status: "error",
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
        if (!await resourceService.resourceExists(resource)) {
            return res.status(404).json({
                status: "error",
                message: "Resource not found"
            });
        }

        const result = await resourceService.deleteById(resource, id);
        if (result === 0) {
            return res.status(404).json({
                status: "error",
                message: `Resource ${id} not found`
            });
        }

        return res.status(200).json({
            data: result,
        });
    } catch (error) {
        console.error(`${resource} DB ping failed: ${error}`);
        return res.status(500).json({
            status: "error",
            data: [],
        });
    }
};
