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

// Retrieve a list of resource records matching filters (Public)
router.get("/:resource", getResource);

// Retrieve a single resource record by ID (Public)
router.get("/:resource/:id", getResourceById);

// Create a new resource record 
router.post("/:resource", authenticate, createResource);

// Completely update a resource record 
router.put("/:resource/:id", authenticate, updateResource);

// Partially update a resource record 
router.patch("/:resource/:id", authenticate, patchResource);

// Delete a resource record by ID (Admin only)
router.delete("/:resource/:id", authenticate, requireAdmin, deleteResource);

export default router;