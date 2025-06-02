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
        message: "FAQs processed successfully.",
        faqs: allFaqs,
      });
    } catch (error) {
      console.error("Error creating/updating FAQs:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  },
};

module.exports = faqController;
