const express = require("express");
const authenticationMiddleware = require("../middlewares/authentication");
const adminAuth = require("../middlewares/adminAuth");
const router = express.Router();
const contactController = require("../controllers/contact.controller");
// Admin routes - all protected with authentication and admin role
router.use(authenticationMiddleware);
router.use(adminAuth);

// Get all users (admin only)
router.get("/users", async (req, res) => {
  try {
    const { User } = require("../models/user.model");

    // Get all users with role "User" (regular users, not companies)
    const users = await User.findAll({
      where: { role: "User" },
      attributes: [
        'id', 'name', 'email', 'city', 'region',
        'isBlocked', 'notes', 'createdTimestamp', 'modifiedTimestamp'
      ],
      order: [['createdTimestamp', 'DESC']]
    });

    // Transform data to match the frontend table structure
    const usersData = users.map(user => {
      return {
        id: user.id,
        slugKey: user.slugKey || `U${user.id.toString().padStart(5, '0')}`,
        email: user.email,
        name: user.name || 'Unknown',
        city: user.city || 'Unknown',
        region: user.region || 'Unknown',
        registered: user.createdTimestamp,
        lastLogin: user.modifiedTimestamp,
        isBlocked: user.isBlocked,
        notes: user.notes,
        // Mock data for fields not in database yet
        subscribed: Math.random() > 0.3, // Random subscription status
        lastContribution: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Random date within last 30 days
        daysVisited: Math.floor(Math.random() * 50) + 1, // Random days visited
        readTime: `${Math.floor(Math.random() * 24) + 1} Hours` // Random read time
      };
    });

    res.status(200).json({
      success: true,
      data: usersData
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get admin dashboard stats
router.get("/stats", async (req, res) => {
  try {
    const { User } = require("../models/user.model");
    const { Obituary } = require("../models/obituary.model");

    const totalUsers = await User.count();
    const totalObituaries = await Obituary.count();
    const usersByRole = await User.findAll({
      attributes: ['role', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['role']
    });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalObituaries,
        usersByRole
      }
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ error: "Failed to fetch admin stats" });
  }
});

// Delete user (admin only)
router.delete("/users/:id", async (req, res) => {
  try {
    const { User } = require("../models/user.model");
    const userId = req.params.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "Podatki se je ujemajo" });
    }

    // Prevent deleting superadmin
    if (user.role === "SUPERADMIN") {
      return res.status(403).json({ error: "Cannot delete superadmin account" });
    }

    await user.destroy();

    res.status(200).json({
      success: true,
      message: "Uporabnik je bil izbrisan"
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// Update user role (admin only)
router.patch("/users/:id/role", async (req, res) => {
  try {
    const { User } = require("../models/user.model");
    const { role } = req.body;
    const userId = req.params.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "Podatki se je ujemajo" });
    }

    // Prevent changing superadmin role
    if (user.role === "SUPERADMIN") {
      return res.status(403).json({ error: "Cannot modify superadmin role" });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ error: "Failed to update user role" });
  }
});

// Get funeral companies with statistics (admin only)
router.get("/funeral-companies", async (req, res) => {
  try {
    const { User } = require("../models/user.model");
    const { Obituary } = require("../models/obituary.model");
    const { Op } = require("sequelize");

    // Get current date and last month date
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all funeral companies
    const funeralCompanies = await User.findAll({
      where: { role: "Funeral" },
      attributes: [
        'id', 'name', 'email', 'company', 'city', 'region',
        'createObituaryPermission', 'assignKeeperPermission',
        'sendGiftsPermission', 'sendMobilePermission',
        'isBlocked', 'notes', 'adminRating', 'hasFlorist', 'isPaid', 'createdTimestamp'
      ],
      include: [
        {
          model: Obituary,
          as: 'Obituaries',
          attributes: ['id', 'createdTimestamp'],
          required: false
        }
      ]
    });

    // Calculate statistics for each company
    const companiesWithStats = await Promise.all(
      funeralCompanies.map(async (company) => {
        const obituaries = company.Obituaries || [];

        // Total obituaries
        const totalObituaries = obituaries.length;

        // Last month obituaries
        const lastMonthObituaries = obituaries.filter(obit =>
          new Date(obit.createdTimestamp) >= lastMonth &&
          new Date(obit.createdTimestamp) < thisMonth
        ).length;

        // Previous month obituaries
        const prevMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() - 1, 1);
        const prevMonthObituaries = obituaries.filter(obit =>
          new Date(obit.createdTimestamp) >= prevMonth &&
          new Date(obit.createdTimestamp) < lastMonth
        ).length;

        // Calculate percentages (mock data for now)
        const photoFuneralPercentage = Math.floor(Math.random() * 100);
        const localObitsPercentage = Math.floor(Math.random() * 100);
        const lastMonthLocalPercentage = Math.floor(Math.random() * 100);

        // Mock data for other metrics
        const keepersLastMonth = Math.floor(Math.random() * 50);
        const keepersPrevMonth = Math.floor(Math.random() * 50);
        const mobileLastMonth = Math.floor(Math.random() * 30);
        const mobilePrevMonth = Math.floor(Math.random() * 30);
        const tributesLastMonth = Math.floor(Math.random() * 20);
        const tributesPrevMonth = Math.floor(Math.random() * 20);
        const contributionsLastMonth = Math.floor(Math.random() * 40);
        const contributionsPrevMonth = Math.floor(Math.random() * 40);

        return {
          id: company.id,
          name: company.name || company.company || 'Unknown',
          company: company.company || company.name || 'Unknown',
          city: company.city || 'Unknown',
          region: company.region || 'Unknown',
          createdTimestamp: company.createdTimestamp,
          totalObituaries,
          lastMonthObituaries,
          prevMonthObituaries,
          photoFuneralPercentage,
          localObitsPercentage,
          lastMonthLocalPercentage,
          keepersLastMonth,
          keepersPrevMonth,
          mobileLastMonth,
          mobilePrevMonth,
          tributesLastMonth,
          tributesPrevMonth,
          contributionsLastMonth,
          contributionsPrevMonth,
          permissions: {
            createObituary: company.createObituaryPermission,
            assignKeeper: company.assignKeeperPermission,
            sendGifts: company.sendGiftsPermission,
            sendMobile: company.sendMobilePermission
          },
          isBlocked: company.isBlocked,
          notes: company.notes,
          adminRating: company.adminRating,
          hasFlorist: company.hasFlorist,
          isPaid: company.isPaid
        };
      })
    );

    res.status(200).json({
      success: true,
      companies: companiesWithStats
    });
  } catch (error) {
    console.error("Error fetching funeral companies:", error);
    res.status(500).json({ error: "Failed to fetch funeral companies" });
  }
});

