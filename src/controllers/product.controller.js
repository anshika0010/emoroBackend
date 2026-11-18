import ProductModel from "../models/product.model.js";
import ProductCategoryModel from "../models/productCategory.model.js";
import { isValidObjectId } from "mongoose";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"

const parseJsonField = (value) =>
    typeof value === "string" ? JSON.parse(value) : value;

const toNumberOrNull = (value) => {
    if (value === undefined || value === null || value === "") return null;
    const num = Number(value);
    if (Number.isNaN(num) || num < 0) throw new Error("must be a non-negative number");
    return num;
};

// Validates categoryId and parses tags / weight / dimension / stock from the request body.
// With partial = true (updates), fields not sent in the request are left out so existing values are kept.
// Returns { error } or { data }.
const parseProductExtras = async ({ categoryId, tags, weight, dimension, stock }, { partial = false } = {}) => {
    const data = {};

    if (!partial || categoryId !== undefined) {
        if (!categoryId || !isValidObjectId(categoryId)) {
            return { error: "Valid categoryId is required" };
        }

        const category = await ProductCategoryModel.findById(categoryId);
        if (!category) {
            return { error: "Category not found" };
        }
        data.categoryId = categoryId;
    }

    let parsedTags = [];
    if (tags !== undefined && tags !== "") {
        if (Array.isArray(tags)) {
            parsedTags = tags;
        } else {
            try {
                parsedTags = JSON.parse(tags);
            } catch {
                parsedTags = String(tags).split(",");
            }
        }
        if (!Array.isArray(parsedTags)) {
            return { error: "Invalid tags format" };
        }
        parsedTags = [...new Set(parsedTags.map((t) => String(t).trim().toLowerCase()).filter(Boolean))];
    }
    if (!partial || tags !== undefined) data.tags = parsedTags;

    if (!partial || weight !== undefined) {
        try {
            const w = parseJsonField(weight) || {};
            data.weight = {
                value: toNumberOrNull(w.value),
                unit: w.unit || "g"
            };
        } catch (err) {
            return { error: `Invalid weight: ${err.message}` };
        }
    }

    if (!partial || dimension !== undefined) {
        try {
            const d = parseJsonField(dimension) || {};
            data.dimension = {
                length: toNumberOrNull(d.length),
                width: toNumberOrNull(d.width),
                height: toNumberOrNull(d.height),
                unit: d.unit || "cm"
            };
        } catch (err) {
            return { error: `Invalid dimension: ${err.message}` };
        }
    }

    if (!partial || stock !== undefined) {
        try {
            const parsedStock = toNumberOrNull(stock) ?? 0;
            if (!Number.isInteger(parsedStock)) throw new Error("must be a whole number");
            data.stock = parsedStock;
        } catch (err) {
            return { error: `Invalid stock: ${err.message}` };
        }
    }

    return { data };
};

const invalidIdResponse = (res) =>
    res.status(400).json({ success: false, message: "Invalid product id" });


