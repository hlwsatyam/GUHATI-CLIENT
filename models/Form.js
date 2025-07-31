// models/Form.js
const mongoose = require("mongoose");

const formSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  message: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  status: { type: String, enum: ['new', 'contacted', 'qualified', 'lost'], default: 'new' },
  source: { type: String, enum: ['website', 'social', 'referral', 'other'], default: 'website' },
  notes: [{
    content: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
formSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("Form", formSchema);