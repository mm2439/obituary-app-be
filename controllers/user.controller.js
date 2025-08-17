const httpStatus = require("http-status-codes").StatusCodes;
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { supabase, supabaseAdmin } = require("../config/supabase");
const { uploadToSupabase } = require("../config/upload-supabase");
const COMPANY_FOLDER_UPLOAD = path.join(__dirname, "../companyUploads");

const userController = {
  register: async (req, res) => {
    try {
      const { name, email, password, role, company, region, city } = req.body;
      if (!name || !email || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ error: 'Missing required fields' });
      }

      const { data: existing, error: existErr } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .limit(1);
      if (!existErr && existing && existing.length > 0) {
        return res.status(httpStatus.CONFLICT).json({ error: 'User already registered' });
      }

      const { data: signup, error: signErr } = await supabase.auth.signUp({
        email,
        password
      });
      if (signErr) {
        console.error('🔥 DETAILED Supabase signUp error:', {
          message: signErr.message,
          status: signErr.status,
          code: signErr.code,
          details: signErr.details,
          hint: signErr.hint,
          fullError: signErr
        });
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
          error: 'Failed to sign up user',
          supabaseError: signErr.message,
          errorCode: signErr.code,
          errorDetails: signErr.details
        });
      }

      const payload = {
        id: signup.user.id, // Use the auth user ID - FIXED VARIABLE NAME
        name: name, // Use 'name' to match your schema
        email,
        role: role || 'USER',
        company,
        region,
        city,
        "slugKey": email.split('@')[0] + '-' + Date.now(), // Match your schema
        "createdTimestamp": new Date().toISOString(),
        "modifiedTimestamp": new Date().toISOString()
      };
      const { data: newUser, error: insErr } = await supabaseAdmin
        .from('profiles')
        .insert(payload)
        .select()
        .single();
      if (insErr) {
        console.error('🔥 DETAILED Database insert error:', {
          message: insErr.message,
          code: insErr.code,
          details: insErr.details,
          hint: insErr.hint,
          table: 'users',
          payload: payload,
          fullError: insErr
        });
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
          error: 'Failed to create user profile',
          dbError: insErr.message,
          errorCode: insErr.code,
          errorDetails: insErr.details
        });
      }

      res.status(httpStatus.CREATED).json({ message: 'User registered successfully!', user: newUser });
    } catch (error) {
      console.error('Error in user registration:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Something went wrong. Please try again!' });
    }
  },

  getMyUser: async (req, res) => {
    const id = req.profile?.id;
    if (!id) return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthorized' });

    const { data: user, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !user) {
      return res.status(httpStatus.NOT_FOUND).json({ error: 'User not found' });
    }

    res.status(httpStatus.OK).json(user);
  },

  updateMyUser: async (req, res) => {
    try {
      const id = req.profile?.id;
      if (!id) return res.status(httpStatus.UNAUTHORIZED).json({ error: 'User not found' });

      const {
        email,
        company,
        region,
        city,
        secondaryCity,
        sendGiftsPermission,
        sendMobilePermission,
        createObitaryPermission,
        assignKeeperPermission,
      } = req.body;

      // Check email uniqueness if changing
      if (email) {
        const { data: existing } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('email', email)
          .neq('id', id)
          .limit(1);
        if (existing && existing.length > 0) {
          return res.status(httpStatus.CONFLICT).json({ error: 'Email is already in use' });
        }
      }

      const update = {};
      if (email !== undefined) update.email = email;
      if (company !== undefined) update.company = company;
      if (region !== undefined) update.region = region;
      if (city !== undefined) update.city = city;
      if (assignKeeperPermission !== undefined) update.assignKeeperPermission = assignKeeperPermission;
      if (sendGiftsPermission !== undefined) update.sendGiftsPermission = sendGiftsPermission;
      if (sendMobilePermission !== undefined) update.sendMobilePermission = sendMobilePermission;
      if (createObitaryPermission !== undefined) update.createObitaryPermission = createObitaryPermission;
      if (secondaryCity !== undefined) update.secondaryCity = secondaryCity;

      const { data: updated, error } = await supabaseAdmin
        .from('profiles')
        .update(update)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error('updateMyUser error:', error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Failed to update user' });
      }

      res.status(httpStatus.OK).json({ message: 'User updated successfully', updatedUser: updated });
    } catch (e) {
      console.error('updateMyUser exception:', e);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Failed to update user' });
    }
  },

  updateUser: async (req, res) => {
    try {
      const { id, userData } = req.body;
      if (!id || !userData) return res.status(400).json({ message: 'Invalid Data' });

      // Check existing
      const { data: existingUser, error: fetchErr } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      if (fetchErr || !existingUser) return res.status(404).json({ error: 'User not found' });

      if (userData.email && userData.email !== existingUser.email) {
        const { data: dup } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('email', userData.email)
          .neq('id', id)
          .limit(1);
        if (dup && dup.length > 0) return res.status(409).json({ error: 'Email is already in use' });
      }

      const keysToUpdate = [
        'email', 'company', 'region', 'city', 'secondaryCity',
        'createObituaryPermission', 'assignKeeperPermission', 'sendMobilePermission', 'sendGiftsPermission'
      ];
      const update = {};
      for (const key of keysToUpdate) {
        if (Object.prototype.hasOwnProperty.call(userData, key)) update[key] = userData[key];
      }

      const { data: updated, error } = await supabaseAdmin
        .from('users')
        .update(update)
        .eq('id', id)
        .select()
        .single();
      if (error) return res.status(500).json({ message: 'Server error' });

      return res.status(200).json({ message: 'User updated successfully', updatedUser: updated });
    } catch (error) {
      console.error('Update error:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
  deleteMyUser: async (req, res) => {
    const id = req.profile?.id;
    if (!id) return res.status(httpStatus.UNAUTHORIZED).json({ error: 'User not found' });

    const { error } = await supabaseAdmin.from('users').delete().eq('id', id);
    if (error) return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Failed to delete user' });

    res.status(httpStatus.OK).json({ message: 'User deleted successfully' });
  },

  updateSlugKey: async (req, res) => {
    const id = req.profile?.id;
    if (!id) return res.status(httpStatus.UNAUTHORIZED).json({ error: 'User not found' });

    const { slugKey } = req.body;
    if (!slugKey) return res.status(httpStatus.BAD_REQUEST).json({ error: 'Slug key is required' });

    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slugKey)) {
      return res.status(httpStatus.BAD_REQUEST).json({
        error: 'Invalid slug key format. Only lowercase letters, numbers, and hyphens are allowed.',
      });
    }

    const { data: dup } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('slugKey', slugKey)
      .neq('id', id)
      .limit(1);
    if (dup && dup.length > 0) {
      return res.status(httpStatus.CONFLICT).json({ error: 'This slug key is already taken. Please choose a different one.' });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('users')
      .update({ slugKey })
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Failed to update slugKey' });

    res.status(httpStatus.OK).json({ message: 'SlugKey updated successfully', updatedUser: updated });
  },

  updateUserAndCompanyPage: async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { address, website, email, name } = req.body;
      let logoPath = null;

      if (!userId) return res.status(400).json({ message: 'Bad Request' });

      const { data: userExists, error: userErr } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      if (userErr || !userExists) return res.status(404).json({ message: 'No Such User Found' });

      if (email || name) {
        const updates = {};
        if (email) updates.email = email;
        if (name) updates.name = name;
        await supabaseAdmin.from('"users"').update(updates).eq('id', userId);
      }

      const { data: companyPage, error: compErr } = await supabaseAdmin
        .from('companypages')
        .select('*')
        .eq('userId', userId)
        .single();

      if (compErr || !companyPage) {
        return res.status(200).json({ message: 'Could not update company related data' });
      }

      // optional local folder (legacy); but we will just generate and store file to local
      const companyFolder = path.join(COMPANY_FOLDER_UPLOAD, String(companyPage.id));
      if (!fs.existsSync(companyFolder)) {
        fs.mkdirSync(companyFolder, { recursive: true });
      }

      if (req.files?.picture) {
        const pictureFile = req.files.picture[0];
        const fileName = `${path.parse(pictureFile.originalname).name}.avif`;

        const localPath = path.join('companyUploads', String(companyPage.id), fileName);
        await sharp(pictureFile.buffer)
          .resize(195, 267, { fit: 'cover' })
          .toFormat('avif', { quality: 50 })
          .toFile(path.join(__dirname, '../', localPath));
        logoPath = `${localPath.replace(/\\/g, '/')}`;
      }

      const updateCompany = {};
      if (website) updateCompany.website = website;
      if (address) updateCompany.address = address;
      if (logoPath) updateCompany.logo = logoPath;

      const { data: updatedCompany } = await supabaseAdmin
        .from('companypages')
        .update(updateCompany)
        .eq('id', companyPage.id)
        .select()
        .single();

      return res.status(200).json({ message: 'Updated Successfully', user: userExists, company: updatedCompany });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  // Create superadmin endpoint
  createSuperadmin: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Only allow creating the specific superadmin account
      if (email !== "gamspob@yahoo.com" || password !== "trbovlj3:142o") {
        return res.status(403).json({ 
          error: "Unauthorized: Only specific superadmin credentials allowed" 
        });
      }

      // Check if superadmin already exists
      const existingSuperadmin = await User.findOne({ 
        where: { email: "gamspob@yahoo.com" } 
      });
      
      if (existingSuperadmin) {
        return res.status(409).json({ 
          error: "Superadmin account already exists" 
        });
      }

      // Create superadmin user
      const superadmin = await User.create({
        name: "Super Admin",
        email: "gamspob@yahoo.com",
        password: "trbovlj3:142o",
        role: "SUPERADMIN",
        createObituaryPermission: true,
        assignKeeperPermission: true,
        sendGiftsPermission: true,
        sendMobilePermission: true,
      });

      res.status(201).json({
        message: "Superadmin account created successfully",
        user: superadmin.toSafeObject()
      });
    } catch (error) {
      console.error("Error creating superadmin:", error);
      res.status(500).json({ 
        error: "Failed to create superadmin account" 
      });
    }
  },
};

module.exports = userController;