// Update user permissions (admin only)
router.patch("/users/:id/permissions", async (req, res) => {
  try {
    const { User } = require("../models/user.model");
    const {
      createObituaryPermission,
      assignKeeperPermission,
      sendGiftsPermission,
      sendMobilePermission
    } = req.body;
    const userId = req.params.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "Podatki se je ujemajo" });
    }

    // Prevent modifying superadmin permissions
    if (user.role === "SUPERADMIN") {
      return res.status(403).json({ error: "Cannot modify superadmin permissions" });
    }

    // Update permissions
    user.createObituaryPermission = createObituaryPermission;
    user.assignKeeperPermission = assignKeeperPermission;
    user.sendGiftsPermission = sendGiftsPermission;
    user.sendMobilePermission = sendMobilePermission;

    await user.save();

    res.status(200).json({
      success: true,
      message: "User permissions updated successfully",
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error("Error updating user permissions:", error);
    res.status(500).json({ error: "Failed to update user permissions" });
  }
});

// Get florist companies with statistics (admin only)
router.get("/florist-companies", async (req, res) => {
  try {
    const { User } = require("../models/user.model");
    const { Op } = require("sequelize");

    // Get all florist companies
    const floristCompanies = await User.findAll({
      where: { role: "Florist" },
      attributes: [
        'id', 'name', 'email', 'company', 'city', 'region',
        'createObituaryPermission', 'assignKeeperPermission',
        'sendGiftsPermission', 'sendMobilePermission',
        'isBlocked', 'notes', 'adminRating', 'hasFlorist', 'isPaid', 'createdTimestamp'
      ]
    });

    // Calculate statistics for each company (mock data for now)
    const companiesWithStats = floristCompanies.map(company => ({
      id: company.id,
      name: company.name || company.company || 'Unknown',
      company: company.company || company.name || 'Unknown',
      city: company.city || 'Unknown',
      region: company.region || 'Unknown',
      createdTimestamp: company.createdTimestamp,
      totalGifts: Math.floor(Math.random() * 200),
      lastMonthGifts: Math.floor(Math.random() * 50),
      prevMonthGifts: Math.floor(Math.random() * 50),
      permissions: {
        createObituary: company.createObituaryPermission,
        assignKeeper: company.assignKeeperPermission,
        sendGifts: company.sendGiftsPermission,
        sendMobile: company.sendMobilePermission
      },
      isBlocked: company.isBlocked,
      notes: company.notes,
      adminRating: company.adminRating,
      hasFlorist: company.hasFlorist,
      isPaid: company.isPaid
    }));

    res.status(200).json({
      success: true,
      companies: companiesWithStats
    });
  } catch (error) {
    console.error("Error fetching florist companies:", error);
    res.status(500).json({ error: "Failed to fetch florist companies" });
  }
});

