import { Router } from "express";
import {
    getResource,
    createResource,
    updateResource,
    patchResource,
    deleteResource
} from "../controllers/resource.controller";

const router = Router();

// Retrieve a list of resource records matching filters
router.get("/:resource", getResource);

// Create a new resource record
router.post("/:resource", createResource);

// Completely update a resource record
router.put("/:resource/:id", updateResource);

// Partially update a resource record
router.patch("/:resource/:id", patchResource);

// Delete a resource record by ID
router.delete("/:resource/:id", deleteResource);

export default router;