import { Schema, model } from "mongoose";

const productSchema = new Schema({
    name: {
        type: String
    },
    slug: {
        type: String,
        unique: true
    },
    des: {
        type: String,
    },
    overView: {
        type: String
    },
    shortDes: {
        type: String
    },
    featureImage: {
        type: String
    },
    image: [{
        type: String
    }],
    seo: {
        metaTitle: {
            type: String,
            trim: true,
            maxlength: 60,
        },

        metaDescription: {
            type: String,
            trim: true,
            maxlength: 160,
        },

        keywords: [
            {
                type: String,
                trim: true,
                lowercase: true,
            },
        ],

        canonicalUrl: {
            type: String,
            default: null,
            trim: true,
        },

        ogTitle: {
            type: String,
            default: null,
            trim: true,
        },

        ogDescription: {
            type: String,
            default: null,
            trim: true,
        },

        ogImage: {
            type: String,
            default: null,
            trim: true,
        },
        twitterTitle: {
            type: String,
            default: null,
            trim: true,
        },

        twitterDescription: {
            type: String,
            default: null,
            trim: true,
        },

        twitterImage: {
            type: String,
            default: null,
            trim: true,
        },
        facebookTitle: {
            type: String,
            default: null,
            trim: true,
        },

        facebookDescription: {
            type: String,
            default: null,
            trim: true,
        },

        facebookImage: {
            type: String,
            default: null,
            trim: true,
        },
    },
    faq: [
        {
            question: {
                type: String
            },
            answer: {
                type: String
            }
        }
    ],
    price: {
        type: String
    },
    discountedPrice: {
        type: String
    },
    categoryId: {
        type: Schema.Types.ObjectId,
        ref: "productcategory",
        required: true
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    weight: {
        value: { type: Number, min: 0, default: null },
        unit: { type: String, enum: ["g", "kg", "ml", "l"], default: "g" }
    },
    dimension: {
        length: { type: Number, min: 0, default: null },
        width: { type: Number, min: 0, default: null },
        height: { type: Number, min: 0, default: null },
        unit: { type: String, enum: ["mm", "cm", "m", "in"], default: "cm" }
    },
    stock: {
        type: Number,
        min: 0,
        default: 0
    },
    review: [{
        name: String,
        rating: Number,
        des: String,
        image: [String]
    }],
    status: {
        type: Boolean,
        default: true,
        enum: [false, true]
    }
},
    { timestamps: true }
);

const productModel = model("Products", productSchema);

export default productModel