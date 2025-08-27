const httpStatus = require("http-status-codes").StatusCodes;
const { supabase, supabaseAdmin } = require("../config/supabase");

const authController = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ error: 'Email and password are required' });
      }

      // Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Invalid credentials' });
      }

      // Fetch user profile from your profiles table
      const { data: userProfile, error: userError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (userError || !userProfile) {
        return res.status(httpStatus.NOT_FOUND).json({ error: 'User profile not found' });
      }

      if (userProfile.isBlocked) {
        return res.status(httpStatus.FORBIDDEN).json({ error: 'Your account has been blocked. Please contact administrator.' });
      }

      res.status(httpStatus.OK).json({
        message: 'Login Successful!',
        user: userProfile,
        session: authData.session,
        access_token: authData.session?.access_token
      });
    } catch (e) {
      console.error('Auth login error:', e);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Login failed' });
    }
  },

  logout: async (req, res) => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signOut error:', error);
      }
      res.status(httpStatus.OK).json({ message: "Logged out successfully!" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Failed to log out" });
    }
  },
};

module.exports = authController;