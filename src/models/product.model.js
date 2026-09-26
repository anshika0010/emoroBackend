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
        title: {
            type: String,
            default: ""
        },
        description: {
            type: String,
            default: ""
        },
        keywords: {
            type: [String],
            default: []
        },
        author: {
            type: String,
            default: ""
        },
        canonicalUrl: {
            type: String,
            default: ""
        },
        robotsMeta: {
            type: String,
            default: "index, follow"
        }
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