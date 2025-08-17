const path = require("path");
const { supabaseAdmin } = require("../config/supabase");
const { sharpHelpers } = require("../helpers/sharp");
const { resizeConstants } = require("../constants/resize");
const fs = require("fs");
const PACKAGE_UPLOADS = path.join(__dirname, "../packageUploads");

const packageController = {
  addPackages: async (req, res) => {
    try {
      const { packages, companyId } = req.body;
      if (!Array.isArray(packages)) return res.status(400).json({ message: 'Invalid payload' });

      for (let i = 0; i < packages.length; i++) {
        const { id, updated, title, price, image } = packages[i];
        const file = req.files?.find((f) => f.fieldname === `packages[${i}][image]`);

        if (id && updated) {
          await supabaseAdmin.from('packages').update({ title, price }).eq('id', id);

          if (file) {
            const imagePath = path.join("packageUploads", String(id), `${path.parse(file.originalname).name}.avif`);
            const packageFolder = path.join(PACKAGE_UPLOADS, String(id));
            if (!fs.existsSync(packageFolder)) fs.mkdirSync(packageFolder, { recursive: true });

            await sharpHelpers.processImageToAvif({ buffer: file.buffer, outputPath: path.join(__dirname, "../", imagePath), resize: resizeConstants.packageImageOptions });
            await supabaseAdmin.from('packages').update({ image: imagePath }).eq('id', id);
          } else if (typeof image === 'string') {
            await supabaseAdmin.from('packages').update({ image }).eq('id', id);
          }
          continue;
        }

        if (id && !updated) continue;

        const { data: created, error } = await supabaseAdmin
          .from('packages')
          .insert({ companyId, title, price })
          .select()
          .single();
        if (error) return res.status(500).json({ message: 'Internal server error.' });

        const packageFolder = path.join(PACKAGE_UPLOADS, String(created.id));
        if (!fs.existsSync(packageFolder)) fs.mkdirSync(packageFolder, { recursive: true });

        if (file) {
          const imagePath = path.join("packageUploads", String(created.id), `${path.parse(file.originalname).name}.avif`);
          await sharpHelpers.processImageToAvif({ buffer: file.buffer, outputPath: path.join(__dirname, "../", imagePath), resize: resizeConstants.packageImageOptions });
          await supabaseAdmin.from('packages').update({ image: imagePath }).eq('id', created.id);
        } else if (typeof image === 'string') {
          await supabaseAdmin.from('packages').update({ image }).eq('id', created.id);
        }
      }

      const { data: allPackages } = await supabaseAdmin.from('packages').select('*').eq('companyId', companyId).limit(3);
      const { data: company } = await supabaseAdmin.from('companypages').select('*').eq('id', companyId).single();

      return res.status(201).json({ message: 'Packages processed successfully.', packages: allPackages || [], company });
    } catch (error) {
      console.error("Error processing packages:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  },

  getPackages: async (req, res) => {
    try {
      const { companyId } = req.query;
      const { data: allPackages } = await supabaseAdmin.from('packages').select('*').eq('companyId', companyId).limit(3);
      const { data: company } = await supabaseAdmin.from('companypages').select('*').eq('id', companyId).single();
      return res.status(200).json({ message: 'Packages retrieved successfully.', packages: allPackages || [], company });
    } catch (error) {
      console.error('Error processing packages:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  },
};

module.exports = packageController;