export const addProduct = async (req, res) => {
    try {

        const { name, slug, des, price, discountedPrice, overView, faq, seo, shortDes, status, categoryId, tags, weight, dimension, stock } = req.body;

        const featureImage = req.files?.featureImage?.[0];
        const images = req.files?.image || [];

        if (!name?.trim() || !slug?.trim() || !des?.trim() || !price || !discountedPrice || !overView?.trim() || !shortDes?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Send all required values"
            });
        }

        if (!featureImage) {
            return res.status(400).json({
                success: false,
                message: "Feature image is required"
            });
        }

        let parsedFaq = [];

        try {
            parsedFaq =
                typeof faq === "string"
                    ? JSON.parse(faq)
                    : faq;
        } catch {
            return res.status(400).json({
                success: false,
                message: "Invalid FAQ format"
            });
        }

        if (!Array.isArray(parsedFaq) || parsedFaq.length === 0) {
            return res.status(400).json({
                success: false,
                message: "FAQ is required"
            });
        }

        let parsedSeo = {};

        try {
            parsedSeo =
                typeof seo === "string"
                    ? JSON.parse(seo)
                    : seo || {};
        } catch {
            return res.status(400).json({
                success: false,
                message: "Invalid SEO format"
            });
        }

        const extras = await parseProductExtras({ categoryId, tags, weight, dimension, stock });

        if (extras.error) {
            return res.status(400).json({
                success: false,
                message: extras.error
            });
        }

        const duplicateSlugCheck = await ProductModel.findOne({
            slug: slug.trim()
        });

        if (duplicateSlugCheck) {
            return res.status(400).json({
                success: false,
                message: "Duplicate Slug"
            });
        }

        const featureImageResult = await uploadToCloudinary(
            featureImage.buffer,
            name
        );

        const imageResult = [];

        if (images.length > 0) {
            const uploadedImages = await Promise.all(
                images.map(async (image) => {
                    const result = await uploadToCloudinary(
                        image.buffer,
                        name
                    );

                    return result.secure_url;
                })
            );

            imageResult.push(...uploadedImages);
        }

        const productDetails = await ProductModel.create({
            name: name.trim(),
            slug: slug.trim(),
            des: des.trim(),
            price: String(price),
            discountedPrice: String(discountedPrice),
            overView: overView.trim(),
            faq: parsedFaq,
            seo: parsedSeo,
            shortDes: shortDes.trim(),
            featureImage: featureImageResult.secure_url,
            image: imageResult,
            ...extras.data,
            status:
                status === true ||
                status === "true"
        });

        if (!productDetails) {
            return res.status(500).json({
                success: false,
                message: "Failed to add product"
            });
        }

        return res.status(201).json({
            success: true,
            message: "Product added successfully",
            product: productDetails
        });

    } catch (err) {
        console.error("Add product error:", err);

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const { name, slug, des, price, discountedPrice, overView, faq, seo, shortDes, status, categoryId, tags, weight, dimension, stock } = req.body;

        if (!isValidObjectId(id)) return invalidIdResponse(res);

        const product = await ProductModel.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (!name?.trim() || !slug?.trim() || !des?.trim() || !price || !discountedPrice || !overView?.trim() || !shortDes?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Send all required values"
            });
        }

        let parsedFaq = [];

        try {
            parsedFaq =
                typeof faq === "string"
                    ? JSON.parse(faq)
                    : faq;
        } catch {
            return res.status(400).json({
                success: false,
                message: "Invalid FAQ format"
            });
        }

        if (!Array.isArray(parsedFaq) || parsedFaq.length === 0) {
            return res.status(400).json({
                success: false,
                message: "FAQ is required"
            });
        }

        let parsedSeo = {};

        try {
            parsedSeo =
                typeof seo === "string"
                    ? JSON.parse(seo)
                    : seo || {};
        } catch {
            return res.status(400).json({
                success: false,
                message: "Invalid SEO format"
            });
        }

        const extras = await parseProductExtras(
            { categoryId, tags, weight, dimension, stock },
            { partial: true }
        );

        if (extras.error) {
            return res.status(400).json({
                success: false,
                message: extras.error
            });
        }

        const duplicateSlugCheck = await ProductModel.findOne({
            slug: slug.trim(),
            _id: { $ne: id }
        });

        if (duplicateSlugCheck) {
            return res.status(400).json({
                success: false,
                message: "Duplicate Slug"
            });
        }

        const newFeatureImage =
            req.files?.featureImage?.[0];

        const newImages =
            req.files?.image || [];

        let featureImageUrl =
            product.featureImage;

        if (newFeatureImage) {
            const featureImageResult =
                await uploadToCloudinary(
                    newFeatureImage.buffer,
                    name
                );

            featureImageUrl =
                featureImageResult.secure_url;

            if (product.featureImage) {
                await deleteFromCloudinary(
                    product.featureImage
                );
            }
        }

        let imageResult =
            product.image || [];

        if (newImages.length > 0) {
            const uploadedImages =
                await Promise.all(
                    newImages.map(
                        async (image) => {
                            const result =
                                await uploadToCloudinary(
                                    image.buffer,
                                    name
                                );

                            return result.secure_url;
                        }
                    )
                );

            const oldImages = product.image || [];
            imageResult = uploadedImages;

            await Promise.all(oldImages.map((url) => deleteFromCloudinary(url)));
        }

        const updatedProduct = await ProductModel.findByIdAndUpdate(
            id,
            {
                name: name.trim(),
                slug: slug.trim(),
                des: des.trim(),
                price: String(price),
                discountedPrice: String(discountedPrice),
                overView: overView.trim(),
                faq: parsedFaq,
                seo: parsedSeo,
                shortDes: shortDes.trim(),
                featureImage: featureImageUrl,
                image: imageResult,
                ...extras.data,
                status: status === true || status === "true"
            },
            {
                returnDocument: "after",
                runValidators: true
            }
        );

        if (!updatedProduct) {
            return res.status(500).json({
                success: false,
                message: "Failed to update product"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product: updatedProduct
        });

    } catch (err) {
        console.error(
            "Update product error:",
            err
        );

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) return invalidIdResponse(res);

        const product = await ProductModel.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        await ProductModel.findByIdAndDelete(id);

        if (product.featureImage) {
            try {
                await deleteFromCloudinary(product.featureImage);
            } catch (error) {
                console.error(
                    "Failed to delete featured image:",
                    error.message
                );
            }
        }

        if (product.image?.length) {
            await Promise.all(
                product.image.map((url) => deleteFromCloudinary(url))
            );
        }

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const getProductBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        if (!slug) {
            return res.status(400).json({ success: false, message: "Slug is required" });
        }

        const productDetails = await ProductModel.findOne({ slug: slug, status: true }).populate("categoryId", "_id name slug");

        if (!productDetails) {
            return res.status(404).json({ success: false, message: "Product not found" })
        }

        return res.status(200).json({ success: true, product: productDetails })
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message })
    }
}

