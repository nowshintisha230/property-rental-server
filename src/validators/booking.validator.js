// src/validators/booking.validator.js
const { body } = require("express-validator");

const createBookingValidator = [
  body("propertyId")
    .notEmpty()
    .withMessage("Property ID is required")
    .isMongoId()
    .withMessage("Invalid property ID"),

  body("moveInDate")
    .notEmpty()
    .withMessage("Move-in date is required")
    .isISO8601()
    .withMessage("Move-in date must be a valid date")
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        throw new Error("Move-in date cannot be in the past");
      }
      return true;
    }),

  body("contactNumber")
    .trim()
    .notEmpty()
    .withMessage("Contact number is required"),

  body("additionalNotes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes cannot exceed 500 characters"),
];

module.exports = { createBookingValidator };