// Block/Unblock user (admin only)
router.patch("/users/:id/block", async (req, res) => {
  try {
    const { User } = require("../models/user.model");
    const { isBlocked } = req.body;
    const userId = req.params.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "Podatki se je ujemajo" });
    }

    // Prevent blocking superadmin
    if (user.role === "SUPERADMIN") {
      return res.status(403).json({ error: "Cannot block superadmin" });
    }

    // Update blocked status
    user.isBlocked = isBlocked;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error("Error blocking/unblocking user:", error);
    res.status(500).json({ error: "Failed to block/unblock user" });
  }
});

// Update user notes (admin only)
router.patch("/users/:id/notes", async (req, res) => {
  try {
    const { User } = require("../models/user.model");
    const { notes } = req.body;
    const userId = req.params.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "Podatki se je ujemajo" });
    }

    // Validate notes length
    if (notes && notes.length > 500) {
      return res.status(400).json({ error: "Notes cannot exceed 500 characters" });
    }

    // Update notes
    user.notes = notes;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User notes updated successfully",
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error("Error updating user notes:", error);
    res.status(500).json({ error: "Failed to update user notes" });
  }
});

// Get florist financials (admin only)
router.get("/florist-financials", async (req, res) => {
  try {
    const { User } = require("../models/user.model");
    const { Op } = require("sequelize");

    // Get all florist companies with their subscription data
    const floristCompanies = await User.findAll({
      where: { role: "Florist" },
      attributes: [
        'id', 'name', 'email', 'company', 'city', 'region',
        'createdTimestamp', 'modifiedTimestamp'
      ]
    });

    // Transform data to match the financial table structure
    const financialData = floristCompanies.map(company => {
      // For now, we'll use basic subscription data
      // In a real implementation, you'd have a separate subscriptions table
      const subscriptionDate = new Date(company.createdTimestamp);
      const expiryDate = new Date(subscriptionDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year subscription

      return {
        florist: company.name || company.company || 'Unknown',
        city: company.city || 'Unknown',
        region: company.region || 'Unknown',
        whatP: "Basic", // Default plan type
        whatS: "Active", // Default status
        when: subscriptionDate.toISOString().split('T')[0], // YYYY-MM-DD format
        expires: expiryDate.toISOString().split('T')[0], // YYYY-MM-DD format
        isredDot: Math.random() > 0.5, // Random red dot for demo
        paid: Math.random() > 0.3 ? "Yes" : "No", // Random payment status
        amount: "€50" // Default amount
      };
    });

    res.status(200).json({
      success: true,
      data: financialData
    });
  } catch (error) {
    console.error("Error fetching florist financials:", error);
    res.status(500).json({ error: "Failed to fetch florist financials" });
  }
});

// Update admin convenience fields (admin only)
router.patch("/users/:id/admin-fields", async (req, res) => {
  try {
    const { User } = require("../models/user.model");
    const { adminRating, hasFlorist, isPaid } = req.body;
    const userId = req.params.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "Podatki se je ujemajo" });
    }

    // Validate adminRating length
    if (adminRating && adminRating.length > 1) {
      return res.status(400).json({ error: "Admin rating cannot exceed 1 character" });
    }

    // Update admin convenience fields
    if (adminRating !== undefined) user.adminRating = adminRating;
    if (hasFlorist !== undefined) user.hasFlorist = hasFlorist;
    if (isPaid !== undefined) user.isPaid = isPaid;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Admin fields updated successfully",
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error("Error updating admin fields:", error);
    res.status(500).json({ error: "Failed to update admin fields" });
  }
});

