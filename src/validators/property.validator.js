// src/validators/property.validator.js
const { body } = require("express-validator");

const createPropertyValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 10, max: 120 })
    .withMessage("Title must be between 10 and 120 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 30, max: 2000 })
    .withMessage("Description must be between 30 and 2000 characters"),

  body("location")
    .trim()
    .notEmpty()
    .withMessage("Location is required"),

  body("propertyType")
    .notEmpty()
    .withMessage("Property type is required")
    .isIn([
      "Apartment","House","Villa","Studio",
      "Condo","Townhouse","Office","Warehouse",
    ])
    .withMessage("Invalid property type"),

  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  body("rentType")
    .notEmpty()
    .withMessage("Rent type is required")
    .isIn(["per month", "per week", "per day"])
    .withMessage("Invalid rent type"),

  body("bedrooms")
    .notEmpty()
    .withMessage("Bedrooms is required")
    .isInt({ min: 0, max: 50 })
    .withMessage("Bedrooms must be between 0 and 50"),

  body("bathrooms")
    .notEmpty()
    .withMessage("Bathrooms is required")
    .isInt({ min: 0, max: 50 })
    .withMessage("Bathrooms must be between 0 and 50"),

  body("size")
    .notEmpty()
    .withMessage("Size is required")
    .isFloat({ min: 1 })
    .withMessage("Size must be at least 1 sq ft"),

  body("images")
    .isArray({ min: 1, max: 10 })
    .withMessage("Between 1 and 10 images are required"),

  body("ownerInfo.name")
    .trim()
    .notEmpty()
    .withMessage("Owner name is required"),

  body("ownerInfo.email")
    .trim()
    .notEmpty()
    .withMessage("Owner email is required")
    .isEmail()
    .withMessage("Owner email must be valid"),
];

const updatePropertyValidator = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 10, max: 120 })
    .withMessage("Title must be between 10 and 120 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 30, max: 2000 })
    .withMessage("Description must be between 30 and 2000 characters"),

  body("propertyType")
    .optional()
    .isIn([
      "Apartment","House","Villa","Studio",
      "Condo","Townhouse","Office","Warehouse",
    ])
    .withMessage("Invalid property type"),

  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  body("rentType")
    .optional()
    .isIn(["per month", "per week", "per day"])
    .withMessage("Invalid rent type"),

  body("bedrooms")
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage("Bedrooms must be between 0 and 50"),

  body("bathrooms")
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage("Bathrooms must be between 0 and 50"),

  body("size")
    .optional()
    .isFloat({ min: 1 })
    .withMessage("Size must be at least 1"),
];

module.exports = { createPropertyValidator, updatePropertyValidator };