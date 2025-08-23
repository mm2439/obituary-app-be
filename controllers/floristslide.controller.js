const path = require("path");
const { supabaseAdmin } = require("../config/supabase");
const FLORIST_SLIDE_UPLOADS_PATH = path.join(__dirname, "../floristSlideUploads");
const sharp = require("sharp");
const fs = require("fs");

const florsitSlideController = {
  addFloristSlide: async (req, res) => {
    try {
      const { slides, companyId } = req.body;
      const userIdToUse = req.profile?.id;

      if (!slides || !Array.isArray(slides)) {
        return res.status(400).json({ message: 'Slides array is required' });
      }

      let finalCompanyId = companyId;

      // If no companyId provided, try to get it from user's company
      if (!finalCompanyId && userIdToUse) {
        const userIntId = Math.abs(userIdToUse.replace(/-/g, '').substring(0, 6).split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a; // Convert to 32bit integer
        }, 0)) % 2147483647;
        const { data: company } = await supabaseAdmin
          .from('companypages')
          .select('id')
          .eq('userId', userIntId)
          .single();

        if (company) {
          finalCompanyId = company.id;
        }
      }

      if (!finalCompanyId) {
        return res.status(400).json({ message: 'Company ID is required' });
      }

      for (let i = 0; i < slides.length; i++) {
        const { id, updated, title, description, image } = slides[i];
        const file = req.files?.find((f) => f.fieldname === `slides[${i}][image]`);

        if (id && updated) {
          await supabaseAdmin.from('floristslides').update({ title, description }).eq('id', id);

          if (file) {
            const imagePath = path.join('floristSlideUploads', String(id), `${path.parse(file.originalname).name}.avif`);
            const slideFolder = path.join(FLORIST_SLIDE_UPLOADS_PATH, String(id));
            if (!fs.existsSync(slideFolder)) fs.mkdirSync(slideFolder, { recursive: true });

            await sharp(file.buffer).resize(195, 267, { fit: 'cover' }).toFormat('avif', { quality: 50 }).toFile(path.join(__dirname, '../', imagePath));
            await supabaseAdmin.from('floristslides').update({ image: imagePath }).eq('id', id);
          } else if (typeof image === 'string') {
            await supabaseAdmin.from('floristslides').update({ image }).eq('id', id);
          }
          continue;
        }

        if (id && !updated) continue;

        const { data: newSlide, error } = await supabaseAdmin
          .from('floristslides')
          .insert({ companyId: finalCompanyId, title, description })
          .select()
          .single();
        if (error) return res.status(500).json({ message: 'Internal server error.', error: error.message });

        const slideFolder = path.join(FLORIST_SLIDE_UPLOADS_PATH, String(newSlide.id));
        if (!fs.existsSync(slideFolder)) fs.mkdirSync(slideFolder, { recursive: true });

        if (file) {
          const imagePath = path.join('floristSlideUploads', String(newSlide.id), `${path.parse(file.originalname).name}.avif`);
          await sharp(file.buffer).resize(195, 267, { fit: 'cover' }).toFormat('avif', { quality: 50 }).toFile(path.join(__dirname, '../', imagePath));
          await supabaseAdmin.from('floristslides').update({ image: imagePath }).eq('id', newSlide.id);
        } else if (typeof image === 'string') {
          await supabaseAdmin.from('floristslides').update({ image }).eq('id', newSlide.id);
        }
      }

      const { data: allSlides } = await supabaseAdmin.from('floristslides').select('*').eq('companyId', finalCompanyId);

      return res.status(201).json({ message: 'Slides processed successfully.', slides: allSlides || [] });
    } catch (error) {
      console.error('Error processing slides:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  },

  getFloristSlide: async (req, res) => {
    try {
      const { companyId } = req.query;
      const userIdToUse = req.profile?.id;

      let finalCompanyId = companyId;

      // If no companyId provided, try to get it from user's company
      if (!finalCompanyId && userIdToUse) {
        const userIntId = parseInt(userIdToUse.replace(/-/g, '').substring(0, 8), 16);
        const { data: company } = await supabaseAdmin
          .from('companypages')
          .select('id')
          .eq('userId', userIntId)
          .single();

        if (company) {
          finalCompanyId = company.id;
        }
      }

      if (!finalCompanyId) {
        return res.status(400).json({ message: 'Company ID is required' });
      }

      const { data: slides, error } = await supabaseAdmin
        .from('floristslides')
        .select('*')
        .eq('companyId', finalCompanyId);

      if (error) {
        return res.status(500).json({ message: 'Internal server error.', error: error.message });
      }

      return res.status(200).json({ slides: slides || [] });
    } catch (error) {
      console.error('Error getting slides:', error);
      return res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
  },
};

module.exports = florsitSlideController;
