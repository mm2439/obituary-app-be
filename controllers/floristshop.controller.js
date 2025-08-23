const { supabaseAdmin } = require("../config/supabase");

const florsitShopController = {
  addFloristShop: async (req, res) => {
    try {
      const { shops, userId } = req.body;
      const userIdToUse = userId || req.profile?.id;
      const city = req.profile?.city || null;
      if (!userIdToUse) return res.status(401).json({ message: 'Unauthorized' });

      // Convert UUID to integer for legacy table compatibility (use smaller hash to avoid overflow)
      const userIntId = Math.abs(userIdToUse.replace(/-/g, '').substring(0, 6).split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a; // Convert to 32bit integer
      }, 0)) % 2147483647;

      // Find or create company page for this user
      let { data: company } = await supabaseAdmin
        .from('companypages')
        .select('*')
        .eq('userId', userIntId)
        .single();

      if (!company) {
        const { data: createdCompany, error: createError } = await supabaseAdmin
          .from('companypages')
          .insert({
            userId: userIntId,
            type: 'FLORIST',
            name: shops?.[0]?.shopName || 'Default Florist'
          })
          .select()
          .single();

        if (createError || !createdCompany) {
          console.error('Error creating company:', createError);
          return res.status(500).json({
            message: 'Failed to create company page',
            error: createError?.message
          });
        }
        company = createdCompany;
      }

      if (!company || !company.id) {
        return res.status(500).json({
          message: 'Failed to get or create company page'
        });
      }

      const companyId = company.id;

      for (let i = 0; i < shops.length; i++) {
        const { id, updated, shopName, address, hours, email, telephone, secondaryHours, tertiaryHours, quaternaryHours } = shops[i];

        if (id && updated) {
          await supabaseAdmin
            .from('floristshops')
            .update({
              shopName,
              address,
              hours,
              email,
              telephone,
              secondaryHours,
              tertiaryHours,
              quaternaryHours,
              city
            })
            .eq('id', id);
          continue;
        }
        if (id && !updated) continue;

        await supabaseAdmin
          .from('floristshops')
          .insert({
            companyId,
            shopName,
            address,
            hours,
            email,
            telephone,
            secondaryHours,
            tertiaryHours,
            quaternaryHours,
            city
          });
      }

      const { data: allShops } = await supabaseAdmin.from('floristshops').select('*').eq('companyId', companyId);

      return res.status(201).json({ message: 'Shops processed successfully.', shops: allShops || [] });
    } catch (error) {
      console.error('Error processing shops:', error);
      return res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
  },

  getFloristShops: async (req, res) => {
    try {
      const { city, companyId, userId } = req.query;

      const filter = {};
      if (city) filter.city = city;
      let cid = companyId;

      if (userId) {
        const userIntId = Math.abs(userId.replace(/-/g, '').substring(0, 6).split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a; // Convert to 32bit integer
        }, 0)) % 2147483647;
        const { data: company } = await supabaseAdmin.from('companypages').select('id').eq('userId', userIntId).single();
        if (company) cid = company.id; else return res.status(404).json({ message: 'No company found for this user.', shops: [] });
      }
      let query = supabaseAdmin.from('floristshops').select('*, company:companypages(id, name, type, userId)');
      if (cid) query = query.eq('companyId', cid);
      if (filter.city) query = query.eq('city', filter.city);

      const { data: shops } = await query;

      return res.status(200).json({ message: 'Florist shops fetched successfully.', shops: shops || [] });
    } catch (error) {
      console.error('Error fetching florist shops:', error);
      return res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
  },
};

module.exports = florsitShopController;
