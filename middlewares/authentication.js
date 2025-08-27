const httpStatus = require("http-status-codes").StatusCodes;
const { supabaseAdmin } = require("../config/supabase");

module.exports = async (req, res, next) => {
  try {
    // Accept Supabase access token from Authorization: Bearer <token> or access-token header
    const authHeader = req.header("authorization") || req.header("Authorization");
    const bearerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const accessToken = bearerToken || req.header("access-token");

    if (!accessToken) {
      return res.status(httpStatus.UNAUTHORIZED).json({ error: "Access denied. No token provided" });
    }

    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
    if (error || !data?.user) {
      return res.status(httpStatus.UNAUTHORIZED).json({ error: "Access denied. Invalid token" });
    }

    const email = data.user.email;

    // Fetch profile from profiles table by email
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (profileErr || !profile) {
      return res.status(httpStatus.UNAUTHORIZED).json({ error: "Access denied. User not found" });
    }

    if (profile.isBlocked) {
      return res.status(httpStatus.FORBIDDEN).json({ error: "Your account has been blocked. Please contact administrator." });
    }

    // Backwards-compat: set both req.profile and req.user
    req.profile = profile;
    req.user = profile;

    return next();
  } catch (e) {
    console.error("authentication middleware error:", e);
    return res.status(httpStatus.UNAUTHORIZED).json({ error: "Access denied" });
  }
};
