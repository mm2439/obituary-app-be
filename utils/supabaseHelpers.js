const { supabaseAdmin } = require('../config/supabase');

/**
 * Helper functions for Supabase operations
 */

// Convert Sequelize-style where conditions to Supabase format
const convertWhereConditions = (where) => {
  if (!where) return {};
  
  const converted = {};
  
  Object.entries(where).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
      // Handle Sequelize operators
      if (value.like) {
        converted[`${key}.ilike`] = value.like.replace(/%/g, '*');
      } else if (value.in) {
        converted[`${key}.in`] = `(${value.in.join(',')})`;
      } else if (value.gte) {
        converted[`${key}.gte`] = value.gte;
      } else if (value.lte) {
        converted[`${key}.lte`] = value.lte;
      } else if (value.gt) {
        converted[`${key}.gt`] = value.gt;
      } else if (value.lt) {
        converted[`${key}.lt`] = value.lt;
      } else if (value.ne) {
        converted[`${key}.neq`] = value.ne;
      } else {
        converted[key] = value;
      }
    } else {
      converted[key] = value;
    }
  });
  
  return converted;
};

// Convert Sequelize-style order to Supabase format
const convertOrderConditions = (order) => {
  if (!order) return null;
  
  if (Array.isArray(order)) {
    // Handle array format: [['field', 'ASC']]
    const [field, direction] = order[0];
    return {
      field,
      ascending: direction.toUpperCase() === 'ASC'
    };
  } else if (typeof order === 'string') {
    // Handle string format: 'field ASC'
    const parts = order.split(' ');
    return {
      field: parts[0],
      ascending: parts[1]?.toUpperCase() !== 'DESC'
    };
  }
  
  return null;
};

// Generic query builder for Supabase
const buildSupabaseQuery = (table, options = {}) => {
  let query = supabaseAdmin.from(table);
  
  // Select fields
  if (options.attributes) {
    query = query.select(options.attributes.join(','));
  } else {
    query = query.select('*');
  }
  
  // Where conditions
  if (options.where) {
    const conditions = convertWhereConditions(options.where);
    Object.entries(conditions).forEach(([key, value]) => {
      if (key.includes('.')) {
        const [field, operator] = key.split('.');
        switch (operator) {
          case 'ilike':
            query = query.ilike(field, value);
            break;
          case 'in':
            query = query.in(field, value.slice(1, -1).split(','));
            break;
          case 'gte':
            query = query.gte(field, value);
            break;
          case 'lte':
            query = query.lte(field, value);
            break;
          case 'gt':
            query = query.gt(field, value);
            break;
          case 'lt':
            query = query.lt(field, value);
            break;
          case 'neq':
            query = query.neq(field, value);
            break;
          default:
            query = query.eq(field, value);
        }
      } else {
        query = query.eq(key, value);
      }
    });
  }
  
  // Order
  if (options.order) {
    const orderConfig = convertOrderConditions(options.order);
    if (orderConfig) {
      query = query.order(orderConfig.field, { ascending: orderConfig.ascending });
    }
  }
  
  // Limit
  if (options.limit) {
    query = query.limit(options.limit);
  }
  
  // Offset
  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 1000) - 1);
  }
  
  return query;
};

// Execute query with error handling
const executeQuery = async (query, operation = 'query') => {
  try {
    const { data, error } = await query;
    
    if (error) {
      console.error(`Supabase ${operation} error:`, error);
      throw new Error(`Database ${operation} failed: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Query execution error:`, error);
    throw error;
  }
};

// Pagination helper
const paginate = async (table, options = {}) => {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const offset = (page - 1) * limit;
  
  // Get total count
  const countQuery = supabaseAdmin
    .from(table)
    .select('*', { count: 'exact', head: true });
  
  if (options.where) {
    const conditions = convertWhereConditions(options.where);
    Object.entries(conditions).forEach(([key, value]) => {
      countQuery.eq(key, value);
    });
  }
  
  const { count, error: countError } = await countQuery;
  
  if (countError) {
    throw new Error(`Count query failed: ${countError.message}`);
  }
  
  // Get data
  const dataQuery = buildSupabaseQuery(table, {
    ...options,
    limit,
    offset
  });
  
  const data = await executeQuery(dataQuery, 'pagination');
  
  return {
    data,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
      hasNext: page < Math.ceil(count / limit),
      hasPrev: page > 1
    }
  };
};

// Batch operations
const batchInsert = async (table, records, batchSize = 100) => {
  const results = [];
  
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    
    const { data, error } = await supabaseAdmin
      .from(table)
      .insert(batch)
      .select();
    
    if (error) {
      throw new Error(`Batch insert failed: ${error.message}`);
    }
    
    results.push(...data);
  }
  
  return results;
};

// Transaction helper (using Supabase RPC)
const executeTransaction = async (operations) => {
  // Note: Supabase doesn't have traditional transactions
  // This is a simple implementation that executes operations in sequence
  const results = [];
  
  try {
    for (const operation of operations) {
      const result = await operation();
      results.push(result);
    }
    
    return results;
  } catch (error) {
    console.error('Transaction failed:', error);
    // In a real transaction, we would rollback here
    // For now, we just throw the error
    throw error;
  }
};

// Health check
const healthCheck = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('count')
      .limit(1);
    
    return {
      status: error ? 'error' : 'healthy',
      error: error?.message,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

module.exports = {
  convertWhereConditions,
  convertOrderConditions,
  buildSupabaseQuery,
  executeQuery,
  paginate,
  batchInsert,
  executeTransaction,
  healthCheck
};
