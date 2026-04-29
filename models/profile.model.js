const mongoose = require("mongoose");
const { isUuidV7 } = require("../utils/uuid.util");

const UUID_V7_MESSAGE = "id must be a valid UUID v7";
const AGE_GROUPS = ["child", "teenager", "adult", "senior"];
const GENDERS = ["male", "female"];

const profileSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      immutable: true,
      validate: {
        validator: isUuidV7,
        message: UUID_V7_MESSAGE,
      },
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: GENDERS,
      lowercase: true,
      default: null,
    },
    gender_probability: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },
    age: {
      type: Number,
      min: 0,
      max: 150,
      default: null,
    },
    age_group: {
      type: String,
      enum: AGE_GROUPS,
      lowercase: true,
      default: null,
    },
    country_id: {
      type: String,
      uppercase: true,
      minlength: 2,
      maxlength: 2,
      default: null,
    },
    country_name: {
      type: String,
      default: null,
    },
    country_probability: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },
    created_at: {
      type: Date,
      default: () => new Date(),
      immutable: true,
    },
  },
  {
    versionKey: false,
    toJSON: {
      transform: (_, ret) => {
        delete ret._id;
        return ret;
      },
    },
    toObject: {
      transform: (_, ret) => {
        delete ret._id;
        return ret;
      },
    },
  }
);

// Indexes for performance optimization
profileSchema.index({ id: 1 }, { unique: true });
profileSchema.index(
  { name: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

// Compound index to optimize queries filtering by gender, age, and country_id
profileSchema.index({ gender: 1, age: 1, country_id: 1 });
profileSchema.index({ created_at: -1 });
profileSchema.index({ gender_probability: -1 });
profileSchema.index({ country_probability: -1 });

module.exports = mongoose.model("Profile", profileSchema);
