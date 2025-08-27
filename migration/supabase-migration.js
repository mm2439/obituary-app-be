const mysql = require('mysql2/promise');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const MYSQL_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_DATABASE || 'obituary-db',
};

const SUPABASE_CONFIG = {
  url: process.env.SUPABASE_URL,
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY, // Use service role key for admin operations
};

class ObituaryMigration {
  constructor() {
    this.mysqlConnection = null;
    this.supabase = null;
    this.migrationLog = [];
    this.errors = [];
  }

  async initialize() {
    try {
      // Initialize MySQL connection
      this.mysqlConnection = await mysql.createConnection(MYSQL_CONFIG);
      console.log('✅ Connected to MySQL database');

      // Initialize Supabase client
      this.supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceKey);
      console.log('✅ Connected to Supabase');

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize connections:', error);
      return false;
    }
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, type };
    this.migrationLog.push(logEntry);
    
    const emoji = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
    console.log(`${emoji} [${timestamp}] ${message}`);
  }

  async executeSupabaseQuery(query, params = []) {
    try {
      const { data, error } = await this.supabase.rpc('execute_sql', { 
        query: query,
        params: params 
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      // Fallback to direct table operations for simple queries
      console.warn('RPC failed, attempting direct operation:', error.message);
      throw error;
    }
  }

  async createSupabaseSchema() {
    this.log('Creating Supabase schema...', 'info');
    
    const schemas = [
      // Users table
      `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100) NOT NULL UNIQUE,
        password TEXT NOT NULL,
        company VARCHAR(100),
        region VARCHAR(100),
        city VARCHAR(100),
        secondary_city VARCHAR(100),
        role VARCHAR(50) NOT NULL DEFAULT 'USER',
        slug_key VARCHAR(500) UNIQUE,
        create_obituary_permission BOOLEAN DEFAULT FALSE,
        assign_keeper_permission BOOLEAN DEFAULT FALSE,
        send_gifts_permission BOOLEAN DEFAULT FALSE,
        send_mobile_permission BOOLEAN DEFAULT FALSE,
        is_blocked BOOLEAN DEFAULT FALSE,
        notes TEXT,
        admin_rating VARCHAR(1),
        has_florist BOOLEAN DEFAULT FALSE,
        is_paid BOOLEAN DEFAULT FALSE,
        created_timestamp TIMESTAMP DEFAULT NOW(),
        modified_timestamp TIMESTAMP DEFAULT NOW()
      );
      `,
      
      // Refresh tokens table
      `
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        is_valid BOOLEAN DEFAULT TRUE
      );
      `,
      
      // Cemeteries table
      `
      CREATE TABLE IF NOT EXISTS cemetries (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        location VARCHAR(100) NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        company_id INTEGER,
        created_timestamp TIMESTAMP DEFAULT NOW(),
        modified_timestamp TIMESTAMP DEFAULT NOW()
      );
      `,
      
      // Obituaries table
      `
      CREATE TABLE IF NOT EXISTS obituaries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        sir_name VARCHAR(100) NOT NULL,
        location VARCHAR(100) NOT NULL,
        region VARCHAR(100) NOT NULL,
        city VARCHAR(100) NOT NULL,
        gender VARCHAR(10) DEFAULT 'Male',
        birth_date DATE NOT NULL,
        death_date DATE NOT NULL,
        image TEXT,
        funeral_location VARCHAR(100),
        funeral_cemetery INTEGER REFERENCES cemetries(id),
        funeral_timestamp TIMESTAMP,
        events JSONB,
        death_report_exists BOOLEAN DEFAULT TRUE,
        death_report TEXT,
        obituary TEXT NOT NULL,
        symbol VARCHAR(100),
        verse VARCHAR(60),
        total_candles INTEGER DEFAULT 0,
        total_visits INTEGER DEFAULT 0,
        current_week_visits INTEGER DEFAULT 0,
        last_weekly_reset TIMESTAMP DEFAULT NOW(),
        created_timestamp TIMESTAMP DEFAULT NOW(),
        modified_timestamp TIMESTAMP DEFAULT NOW(),
        slug_key VARCHAR(500) NOT NULL UNIQUE,
        card_images JSONB DEFAULT '[]',
        card_pdfs JSONB DEFAULT '[]'
      );
      `
    ];

    for (const schema of schemas) {
      try {
        await this.supabase.rpc('execute_sql', { query: schema });
        this.log(`Schema created successfully`, 'info');
      } catch (error) {
        this.log(`Failed to create schema: ${error.message}`, 'error');
        this.errors.push(error);
      }
    }
  }

  async migrateUsers() {
    this.log('Migrating users...', 'info');
    
    try {
      const [rows] = await this.mysqlConnection.execute('SELECT * FROM users ORDER BY id');
      this.log(`Found ${rows.length} users to migrate`, 'info');

      for (const user of rows) {
        try {
          const { data, error } = await this.supabase
            .from('users')
            .insert({
              id: user.id,
              name: user.name,
              email: user.email,
              password: user.password,
              company: user.company,
              region: user.region,
              city: user.city,
              secondary_city: user.secondaryCity,
              role: user.role,
              slug_key: user.slugKey,
              create_obituary_permission: user.createObituaryPermission,
              assign_keeper_permission: user.assignKeeperPermission,
              send_gifts_permission: user.sendGiftsPermission,
              send_mobile_permission: user.sendMobilePermission,
              is_blocked: user.isBlocked,
              notes: user.notes,
              admin_rating: user.adminRating,
              has_florist: user.hasFlorist,
              is_paid: user.isPaid,
              created_timestamp: user.createdTimestamp,
              modified_timestamp: user.modifiedTimestamp
            });

          if (error) throw error;
          this.log(`Migrated user: ${user.email}`, 'info');
        } catch (error) {
          this.log(`Failed to migrate user ${user.email}: ${error.message}`, 'error');
          this.errors.push({ table: 'users', id: user.id, error: error.message });
        }
      }
    } catch (error) {
      this.log(`Failed to migrate users: ${error.message}`, 'error');
      this.errors.push(error);
    }
  }

  async migrateRefreshTokens() {
    this.log('Migrating refresh tokens...', 'info');
    
    try {
      const [rows] = await this.mysqlConnection.execute('SELECT * FROM refreshTokens ORDER BY id');
      this.log(`Found ${rows.length} refresh tokens to migrate`, 'info');

      for (const token of rows) {
        try {
          const { data, error } = await this.supabase
            .from('refresh_tokens')
            .insert({
              id: token.id,
              user_id: token.userId,
              token: token.token,
              expires_at: token.expiresAt,
              is_valid: token.isValid
            });

          if (error) throw error;
        } catch (error) {
          this.log(`Failed to migrate refresh token ${token.id}: ${error.message}`, 'error');
          this.errors.push({ table: 'refresh_tokens', id: token.id, error: error.message });
        }
      }
    } catch (error) {
      this.log(`Failed to migrate refresh tokens: ${error.message}`, 'error');
      this.errors.push(error);
    }
  }

  async migrateCemetries() {
    this.log('Migrating cemetries...', 'info');
    
    try {
      const [rows] = await this.mysqlConnection.execute('SELECT * FROM cemetries ORDER BY id');
      this.log(`Found ${rows.length} cemetries to migrate`, 'info');

      for (const cemetery of rows) {
        try {
          const { data, error } = await this.supabase
            .from('cemetries')
            .insert({
              id: cemetery.id,
              name: cemetery.name,
              location: cemetery.location,
              user_id: cemetery.userId,
              company_id: cemetery.companyId,
              created_timestamp: cemetery.createdTimestamp,
              modified_timestamp: cemetery.modifiedTimestamp
            });

          if (error) throw error;
        } catch (error) {
          this.log(`Failed to migrate cemetery ${cemetery.id}: ${error.message}`, 'error');
          this.errors.push({ table: 'cemetries', id: cemetery.id, error: error.message });
        }
      }
    } catch (error) {
      this.log(`Failed to migrate cemetries: ${error.message}`, 'error');
      this.errors.push(error);
    }
  }

  async migrateObituaries() {
    this.log('Migrating obituaries...', 'info');

    try {
      const [rows] = await this.mysqlConnection.execute('SELECT * FROM obituaries ORDER BY id');
      this.log(`Found ${rows.length} obituaries to migrate`, 'info');

      for (const obituary of rows) {
        try {
          const { data, error } = await this.supabase
            .from('obituaries')
            .insert({
              id: obituary.id,
              user_id: obituary.userId,
              name: obituary.name,
              sir_name: obituary.sirName,
              location: obituary.location,
              region: obituary.region,
              city: obituary.city,
              gender: obituary.gender,
              birth_date: obituary.birthDate,
              death_date: obituary.deathDate,
              image: obituary.image,
              funeral_location: obituary.funeralLocation,
              funeral_cemetery: obituary.funeralCemetery,
              funeral_timestamp: obituary.funeralTimestamp,
              events: obituary.events ? JSON.stringify(obituary.events) : null,
              death_report_exists: obituary.deathReportExists,
              death_report: obituary.deathReport,
              obituary: obituary.obituary,
              symbol: obituary.symbol,
              verse: obituary.verse,
              total_candles: obituary.totalCandles,
              total_visits: obituary.totalVisits,
              current_week_visits: obituary.currentWeekVisits,
              last_weekly_reset: obituary.lastWeeklyReset,
              created_timestamp: obituary.createdTimestamp,
              modified_timestamp: obituary.modifiedTimestamp,
              slug_key: obituary.slugKey,
              card_images: obituary.cardImages ? JSON.stringify(obituary.cardImages) : '[]',
              card_pdfs: obituary.cardPdfs ? JSON.stringify(obituary.cardPdfs) : '[]'
            });

          if (error) throw error;
          this.log(`Migrated obituary: ${obituary.name} ${obituary.sirName}`, 'info');
        } catch (error) {
          this.log(`Failed to migrate obituary ${obituary.id}: ${error.message}`, 'error');
          this.errors.push({ table: 'obituaries', id: obituary.id, error: error.message });
        }
      }
    } catch (error) {
      this.log(`Failed to migrate obituaries: ${error.message}`, 'error');
      this.errors.push(error);
    }
  }

  async migrateCandles() {
    this.log('Migrating candles...', 'info');

    try {
      const [rows] = await this.mysqlConnection.execute('SELECT * FROM candles ORDER BY id');
      this.log(`Found ${rows.length} candles to migrate`, 'info');

      for (const candle of rows) {
        try {
          const { data, error } = await this.supabase
            .from('candles')
            .insert({
              id: candle.id,
              expiry: candle.expiry,
              ip_address: candle.ipAddress,
              user_id: candle.userId,
              obituary_id: candle.obituaryId,
              created_timestamp: candle.createdTimestamp,
              modified_timestamp: candle.modifiedTimestamp
            });

          if (error) throw error;
        } catch (error) {
          this.log(`Failed to migrate candle ${candle.id}: ${error.message}`, 'error');
          this.errors.push({ table: 'candles', id: candle.id, error: error.message });
        }
      }
    } catch (error) {
      this.log(`Failed to migrate candles: ${error.message}`, 'error');
      this.errors.push(error);
    }
  }

  async migrateVisits() {
    this.log('Migrating visits...', 'info');

    try {
      const [rows] = await this.mysqlConnection.execute('SELECT * FROM visits ORDER BY id');
      this.log(`Found ${rows.length} visits to migrate`, 'info');

      for (const visit of rows) {
        try {
          const { data, error } = await this.supabase
            .from('visits')
            .insert({
              id: visit.id,
              expiry: visit.expiry,
              ip_address: visit.ipAddress,
              user_id: visit.userId,
              obituary_id: visit.obituaryId,
              created_timestamp: visit.createdTimestamp,
              modified_timestamp: visit.modifiedTimestamp
            });

          if (error) throw error;
        } catch (error) {
          this.log(`Failed to migrate visit ${visit.id}: ${error.message}`, 'error');
          this.errors.push({ table: 'visits', id: visit.id, error: error.message });
        }
      }
    } catch (error) {
      this.log(`Failed to migrate visits: ${error.message}`, 'error');
      this.errors.push(error);
    }
  }

  async migratePhotos() {
    this.log('Migrating photos...', 'info');

    try {
      const [rows] = await this.mysqlConnection.execute('SELECT * FROM photos ORDER BY id');
      this.log(`Found ${rows.length} photos to migrate`, 'info');

      for (const photo of rows) {
        try {
          const { data, error } = await this.supabase
            .from('photos')
            .insert({
              id: photo.id,
              file_url: photo.fileUrl,
              status: photo.status,
              user_id: photo.userId,
              obituary_id: photo.obituaryId,
              created_timestamp: photo.createdTimestamp,
              modified_timestamp: photo.modifiedTimestamp
            });

          if (error) throw error;
        } catch (error) {
          this.log(`Failed to migrate photo ${photo.id}: ${error.message}`, 'error');
          this.errors.push({ table: 'photos', id: photo.id, error: error.message });
        }
      }
    } catch (error) {
      this.log(`Failed to migrate photos: ${error.message}`, 'error');
      this.errors.push(error);
    }
  }

  async migrateCondolences() {
    this.log('Migrating condolences...', 'info');

    try {
      const [rows] = await this.mysqlConnection.execute('SELECT * FROM condolences ORDER BY id');
      this.log(`Found ${rows.length} condolences to migrate`, 'info');

      for (const condolence of rows) {
        try {
          const { data, error } = await this.supabase
            .from('condolences')
            .insert({
              id: condolence.id,
              name: condolence.name,
              message: condolence.message,
              relation: condolence.relation,
              status: condolence.status,
              is_custom_message: condolence.isCustomMessage,
              user_id: condolence.userId,
              obituary_id: condolence.obituaryId,
              created_timestamp: condolence.createdTimestamp,
              modified_timestamp: condolence.modifiedTimestamp
            });

          if (error) throw error;
        } catch (error) {
          this.log(`Failed to migrate condolence ${condolence.id}: ${error.message}`, 'error');
          this.errors.push({ table: 'condolences', id: condolence.id, error: error.message });
        }
      }
    } catch (error) {
      this.log(`Failed to migrate condolences: ${error.message}`, 'error');
      this.errors.push(error);
    }
  }

  async migrateAllTables() {
    this.log('Starting complete migration process...', 'info');

    const migrationSteps = [
      { name: 'Schema Creation', fn: () => this.createSupabaseSchema() },
      { name: 'Users', fn: () => this.migrateUsers() },
      { name: 'Refresh Tokens', fn: () => this.migrateRefreshTokens() },
      { name: 'Cemetries', fn: () => this.migrateCemetries() },
      { name: 'Obituaries', fn: () => this.migrateObituaries() },
      { name: 'Candles', fn: () => this.migrateCandles() },
      { name: 'Visits', fn: () => this.migrateVisits() },
      { name: 'Photos', fn: () => this.migratePhotos() },
      { name: 'Condolences', fn: () => this.migrateCondolences() },
    ];

    for (const step of migrationSteps) {
      try {
        this.log(`Starting migration step: ${step.name}`, 'info');
        await step.fn();
        this.log(`Completed migration step: ${step.name}`, 'info');
      } catch (error) {
        this.log(`Failed migration step ${step.name}: ${error.message}`, 'error');
        this.errors.push({ step: step.name, error: error.message });
      }
    }

    this.generateMigrationReport();
  }

  generateMigrationReport() {
    this.log('Generating migration report...', 'info');

    const report = {
      timestamp: new Date().toISOString(),
      totalLogs: this.migrationLog.length,
      totalErrors: this.errors.length,
      success: this.errors.length === 0,
      logs: this.migrationLog,
      errors: this.errors
    };

    // Save report to file
    const fs = require('fs');
    const reportPath = `migration-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    this.log(`Migration report saved to: ${reportPath}`, 'info');

    if (this.errors.length === 0) {
      this.log('🎉 Migration completed successfully!', 'info');
    } else {
      this.log(`⚠️ Migration completed with ${this.errors.length} errors. Check the report for details.`, 'warning');
    }

    return report;
  }

  async validateMigration() {
    this.log('Validating migration...', 'info');

    const tables = ['users', 'refresh_tokens', 'cemetries', 'obituaries', 'candles', 'visits', 'photos', 'condolences'];
    const validation = {};

    for (const table of tables) {
      try {
        // Get MySQL count
        const [mysqlRows] = await this.mysqlConnection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        const mysqlCount = mysqlRows[0].count;

        // Get Supabase count
        const { data, error, count } = await this.supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) throw error;

        validation[table] = {
          mysql: mysqlCount,
          supabase: count,
          match: mysqlCount === count
        };

        this.log(`${table}: MySQL=${mysqlCount}, Supabase=${count}, Match=${mysqlCount === count}`,
                 mysqlCount === count ? 'info' : 'warning');
      } catch (error) {
        this.log(`Failed to validate table ${table}: ${error.message}`, 'error');
        validation[table] = { error: error.message };
      }
    }

    return validation;
  }

  async cleanup() {
    if (this.mysqlConnection) {
      await this.mysqlConnection.end();
      this.log('MySQL connection closed', 'info');
    }
  }
}

// Main execution function
async function runMigration() {
  const migration = new ObituaryMigration();

  try {
    const initialized = await migration.initialize();
    if (!initialized) {
      console.error('Failed to initialize migration. Please check your configuration.');
      process.exit(1);
    }

    await migration.migrateAllTables();

    // Validate migration
    const validation = await migration.validateMigration();
    console.log('\n📊 Migration Validation Results:');
    console.table(validation);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await migration.cleanup();
  }
}

// Export for use as module or run directly
module.exports = { ObituaryMigration, runMigration };

if (require.main === module) {
  runMigration();
}
