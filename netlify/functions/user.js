const { supabase, supabaseAdmin } = require('../../config/supabase');

// Helper function to get user from token
async function getUserFromToken(token) {
  if (!token) return null;
  
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) return null;
    
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', data.user.email)
      .single();
    
    return profileErr ? null : profile;
  } catch (error) {
    return null;
  }
}

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      },
      body: '',
    };
  }

  const path = event.path.replace('/.netlify/functions/user', '');
  const method = event.httpMethod;

  try {
    // POST /api/user - Register new user
    if (method === 'POST' && path === '') {
      const { name, email, password, role, company, region, city } = JSON.parse(event.body);
      
      if (!name || !email || !password) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Missing required fields' }),
        };
      }

      // Check if user already exists
      const { data: existing, error: existErr } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .limit(1);
      
      if (!existErr && existing && existing.length > 0) {
        return {
          statusCode: 409,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'User already registered' }),
        };
      }

      // Sign up with Supabase Auth
      const { data: signup, error: signErr } = await supabase.auth.signUp({
        email,
        password
      });

      if (signErr) {
        return {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            error: 'Failed to sign up user',
            supabaseError: signErr.message,
            errorCode: signErr.code
          }),
        };
      }

      // Create user profile with complete schema
      const payload = {
        id: signup.user.id,
        name: name,
        email,
        role: role || 'USER',
        company,
        region,
        city,
        "slugKey": email.split('@')[0] + '-' + Date.now(),
        "createObituaryPermission": false,
        "assignKeeperPermission": false,
        "sendGiftsPermission": false,
        "sendMobilePermission": false,
        "isBlocked": false,
        "hasFlorist": false,
        "isPaid": false,
        "createdTimestamp": new Date().toISOString(),
        "modifiedTimestamp": new Date().toISOString()
      };

      const { data: newUser, error: insErr } = await supabaseAdmin
        .from('profiles')
        .insert(payload)
        .select()
        .single();

      if (insErr) {
        return {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            error: 'Failed to create user profile',
            dbError: insErr.message
          }),
        };
      }

      return {
        statusCode: 201,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: 'User registered successfully!', 
          user: newUser 
        }),
      };
    }

    // GET /api/user/me - Get current user
    if (method === 'GET' && path === '/me') {
      const authHeader = event.headers.authorization || event.headers.Authorization;
      const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      
      const user = await getUserFromToken(token);
      if (!user) {
        return {
          statusCode: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Access denied. User not found' }),
        };
      }

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
      };
    }

    // PATCH /api/user/me - Update current user
    if (method === 'PATCH' && path === '/me') {
      const authHeader = event.headers.authorization || event.headers.Authorization;
      const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      
      const user = await getUserFromToken(token);
      if (!user) {
        return {
          statusCode: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Access denied. User not found' }),
        };
      }

      const updateData = JSON.parse(event.body);
      const { email, company, region, city, secondaryCity } = updateData;

      // Check if email is being changed and if it's already in use
      if (email && email !== user.email) {
        const { data: existing } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', email)
          .neq('id', user.id)
          .limit(1);
        
        if (existing && existing.length > 0) {
          return {
            statusCode: 409,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ error: 'Email is already in use' }),
          };
        }
      }

      const update = {};
      if (email !== undefined) update.email = email;
      if (company !== undefined) update.company = company;
      if (region !== undefined) update.region = region;
      if (city !== undefined) update.city = city;
      if (secondaryCity !== undefined) update["secondaryCity"] = secondaryCity;

      // Always update modifiedTimestamp
      update["modifiedTimestamp"] = new Date().toISOString();

      const { data: updated, error } = await supabaseAdmin
        .from('profiles')
        .update(update)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        return {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Failed to update user' }),
        };
      }

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: 'User updated successfully', 
          updatedUser: updated 
        }),
      };
    }

    // Route not found
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Route not found' }),
    };

  } catch (error) {
    console.error('User function error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
