const { supabaseAdmin } = require("../config/supabase");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const CEMETRY_UPLOADS_PATH = path.join(__dirname, "../cemetryUploads");

const cemetryController = {
  addCemetry: async (req, res) => {
    try {
      const { companyId, cemeteries } = req.body;
      const userId = req.profile?.id;

      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      for (let i = 0; i < cemeteries.length; i++) {
        const { id, updated, name, address, city, image } = cemeteries[i];
        const file = req.files?.find((f) => f.fieldname === `cemeteries[${i}][image]`);

        if (id && updated) {
          await supabaseAdmin.from('cemetries').update({ name, address, city }).eq('id', id);
          if (file) {
            const imagePath = path.join('cemetryUploads', String(id), `${path.parse(file.originalname).name}.avif`);
            const cemetryFolder = path.join(CEMETRY_UPLOADS_PATH, String(id));
            if (!fs.existsSync(cemetryFolder)) fs.mkdirSync(cemetryFolder, { recursive: true });

            await sharp(file.buffer).resize(195, 267, { fit: 'cover' }).toFormat('avif', { quality: 50 }).toFile(path.join(__dirname, '../', imagePath));
            await supabaseAdmin.from('cemetries').update({ image: imagePath }).eq('id', id);
          } else if (typeof image === 'string') {
            await supabaseAdmin.from('cemetries').update({ image }).eq('id', id);
          }
          continue;
        }

        if (id && !updated) continue;

        const { data: existing } = await supabaseAdmin.from('cemetries').select('id').eq('name', name).limit(1);
        if (existing && existing.length > 0) {
          return res.status(409).json({ message: `Cemetery "${name}" already exists.` });
        }

        const { data: created } = await supabaseAdmin
          .from('cemetries')
          .insert({ userId, name, city, address, companyId })
          .select()
          .single();

        const cemetryFolder = path.join(CEMETRY_UPLOADS_PATH, String(created.id));
        if (!fs.existsSync(cemetryFolder)) fs.mkdirSync(cemetryFolder, { recursive: true });

        if (file) {
          const imagePath = path.join('cemetryUploads', String(created.id), `${path.parse(file.originalname).name}.avif`);
          await sharp(file.buffer).resize(195, 267, { fit: 'cover' }).toFormat('avif', { quality: 50 }).toFile(path.join(__dirname, '../', imagePath));
          await supabaseAdmin.from('cemetries').update({ image: imagePath }).eq('id', created.id);
        } else if (typeof image === 'string') {
          await supabaseAdmin.from('cemetries').update({ image }).eq('id', created.id);
        }
      }

      const { data: allCemeteries } = await supabaseAdmin.from('cemetries').select('*').eq('companyId', companyId);
      return res.status(201).json({ message: 'Cemeteries processed successfully.', cemeteries: allCemeteries || [] });
    } catch (error) {
      console.error('Error creating/updating cemeteries:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  },

  getCemetries: async (req, res) => {
    try {
      const userId = req.profile?.id;
      const { city } = req.query;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      let query = supabaseAdmin.from('cemetries').select('*').eq('userId', userId);
      if (city) query = query.eq('city', city);
      const { data: cemetries } = await query;

      return res.status(201).json({ message: 'Success.', cemetries: cemetries || [] });
    } catch (error) {
      console.error('Error getting cemetries:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  },
};
module.exports = cemetryController;
