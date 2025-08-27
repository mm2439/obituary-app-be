const path = require("path");
const COMPANY_UPLOADS_PATH = path.join(__dirname, "../companyUploads");
const fs = require("fs");
const sharp = require("sharp");
const { resizeConstants } = require("../constants/resize");
const { sharpHelpers } = require("../helpers/sharp");
const { supabaseAdmin } = require("../config/supabase");
const httpStatus = require("http-status-codes").StatusCodes;

const companyController = {
  creatFlorist: async (req, res) => {
    try {
      const { heading, phone, title, description, background } = req.body;
      const userId = req.profile?.id;
      if (!userId) return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthorized' });

      const { data: floristCompany, error } = await supabaseAdmin
        .from('companypages')
        .insert({ userId, type: 'FLORIST', heading, phone, title, description })
        .select()
        .single();
      if (error) return res.status(500).json({ error: 'Something went wrong' });

      const companyFolder = path.join(COMPANY_UPLOADS_PATH, String(floristCompany.id));
      if (!fs.existsSync(companyFolder)) fs.mkdirSync(companyFolder, { recursive: true });

      let picturePath = null;
      if (req.files?.background) {
        const pictureFile = req.files.background[0];
        const optimizedPicturePath = path.join('companyUploads', String(floristCompany.id), `${path.parse(pictureFile.originalname).name}.avif`);
        await sharpHelpers.processImageToAvif({ buffer: pictureFile.buffer, outputPath: path.join(__dirname, '../', optimizedPicturePath), resize: resizeConstants.companyPageCoverImageOptions });
        picturePath = optimizedPicturePath;
      } else if (typeof background === 'string') {
        picturePath = background;
      }
      await supabaseAdmin.from('companypages').update({ background: picturePath }).eq('id', floristCompany.id);

      res.status(httpStatus.OK).json({ message: 'Florist Company Created Successfully ', company: { ...floristCompany, background: picturePath } });
    } catch (error) {
      console.error('Error :', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Something went wrong' });
    }
  },
  creatFuneral: async (req, res) => {
    try {
      const { name, facebook, address, email, phone, website, background } = req.body;
      const userId = req.profile?.id;
      if (!userId) return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthorized' });

      const { data: funeralCompany, error } = await supabaseAdmin
        .from('companypages')
        .insert({ userId, type: 'FUNERAL', name, facebook, address, email, phone, website })
        .select()
        .single();
      if (error) return res.status(500).json({ error: 'Something went wrong' });

      const companyFolder = path.join(COMPANY_UPLOADS_PATH, String(funeralCompany.id));
      if (!fs.existsSync(companyFolder)) fs.mkdirSync(companyFolder, { recursive: true });

      let picturePath = null;
      let logoPath = null;

      if (req.files?.background) {
        const pictureFile = req.files.background[0];
        const optimizedPicturePath = path.join('companyUploads', String(funeralCompany.id), `${path.parse(pictureFile.originalname).name}.avif`);
        await sharpHelpers.processImageToAvif({ buffer: pictureFile.buffer, outputPath: path.join(__dirname, '../', optimizedPicturePath), resize: resizeConstants.funeralBackgroundSize, avifOptions: { quality: 60, effort: 5, chromaSubsampling: '4:4:4' } });
        picturePath = optimizedPicturePath;
      } else if (typeof background === 'string') {
        picturePath = background;
      }

      if (req.files?.logo) {
        const pictureFile = req.files.logo[0];

        const optimizedPicturePath = path.join(
          "companyUploads",
          String(funeralCompany.id),
          `${path.parse(pictureFile.originalname).name}.avif`
        );

        const maxWidth = 200;
        const maxHeight = 80;
        const image = sharp(pictureFile.buffer);
        const metadata = await image.metadata();
        const { width, height } = resizeConstants.getTargetResizeDimensions(
          maxWidth,
          maxHeight,
          metadata
        );

        await sharpHelpers.processImageToAvif({
          buffer: pictureFile.buffer,
          outputPath: path.join(__dirname, "../", optimizedPicturePath),
          resize: {
            width,
            height,
            fit: "contain",
            background: { r: 255, g: 255, b: 255, alpha: 0 },
          },
        });

        logoPath = optimizedPicturePath;
      }
      if (req.files?.picture) {
        const pictureFile = req.files.picture[0];

        const optimizedPicturePath = path.join(
          "companyUploads",
          String(funeralCompany.id),
          `picture.avif`
        );

        await sharpHelpers.processImageToAvif({
          buffer: pictureFile.buffer,
          outputPath: path.join(__dirname, "../", optimizedPicturePath),
          resize: {
            width: 195,
            height: 267,
            fit: "cover",
          },
          avifOptions: {
            quality: 50,
          },
        });

        logoPath = optimizedPicturePath;
      }

      await supabaseAdmin.from('companypages').update({ background: picturePath, logo: logoPath }).eq('id', funeralCompany.id);

      res.status(httpStatus.OK).json({ message: 'Funeral Company Created Successfully ', company: { ...funeralCompany, background: picturePath, logo: logoPath } });
    } catch (error) {
      console.error('Error :', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Something went wrong' });
    }
  },
  getFuneralCompany: async (req, res) => {
    try {
      const { userId, id } = req.query;
      let query = supabaseAdmin.from('companypages').select('*, user:users(id, name, email, city, secondaryCity, company, region)').eq('type', 'FUNERAL').limit(1);
      if (id) query = query.eq('id', id);
      if (userId) query = query.eq('userId', userId);
      const { data: company } = await query.single();
      if (!company) return res.status(httpStatus.NOT_FOUND).json({ message: 'No Company Found' });

      const companyId = company.id;
      const [{ data: faqs }, { data: cemeteries }] = await Promise.all([
        supabaseAdmin.from('faqs').select('*').eq('companyId', companyId),
        supabaseAdmin.from('cemetries').select('*').eq('companyId', companyId),
      ]);

      const companyData = { ...company, faqs: faqs || [], cemeteries: cemeteries || [] };
      res.status(httpStatus.OK).json({ message: 'success', company: companyData });
    } catch (error) {
      console.error('Error :', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Something went wrong' });
    }
  },
  getFloristCompany: async (req, res) => {
    try {
      const { userId, id } = req.query;
      let query = supabaseAdmin.from('companypages').select('*').eq('type', 'FLORIST').limit(1);
      if (id) query = query.eq('id', id);
      if (userId) query = query.eq('userId', userId);
      const { data: company } = await query.single();
      if (!company) return res.status(httpStatus.NOT_FOUND).json({ message: 'No Company Found' });

      const companyId = company.id;
      const [{ data: packages }, { data: slides }, { data: shops }] = await Promise.all([
        supabaseAdmin.from('packages').select('*').eq('companyId', companyId),
        supabaseAdmin.from('floristslides').select('*').eq('companyId', companyId),
        supabaseAdmin.from('floristshops').select('*').eq('companyId', companyId),
      ]);

      const companyData = { ...company, packages: packages || [], slides: slides || [], shops: shops || [] };

      res.status(httpStatus.OK).json({ message: 'success', company: companyData });
    } catch (error) {
      console.error('Error :', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Something went wrong' });
    }
  },
  updateCompanyPage: async (req, res) => {
    try {
      const { id } = req.params;
      const { data: company, error: compErr } = await supabaseAdmin.from('companypages').select('*').eq('id', id).single();
      if (compErr || !company) return res.status(httpStatus.NOT_FOUND).json({ error: 'Company not found' });

      const updateData = { ...req.body };
      const companyFolder = path.join(COMPANY_UPLOADS_PATH, String(company.id));
      if (!fs.existsSync(companyFolder)) fs.mkdirSync(companyFolder, { recursive: true });

      const fileFields = [
        {
          field: "background",
          resize: resizeConstants.funeralBackgroundSize,
          avifOptions: {
            quality: 60,
            effort: 5,
            chromaSubsampling: "4:4:4",
          },
        },
        {
          field: "logo",
          resize: {
            width: 200,
            height: 80,
            fit: "contain",
            background: { r: 255, g: 255, b: 255, alpha: 0 },
          },
        },
        { field: "secondary_image", resize: [195, 267] },
        { field: "funeral_section_one_image_one", resize: [195, 267] },
        { field: "funeral_section_one_image_two", resize: [195, 267] },
        { field: "offer_one_image", resize: resizeConstants.offerImageOptions },
        { field: "offer_two_image", resize: resizeConstants.offerImageOptions },
        { field: "offer_three_image", resize: resizeConstants.offerImageOptions },
        { field: "boxBackgroundImage", resize: [1280, 420] },
        {
          field: "picture",
          resize: {
            width: 195,
            height: 267,
            fit: "cover",
          },
          avifOptions: {
            quality: 50
          }
        }

      ];

      for (const fileField of fileFields) {
        const file = req.files?.[fileField.field]?.[0];
        if (file) {
          const optimizedPath = path.join(
            "companyUploads",
            String(company.id),
            `${fileField.field}.avif`
          );

          await sharpHelpers.processImageToAvif({
            buffer: file.buffer,
            outputPath: path.join(__dirname, "../", optimizedPath),
            resize: fileField.resize,
            ...(fileField.avifOptions || {}),
          });

          if (fileField.field === "picture") {
            updateData.logo = optimizedPath;
          } else {
            updateData[fileField.field] = optimizedPath;
          }
        } else if (req.body[fileField.field]) {
          updateData[fileField.field] = req.body[fileField.field];
        }
      }

      updateData.modifiedTimestamp = new Date();
      const { data: updated } = await supabaseAdmin.from('companypages').update(updateData).eq('id', company.id).select().single();

      const companyType = updated.type;
      const companyId = updated.id;
      let extras = {};
      if (companyType === 'FUNERAL') {
        const [{ data: faqs }, { data: cemeteries }] = await Promise.all([
          supabaseAdmin.from('faqs').select('*').eq('companyId', companyId),
          supabaseAdmin.from('cemetries').select('*').eq('companyId', companyId),
        ]);
        extras = { faqs: faqs || [], cemeteries: cemeteries || [] };
      } else if (companyType === 'FLORIST') {
        const [{ data: packages }, { data: slides }, { data: shops }] = await Promise.all([
          supabaseAdmin.from('packages').select('*').eq('companyId', companyId),
          supabaseAdmin.from('floristslides').select('*').eq('companyId', companyId),
          supabaseAdmin.from('floristshops').select('*').eq('companyId', companyId),
        ]);
        extras = { packages: packages || [], slides: slides || [], shops: shops || [] };
      }

      res.status(httpStatus.OK).json({ message: 'Company page updated successfully', company: { ...updated, ...extras } });
    } catch (error) {
      console.error('Update Error:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Something went wrong' });
    }
  },

  getFullCompanyDetails: async (req, res) => {
    try {
      const userId = req.profile?.id;
      const { type } = req.query;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const { data: user } = await supabaseAdmin
        .from('users')
        .select('id, name, email, city, secondaryCity, company')
        .eq('id', userId)
        .single();
      if (!user) return res.status(404).json({ message: 'User not found' });

      const { data: companies } = await supabaseAdmin.from('companypages').select('*').eq('userId', userId);
      let extras = {};
      if (type === 'FLORIST') {
        const ids = (companies || []).filter(c => c.type === 'FLORIST').map(c => c.id);
        const { data: shops } = await supabaseAdmin.from('floristshops').select('*').in('companyId', ids);
        extras = { companies, shops };
      } else if (type === 'FUNERAL') {
        const ids = (companies || []).filter(c => c.type === 'FUNERAL').map(c => c.id);
        const { data: cemetries } = await supabaseAdmin.from('cemetries').select('*').in('companyId', ids);
        extras = { companies, cemetries };
      } else {
        extras = { companies };
      }

      return res.status(200).json({ message: 'success', user, ...extras });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Something went wrong' });
    }
  },

  getCompanies: async (req, res) => {
    try {
      const { type, region, city } = req.query;

      // Fetch users matching filters
      let userQuery = supabaseAdmin
        .from('users')
        .select('id, name, email, city, region, secondaryCity, sendMobilePermission, sendGiftsPermission, assignKeeperPermission, createObituaryPermission, createdTimestamp');
      if (region) userQuery = userQuery.eq('region', region);
      if (city) userQuery = userQuery.eq('city', city);
      const { data: users } = await userQuery;

      if (!users || users.length === 0) {
        return res.status(404).json({ message: 'No Company Found', companies: [] });
      }

      // Fetch company pages for these users filtered by type
      const userIds = users.map(u => u.id);
      let companyQuery = supabaseAdmin.from('companypages').select('*').in('userId', userIds);
      if (type) companyQuery = companyQuery.eq('type', type);
      const { data: companies } = await companyQuery;

      // Merge data: attach company pages to their users
      const companiesByUser = (companies || []).reduce((acc, c) => {
        (acc[c.userId] = acc[c.userId] || []).push(c);
        return acc;
      }, {});

      // If funeral type, compute obituary counts
      let obituaryCounts = {};
      if (type === 'FUNERAL' && companies && companies.length > 0) {
        const funeralUserIds = [...new Set(companies.filter(c => c.type === 'FUNERAL').map(c => c.userId))];
        if (funeralUserIds.length > 0) {
          let obitQuery = supabaseAdmin.from('obituaries').select('id, userId, region');
          if (region) obitQuery = obitQuery.eq('region', region);
          const { data: obits } = await obitQuery;
          const grouped = (obits || []).reduce((acc, o) => {
            acc[o.userId] = acc[o.userId] || { total: 0, region: 0 };
            acc[o.userId].total += 1;
            if (!region || o.region === region) acc[o.userId].region += 1;
            return acc;
          }, {});
          obituaryCounts = grouped;
        }
      }

      const result = users.map(u => {
        const userCompanies = companiesByUser[u.id] || [];
        const base = { ...u, CompanyPages: userCompanies };
        if (type === 'FUNERAL') {
          const counts = obituaryCounts[u.id] || { total: 0, region: 0 };
          return { ...base, totalObituaryCount: counts.total, regionObituaryCount: counts.region };
        }
        return base;
      });

      return res.status(200).json({ message: 'success', companies: result });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Something went wrong' });
    }
  }
};

module.exports = companyController;
