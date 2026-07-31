import { Router } from "express";
import {
    getResource,
    getResourceById,
    createResource,
    updateResource,
    patchResource,
    deleteResource
} from "../controllers/resource.controller";
import { authenticate, requireAdmin } from "../middleware/auth.middleware";

const router = Router();

/**
 * @openapi
 * /{resource}:
 *   get:
 *     summary: Get all resources
 *     description: Retrieve a list of resource records with filtering, sorting, pagination and relationship queries.
 *     tags:
 *       - Resources
 *     parameters:
 *       - in: path
 *         name: resource
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource name (users, posts, comments, ...)
 *       - in: query
 *         name: _fields
 *         schema:
 *           type: string
 *       - in: query
 *         name: _page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: _limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: _sort
 *         schema:
 *           type: string
 *       - in: query
 *         name: _order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: _expand
 *         schema:
 *           type: string
 *       - in: query
 *         name: _embed
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resource list
 */
router.get("/:resource", getResource);

/**
 * @openapi
 * /{resource}/{id}:
 *   get:
 *     summary: Get resource by ID
 *     tags:
 *       - Resources
 *     parameters:
 *       - in: path
 *         name: resource
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Resource found
 *       404:
 *         description: Resource not found
 */
router.get("/:resource/:id", getResourceById);

/**
 * @openapi
 * /{resource}:
 *   post:
 *     summary: Create resource
 *     tags:
 *       - Resources
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resource
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Created successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/:resource", authenticate, createResource);

/**
 * @openapi
 * /{resource}/{id}:
 *   put:
 *     summary: Replace resource
 *     tags:
 *       - Resources
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resource
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated successfully
 */
router.put("/:resource/:id", authenticate, updateResource);

/**
 * @openapi
 * /{resource}/{id}:
 *   patch:
 *     summary: Partially update resource
 *     tags:
 *       - Resources
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resource
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated successfully
 */
router.patch("/:resource/:id", authenticate, patchResource);

/**
 * @openapi
 * /{resource}/{id}:
 *   delete:
 *     summary: Delete resource
 *     tags:
 *       - Resources
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resource
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 */
router.delete("/:resource/:id", authenticate, requireAdmin, deleteResource);

export default router;