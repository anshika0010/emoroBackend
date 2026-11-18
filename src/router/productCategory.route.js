import { Router } from "express";
import {
    createProductCategory, updateProductCategory, deleteProductCategory,
    getProductCategories, getProductCategoryBySlug, getProductsByCategorySlug
} from "../controllers/productCategory.controller.js";

const router = Router();

router.route("/").post(createProductCategory);
router.route("/").get(getProductCategories);
router.route("/:id").put(updateProductCategory);
router.route("/:id").delete(deleteProductCategory);
router.route("/:slug/products").get(getProductsByCategorySlug);
router.route("/:slug").get(getProductCategoryBySlug);

export default router;
