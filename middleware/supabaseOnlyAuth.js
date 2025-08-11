const { supabaseAdmin } = require('../config/supabase');

// Pure Supabase authentication middleware (no JWT fallback)
const verifySupabaseAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Profile fetch error:', profileError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching user profile' 
      });
    }

    // If no profile exists, create one
    if (!profile) {
      const newProfile = await supabaseAdmin
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email.split('@')[0],
          role: 'User'
        })
        .select()
        .single();

      req.profile = newProfile.data;
    } else {
      req.profile = profile;
    }

    // Attach user and profile to request
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    console.error('Supabase auth middleware error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
};

// Optional Supabase authentication - doesn't fail if no token
const optionalSupabaseAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (!error && user) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      req.user = user;
      req.profile = profile;
      req.token = token;
    }

    next();
  } catch (error) {
    // Ignore errors in optional auth
    next();
  }
};

// Check user roles (Supabase version)
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.profile) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const userRole = req.profile.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

// Admin role check
const requireAdmin = requireRole(['SUPERADMIN']);

// Funeral company or admin check
const requireFuneralOrAdmin = requireRole(['Funeral', 'SUPERADMIN']);

// Florist or admin check
const requireFloristOrAdmin = requireRole(['Florist', 'SUPERADMIN']);

// Get client IP address
const getClientIP = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         '127.0.0.1';
};

module.exports = {
  verifySupabaseAuth,
  optionalSupabaseAuth,
  requireRole,
  requireAdmin,
  requireFuneralOrAdmin,
  requireFloristOrAdmin,
  getClientIP
};
