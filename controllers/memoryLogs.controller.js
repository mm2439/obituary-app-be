const httpStatus = require("http-status-codes").StatusCodes;
const { supabaseAdmin } = require("../config/supabase");

const memoryLogsController = {
  createLog: async (
    type,
    obituaryId,
    userId,
    interactionId = null,
    status,
    name,
    typeInSl
  ) => {
    try {
      if (!type || !obituaryId || !userId || !status) {
        console.warn("Invalid data format: Missing required fields");
        return null;
      }

      const payload = {
        type,
        status,
        userId,
        obituaryId,
        interactionId: interactionId || null,
        userName: name || null,
        typeInSL: typeInSl,
        createdTimestamp: new Date().toISOString(),
      };

      const { data: log, error } = await supabaseAdmin
        .from('memorylogs')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('createLog error:', error);
        return null;
      }

      return log;
    } catch (error) {
      console.error("Error creating memory log:", error);
      throw new Error("Failed to create memory log");
    }
  },

  getLogsWithInteraction: async (req, res) => {
    try {
      const obituaryId = parseInt(req.params.id);

      const { data: memoryLogs, error } = await supabaseAdmin
        .from('memorylogs')
        .select('*')
        .eq('obituaryId', obituaryId);
      if (error) {
        console.error('getLogsWithInteraction error:', error);
        return res.status(500).json({ message: 'Failed to get memory logs' });
      }

      // Group logs by type and fetch related items in bulk
      const logsByType = {};
      (memoryLogs || []).forEach((log) => {
        if (!logsByType[log.type]) logsByType[log.type] = [];
        logsByType[log.type].push(log);
      });

      // Fetch related interaction data by type
      const interactionDataMap = {};
      if (logsByType['condolence']) {
        const ids = logsByType['condolence'].map((l) => l.interactionId);
        const { data } = await supabaseAdmin.from('condolences').select('*').in('id', ids);
        interactionDataMap['condolence'] = {};
        (data || []).forEach((d) => { interactionDataMap['condolence'][d.id] = d; });
      }
      if (logsByType['dedication']) {
        const ids = logsByType['dedication'].map((l) => l.interactionId);
        const { data } = await supabaseAdmin.from('dedications').select('*').in('id', ids);
        interactionDataMap['dedication'] = {};
        (data || []).forEach((d) => { interactionDataMap['dedication'][d.id] = d; });
      }
      if (logsByType['photo']) {
        const ids = logsByType['photo'].map((l) => l.interactionId);
        const { data } = await supabaseAdmin.from('photos').select('*').in('id', ids);
        interactionDataMap['photo'] = {};
        (data || []).forEach((d) => { interactionDataMap['photo'][d.id] = d; });
      }

      const detailedLogs = (memoryLogs || []).map((log) => {
        const interactionData = interactionDataMap[log.type]?.[log.interactionId] || null;
        return { ...log, interactionData };
      });

      return res.status(200).json({ detailedLogs });
    } catch (error) {
      console.error("Error fetching memory logs:", error);
      res.status(500).json({ message: "Failed to get memory logs" });
    }
  },

  getUserCardAndKeeperLogs: async (req, res) => {
    try {
      const userId = req.profile?.id;

      const { data: userObituaries } = await supabaseAdmin
        .from('obituaries')
        .select('id')
        .eq('userId', userId);
      if (!userObituaries || userObituaries.length === 0) {
        return res.status(200).json({ logs: [] });
      }
      const obituaryIds = userObituaries.map((o) => o.id);

      const { data: logs } = await supabaseAdmin
        .from('memorylogs')
        .select('*, Obituary:obituaries(city, name, sirName)')
        .in('obituaryId', obituaryIds)
        .in('type', ['card', 'keeper_activation', 'keeper_deactivation'])
        .eq('status', 'approved')
        .order('createdTimestamp', { ascending: false });

      const formattedLogs = (logs || []).map((log) => ({
        city: log.Obituary?.city,
        name: log.Obituary?.name,
        sirName: log.Obituary?.sirName,
        giftedTo: log.userName,
        createdAt: log.createdTimestamp,
        typeInSL: log.typeInSL,
      }));

      return res.status(200).json({ logs: formattedLogs });
    } catch (error) {
      console.error("Error fetching logs:", error);
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  },
};

module.exports = memoryLogsController;
