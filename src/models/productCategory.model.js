import { Schema, model } from "mongoose";

const productCategorySchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    des: {
        type: String,
        trim: true,
        default: ""
    }
}, { timestamps: true });

const productCategoryModel = model("productcategory", productCategorySchema);

export default productCategoryModel;
