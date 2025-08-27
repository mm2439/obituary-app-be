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
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

class ObituaryMigrationUpdated {
  constructor() {
    this.mysqlConnection = null;
    this.supabase = null;
    this.migrationLog = [];
    this.errors = [];
    this.idMapping = {}; // Map MySQL IDs to Supabase UUIDs
  }

  async initialize() {
    try {
      this.mysqlConnection = await mysql.createConnection(MYSQL_CONFIG);
      this.supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceKey);
      console.log('✅ Connected to both databases');
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

  // Generate UUID for mapping
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async migrateUsers() {
    this.log('Migrating users to profiles...', 'info');
    
    try {
      const [rows] = await this.mysqlConnection.execute('SELECT * FROM users ORDER BY id');
      this.log(`Found ${rows.length} users to migrate`, 'info');

      for (const user of rows) {
        try {
          // Generate UUID for this user
          const userId = this.generateUUID();
          this.idMapping[`user_${user.id}`] = userId;

          // First create auth user (if using Supabase Auth)
          // For now, we'll just create the profile
          const { data, error } = await this.supabase
            .from('profiles')
            .insert({
              id: userId,
              email: user.email,
              full_name: user.name,
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
              password_hash: user.password, // Store for reference
              created_at: user.createdTimestamp,
              updated_at: user.modifiedTimestamp
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
          const userId = this.idMapping[`user_${token.userId}`];
          if (!userId) {
            this.log(`Skipping token - user ${token.userId} not found in mapping`, 'warning');
            continue;
          }

          const { data, error } = await this.supabase
            .from('refresh_tokens')
            .insert({
              user_id: userId,
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
          const cemeteryId = this.generateUUID();
          this.idMapping[`cemetery_${cemetery.id}`] = cemeteryId;

          const userId = cemetery.userId ? this.idMapping[`user_${cemetery.userId}`] : null;
          const companyId = cemetery.companyId ? this.idMapping[`company_${cemetery.companyId}`] : null;

          const { data, error } = await this.supabase
            .from('cemetries')
            .insert({
              id: cemeteryId,
              name: cemetery.name,
              location: cemetery.location,
              user_id: userId,
              company_id: companyId,
              created_at: cemetery.createdTimestamp,
              updated_at: cemetery.modifiedTimestamp
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
          const obituaryId = this.generateUUID();
          this.idMapping[`obituary_${obituary.id}`] = obituaryId;

          const userId = this.idMapping[`user_${obituary.userId}`];
          if (!userId) {
            this.log(`Skipping obituary - user ${obituary.userId} not found in mapping`, 'warning');
            continue;
          }

          const funeralCemetery = obituary.funeralCemetery ? 
            this.idMapping[`cemetery_${obituary.funeralCemetery}`] : null;

          const { data, error } = await this.supabase
            .from('obituaries')
            .insert({
              id: obituaryId,
              user_id: userId,
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
              funeral_cemetery: funeralCemetery,
              funeral_timestamp: obituary.funeralTimestamp,
              events: obituary.events,
              death_report_exists: obituary.deathReportExists,
              death_report: obituary.deathReport,
              obituary_content: obituary.obituary,
              symbol: obituary.symbol,
              verse: obituary.verse,
              total_candles: obituary.totalCandles,
              total_visits: obituary.totalVisits,
              current_week_visits: obituary.currentWeekVisits,
              last_weekly_reset: obituary.lastWeeklyReset,
              created_at: obituary.createdTimestamp,
              updated_at: obituary.modifiedTimestamp,
              slug_key: obituary.slugKey,
              card_images: obituary.cardImages || [],
              card_pdfs: obituary.cardPdfs || [],
              is_published: true, // Assume existing obituaries are published
              is_featured: false
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
          const userId = candle.userId ? this.idMapping[`user_${candle.userId}`] : null;
          const obituaryId = this.idMapping[`obituary_${candle.obituaryId}`];

          if (!obituaryId) {
            this.log(`Skipping candle - obituary ${candle.obituaryId} not found`, 'warning');
            continue;
          }

          const { data, error } = await this.supabase
            .from('candles')
            .insert({
              expiry: candle.expiry,
              ip_address: candle.ipAddress,
              user_id: userId,
              obituary_id: obituaryId,
              created_at: candle.createdTimestamp,
              updated_at: candle.modifiedTimestamp
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
          const userId = visit.userId ? this.idMapping[`user_${visit.userId}`] : null;
          const obituaryId = this.idMapping[`obituary_${visit.obituaryId}`];

          if (!obituaryId) {
            this.log(`Skipping visit - obituary ${visit.obituaryId} not found`, 'warning');
            continue;
          }

          const { data, error } = await this.supabase
            .from('visits')
            .insert({
              expiry: visit.expiry,
              ip_address: visit.ipAddress,
              user_id: userId,
              obituary_id: obituaryId,
              created_at: visit.createdTimestamp,
              updated_at: visit.modifiedTimestamp
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
          const userId = this.idMapping[`user_${photo.userId}`];
          const obituaryId = this.idMapping[`obituary_${photo.obituaryId}`];

          if (!userId || !obituaryId) {
            this.log(`Skipping photo - missing user or obituary mapping`, 'warning');
            continue;
          }

          const { data, error } = await this.supabase
            .from('photos')
            .insert({
              file_url: photo.fileUrl,
              status: photo.status,
              user_id: userId,
              obituary_id: obituaryId,
              created_at: photo.createdTimestamp,
              updated_at: photo.modifiedTimestamp
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
          const userId = this.idMapping[`user_${condolence.userId}`];
          const obituaryId = this.idMapping[`obituary_${condolence.obituaryId}`];

          if (!userId || !obituaryId) {
            this.log(`Skipping condolence - missing user or obituary mapping`, 'warning');
            continue;
          }

          const { data, error } = await this.supabase
            .from('condolences')
            .insert({
              name: condolence.name,
              message: condolence.message,
              relation: condolence.relation,
              status: condolence.status,
              is_custom_message: condolence.isCustomMessage,
              user_id: userId,
              obituary_id: obituaryId,
              created_at: condolence.createdTimestamp,
              updated_at: condolence.modifiedTimestamp
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
      idMappings: Object.keys(this.idMapping).length,
      logs: this.migrationLog,
      errors: this.errors
    };

    const fs = require('fs');
    const reportPath = `migration-report-updated-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    this.log(`Migration report saved to: ${reportPath}`, 'info');

    if (this.errors.length === 0) {
      this.log('🎉 Migration completed successfully!', 'info');
    } else {
      this.log(`⚠️ Migration completed with ${this.errors.length} errors. Check the report for details.`, 'warning');
    }

    return report;
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
  const migration = new ObituaryMigrationUpdated();

  try {
    const initialized = await migration.initialize();
    if (!initialized) {
      console.error('Failed to initialize migration. Please check your configuration.');
      process.exit(1);
    }

    await migration.migrateAllTables();

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await migration.cleanup();
  }
}

// Export for use as module or run directly
module.exports = { ObituaryMigrationUpdated, runMigration };

if (require.main === module) {
  runMigration();
}
