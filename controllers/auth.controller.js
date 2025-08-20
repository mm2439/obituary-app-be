const httpStatus = require("http-status-codes").StatusCodes;
const { getSupabaseAnon, getSupabaseForToken } = require("../lib/supabaseClient");

const authController = {
  // Login with email+password (proxy to Supabase)
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password)
        return res.status(400).json({ error: "Email and password are required" });

      const supabase = await getSupabaseAnon();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return res.status(401).json({ error: error.message });

      // Return session like Supabase (access_token, refresh_token, etc.)
      return res.status(200).json({ session: data.session, user: data.user });
    } catch (e) {
      console.error("Login error:", e);
      return res.status(500).json({ error: "Server error" });
    }
  },

  // Logout (invalidate refresh token)
  logout: async (req, res) => {
    try {
      const auth = req.headers.authorization || "";
      const accessToken = auth.startsWith("Bearer ") ? auth.slice(7) : null;
      if (!accessToken) return res.status(401).json({ error: "Missing Authorization header" });

      const supabase = await getSupabaseForToken(accessToken);
      const { error } = await supabase.auth.signOut();
      if (error) return res.status(400).json({ error: error.message });

      return res.status(200).json({ message: "Logged out" });
    } catch (e) {
      console.error("Logout error:", e);
      return res.status(500).json({ error: "Server error" });
    }
  },

  // Lost password → send reset email (Supabase handles email)
  lostPassword: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email is required" });

      const supabase = await getSupabaseAnon();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo:
          process.env.SUPABASE_PASSWORD_RESET_REDIRECT_TO ||
          process.env.SUPABASE_EMAIL_REDIRECT_TO, // fallback
      });
      if (error) return res.status(400).json({ error: error.message });

      return res.status(200).json({ message: "Password reset email sent" });
    } catch (e) {
      console.error("Lost password error:", e);
      return res.status(500).json({ error: "Server error" });
    }
  },

  updatePassword: async (req, res) => {
    try {
      const { newPassword } = req.body;
      if (!newPassword) {
        return res.status(400).json({ error: "newPassword is required" });
      }

      // Accept token from Authorization, body, or query
      const authHeader = req.headers.authorization || "";
      let accessToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
      if (!accessToken) {
        accessToken =
          req.body?.token ||
          req.query?.token ||
          req.headers["x-supabase-token"] ||
          null;
      }
      if (!accessToken) {
        return res.status(401).json({ error: "Auth session missing!" });
      }

      const { getSupabaseAnon, getSupabaseAdmin } = require("../lib/supabaseClient");

      // 1) Validate the recovery token and get the Supabase user id
      const anon = await getSupabaseAnon();
      const { data: userData, error: getUserErr } = await anon.auth.getUser(accessToken);
      if (getUserErr || !userData?.user?.id) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      // 2) Update password via Admin API (no session required)
      const admin = await getSupabaseAdmin();
      const { data, error } = await admin.auth.admin.updateUserById(userData.user.id, {
        password: newPassword,
      });
      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({ message: "Password updated", user: data.user });
    } catch (e) {
      console.error("Update password error:", e);
      return res.status(500).json({ error: "Server error" });
    }
  },

  // Google OAuth: return provider URL; frontend should redirect user to it
  googleUrl: async (req, res) => {
    try {
      const redirectTo = req.query.redirectTo || process.env.SUPABASE_EMAIL_REDIRECT_TO;
      const supabase = await getSupabaseAnon();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ url: data.url });
    } catch (e) {
      console.error("Google URL error:", e);
      return res.status(500).json({ error: "Server error" });
    }
  },
};

module.exports = authController;


// const httpStatus = require("http-status-codes").StatusCodes;
// const bcrypt = require("bcrypt");

// const { User } = require("../models/user.model");
// const Auth = require("../models/auth.model");
// const { RefreshToken } = require("../models/refreshToken.model");
// const responseToken = require("../helpers/responseToken");

// const authController = {
//   login: async (req, res) => {
//     const { email, password } = req.body;

//     const { error } = Auth.validateAuth(req.body);

//     if (error) {
//       console.warn(`Invalid data format: ${error}`);

//       return res
//         .status(httpStatus.BAD_REQUEST)
//         .json({ error: `Invalid data format: ${error}` });
//     }

//     const user = await User.findOne({
//       where: {
//         email: email,
//       },
//     });

//     if (!user) {
//       console.warn("Invalid email or password");

//       return res
//         .status(httpStatus.UNAUTHORIZED)
//         .json({ error: "Invalid Email" });
//     }

//     // Check if user is blocked
//     if (user.isBlocked) {
//       console.warn("User account is blocked");

//       return res
//         .status(httpStatus.FORBIDDEN)
//         .json({ error: "Your account has been blocked. Please contact administrator." });
//     }

//     const validPassword = await bcrypt.compare(password, user.password);


//     if (!validPassword) {
//       console.warn("Invalid Password");

//       return res
//         .status(httpStatus.UNAUTHORIZED)
//         .json({ error: "Invalid   password" });
//     }

//     responseToken.setAccessToken(user, res);

//     await responseToken.setRefreshToken(user, res);

//     res.status(httpStatus.OK).json({
//       message: "Login Successful!",
//       user: user.toSafeObject(),
//     });
//   },

//   logout: async (req, res) => {
//     try {
//       // Invalidate refresh token
//       await RefreshToken.update(
//         { isValid: false },
//         { where: { userId: req.user.id } }
//       );
      
//       const isProd = process.env.NODE_ENV === "production";
      
//       // Clear cookies with exact same options as when they were set
//       res.clearCookie("accessToken", {
//         path: "/",
//         httpOnly: false,
//         secure: isProd,
//         sameSite: isProd ? "None" : "Lax",
//         maxAge: 0,
//         expires: new Date(0),
//       });
      
//       res.clearCookie("role", {
//         path: "/",
//         httpOnly: false,
//         secure: isProd,
//         sameSite: isProd ? "None" : "Lax",
//         maxAge: 0,
//         expires: new Date(0),
//       });
      
//       res.clearCookie("slugKey", {
//         path: "/",
//         httpOnly: false,
//         secure: isProd,
//         sameSite: isProd ? "None" : "Lax",
//         maxAge: 0,
//         expires: new Date(0),
//       });
      
//       res.status(httpStatus.OK).json({
//         message: "Logged out successfully!",
//       });
//     } catch (error) {
//       console.error("Logout error:", error);
//       res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
//         error: "Failed to log out",
//       });
//     }
//   },
// };

// module.exports = authController;