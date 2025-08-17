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
};

module.exports = faqController;
