// routes/forms.js
const express = require("express");
const Form = require("../models/Form");
const { Parser } = require('json2csv');
const router = express.Router();

// Submit form
router.post("/submit", async (req, res) => {
  try {
    const form = await Form.create(req.body);
    // Log activity
    await logActivity(`${form.name} submitted a contact form`);
    res.json({ message: "Form submitted", form });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all forms with pagination and filtering
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    
    // Date filter
    if (req.query.dateFilter) {
      const now = new Date();
      switch(req.query.dateFilter) {
        case 'today':
          filter.createdAt = { $gte: new Date(now.setHours(0, 0, 0, 0)) };
          break;
        case 'week':
          const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
          filter.createdAt = { $gte: new Date(firstDay.setHours(0, 0, 0, 0)) };
          break;
        case 'month':
          filter.createdAt = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
          break;
      }
    }
    
    // Status filter
    if (req.query.statusFilter && req.query.statusFilter !== 'all') {
      filter.status = req.query.statusFilter;
    }
    
    // Source filter
    if (req.query.sourceFilter && req.query.sourceFilter !== 'all') {
      filter.source = req.query.sourceFilter;
    }

    const total = await Form.countDocuments(filter);
    const forms = await Form.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalForms: total,
      forms,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single form
router.get("/:id", async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }
    res.json(form);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update form status
router.put("/:id/status", async (req, res) => {
  try {
    const form = await Form.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    
    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }
    
    // Log activity
    await logActivity(`Lead status changed to ${req.body.status} for ${form.name}`);
    res.json(form);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add note to form
router.post("/:id/notes", async (req, res) => {
  try {
    const form = await Form.findByIdAndUpdate(
      req.params.id,
      { $push: { notes: req.body } },
      { new: true }
    );
    
    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }
    
    // Log activity
    await logActivity(`Note added to lead ${form.name}`);
    res.json(form);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete form
router.delete("/:id", async (req, res) => {
  try {
    const form = await Form.findByIdAndDelete(req.params.id);
    
    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }
    
    // Log activity
    await logActivity(`Lead ${form.name} deleted`);
    res.json({ message: "Form deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get stats for dashboard
router.get("/stats/dashboard", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const stats = {
      total: await Form.countDocuments(),
      today: await Form.countDocuments({ createdAt: { $gte: today } }),
      byStatus: {
        new: await Form.countDocuments({ status: 'new' }),
        contacted: await Form.countDocuments({ status: 'contacted' }),
        qualified: await Form.countDocuments({ status: 'qualified' }),
        lost: await Form.countDocuments({ status: 'lost' })
      },
      bySource: {
        website: await Form.countDocuments({ source: 'website' }),
        social: await Form.countDocuments({ source: 'social' }),
        referral: await Form.countDocuments({ source: 'referral' }),
        other: await Form.countDocuments({ source: 'other' })
      }
    };
    
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get recent activity
router.get("/activity", async (req, res) => {
  try {
    // In a real app, you would have a separate Activity model
    // For this example, we'll return some sample data
    const activities = [
      { 
        action: "System initialized", 
        timestamp: new Date(), 
        icon: "fa-info-circle", 
        color: "text-blue-500" 
      }
    ];
    
    // Add some recent form submissions
    const recentForms = await Form.find()
      .sort({ createdAt: -1 })
      .limit(3);
    
    recentForms.forEach(form => {
      activities.push({
        action: `${form.name} submitted a form`,
        timestamp: form.createdAt,
        icon: "fa-user-plus",
        color: "text-green-500"
      });
    });
    
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export to CSV
router.get("/export", async (req, res) => {
  try {
    // Build filter object
    const filter = {};
    
    // Date filter
    if (req.query.dateFilter) {
      const now = new Date();
      switch(req.query.dateFilter) {
        case 'today':
          filter.createdAt = { $gte: new Date(now.setHours(0, 0, 0, 0)) };
          break;
        case 'week':
          const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
          filter.createdAt = { $gte: new Date(firstDay.setHours(0, 0, 0, 0)) };
          break;
        case 'month':
          filter.createdAt = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
          break;
      }
    }
    
    // Status filter
    if (req.query.statusFilter) {
      filter.status = req.query.statusFilter;
    }
    
    // Source filter
    if (req.query.sourceFilter) {
      filter.source = req.query.sourceFilter;
    }

    const forms = await Form.find(filter).sort({ createdAt: -1 });

    // Prepare CSV data
    const fields = [
      'name',
      'email',
      'phone',
      'subject',
      'status',
      'source',
      'createdAt'
    ];
    
    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(forms);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=leads_export.csv');
    res.status(200).end(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper function to log activity (in a real app, this would save to a database)
async function logActivity(action) {
  console.log(`[Activity] ${action} at ${new Date().toISOString()}`);
}

module.exports = router;