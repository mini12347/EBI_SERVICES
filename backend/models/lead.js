const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    company: { type: String, default: "Individual" },
    email: { type: String, required: true },
    phone: { type: String, default: "" },
    country: { type: String, default: "France" },
    projectDescription: { type: String, default: "" },
    budget: { type: String, default: "" },
    deadline: { type: String, default: "" },
    status: {
      type: String,
      enum: ["new", "contacted", "qualified", "lost"],
      default: "new",
    },
    suggestedDepartment: { type: String, default: "Development" },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    source: { type: String, default: "chatbot" },
    userId: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lead", leadSchema);
