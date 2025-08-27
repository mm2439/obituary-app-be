# Obituary App - MySQL to Supabase Migration

This directory contains all the necessary scripts and documentation to migrate the Obituary App from MySQL to Supabase (PostgreSQL).

## 📋 Overview

The migration process includes:
- **Schema Creation**: Converting MySQL schema to PostgreSQL with proper data types
- **Data Migration**: Transferring all data while maintaining relationships
- **Validation**: Ensuring data integrity and completeness
- **Error Handling**: Comprehensive logging and error reporting

## 🗂️ Files Structure

```
migration/
├── supabase-migration.js     # Main migration script
├── supabase-schema.sql       # PostgreSQL schema definition
├── setup-schema.js           # Schema setup utility
├── validate-migration.js     # Validation script
├── package.json              # Dependencies
├── .env.example              # Configuration template
└── README.md                 # This file
```

## 🚀 Quick Start

### 1. Prerequisites

- Node.js (v16 or higher)
- Docker and Docker Compose
- Your MySQL database running via Docker (as per main README)
- Supabase project with service role key (not anon key)

### 2. Installation

```bash
cd migration
npm install
```

### 3. Configuration

```bash
cp .env.example .env
# Edit .env with your database credentials
```

Required environment variables:
```env
# MySQL (Source Database)
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=obituary-db

# Supabase (Destination)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Start Your MySQL Database

First, make sure your MySQL database is running via Docker:

```bash
# In the main project directory (not migration folder)
cd ..
docker-compose up --build

# Wait for MySQL to be ready, then in a new terminal:
cd migration
```

### 5. Run Migration

```bash
# Step 1: Setup Supabase schema
npm run setup-schema

# Step 2: Run the migration
npm run migrate

# Step 3: Validate the migration
npm run validate
```

## 📊 Database Schema

### Tables Migrated

| MySQL Table | Supabase Table | Records | Notes |
|-------------|----------------|---------|-------|
| users | users | All | Role enum converted |
| refreshTokens | refresh_tokens | All | Snake_case naming |
| obituaries | obituaries | All | JSON fields converted to JSONB |
| candles | candles | All | IP tracking preserved |
| visits | visits | All | Analytics data |
| photos | photos | All | File URLs maintained |
| condolences | condolences | All | Status enum converted |
| cemetries | cemetries | All | Location data |
| events | events | All | Date/time handling |
| sorrow_book | sorrow_books | All | Renamed for consistency |

### Key Data Type Conversions

| MySQL Type | PostgreSQL Type | Notes |
|------------|-----------------|-------|
| `ENUM` | Custom ENUM types | Created user_role, gender_type, status_type |
| `JSON` | `JSONB` | Better performance and indexing |
| `TEXT` | `TEXT` | Direct mapping |
| `VARCHAR(n)` | `VARCHAR(n)` | Length preserved |
| `DATETIME` | `TIMESTAMP` | Timezone handling |
| `BOOLEAN` | `BOOLEAN` | Direct mapping |

## 🔧 Migration Process

### Phase 1: Schema Setup
1. Creates custom ENUM types
2. Creates all tables with proper constraints
3. Sets up foreign key relationships
4. Creates performance indexes

### Phase 2: Data Migration
1. **Users** (first - referenced by other tables)
2. **Refresh Tokens**
3. **Cemetries**
4. **Obituaries** (depends on users and cemetries)
5. **Related Data** (candles, visits, photos, etc.)

### Phase 3: Validation
1. Record count comparison
2. Data integrity checks
3. Foreign key validation
4. Sample data verification

## 🛠️ Advanced Usage

### Custom Migration

```javascript
const { ObituaryMigration } = require('./supabase-migration');

const migration = new ObituaryMigration();
await migration.initialize();

// Migrate specific tables
await migration.migrateUsers();
await migration.migrateObituaries();

// Generate report
migration.generateMigrationReport();
```

### Validation Only

```javascript
const { MigrationValidator } = require('./validate-migration');

const validator = new MigrationValidator();
await validator.initialize();
await validator.validateTableCounts();
await validator.validateDataIntegrity();
```

## 📈 Monitoring & Logging

The migration script provides comprehensive logging:

- **Progress Tracking**: Real-time migration status
- **Error Logging**: Detailed error information with context
- **Performance Metrics**: Migration timing and throughput
- **Validation Reports**: Data integrity verification

### Log Files Generated

- `migration-report-{timestamp}.json` - Complete migration log
- `validation-report-{timestamp}.json` - Validation results

## ⚠️ Important Considerations

### Before Migration

1. **Backup your MySQL database**
2. **Test on a copy first**
3. **Ensure Supabase project is ready**
4. **Check network connectivity**

### During Migration

1. **Don't interrupt the process**
2. **Monitor logs for errors**
3. **Ensure sufficient disk space**

### After Migration

1. **Run validation scripts**
2. **Test application functionality**
3. **Update application configuration**
4. **Monitor performance**

## 🔍 Troubleshooting

### Common Issues

**Connection Errors**
```bash
# Check MySQL connection
mysql -h localhost -u root -p obituary-db

# Test Supabase connection
curl -H "apikey: YOUR_KEY" https://your-project.supabase.co/rest/v1/
```

**Schema Creation Fails**
- Manually run SQL from `supabase-schema.sql` in Supabase SQL Editor
- Check for naming conflicts
- Verify permissions

**Data Migration Errors**
- Check foreign key constraints
- Verify data types compatibility
- Review error logs in migration report

**Validation Failures**
- Compare record counts manually
- Check for data transformation issues
- Verify foreign key relationships

## 📞 Support

If you encounter issues:

1. Check the generated error logs
2. Review the troubleshooting section
3. Verify your configuration
4. Test with a smaller dataset first

## 🔄 Rollback Plan

If you need to rollback:

1. Keep your MySQL database unchanged during migration
2. Drop Supabase tables if needed:
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   ```
3. Re-run setup if necessary

## ✅ Post-Migration Checklist

- [ ] All tables created successfully
- [ ] Record counts match between databases
- [ ] Foreign key relationships intact
- [ ] Application connects to Supabase
- [ ] Authentication works
- [ ] File uploads/downloads work
- [ ] Performance is acceptable
- [ ] Backup strategy updated
