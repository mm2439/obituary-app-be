const { FAQ } = require("../models/faq.model");

const faqController = {
  addFaq: async (req, res) => {
    try {
      const { companyId, faqs } = req.body;

      for (let i = 0; i < faqs.length; i++) {
        const faq = faqs[i];
        const { id, updated, question, answer } = faq;

        if (id && updated) {
          await FAQ.update({ question, answer }, { where: { id } });
        } else if (id && !updated) {
          continue;
        } else if (!id) {
          await FAQ.create({
            question,
            answer,
            companyId,
          });
        }
      }

      const allFaqs = await FAQ.findAll({ where: { companyId } });

      return res.status(201).json({
        message: "Dodano",
        faqs: allFaqs,
      });
    } catch (error) {
      console.error("Error creating/updating FAQs:", error);
      return res.status(500).json({ message: "Prišlo je do napake" });
    }
  },
  deleteFaq: async (req, res) => {
    try {
      const { id } = req.params;
      const { companyId } = req.query; // ✅ get companyId from query string

      if (!id) {
        return res.status(400).json({ message: "FAQ ID is required." });
      }
      if (!companyId) {
        return res.status(400).json({ message: "Company ID is required." });
      }

      const deleted = await FAQ.destroy({ where: { id } });

      if (!deleted) {
        return res.status(404).json({ message: "Ne obstaja" });
      }

      // ✅ fetch updated FAQ list for this company
      const updatedFaqs = await FAQ.findAll({ where: { companyId } });

      return res.status(200).json({
        message: "Izbrisano",
        faqs: updatedFaqs,
      });
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      return res.status(500).json({ message: "Prišlo je do napake" });
    }
  },
};

module.exports = faqController;
