const { FAQ } = require("../models/faq.model");

const faqController = {
  addFaq: async (req, res) => {
    try {
      const { companyId, question, answer } = req.body;

      const faq = await FAQ.create({
        companyId,
        question,
        answer,
      });

      return res
        .status(201)
        .json({ message: "FAQ created successfully.", faq });
    } catch (error) {
      console.error("Error creating Cemetry:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  },
};
module.exports = faqController;
