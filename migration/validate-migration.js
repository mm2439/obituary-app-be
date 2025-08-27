const mysql = require('mysql2/promise');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

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

class MigrationValidator {
  constructor() {
    this.mysqlConnection = null;
    this.supabase = null;
    this.validationResults = {};
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

  async validateTableCounts() {
    console.log('📊 Validating table record counts...');
    
    const tables = [
      'users',
      'refresh_tokens',
      'cemetries', 
      'obituaries',
      'candles',
      'visits',
      'photos',
      'condolences',
      'dedications',
      'sorrow_books',
      'memory_logs',
      'keepers',
      'reports',
      'cards',
      'events',
      'faqs',
      'florist_slides',
      'florist_shops'
    ];

    const results = {};

    for (const table of tables) {
      try {
        // Get MySQL count
        const mysqlTableName = table === 'refresh_tokens' ? 'refreshTokens' : 
                              table === 'sorrow_books' ? 'sorrow_book' :
                              table === 'memory_logs' ? 'memory_logs' : table;
        
        const [mysqlRows] = await this.mysqlConnection.execute(
          `SELECT COUNT(*) as count FROM ${mysqlTableName}`
        );
        const mysqlCount = mysqlRows[0].count;

        // Get Supabase count
        const { data, error, count } = await this.supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error && !error.message.includes('does not exist')) {
          throw error;
        }

        const supabaseCount = error ? 0 : count;

        results[table] = {
          mysql: mysqlCount,
          supabase: supabaseCount,
          match: mysqlCount === supabaseCount,
          difference: mysqlCount - supabaseCount
        };

        const status = mysqlCount === supabaseCount ? '✅' : '❌';
        console.log(`${status} ${table}: MySQL=${mysqlCount}, Supabase=${supabaseCount}`);

      } catch (error) {
        console.log(`⚠️ ${table}: Error - ${error.message}`);
        results[table] = { error: error.message };
      }
    }

    this.validationResults.tableCounts = results;
    return results;
  }

  async validateDataIntegrity() {
    console.log('🔍 Validating data integrity...');
    
    const integrityChecks = [];

    try {
      // Check user email uniqueness
      const { data: users, error: usersError } = await this.supabase
        .from('users')
        .select('email');

      if (!usersError) {
        const emails = users.map(u => u.email);
        const uniqueEmails = [...new Set(emails)];
        integrityChecks.push({
          check: 'User email uniqueness',
          passed: emails.length === uniqueEmails.length,
          details: `${emails.length} total, ${uniqueEmails.length} unique`
        });
      }

      // Check obituary slug key uniqueness
      const { data: obituaries, error: obituariesError } = await this.supabase
        .from('obituaries')
        .select('slug_key');

      if (!obituariesError) {
        const slugKeys = obituaries.map(o => o.slug_key).filter(Boolean);
        const uniqueSlugKeys = [...new Set(slugKeys)];
        integrityChecks.push({
          check: 'Obituary slug key uniqueness',
          passed: slugKeys.length === uniqueSlugKeys.length,
          details: `${slugKeys.length} total, ${uniqueSlugKeys.length} unique`
        });
      }

      // Check foreign key relationships
      const { data: orphanedCandles } = await this.supabase
        .from('candles')
        .select('id, obituary_id')
        .not('obituary_id', 'in', `(SELECT id FROM obituaries)`);

      integrityChecks.push({
        check: 'Candles foreign key integrity',
        passed: !orphanedCandles || orphanedCandles.length === 0,
        details: `${orphanedCandles ? orphanedCandles.length : 0} orphaned records`
      });

    } catch (error) {
      console.error('Error during integrity checks:', error);
    }

    this.validationResults.integrityChecks = integrityChecks;
    
    integrityChecks.forEach(check => {
      const status = check.passed ? '✅' : '❌';
      console.log(`${status} ${check.check}: ${check.details}`);
    });

    return integrityChecks;
  }

