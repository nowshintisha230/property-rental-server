// src/models/Favorite.js
const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Tenant is required"],
      index: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "Property is required"],
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Prevent duplicate favorites — compound unique index
favoriteSchema.index({ tenantId: 1, propertyId: 1 }, { unique: true });

const Favorite = mongoose.model("Favorite", favoriteSchema);
module.exports = Favorite;