// Delete user (admin only)
router.delete("/users/:id", async (req, res) => {
  try {
    const { User } = require("../models/user.model");
    const userId = req.params.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "Podatki se je ujemajo" });
    }

    // Check if user is a regular user (not a company)
    if (user.role !== "User") {
      return res.status(400).json({ error: "Can only delete regular users" });
    }

    await user.destroy();

    res.status(200).json({
      success: true,
      message: "Uporabnik je bil izbrisan"
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// Delete obituary (admin only)
router.delete("/obituaries/:id", async (req, res) => {
  try {
    const { Obituary } = require("../models/obituary.model");
    const obituaryId = req.params.id;

    const obituary = await Obituary.findByPk(obituaryId);
    if (!obituary) {
      return res.status(404).json({ error: "Osmrtnica ne obstaja" });
    }

    // Soft delete - mark as deleted but keep for 1 month
    obituary.deletedAt = new Date();
    obituary.isDeleted = true;
    await obituary.save();

    res.status(200).json({
      success: true,
      message: "Obituary deleted successfully. It can be recovered within 1 month."
    });
  } catch (error) {
    console.error("Error deleting obituary:", error);
    res.status(500).json({ error: "Failed to delete obituary" });
  }
});

// Toggle obituary visibility (hide/unhide)
router.patch("/obituaries/:id/visibility", async (req, res) => {
  try {
    const { Obituary } = require("../models/obituary.model");
    const { isHidden } = req.body;
    const obituaryId = req.params.id;

    const obituary = await Obituary.findByPk(obituaryId);
    if (!obituary) {
      return res.status(404).json({ error: "Osmrtnica ne obstaja" });
    }

    obituary.isHidden = isHidden;
    await obituary.save();

    res.status(200).json({
      success: true,
      message: isHidden ? "Obituary hidden successfully" : "Obituary unhidden successfully",
      obituary: obituary
    });
  } catch (error) {
    console.error("Error toggling obituary visibility:", error);
    res.status(500).json({ error: "Failed to toggle obituary visibility" });
  }
});

// Toggle memory page visibility (block/unblock)
router.patch("/obituaries/:id/memory-visibility", async (req, res) => {
  try {
    const { Obituary } = require("../models/obituary.model");
    const { isMemoryBlocked } = req.body;
    const obituaryId = req.params.id;

    const obituary = await Obituary.findByPk(obituaryId);
    if (!obituary) {
      return res.status(404).json({ error: "Osmrtnica ne obstaja" });
    }

    obituary.isMemoryBlocked = isMemoryBlocked;
    await obituary.save();

    res.status(200).json({
      success: true,
      message: isMemoryBlocked ? "Memory page blocked successfully" : "Memory page unblocked successfully",
      obituary: obituary
    });
  } catch (error) {
    console.error("Error toggling memory visibility:", error);
    res.status(500).json({ error: "Failed to toggle memory visibility" });
  }
});

// Update obituary admin notes
router.patch("/obituaries/:id/admin-notes", async (req, res) => {
  try {
    const { Obituary } = require("../models/obituary.model");
    const { adminNotes } = req.body;
    const obituaryId = req.params.id;

    const obituary = await Obituary.findByPk(obituaryId);
    if (!obituary) {
      return res.status(404).json({ error: "Osmrtnica ne obstaja" });
    }

    obituary.adminNotes = adminNotes;
    await obituary.save();

    res.status(200).json({
      success: true,
      message: "Admin notes updated successfully",
      obituary: obituary
    });
  } catch (error) {
    console.error("Error updating admin notes:", error);
    res.status(500).json({ error: "Failed to update admin notes" });
  }
});


// GET companies with status 'sent_for_approval' (admin only)
router.get("/compines-for-approval", async (req, res) => {
  try {
    const { User } = require("../models/user.model");
    const { CompanyPage } = require("../models/company_page.model");
    const { Op } = require("sequelize");

    // Get all companies
    const companies = await CompanyPage.findAll({
      // where: { status: "SENT_FOR_APPROVAL" },
      attributes: [
        'id', 'userId', 'type', 'city', 'createdTimestamp', 'modifiedTimestamp', 'status', 'approvedTimestamp', 'sentTimestamp',
      ],
      include: [{
        model: User,
        attributes: ["company"]
      }]
    });

    res.status(200).json({
      success: true,
      companies
    });
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ error: "Failed to fetch companies" });
  }
});

// PATCH Approve the company's request (admin only)
router.patch("/approve-request/:id", async (req, res) => {
  try {
    const { CompanyPage } = require("../models/company_page.model");

    const id = req.params?.id
    const status = req.body?.status;

    if (!id || !status) {
      return res.status(400).json({ success: false, message: "Missing required parameter" });
    }
    if (status !== "PUBLISHED" && status !== "DRAFT") {
      return res.status(400).json({ success: false, message: "Invalid parameter" });

    }
    const timestamp = status === "DRAFT" ? null : Date.now();
    const payload = { status: status, approvedTimestamp: timestamp, isNotified: false };
    const [updatedRowsCount] = await CompanyPage.update(payload, { where: { id } });

    if (updatedRowsCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Company not found or no changes made",
      });
    }

    res.status(200).json({
      success: true,
      updatedRowsCount
    });
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ error: "Prišlo je do napake" });
  }
});

router.get("/contact-list", contactController.fetchContacts)

module.exports = router; 