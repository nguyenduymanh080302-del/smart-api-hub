"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const resource_controller_1 = require("../controllers/resource.controller");
const router = (0, express_1.Router)();
// Retrieve a list of resource records matching filters
router.get("/:resource", resource_controller_1.getResource);
// Create a new resource record
router.post("/:resource", resource_controller_1.createResource);
// Completely update a resource record
router.put("/:resource/:id", resource_controller_1.updateResource);
// Partially update a resource record
router.patch("/:resource/:id", resource_controller_1.patchResource);
// Delete a resource record by ID
router.delete("/:resource/:id", resource_controller_1.deleteResource);
exports.default = router;
