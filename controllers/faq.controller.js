const { supabaseAdmin } = require("../config/supabase");

const faqController = {
  addFaq: async (req, res) => {
    try {
      const { companyId, faqs } = req.body;
      if (!Array.isArray(faqs)) return res.status(400).json({ message: 'Invalid payload' });

      for (let i = 0; i < faqs.length; i++) {
        const { id, updated, question, answer } = faqs[i];
        if (id && updated) {
          await supabaseAdmin.from('faqs').update({ question, answer }).eq('id', id);
        } else if (id && !updated) {
          continue;
        } else if (!id) {
          await supabaseAdmin.from('faqs').insert({ question, answer, companyId });
        }
      }

      const { data: allFaqs } = await supabaseAdmin.from('faqs').select('*').eq('companyId', companyId);

      return res.status(201).json({ message: 'FAQs processed successfully.', faqs: allFaqs || [] });
    } catch (error) {
      console.error('Error creating/updating FAQs:', error);
      return res.status(500).json({ message: 'Internal server error.' });
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
        return res.status(404).json({ message: "FAQ not found." });
      }

      // ✅ fetch updated FAQ list for this company
      const updatedFaqs = await FAQ.findAll({ where: { companyId } });

      return res.status(200).json({
        message: "FAQ deleted successfully.",
        faqs: updatedFaqs,
      });
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  },
};

module.exports = faqController;