  async validateSampleData() {
    console.log('🔬 Validating sample data...');
    
    const sampleChecks = [];

    try {
      // Compare first 5 users
      const [mysqlUsers] = await this.mysqlConnection.execute(
        'SELECT id, name, email, role FROM users ORDER BY id LIMIT 5'
      );

      const { data: supabaseUsers } = await this.supabase
        .from('users')
        .select('id, name, email, role')
        .order('id')
        .limit(5);

      if (supabaseUsers) {
        const matches = mysqlUsers.every(mysqlUser => {
          const supabaseUser = supabaseUsers.find(su => su.id === mysqlUser.id);
          return supabaseUser && 
                 supabaseUser.name === mysqlUser.name &&
                 supabaseUser.email === mysqlUser.email &&
                 supabaseUser.role === mysqlUser.role;
        });

        sampleChecks.push({
          check: 'First 5 users data consistency',
          passed: matches,
          details: `${mysqlUsers.length} MySQL vs ${supabaseUsers.length} Supabase`
        });
      }

      // Compare first 5 obituaries
      const [mysqlObituaries] = await this.mysqlConnection.execute(
        'SELECT id, name, sirName, slug_key FROM obituaries ORDER BY id LIMIT 5'
      );

      const { data: supabaseObituaries } = await this.supabase
        .from('obituaries')
        .select('id, name, sir_name, slug_key')
        .order('id')
        .limit(5);

      if (supabaseObituaries) {
        const matches = mysqlObituaries.every(mysqlObit => {
          const supabaseObit = supabaseObituaries.find(so => so.id === mysqlObit.id);
          return supabaseObit && 
                 supabaseObit.name === mysqlObit.name &&
                 supabaseObit.sir_name === mysqlObit.sirName &&
                 supabaseObit.slug_key === mysqlObit.slug_key;
        });

        sampleChecks.push({
          check: 'First 5 obituaries data consistency',
          passed: matches,
          details: `${mysqlObituaries.length} MySQL vs ${supabaseObituaries.length} Supabase`
        });
      }

    } catch (error) {
      console.error('Error during sample data validation:', error);
    }

    this.validationResults.sampleChecks = sampleChecks;
    
    sampleChecks.forEach(check => {
      const status = check.passed ? '✅' : '❌';
      console.log(`${status} ${check.check}: ${check.details}`);
    });

    return sampleChecks;
  }

  generateValidationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTables: Object.keys(this.validationResults.tableCounts || {}).length,
        matchingTables: Object.values(this.validationResults.tableCounts || {})
          .filter(result => result.match).length,
        integrityChecksPassed: (this.validationResults.integrityChecks || [])
          .filter(check => check.passed).length,
        sampleChecksPassed: (this.validationResults.sampleChecks || [])
          .filter(check => check.passed).length
      },
      details: this.validationResults
    };

    const fs = require('fs');
    const reportPath = `validation-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📋 Validation report saved to: ${reportPath}`);
    return report;
  }

  async cleanup() {
    if (this.mysqlConnection) {
      await this.mysqlConnection.end();
    }
  }
}

async function runValidation() {
  const validator = new MigrationValidator();
  
  try {
    const initialized = await validator.initialize();
    if (!initialized) {
      console.error('Failed to initialize validator');
      process.exit(1);
    }

    console.log('🔍 Starting migration validation...\n');

    await validator.validateTableCounts();
    console.log('');
    
    await validator.validateDataIntegrity();
    console.log('');
    
    await validator.validateSampleData();
    console.log('');

    const report = validator.generateValidationReport();
    
    console.log('\n📊 Validation Summary:');
    console.table(report.summary);

    const allPassed = report.summary.matchingTables === report.summary.totalTables &&
                     report.summary.integrityChecksPassed === (validator.validationResults.integrityChecks || []).length &&
                     report.summary.sampleChecksPassed === (validator.validationResults.sampleChecks || []).length;

    if (allPassed) {
      console.log('🎉 All validation checks passed!');
    } else {
      console.log('⚠️ Some validation checks failed. Please review the report.');
    }

  } catch (error) {
    console.error('Validation failed:', error);
  } finally {
    await validator.cleanup();
  }
}

module.exports = { MigrationValidator, runValidation };

if (require.main === module) {
  runValidation();
}
