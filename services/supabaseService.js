const { supabase, supabaseAdmin } = require('../config/supabase');

class SupabaseService {
  constructor() {
    this.client = supabase;
    this.adminClient = supabaseAdmin;
  }

  // Generic CRUD operations
  async findAll(table, options = {}) {
    try {
      // Handle quoted table names for camelCase tables
      const tableName = table.includes('"') ? table : `"${table}"`;

      let query = this.adminClient.from(tableName).select(options.select || '*');

      if (options.where) {
        Object.entries(options.where).forEach(([key, value]) => {
          // Handle integer IDs
          if (key === 'id' || key.endsWith('Id')) {
            query = query.eq(key, parseInt(value));
          } else {
            query = query.eq(key, value);
          }
        });
      }

      if (options.order) {
        query = query.order(options.order.field, { ascending: options.order.ascending !== false });
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error finding all from ${table}:`, error);
      throw error;
    }
  }

  async findOne(table, id, options = {}) {
    try {
      // Handle quoted table names for camelCase tables
      const tableName = table.includes('"') ? table : `"${table}"`;

      const { data, error } = await this.adminClient
        .from(tableName)
        .select(options.select || '*')
        .eq('id', parseInt(id))
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error finding one from ${table}:`, error);
      throw error;
    }
  }

  async findByField(table, field, value, options = {}) {
    try {
      let query = this.adminClient.from(table).select(options.select || '*').eq(field, value);
      
      if (options.single) {
        query = query.single();
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error finding by ${field} from ${table}:`, error);
      throw error;
    }
  }

  async create(table, data) {
    try {
      // Handle quoted table names for camelCase tables
      const tableName = table.includes('"') ? table : `"${table}"`;

      const { data: result, error } = await this.adminClient
        .from(tableName)
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error(`Error creating in ${table}:`, error);
      throw error;
    }
  }

  async update(table, id, data) {
    try {
      const { data: result, error } = await this.adminClient
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    } catch (error) {
      console.error(`Error updating in ${table}:`, error);
      throw error;
    }
  }

  async delete(table, id) {
    try {
      const { error } = await this.adminClient
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Error deleting from ${table}:`, error);
      throw error;
    }
  }

  // Specific methods for obituary app
  async getPublishedObituaries(options = {}) {
    return this.findAll('obituaries', {
      where: { isPublished: true },
      order: { field: 'createdTimestamp', ascending: false },
      ...options
    });
  }

  async getObituaryBySlug(slug) {
    return this.findByField('obituaries', 'slugKey', slug, { single: true });
  }

  async getUserProfile(userId) {
    return this.findOne('profiles', userId);
  }

  async createUserProfile(userData) {
    return this.create('profiles', userData);
  }

  async getObituaryPhotos(obituaryId, status = 'approved') {
    return this.findAll('photos', {
      where: { obituaryId, status },
      order: { field: 'createdTimestamp', ascending: false }
    });
  }

  async getObituaryCondolences(obituaryId, status = 'approved') {
    return this.findAll('condolences', {
      where: { obituaryId, status },
      order: { field: 'createdTimestamp', ascending: false }
    });
  }

  async lightCandle(obituaryId, userId = null, ipAddress) {
    const candleData = {
      obituaryId,
      ipAddress,
      expiry: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    };
    
    if (userId) {
      candleData.userId = userId;
    }
    
    // Create candle
    const candle = await this.create('candles', candleData);
    
    // Update obituary candle count
    const { data: obituary } = await this.adminClient
      .from('obituaries')
      .select('totalCandles')
      .eq('id', obituaryId)
      .single();
    
    if (obituary) {
      await this.update('obituaries', obituaryId, {
        totalCandles: (obituary.totalCandles || 0) + 1
      });
    }
    
    return candle;
  }

  async recordVisit(obituaryId, userId = null, ipAddress) {
    const visitData = {
      obituaryId,
      ipAddress,
      expiry: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    };
    
    if (userId) {
      visitData.userId = userId;
    }
    
    // Create visit
    const visit = await this.create('visits', visitData);
    
    // Update obituary visit counts
    const { data: obituary } = await this.adminClient
      .from('obituaries')
      .select('totalVisits, currentWeekVisits')
      .eq('id', obituaryId)
      .single();
    
    if (obituary) {
      await this.update('obituaries', obituaryId, {
        totalVisits: (obituary.totalVisits || 0) + 1,
        currentWeekVisits: (obituary.currentWeekVisits || 0) + 1
      });
    }
    
    return visit;
  }

  // Authentication helpers
  async authenticateUser(email, password) {
    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  async signUpUser(email, password, userData = {}) {
    try {
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  async signOutUser() {
    try {
      const { error } = await this.client.auth.signOut();
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Storage helpers
  async uploadFile(bucket, fileName, file, options = {}) {
    try {
      const { data, error } = await this.adminClient.storage
        .from(bucket)
        .upload(fileName, file, options);
      
      if (error) throw error;
      
      // Get public URL
      const { data: urlData } = this.adminClient.storage
        .from(bucket)
        .getPublicUrl(fileName);
      
      return {
        path: data.path,
        publicUrl: urlData.publicUrl
      };
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }

  async deleteFile(bucket, fileName) {
    try {
      const { error } = await this.adminClient.storage
        .from(bucket)
        .remove([fileName]);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('File delete error:', error);
      throw error;
    }
  }
}

module.exports = new SupabaseService();
