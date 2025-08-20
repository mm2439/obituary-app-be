const { createRemoteJWKSet, jwtVerify } = require("jose");
const { User } = require("../models/user.model");

/** Base64url → JSON */
function decodeJwtHeader(token) {
    const [h] = token.split(".");
    const json = Buffer.from(h.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    return JSON.parse(json);
}

function normalizeSupabaseBaseUrl(url) {
    if (!url) throw new Error("Missing env var SUPABASE_URL");
    let base = url.trim().replace(/\/+$/, "");
    base = base.replace(/\/auth\/v1$/, "");
    return base;
}

const baseUrl = normalizeSupabaseBaseUrl(process.env.SUPABASE_URL);
const jwksUrl = new URL("/auth/v1/keys", baseUrl);
const expectedIssuer = new URL("/auth/v1", baseUrl).toString();

let JWKS = null;
try {
    JWKS = createRemoteJWKSet(jwksUrl);
} catch {
    JWKS = null;
}

async function verifySupabaseJwt(token) {
    // Decide by alg in JWT header
    let alg = "HS256";
    try {
        const header = decodeJwtHeader(token);
        alg = header?.alg || "HS256";
    } catch {
        // default HS256
    }

    if (alg.startsWith("RS") || alg.startsWith("ES")) {
        // Use JWKS if available
        if (!JWKS) throw new Error("JWKS unavailable for RS/ES token");
        const { payload } = await jwtVerify(token, JWKS, { issuer: expectedIssuer });
        return payload;
    } else {
        // HS* → verify with project JWT secret
        const secret = process.env.SUPABASE_JWT_SECRET;
        if (!secret) throw new Error("Missing SUPABASE_JWT_SECRET for HS verification");
        const key = new TextEncoder().encode(secret);
        const { payload } = await jwtVerify(token, key, { issuer: expectedIssuer, algorithms: ["HS256", "HS384", "HS512"] });
        return payload;
    }
}

module.exports = function supabaseAuth() {
    return async (req, res, next) => {
        try {
            if (req.method === "OPTIONS") return next();

            const auth = req.headers.authorization || "";
            if (!auth.startsWith("Bearer ")) {
                return res.status(401).json({ error: "Missing Authorization header" });
            }
            const token = auth.slice(7);

            let payload;
            try {
                payload = await verifySupabaseJwt(token);
            } catch (e) {
                console.error("JWT verify failed:", e?.message || e);
                return res.status(401).json({ error: "Invalid token" });
            }

            const supabaseUserId = payload.sub;
            const email =
                payload.email ||
                (payload.user_metadata && payload.user_metadata.email) ||
                null;

            if (!supabaseUserId) {
                return res.status(401).json({ error: "Invalid token: no subject" });
            }

            // Prefer supabase_user_id, fallback to email (legacy)
            let user = await User.findOne({ where: { supabase_user_id: supabaseUserId } });
            if (!user && email) {
                user = await User.findOne({ where: { email } });
                // Auto-link if the column exists
                if (user && User.rawAttributes && User.rawAttributes.supabase_user_id) {
                    try {
                        user.supabase_user_id = supabaseUserId;
                        await user.save();
                    } catch (e) {
                        console.warn("Could not auto-link supabase_user_id:", e?.message || e);
                    }
                }
            }

            if (!user) {
                return res.status(401).json({ error: "User not provisioned" });
            }

            req.user = { id: user.id, supabase_user_id: supabaseUserId, email: user.email, role: user.role };
            next();
        } catch (err) {
            console.error("Auth middleware error:", err);
            res.status(401).json({ error: "Unauthorized" });
        }
    };
};
