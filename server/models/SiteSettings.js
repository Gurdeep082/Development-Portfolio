const mongoose = require("mongoose");

const siteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "portfolio" },
    resume: { type: String, default: "" },
    resumeName: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "resume.pdf",
    },
    visitCount: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteSettings", siteSettingsSchema);
