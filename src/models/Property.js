// src/models/Property.js
const mongoose = require("mongoose");

const amenityEnum = [
  "WiFi",
  "Air Conditioning",
  "Heating",
  "Parking",
  "Swimming Pool",
  "Gym",
  "Laundry",
  "Dishwasher",
  "Pet Friendly",
  "Balcony",
  "Garden",
  "Security",
  "Elevator",
  "Furnished",
  "TV Cable",
];

const propertySchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Property title is required"],
      trim: true,
      minlength: [10, "Title must be at least 10 characters"],
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [30, "Description must be at least 30 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      maxlength: [200, "Location cannot exceed 200 characters"],
    },
    propertyType: {
      type: String,
      required: [true, "Property type is required"],
      enum: {
        values: [
          "Apartment",
          "House",
          "Villa",
          "Studio",
          "Condo",
          "Townhouse",
          "Office",
          "Warehouse",
        ],
        message: "Invalid property type",
      },
    },
    price: {
      type: Number,
      required: [true, "Rent price is required"],
      min: [0, "Price cannot be negative"],
    },
    rentType: {
      type: String,
      required: [true, "Rent type is required"],
      enum: {
        values: ["per month", "per week", "per day"],
        message: "Rent type must be per month, per week, or per day",
      },
      default: "per month",
    },
    bedrooms: {
      type: Number,
      required: [true, "Number of bedrooms is required"],
      min: [0, "Bedrooms cannot be negative"],
      max: [50, "Bedrooms cannot exceed 50"],
    },
    bathrooms: {
      type: Number,
      required: [true, "Number of bathrooms is required"],
      min: [0, "Bathrooms cannot be negative"],
      max: [50, "Bathrooms cannot exceed 50"],
    },
    size: {
      type: Number,
      required: [true, "Property size is required"],
      min: [1, "Size must be at least 1 sq ft"],
    },
    amenities: {
      type: [String],
      default: [],
    },
    images: {
      type: [String],
      validate: {
        validator: function (arr) {
          return arr.length >= 1 && arr.length <= 10;
        },
        message: "A property must have between 1 and 10 images",
      },
      required: [true, "At least one image is required"],
    },
    extraFeatures: {
      type: String,
      trim: true,
      maxlength: [500, "Extra features cannot exceed 500 characters"],
      default: "",
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "approved", "rejected"],
        message: "Status must be pending, approved, or rejected",
      },
      default: "pending",
      index: true,
    },
    ownerInfo: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, default: "" },
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for search, filter, sort, and aggregation
propertySchema.index({ status: 1, createdAt: -1 });
propertySchema.index({ ownerId: 1, status: 1 });
propertySchema.index({ propertyType: 1, status: 1 });
propertySchema.index({ price: 1, status: 1 });
propertySchema.index({ location: "text", title: "text", description: "text" });
propertySchema.index({ averageRating: -1, status: 1 });

const Property = mongoose.model("Property", propertySchema);
module.exports = Property;