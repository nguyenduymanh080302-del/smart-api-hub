"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteResource = exports.patchResource = exports.updateResource = exports.createResource = exports.getResource = void 0;
const resourceService = __importStar(require("../services/resource.service"));
const queryValidator_1 = require("../validator/queryValidator");
/**
 * Controller handler to retrieve a list of resource items.
 * Extracts parameters and delegates parsing & query logic to the ResourceService.
 */
const getResource = async (req, res) => {
    const resource = req.params.resource;
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
    }
    catch (error) {
        console.error(`${resource} DB ping failed: ${error}`);
        return res.status(500).json({
            status: "error"
        });
    }
};
exports.getResource = getResource;
/**
 * Controller handler to insert a new resource record.
 */
const createResource = async (req, res) => {
    const data = req.body;
    const resource = req.params.resource;
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
    }
    catch (error) {
        console.error(`${resource} DB ping failed: ${error}`);
        return res.status(500).json({
            status: "error",
            data: [],
        });
    }
};
exports.createResource = createResource;
/**
 * Controller handler to replace or update a resource record completely.
 * Includes payload field validation.
 */
const updateResource = async (req, res) => {
    const data = req.body;
    const resource = req.params.resource;
    const id = req.params.id;
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
    const validation = (0, queryValidator_1.validatePutBody)(resource, data);
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
    }
    catch (error) {
        console.error(`${resource} DB ping failed: ${error}`);
        return res.status(500).json({
            status: "error",
            data: [],
        });
    }
};
exports.updateResource = updateResource;
/**
 * Controller handler to partially update a resource record.
 */
const patchResource = async (req, res) => {
    const data = req.body;
    const resource = req.params.resource;
    const id = req.params.id;
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
    }
    catch (error) {
        console.error(`${resource} DB ping failed: ${error}`);
        return res.status(500).json({
            status: "error",
            data: [],
        });
    }
};
exports.patchResource = patchResource;
/**
 * Controller handler to delete a resource record by its ID.
 */
const deleteResource = async (req, res) => {
    const resource = req.params.resource;
    const id = req.params.id;
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
    }
    catch (error) {
        console.error(`${resource} DB ping failed: ${error}`);
        return res.status(500).json({
            status: "error",
            data: [],
        });
    }
};
exports.deleteResource = deleteResource;
