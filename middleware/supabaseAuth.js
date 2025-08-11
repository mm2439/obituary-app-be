const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/supabase');

// Middleware to verify Supabase JWT token
const verifySupabaseToken = async (req, res, next) => {
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

    // Attach user and profile to request
    req.user = user;
    req.profile = profile;
    req.token = token;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
};

// Middleware to verify JWT token (for backward compatibility with existing auth)
const verifyJWTToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user profile from Supabase
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (error) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    req.user = { id: decoded.id, email: decoded.email };
    req.profile = profile;
    req.token = token;

    next();
  } catch (error) {
    console.error('JWT Auth middleware error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
};

// Middleware to check user roles
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

// Middleware to check if user is admin
const requireAdmin = requireRole(['SUPERADMIN']);

// Middleware to check if user is funeral company or admin
const requireFuneralOrAdmin = requireRole(['Funeral', 'SUPERADMIN']);

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);

    // Try Supabase auth first
    try {
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
    } catch (supabaseError) {
      // Try JWT auth as fallback
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', decoded.id)
          .single();

        req.user = { id: decoded.id, email: decoded.email };
        req.profile = profile;
        req.token = token;
      } catch (jwtError) {
        // Ignore errors in optional auth
      }
    }

    next();
  } catch (error) {
    // Ignore errors in optional auth
    next();
  }
};

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
  verifySupabaseToken,
  verifyJWTToken,
  requireRole,
  requireAdmin,
  requireFuneralOrAdmin,
  optionalAuth,
  getClientIP
};
