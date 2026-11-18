import { isValidObjectId } from "mongoose";
import ProductCategoryModel from "../models/productCategory.model.js";
import ProductModel from "../models/product.model.js";

export const createProductCategory = async (req, res) => {
    try {
        const { name, slug, des } = req.body;

        if (!name?.trim() || !slug?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Name and Slug both required"
            });
        }

        const duplicate = await ProductCategoryModel.findOne({ slug: slug.trim() });

        if (duplicate) {
            return res.status(400).json({
                success: false,
                message: "Duplicate Slug"
            });
        }

        const category = await ProductCategoryModel.create({
            name: name.trim(),
            slug: slug.trim(),
            des: des?.trim() || ""
        });

        return res.status(201).json({
            success: true,
            message: "Product category created successfully",
            category
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

export const updateProductCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug, des } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: "Invalid category id" });
        }

        if (!name?.trim() || !slug?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Name and Slug both required"
            });
        }

        const category = await ProductCategoryModel.findById(id);

        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        const duplicate = await ProductCategoryModel.findOne({
            slug: slug.trim(),
            _id: { $ne: id }
        });

        if (duplicate) {
            return res.status(400).json({ success: false, message: "Duplicate Slug" });
        }

        category.name = name.trim();
        category.slug = slug.trim();
        if (des !== undefined) category.des = des?.trim() || "";

        await category.save();

        return res.status(200).json({
            success: true,
            message: "Product category updated successfully",
            category
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

export const deleteProductCategory = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: "Invalid category id" });
        }

        const category = await ProductCategoryModel.findById(id);

        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        const linkedProduct = await ProductModel.findOne({ categoryId: id });

        if (linkedProduct) {
            return res.status(400).json({
                success: false,
                message: "We can't delete this category because products are associated with it"
            });
        }

        await ProductCategoryModel.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Product category deleted successfully"
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

export const getProductCategories = async (req, res) => {
    try {
        const categories = await ProductCategoryModel.find().sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: categories.length,
            categories
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

export const getProductCategoryBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const category = await ProductCategoryModel.findOne({ slug });

        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        return res.status(200).json({ success: true, category });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

export const getProductsByCategorySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.max(Number(req.query.limit) || 20, 1);
        const skip = (page - 1) * limit;

        const category = await ProductCategoryModel.findOne({ slug });

        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        const filter = { categoryId: category._id, status: true };

        const [products, total] = await Promise.all([
            ProductModel.find(filter)
                .populate("categoryId", "_id name slug")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            ProductModel.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            category,
            products,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
