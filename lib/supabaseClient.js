// lib/supabaseClient.js
let adminClient;
let anonClient;

function requireEnv(name) {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env var: ${name}`);
    return v;
}

async function getSupabaseAdmin() {
    if (!adminClient) {
        const { createClient } = await import("@supabase/supabase-js");
        adminClient = createClient(
            requireEnv("SUPABASE_URL"),
            requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
            { auth: { persistSession: false, autoRefreshToken: false } }
        );
    }
    return adminClient;
}

async function getSupabaseAnon() {
    if (!anonClient) {
        const { createClient } = await import("@supabase/supabase-js");
        anonClient = createClient(
            requireEnv("SUPABASE_URL"),
            requireEnv("SUPABASE_ANON_KEY"),
            { auth: { persistSession: false, autoRefreshToken: false } }
        );
    }
    return anonClient;
}

async function getSupabaseForToken(accessToken) {
    if (!accessToken) throw new Error("getSupabaseForToken: accessToken required");

    const { createClient } = await import("@supabase/supabase-js");
    const url = requireEnv("SUPABASE_URL");
    const anon = requireEnv("SUPABASE_ANON_KEY");

    const client = createClient(url, anon, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
            headers: { apikey: anon }, // keep apikey header
        },
    });

    // Set an actual session so auth.* calls work
    const { error } = await client.auth.setSession({
        access_token: accessToken,
        refresh_token: "", // not needed for recovery
    });
    if (error) {
        // Optional: log for debugging
        console.error("setSession error:", error);
    }

    return client;
}

function getAccessTokenFromReq(req) {
    const auth = req?.headers?.authorization || "";
    if (auth.startsWith("Bearer ")) return auth.slice(7);
    return null;
}

module.exports = {
    getSupabaseAdmin,
    getSupabaseAnon,
    getSupabaseForToken,
    getAccessTokenFromReq,
};
