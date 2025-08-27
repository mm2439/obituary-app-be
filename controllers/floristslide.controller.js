const path = require("path");
const { supabaseAdmin } = require("../config/supabase");
const FLORIST_SLIDE_UPLOADS_PATH = path.join(__dirname, "../floristSlideUploads");
const sharp = require("sharp");
const fs = require("fs");

const florsitSlideController = {
  addFloristSlide: async (req, res) => {
    try {
      const { slides, companyId } = req.body;

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
          .insert({ companyId, title, description })
          .select()
          .single();
        if (error) return res.status(500).json({ message: 'Internal server error.' });

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

      const { data: allSlides } = await supabaseAdmin.from('floristslides').select('*').eq('companyId', companyId);

      return res.status(201).json({ message: 'Slides processed successfully.', slides: allSlides || [] });
    } catch (error) {
      console.error('Error processing slides:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  },
};

module.exports = florsitSlideController;