export const getProductByAdmin = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.max(Number(req.query.limit) || 20, 1);

        const skip = (page - 1) * limit;

        const [products, total] = await Promise.all([
            ProductModel.find()
                .populate("categoryId", "_id name slug")
                .skip(skip)
                .limit(limit),

            ProductModel.countDocuments()
        ]);

        return res.status(200).json({
            success: true,
            products,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const getProduct = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.max(Number(req.query.limit) || 20, 1);

        const skip = (page - 1) * limit;

        const [products, total] = await Promise.all([
            ProductModel.find({ status: true })
                .populate("categoryId", "_id name slug")
                .skip(skip)
                .limit(limit),

            ProductModel.countDocuments({ status: true })
        ]);

        return res.status(200).json({
            success: true,
            products,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const updateProductStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!isValidObjectId(id)) return invalidIdResponse(res);

        if (status !== true && status !== false && status !== "true" && status !== "false") {
            return res.status(400).json({
                success: false,
                message: "Status must be true or false",
            });
        }

        const product = await ProductModel.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        const updatedProduct =
            await ProductModel.findByIdAndUpdate(
                id,
                {
                    status: status === true || status === "true",
                },
                {
                    new: true,
                    runValidators: true,
                }
            );

        return res.status(200).json({
            success: true,
            message: updatedProduct.status
                ? "Product is now online"
                : "Product is now offline",
            product: updatedProduct,
        });
    } catch (err) {
        console.error(
            "Update product status error:",
            err
        );

        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

export const searchProducts = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.max(parseInt(req.query.limit, 10) || 20, 1);
        const search = req.query.q?.trim() || "";

        const skip = (page - 1) * limit;

        if (!search) {
            return res.status(400).json({
                success: false,
                message: "Search query is required"
            });
        }

        const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const searchRegex = new RegExp(escapedSearch, "i");

        const filter = {
            status: true,
            $or: [
                { name: searchRegex },
                { slug: searchRegex },
                { shortDes: searchRegex },
                { des: searchRegex },
                { tags: searchRegex }
            ]
        };

        const [products, total] = await Promise.all([
            ProductModel.find(filter)
                .populate("categoryId", "_id name slug")
                .skip(skip)
                .limit(limit)
                .lean(),

            ProductModel.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            products,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            query: search
        });
    } catch (err) {
        console.error("Search products error:", err);

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const searchProductsByAdmin = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.max(parseInt(req.query.limit, 10) || 20, 1);
        const search = req.query.q?.trim() || "";

        const skip = (page - 1) * limit;

        if (!search) {
            return res.status(400).json({
                success: false,
                message: "Search query is required"
            });
        }

        const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const searchRegex = new RegExp(escapedSearch, "i");

        const filter = {
            $or: [
                { name: searchRegex },
                { slug: searchRegex },
                { shortDes: searchRegex },
                { des: searchRegex },
                { tags: searchRegex }
            ]
        };

        const [products, total] = await Promise.all([
            ProductModel.find(filter)
                .populate("categoryId", "_id name slug")
                .skip(skip)
                .limit(limit)
                .lean(),

            ProductModel.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            products,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            query: search
        });
    } catch (err) {
        console.error("Search products error:", err);

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
