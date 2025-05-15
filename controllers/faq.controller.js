const { FAQ } = require("../models/faq.model");

const faqController = {
  addFaq: async (req, res) => {
    try {
      const { companyId, faqs } = req.body;
      const createdFaqs = [];

      for (let i = 0; i < faqs.length; i++) {
        const faq = faqs[i];
        const { id, updated, question, answer } = faq;

        if (id && updated) {
          await FAQ.update({ question, answer }, { where: { id } });
        } else if (id && !updated) {
          continue;
        } else if (!id) {
          const newFaq = await FAQ.create({
            question,
            answer,
            companyId,
          });
          createdFaqs.push(newFaq);
        }
      }

      return res.status(201).json({
        message: "success",
        faqs: createdFaqs,
      });
    } catch (error) {
      console.error("Error creating faqs:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  },
};

module.exports = faqController;
