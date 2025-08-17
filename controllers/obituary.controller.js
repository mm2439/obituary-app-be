const httpStatus = require("http-status-codes").StatusCodes;
const moment = require("moment");
const { supabaseAdmin } = require("../config/supabase");
const { uploadToSupabase } = require("../config/upload-supabase");
const visitController = require("./visit.controller");

const slugKeyFilter = (name) => {
  return name
    .split("")
    .map((char) => {
      if (char.toLowerCase() === "š") return "s";
      if (char.toLowerCase() === "č") return "c";
      if (char.toLowerCase() === "ć") return "c";
      if (char.toLowerCase() === "ž") return "z";
      if (char.toLowerCase() === "đ") return "dj";
      return char;
    })
    .join("");
};
const obituaryController = {
  createObituary: async (req, res) => {
    try {
      const {
        name,
        sirName,
        location,
        region,
        city,
        gender = 'Male',
        birthDate,
        deathDate,
        funeralLocation,
        funeralCemetery,
        funeralTimestamp,
        events,
        deathReportExists = true,
        obituary,
        symbol,
        verse,
        slugKey: providedSlugKey,
      } = req.body;

      if (!name || !sirName || !location || !region || !city || !birthDate || !deathDate || !obituary) {
        return res.status(httpStatus.BAD_REQUEST).json({ error: "Missing required fields" });
      }

      const userId = req.profile?.id;
      if (!userId) {
        return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthorized' });
      }

      // Generate slugKey if not provided
      let slugKey = providedSlugKey;
      if (!slugKey) {
        const formatDate = (date) => {
          const d = new Date(date);
          const day = String(d.getDate()).padStart(2, "0");
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const year = String(d.getFullYear()).slice(-2);
          return `${day}${month}${year}`;
        };
        const cleanFirstName = slugKeyFilter(name);
        const cleanSirName = slugKeyFilter(sirName);
        slugKey = `${cleanFirstName}_${cleanSirName}_${formatDate(deathDate)}`.replace(/\s+/g, "_");
      }

      // Ensure slugKey is unique
      let uniqueSlugKey = slugKey;
      let counter = 1;
      while (true) {
        const { data: existing, error } = await supabaseAdmin
          .from('obituaries')
          .select('id')
          .eq('slugKey', uniqueSlugKey)
          .limit(1);
        if (!error && (!existing || existing.length === 0)) break;
        uniqueSlugKey = `${slugKey}_${counter++}`;
      }
      slugKey = uniqueSlugKey;

      // Check duplicate by name, sirName, deathDate
      const { data: dup, error: dupErr } = await supabaseAdmin
        .from('obituaries')
        .select('id')
        .eq('name', name)
        .eq('sirName', sirName)
        .eq('deathDate', deathDate)
        .limit(1);
      if (!dupErr && dup && dup.length > 0) {
        return res.status(httpStatus.CONFLICT).json({ error: 'An obituary with the same name and death date already exists.' });
      }

      // Upload files
      let picturePath = null;
      let deathReportPath = null;
      if (req.files?.picture) {
        try {
          const pictureFile = req.files.picture[0];
          const upload = await uploadToSupabase(pictureFile, 'obituary-images', `obituary-${slugKey}`);
          picturePath = upload.publicUrl;
        } catch (e) { console.error('picture upload error', e); }
      }
      if (req.files?.deathReport) {
        try {
          const deathReportFile = req.files.deathReport[0];
          const upload = await uploadToSupabase(deathReportFile, 'private-documents', `death-reports/${slugKey}`);
          deathReportPath = upload.publicUrl;
        } catch (e) { console.error('death report upload error', e); }
      }

      const payload = {
        name,
        sirName,
        location,
        region,
        city,
        gender,
        birthDate,
        deathDate,
        image: picturePath,
        funeralLocation: funeralLocation || null,
        funeralCemetery: funeralCemetery && funeralCemetery !== '' ? parseInt(funeralCemetery) : null,
        funeralTimestamp: funeralTimestamp || null,
        events: events ? JSON.parse(events) : null,
        deathReportExists,
        deathReport: deathReportPath,
        obituary,
        symbol: symbol || null,
        verse: verse || null,
        userId,
        slugKey,
        totalCandles: 0,
        totalVisits: 0,
        currentWeekVisits: 0,
        lastWeeklyReset: new Date().toISOString(),
        createdTimestamp: new Date().toISOString(),
        modifiedTimestamp: new Date().toISOString(),
        isHidden: false,
        isMemoryBlocked: false,
        isDeleted: false
      };

      const { data: created, error: createErr } = await supabaseAdmin
        .from('obituaries')
        .insert(payload)
        .select()
        .single();

      if (createErr) {
        console.error('create obituary error', createErr);
        return res.status(500).json({ error: 'Failed to create obituary' });
      }

      return res.status(httpStatus.CREATED).json(created);
    } catch (err) {
      console.error("Error in createObituary:", err);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Failed to create obituary. Please try again." });
    }
  },
  // Get obituaries (Supabase) - keep response shape
  getObituary: async (req, res) => {
    try {
      const {
        id,
        userId,
        name,
        region,
        city,
        obituaryId,
        slugKey,
        date,
        days,
      } = req.query;

      // Build main query
      let query = supabaseAdmin
        .from('obituaries')
        .select(`
          *,
          "users"!inner(id, name, email, role, company),
          "cemetries"(id, name, address, city)
        `, { count: 'exact' })
        .order('createdTimestamp', { ascending: false });

      if (id) query = query.eq('id', parseInt(id));
      if (userId) query = query.eq('userId', parseInt(userId));
      if (obituaryId) query = query.eq('id', parseInt(obituaryId));
      if (slugKey) query = query.eq('slugKey', slugKey);

      if (date) {
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate); startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date(targetDate); endOfDay.setHours(23,59,59,999);
        query = query.gte('createdTimestamp', startOfDay.toISOString())
                     .lte('createdTimestamp', endOfDay.toISOString());
      }

      if (name) {
        // match either first or sirName
        query = query.or(`name.ilike.%${name}%,sirName.ilike.%${name}%`);
      }

      if (city) query = query.eq('city', city);
      else if (region) query = query.eq('region', region);

      const { data: obits, error, count } = await query;
      if (error) {
        console.error('getObituary query error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
      }

      // Funeral count for today in same city (if provided)
      const today = new Date(); today.setHours(0,0,0,0);
      const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1); tomorrow.setHours(23,59,59,999);

      let funeralQuery = supabaseAdmin
        .from('obituaries')
        .select('id', { count: 'exact' })
        .gte('funeralTimestamp', today.toISOString())
        .lte('funeralTimestamp', tomorrow.toISOString());
      if (city) funeralQuery = funeralQuery.eq('funeralLocation', city);

      const { count: funeralCount } = await funeralQuery;

      res.status(httpStatus.OK).json({
        total: count || (obits ? obits.length : 0),
        obituaries: obits || [],
        funeralCount: funeralCount || 0,
      });
    } catch (error) {
      console.error('getObituary error:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  // Get memory page using Supabase, keep response shape { obituary }
  getMemory: async (req, res) => {
    try {
      const { id, slugKey } = req.query;

      // Find obituary id first
      let lookup = supabaseAdmin.from('obituaries').select('id').limit(1);
      if (id) lookup = lookup.eq('id', parseInt(id));
      else if (slugKey) lookup = lookup.eq('slugKey', slugKey);

      const { data: base, error: baseErr } = await lookup.single();
      if (baseErr || !base) {
        return res.status(httpStatus.NOT_FOUND).json({ error: 'Memory not found' });
      }

      const obituaryId = base.id;

      // Fetch obituary with related
      const { data: obituary, error: obitErr } = await supabaseAdmin
        .from('obituaries')
        .select(`
          *,
          "users"!inner(*),
          "cemetries"(*),
          Keepers: "keepers"(*),
          SorrowBooks: "sorrowBooks"(*),
          Dedications: "dedications"(*),
          Photos: "photos"(*),
          Condolences: "condolences"(*)
        `)
        .eq('id', obituaryId)
        .eq('isDeleted', false)
        .single();

      if (obitErr || !obituary) {
        return res.status(httpStatus.NOT_FOUND).json({ error: 'Memory not found' });
      }

      // Filter approved where needed
      obituary.Dedications = (obituary.Dedications || []).filter(d => d.status === 'approved');
      obituary.Photos = (obituary.Photos || []).filter(p => p.status === 'approved');
      obituary.Condolences = (obituary.Condolences || []).filter(c => c.status === 'approved');

      // Candle aggregates
      const [{ data: candlesAll }, { data: myCandles }] = await Promise.all([
        supabaseAdmin.from('"candles"').select('id, createdTimestamp').eq('obituaryId', obituaryId).order('createdTimestamp', { ascending: false }),
        supabaseAdmin.from('"candles"').select('createdTimestamp').eq('obituaryId', obituaryId).order('createdTimestamp', { ascending: false }).limit(1)
      ]);

      obituary.candles = {
        totalCandles: (candlesAll || []).length,
        lastBurnedCandleId: candlesAll && candlesAll[0] ? candlesAll[0].id : null,
        lastBurnedCandleTime: candlesAll && candlesAll[0] ? candlesAll[0].createdTimestamp : null,
        myLastBurntCandleTime: myCandles && myCandles[0] ? myCandles[0].createdTimestamp : null
      };

      return res.status(httpStatus.OK).json({ obituary });
    } catch (e) {
      console.error('getMemory error:', e);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch memory' });
    }
  },

  getMemories: async (req, res) => {
    try {
      const userId = req.profile?.id;

      const ip = req.headers["x-forwarded-for"]?.split(",")[0]
        || req.connection.remoteAddress
        || req.socket.remoteAddress
        || req.ip;
      const ipAddress = (ip && ip.includes("::ffff:")) ? ip.split("::ffff:")[1] : ip;

      if (!userId) {
        return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthorized' });
      }

      // 1) Keeper obituaries for this user
      const { data: keeperRows, error: keeperErr } = await supabaseAdmin
        .from('"keepers"')
        .select('obituaryId, userId')
        .eq('userId', userId);

      if (keeperErr) {
        console.error('keepers query error:', keeperErr);
        return res.status(500).json({ error: 'Failed to fetch keepers' });
      }

      const keeperObitIds = new Set((keeperRows || []).map(k => k.obituaryId));

      // 2) Memory logs by this user (exclude candle, visit)
      const { data: myLogs, error: logsErr } = await supabaseAdmin
        .from('"memorylogs"')
        .select('obituaryId, type, status, userId')
        .eq('userId', userId)
        .neq('type', 'candle')
        .neq('type', 'visit')
        .eq('status', 'approved');

      if (logsErr) {
        console.error('memorylogs query error:', logsErr);
        return res.status(500).json({ error: 'Failed to fetch memory logs' });
      }

      const logObitIds = new Set((myLogs || []).map(l => l.obituaryId));

      // Union of obituary IDs
      const allObitIds = Array.from(new Set([...keeperObitIds, ...logObitIds]));
      if (allObitIds.length === 0) {
        return res.status(httpStatus.OK).json({ finalObituaries: [] });
      }

      // 3) Fetch selected fields from obituaries
      const { data: obits, error: obitsErr } = await supabaseAdmin
        .from('obituaries')
        .select('id, name, sirName, deathDate, city, birthDate, funeralTimestamp, totalVisits')
        .in('id', allObitIds)
        .order('createdTimestamp', { ascending: false });

      if (obitsErr) {
        console.error('obituaries query error:', obitsErr);
        return res.status(500).json({ error: 'Failed to fetch obituaries' });
      }

      // 4) Fetch visits for these obituaries by this user/ip
      const { data: visits, error: visitsErr } = await supabaseAdmin
        .from('"visits"')
        .select('id, obituaryId, createdTimestamp')
        .in('obituaryId', allObitIds)
        .or(`userId.eq.${userId},ipAddress.eq.${ipAddress || ''}`)
        .order('createdTimestamp', { ascending: false });

      if (visitsErr) {
        console.error('visits query error:', visitsErr);
      }

      // 5) Fetch candles for these obituaries by this user/ip
      const { data: candles, error: candlesErr } = await supabaseAdmin
        .from('"candles"')
        .select('id, obituaryId, createdTimestamp')
        .in('obituaryId', allObitIds)
        .or(`userId.eq.${userId},ipAddress.eq.${ipAddress || ''}`)
        .order('createdTimestamp', { ascending: false });

      if (candlesErr) {
        console.error('candles query error:', candlesErr);
      }

      // Group visits/candles by obituary
      const visitsByObit = new Map();
      (visits || []).forEach(v => {
        if (!visitsByObit.has(v.obituaryId)) visitsByObit.set(v.obituaryId, []);
        visitsByObit.get(v.obituaryId).push(v);
      });

      const candlesByObit = new Map();
      (candles || []).forEach(c => {
        if (!candlesByObit.has(c.obituaryId)) candlesByObit.set(c.obituaryId, []);
        candlesByObit.get(c.obituaryId).push(c);
      });

      const keeperSet = new Set((keeperRows || []).map(k => k.obituaryId));

      const finalObituaries = (obits || []).map(o => {
        const oVisits = visitsByObit.get(o.id) || [];
        const oCandles = candlesByObit.get(o.id) || [];
        return {
          ...o,
          isKeeper: keeperSet.has(o.id),
          totalVisits: oVisits.length,
          lastVisit: oVisits[0]?.createdTimestamp || null,
          totalCandles: oCandles.length,
          lastCandleBurnt: oCandles[0]?.createdTimestamp || null,
        };
      });

      return res.status(httpStatus.OK).json({ finalObituaries });
    } catch (e) {
      console.error('getMemories error:', e);
      return res.status(500).json({ error: 'Failed to fetch memories' });
    }
  },

  getFunerals: async (req, res) => {
    try {
      const { id, startDate, endDate, region, city, limit = 50, offset = 0 } = req.query;

      let query = supabaseAdmin
        .from('obituaries')
        .select(`
          *,
          "users"!inner(id, name, email)
        `)
        .order('funeralTimestamp', { ascending: true });

      if (id) query = query.eq('id', parseInt(id));
      if (region) query = query.eq('region', region);
      if (city) query = query.eq('city', city);

      if (startDate && endDate) {
        const startOfDay = new Date(startDate); startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date(endDate); endOfDay.setHours(23,59,59,999);
        query = query.gte('funeralTimestamp', startOfDay.toISOString())
                     .lte('funeralTimestamp', endOfDay.toISOString());
      }

      // Exclude deleted
      query = query.eq('isDeleted', false);

      // Pagination
      query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      const { data, error } = await query;

      if (error) {
        console.error('getFunerals error:', error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ success: false, error: 'Failed to fetch funerals' });
      }

      res.status(httpStatus.OK).json({
        total: data.length,
        obituaries: data
      });
    } catch (e) {
      console.error('getFunerals exception:', e);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ success: false, error: 'Internal Server Error' });
    }
  },

  updateObituary: async (req, res) => {
    try {
      const obituaryId = parseInt(req.params.id);
      const userId = req.profile?.id;
      if (!userId) {
        return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthorized' });
      }

      // Fetch existing obituary
      const { data: existingObituary, error: fetchError } = await supabaseAdmin
        .from('obituaries')
        .select('*')
        .eq('id', obituaryId)
        .eq('userId', userId)
        .single();

      if (fetchError || !existingObituary) {
        return res.status(httpStatus.NOT_FOUND).json({ error: 'Obituary not found/Only Owner can update' });
      }

      const fieldsToUpdate = {};
      const {
        name,
        sirName,
        location,
        region,
        city,
        gender,
        birthDate,
        deathDate,
        funeralLocation,
        funeralCemetery,
        funeralTimestamp,
        events,
        deathReportExists,
        obituary,
        symbol,
        verse
      } = req.body;

      if (name !== undefined) fieldsToUpdate.name = name;
      if (sirName !== undefined) fieldsToUpdate.sirName = sirName;
      if (location !== undefined) fieldsToUpdate.location = location;
      if (region !== undefined) fieldsToUpdate.region = region;
      if (city !== undefined) fieldsToUpdate.city = city;
      if (gender !== undefined) fieldsToUpdate.gender = gender;
      if (birthDate !== undefined) fieldsToUpdate.birthDate = birthDate;
      if (deathDate !== undefined) fieldsToUpdate.deathDate = deathDate;
      if (funeralLocation !== undefined) fieldsToUpdate.funeralLocation = funeralLocation;
      if (funeralCemetery !== undefined) fieldsToUpdate.funeralCemetery = funeralCemetery === '' ? null : parseInt(funeralCemetery);
      if (funeralTimestamp !== undefined) fieldsToUpdate.funeralTimestamp = funeralTimestamp;
      if (verse !== undefined) fieldsToUpdate.verse = verse;
      if (events !== undefined) { try { fieldsToUpdate.events = JSON.parse(events); } catch(_) {} }
      if (deathReportExists !== undefined) fieldsToUpdate.deathReportExists = deathReportExists;
      if (obituary !== undefined) fieldsToUpdate.obituary = obituary;
      if (symbol !== undefined) fieldsToUpdate.symbol = symbol;

      // Handle file uploads
      if (req.files?.picture) {
        try {
          const pictureFile = req.files.picture[0];
          const upload = await uploadToSupabase(pictureFile, 'obituary-images', `obituary-${existingObituary.slugKey}`);
          fieldsToUpdate.image = upload.publicUrl;
        } catch (e) { console.error('picture upload failed', e); }
      }

      if (req.files?.deathReport) {
        try {
          const deathReportFile = req.files.deathReport[0];
          const upload = await uploadToSupabase(deathReportFile, 'private-documents', `death-reports/${existingObituary.slugKey}`);
          fieldsToUpdate.deathReport = upload.publicUrl; // if private, switch to signed URLs
        } catch (e) { console.error('death report upload failed', e); }
      }

      fieldsToUpdate.modifiedTimestamp = new Date().toISOString();

      const { data: updated, error: updateError } = await supabaseAdmin
        .from('obituaries')
        .update(fieldsToUpdate)
        .eq('id', obituaryId)
        .eq('userId', userId)
        .select()
        .single();

      if (updateError) {
        console.error('updateObituary error:', updateError);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Failed to update obituary' });
      }

      return res.status(httpStatus.OK).json(updated);
    } catch (error) {
      console.error('updateObituary exception:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
  },

  updateVisitCounts: async (req, res) => {
    try {
      const { id: obituaryIdParam } = req.params;
      const obituaryId = parseInt(obituaryIdParam);

      const ip = req.headers["x-forwarded-for"]?.split(",")[0]
        || req.connection.remoteAddress
        || req.socket.remoteAddress
        || req.ip;
      const ipAddress = (ip && ip.includes("::ffff:")) ? ip.split("::ffff:")[1] : ip;
      const currentTimestamp = new Date();

      // Fetch obituary with related minimal fields
      const { data: obituary, error: obitErr } = await supabaseAdmin
        .from('obituaries')
        .select('id, userId, city, totalVisits, currentWeekVisits, lastWeeklyReset')
        .eq('id', obituaryId)
        .single();

      if (obitErr || !obituary) {
        return res.status(httpStatus.NOT_FOUND).json({ error: 'Obituary not found' });
      }

      // Candle aggregates
      const [{ data: candleCount }, { data: lastCandle }] = await Promise.all([
        supabaseAdmin.from('"candles"').select('id', { count: 'exact', head: true }).eq('obituaryId', obituaryId),
        supabaseAdmin.from('"candles"').select('id, createdTimestamp').eq('obituaryId', obituaryId).order('createdTimestamp', { ascending: false }).limit(1)
      ]);

      // Weekly reset logic
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7));
      startOfWeek.setHours(0, 0, 0, 0);

      const shouldResetWeek = !obituary.lastWeeklyReset || new Date(obituary.lastWeeklyReset) < startOfWeek;

      const updates = {
        totalVisits: (obituary.totalVisits || 0) + 1,
        currentWeekVisits: shouldResetWeek ? 1 : (obituary.currentWeekVisits || 0) + 1,
        lastWeeklyReset: shouldResetWeek ? currentTimestamp.toISOString() : obituary.lastWeeklyReset
      };

      const { error: updErr } = await supabaseAdmin
        .from('obituaries')
        .update(updates)
        .eq('id', obituaryId);

      // Track visit record (using your existing controller method)
      await visitController.visitMemory(1, ipAddress, obituaryId);

      // Attach extra fields in response (matching old shape)
      const response = {
        ...obituary,
        ...updates,
        candles: {
          totalCandles: candleCount || 0,
          lastBurnedCandleId: lastCandle?.[0]?.id || null,
          lastBurnedCandleTime: lastCandle?.[0]?.createdTimestamp || null
        }
      };

      return res.status(httpStatus.OK).json(response);
    } catch (error) {
      console.error('updateVisitCounts error:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'An error occurred while updating visit counts' });
    }
  },

  getPendingData: async (req, res) => {
    try {
      const userId = req.profile?.id;
      if (!userId) return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthorized' });

      const { data: keepers, error: keepersErr } = await supabaseAdmin
        .from('"keepers"')
        .select('obituaryId')
        .eq('userId', userId);

      if (keepersErr) {
        console.error('keepers error:', keepersErr);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch keepers' });
      }

      if (!keepers || keepers.length === 0) {
        return res.status(httpStatus.OK).json({ pending: [], others: [] });
      }

      const obituaryIds = keepers.map(k => k.obituaryId);

      const { data: interactions, error: logsErr } = await supabaseAdmin
        .from('"memorylogs"')
        .select('id, interactionId, type, status, createdTimestamp, userName, typeInSL, obituaryId')
        .in('obituaryId', obituaryIds)
        .in('type', ['photo', 'condolence', 'dedication'])
        .order('createdTimestamp', { ascending: false });

      if (logsErr) {
        console.error('memorylogs error:', logsErr);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch interactions' });
      }

      // fetch obituary names map
      const { data: obits } = await supabaseAdmin
        .from('obituaries')
        .select('id, name, sirName')
        .in('id', obituaryIds);
      const obitMap = new Map((obits || []).map(o => [o.id, { name: o.name, sirName: o.sirName }]));

      const result = { pending: [], others: [], isKeeper: true };
      (interactions || []).forEach(item => {
        const decorated = {
          ...item,
          Obituary: obitMap.get(item.obituaryId) || null
        };
        if (item.status === 'pending') result.pending.push(decorated);
        else result.others.push(decorated);
      });

      res.status(httpStatus.OK).json(result);
    } catch (error) {
      console.error('getPendingData error:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch interactions' });
    }
  },

  getKeeperObituaries: async (req, res) => {
    try {
      const userId = req.profile?.id;
      if (!userId) return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthorized' });

      const { data: keeperRows, error: keeperErr } = await supabaseAdmin
        .from('"keepers"')
        .select('obituaryId, expiry')
        .eq('userId', userId);

      if (keeperErr) {
        console.error('keepers error:', keeperErr);
        return res.status(500).json({ message: 'Failed to fetch obituaries.' });
      }

      const obituaryIds = (keeperRows || []).map(k => k.obituaryId);
      if (obituaryIds.length === 0) {
        return res.status(httpStatus.OK).json({ obituaries: [], keeperObituaries: [] });
      }

      const { data: obits, error: obitsErr } = await supabaseAdmin
        .from('obituaries')
        .select('*, totalVisits, createdTimestamp')
        .in('id', obituaryIds)
        .order('createdTimestamp', { ascending: false });

      if (obitsErr) {
        console.error('obituaries error:', obitsErr);
        return res.status(500).json({ message: 'Failed to fetch obituaries.' });
      }

      // Fetch memory logs counts per obituary (excluding candle, visit)
      const { data: logs } = await supabaseAdmin
        .from('"memorylogs"')
        .select('id, obituaryId, type, status')
        .in('obituaryId', obituaryIds)
        .neq('type', 'candle')
        .neq('type', 'visit')
        .eq('status', 'approved');

      const logsByObit = new Map();
      (logs || []).forEach(l => {
        if (!logsByObit.has(l.obituaryId)) logsByObit.set(l.obituaryId, []);
        logsByObit.get(l.obituaryId).push(l);
      });

      const response = (obits || []).map(o => {
        const mems = logsByObit.get(o.id) || [];
        return {
          ...o,
          MemoryLogs: mems,
        };
      });

      return res.status(httpStatus.OK).json({ obituaries: response, keeperObituaries: keeperRows });
    } catch (error) {
      console.error('getKeeperObituaries error:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to fetch obituaries.' });
    }
  },

  getMemoryLogs: async (req, res) => {
    try {
      const userId = req.profile?.id;
      if (!userId) return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthorized' });

      const ip = req.headers["x-forwarded-for"]?.split(",")[0]
        || req.connection.remoteAddress
        || req.socket.remoteAddress
        || req.ip;
      const ipAddress = (ip && ip.includes("::ffff:")) ? ip.split("::ffff:")[1] : ip;

      const { data: allLogs, error: logsErr } = await supabaseAdmin
        .from('"memorylogs"')
        .select('id, interactionId, type, status, createdTimestamp, userName, obituaryId')
        .eq('userId', userId)
        .in('type', ['dedication', 'photo', 'sorrowbook', 'condolence']);

      if (logsErr) {
        console.error('memorylogs fetch error:', logsErr);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch memory logs' });
      }

      const { count: candleCount } = await supabaseAdmin
        .from('"candles"')
        .select('id', { count: 'exact', head: true })
        .or(`userId.eq.${userId},ipAddress.eq.${ipAddress || ''}`);

      const { data: keepers } = await supabaseAdmin
        .from('"keepers"')
        .select('id')
        .eq('userId', userId);

      // Unique memory pages
      const memoryPagesSet = new Set();
      (allLogs || []).forEach((log) => {
        if (log.obituaryId) memoryPagesSet.add(log.obituaryId);
      });
      const memoryPagesCount = memoryPagesSet.size;

      // Deduplicate by interactionId
      const uniqueLogsMap = new Map();
      (allLogs || []).forEach((log) => {
        if (!uniqueLogsMap.has(log.interactionId)) uniqueLogsMap.set(log.interactionId, log);
      });
      const totalContributions = (allLogs || []).length;
      const latestLogs = Array.from(uniqueLogsMap.values());

      const approvedCounts = { dedication: 0, photo: 0, sorrowbook: 0, condolence: 0, candle: candleCount || 0 };
      (allLogs || []).forEach((log) => {
        if (log.status === 'approved' && Object.prototype.hasOwnProperty.call(approvedCounts, log.type)) {
          approvedCounts[log.type]++;
        }
      });

      res.status(httpStatus.OK).json({
        myAdministrator: (keepers || []).length,
        totalContributions,
        memoryPagesCount,
        approvedContributions: approvedCounts,
        logs: latestLogs,
      });
    } catch (error) {
      console.error('getMemoryLogs error:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch memory logs' });
    }
  },

  getMemoriesAdmin: async (_req, res) => {
    try {
      const { data: obituaries, error } = await supabaseAdmin
        .from('obituaries')
        .select('id, name, sirName, deathDate, city, birthDate, funeralTimestamp, totalVisits, createdTimestamp');
      if (error) {
        console.error('getMemoriesAdmin error:', error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' });
      }

      const { data: keepers } = await supabaseAdmin
        .from('"keepers"')
        .select('id, obituaryId');
      const { data: visits } = await supabaseAdmin
        .from('"visits"')
        .select('id, obituaryId, createdTimestamp');
      const { data: candles } = await supabaseAdmin
        .from('"candles"')
        .select('id, obituaryId, createdTimestamp');
      const { data: memlogs } = await supabaseAdmin
        .from('"memorylogs"')
        .select('id, obituaryId, userId, type, status')
        .neq('type', 'visit')
        .eq('status', 'approved');

      const keepersByObit = new Map();
      (keepers || []).forEach(k => {
        if (!keepersByObit.has(k.obituaryId)) keepersByObit.set(k.obituaryId, []);
        keepersByObit.get(k.obituaryId).push(k);
      });
      const visitsByObit = new Map();
      (visits || []).forEach(v => {
        if (!visitsByObit.has(v.obituaryId)) visitsByObit.set(v.obituaryId, []);
        visitsByObit.get(v.obituaryId).push(v);
      });
      const candlesByObit = new Map();
      (candles || []).forEach(c => {
        if (!candlesByObit.has(c.obituaryId)) candlesByObit.set(c.obituaryId, []);
        candlesByObit.get(c.obituaryId).push(c);
      });
      const logsByObit = new Map();
      (memlogs || []).forEach(m => {
        if (!logsByObit.has(m.obituaryId)) logsByObit.set(m.obituaryId, []);
        logsByObit.get(m.obituaryId).push(m);
      });

      const finalObituaries = (obituaries || []).map(o => {
        const v = visitsByObit.get(o.id) || [];
        const k = keepersByObit.get(o.id) || [];
        const ml = logsByObit.get(o.id) || [];
        const uniqueUsers = new Set(ml.map(m => m.userId));
        const totalSorrowBooks = ml.filter(m => m.type === 'sorrowbook').length;
        const totalCondolences = ml.filter(m => m.type === 'condolence').length;
        const totalPhotos = ml.filter(m => m.type === 'photo').length;
        const totalDedications = ml.filter(m => m.type === 'dedication').length;
        const c = candlesByObit.get(o.id) || [];

        return {
          ...o,
          hasKeeper: k.length > 0,
          totalVisits: v.length,
          totalContributions: ml.length,
          uniqueContribution: uniqueUsers.size,
          totalSorrowBooks,
          totalCondolences,
          totalCandles: c.length,
          totalPhotos,
          totalDedications,
        };
      });

      return res.status(httpStatus.OK).json({ finalObituaries });
    } catch (e) {
      console.error('getMemoriesAdmin exception:', e);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' });
    }
  },

  getCompanyObituaries: async (req, res) => {
    try {
      const userId = req.profile?.id;
      if (!userId) return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Unauthorized' });

      const { data: obits, error } = await supabaseAdmin
        .from('obituaries')
        .select('*, createdTimestamp')
        .eq('userId', userId)
        .order('createdTimestamp', { ascending: false });

      if (error) {
        console.error('getCompanyObituaries error:', error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' });
      }

      // Fetch keepers for these obits
      const ids = (obits || []).map(o => o.id);
      const { data: keeps } = await supabaseAdmin
        .from('"keepers"')
        .select('id, obituaryId')
        .in('obituaryId', ids);
      const keeperSet = new Set((keeps || []).map(k => k.obituaryId));

      const modifiedObituaries = (obits || []).map(o => ({ ...o, hasKeeper: keeperSet.has(o.id) }));

      function getTotal(entries) {
        const startOfTheMonth = moment().startOf("month");
        const endOfTheMonth = moment().endOf("month");
        const startOfLastMonth = moment().subtract(1, "month").startOf("month");
        const endOfLastMonth = moment().subtract(1, "month").endOf("month");
        let currentMonthCount = 0;
        let lastMonthCount = 0;
        (entries || []).forEach((entry) => {
          const createdDate = moment(entry.createdTimestamp);
          if (createdDate.isBetween(startOfTheMonth, endOfTheMonth, "day", "[]")) currentMonthCount++;
          else if (createdDate.isBetween(startOfLastMonth, endOfLastMonth, "day", "[]")) lastMonthCount++;
        });
        return { currentMonthCount, lastMonthCount };
      }

      res.status(httpStatus.OK).json({ obituaries: modifiedObituaries, data: getTotal(obits) });
    } catch (error) {
      console.log(error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error" });
    }
  },

  getCompanyMonthlyObituaries: async (req, res) => {
    try {
      const userId = req.profile?.id;
      if (!userId) return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Unauthorized' });

      const { data: obituaries, error } = await supabaseAdmin
        .from('obituaries')
        .select('*')
        .eq('userId', userId)
        .order('createdTimestamp', { ascending: false });

      if (error) {
        console.error('getCompanyMonthlyObituaries error:', error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' });
      }

      const { data: keepers } = await supabaseAdmin
        .from('"keepers"')
        .select('id, obituaryId')
        .eq('userId', userId);
      const keeperSet = new Set((keepers || []).map(k => k.obituaryId));

      const groupedByMonth = {};
      let totalObituaries = 0;
      let totalObituariesWithKeeper = 0;
      let totalWithPhotos = 0;
      let totalWithFunerals = 0;
      let totalComplete = 0;

      (obituaries || []).forEach((obituary) => {
        totalObituaries++;
        const month = moment(obituary.createdTimestamp).format("MMMM YYYY");

        if (!groupedByMonth[month]) {
          groupedByMonth[month] = {
            obituaries: [],
            stats: { imageCount: 0, funeralCount: 0, keeperCount: 0, completeObits: 0 },
          };
        }

        groupedByMonth[month].obituaries.push(obituary);
        if (obituary.image !== null) { groupedByMonth[month].stats.imageCount++; totalWithPhotos++; }
        if (obituary.funeralTimestamp) { groupedByMonth[month].stats.funeralCount++; totalWithFunerals++; }
        if (keeperSet.has(obituary.id)) { groupedByMonth[month].stats.keeperCount++; totalObituariesWithKeeper++; }
        if (obituary.image !== null && obituary.funeralTimestamp) { groupedByMonth[month].stats.completeObits++; totalComplete++; }
      });

      return res.status(200).json({
        totalObituaries,
        totalObituariesWithKeeper,
        totalWithPhotos,
        totalComplete,
        totalWithFunerals,
        obituaries: groupedByMonth,
      });
    } catch (error) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error" });
    }
  },

  getCompanyMemoryLogs: async (req, res) => {
    try {
      const userId = req.profile?.id;
      if (!userId) return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Unauthorized' });

      // Get obituaries for this company/user
      const { data: obits, error: obErr } = await supabaseAdmin
        .from('obituaries')
        .select('id')
        .eq('userId', userId);
      if (obErr) {
        console.error('getCompanyMemoryLogs obituaries error:', obErr);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' });
      }
      const ids = (obits || []).map(o => o.id);
      if (ids.length === 0) return res.status(httpStatus.OK).json({ logs: [], totalContirbutions: 0, approvedCounts: { dedication: 0, photo: 0, sorrowbook: 0, condolence: 0, other: 0 }, obitsTotalCount: 0 });

      const { data: logs, error } = await supabaseAdmin
        .from('"memorylogs"')
        .select('*')
        .in('type', ['dedication', 'photo', 'sorrowbook', 'condolence'])
        .in('obituaryId', ids)
        .order('createdTimestamp', { ascending: false });
      if (error) {
        console.error('getCompanyMemoryLogs logs error:', error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' });
      }

      let approvedCounts = { dedication: 0, photo: 0, sorrowbook: 0, condolence: 0 };
      (logs || []).forEach((log) => {
        if (log.status === 'approved' && Object.prototype.hasOwnProperty.call(approvedCounts, log.type)) {
          approvedCounts[log.type]++;
        }
      });

      const totalContirbutions = (logs || []).length;
      approvedCounts = { ...approvedCounts, other: approvedCounts.dedication + approvedCounts.photo };

      const memoryPagesSet = new Set();
      (logs || []).forEach((log) => { if (log.obituaryId) memoryPagesSet.add(log.obituaryId); });
      const obitsTotalCount = memoryPagesSet.size;

      return res.status(httpStatus.OK).json({ logs, totalContirbutions, approvedCounts, obitsTotalCount });
    } catch (error) {
      console.log(error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' });
    }
  },

  getMemoryId: async (req, res) => {
    try {
      const { date, city, type } = req.query;
      if (!date || !city || !type) return res.status(400).json({ message: 'Missing required fields.' });

      const op = type === 'previous' ? 'lt' : 'gt';
      let query = supabaseAdmin
        .from('obituaries')
        .select('id, createdTimestamp')
        .eq('city', city)
        .order('createdTimestamp', { ascending: type !== 'previous' });

      query = op === 'lt' ? query.lt('createdTimestamp', new Date(date).toISOString())
                          : query.gt('createdTimestamp', new Date(date).toISOString());

      const { data: row, error } = await query.limit(1).single();
      if (error || !row) {
        return res.status(404).json({ message: `No ${type} obituary found for the specified date and city.` });
      }
      return res.status(200).json(row);
    } catch (error) {
      console.error('getMemoryId error:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  },
  uploadTemplateCards: async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ message: 'Missing required fields.' });
      const { cardImages, cardPdfs } = req.files || {};
      if (!cardImages || !cardPdfs) return res.status(400).json({ message: 'Missing required fields.' });

      const newCardImages = cardImages.map((image) => dbUploadObituaryTemplateCardsPath(image?.filename));
      const newCardPdfs = cardPdfs.map((pdf) => dbUploadObituaryTemplateCardsPath(pdf?.filename));

      const { error } = await supabaseAdmin
        .from('obituaries')
        .update({ cardImages: newCardImages, cardPdfs: newCardPdfs })
        .eq('id', parseInt(id));

      if (error) {
        console.error('uploadTemplateCards error:', error);
        return res.status(500).json({ message: 'Failed to update template cards' });
      }

      return res.status(200).json({ message: 'Template cards uploaded successfully.' });
    } catch (error) {
      console.error('uploadTemplateCards exception:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },
};

module.exports = obituaryController;
