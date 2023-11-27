// const mongoose = require("mongoose");

// const productSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//   },
//   image: {
//     type: String,
//     required: true,
//   },
//   details: {
//     type: String,
//     required: true,
//   },
//   vote_count: {
//     type: Number,
//     default: 0,
//   },
//   tags: {
//     type: [String],
//   },
//   owner: {
//     type: String,
//     required: true,
//   },
//   timestamp: {
//     type: Date,
//     default: Date.now,
//   },
//   status: {
//     type: String,
//     enum: ["pending", "approved", "rejected"],
//     default: "pending",
//   },
// });

// const ProductModel = mongoose.model("product", productSchema);

// module.exports = ProductModel;
