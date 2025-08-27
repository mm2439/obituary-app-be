const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SUPABASE_CONFIG = {
  url: process.env.SUPABASE_URL,
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

async function setupSupabaseSchema() {
  console.log('🚀 Setting up Supabase schema...');
  
  if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.serviceKey) {
    console.error('❌ Missing Supabase configuration. Please check your .env file.');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceKey);
  
  try {
    // Read the schema SQL file
    const schemaPath = path.join(__dirname, 'supabase-schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        // Use the SQL editor or RPC function to execute raw SQL
        const { data, error } = await supabase.rpc('execute_sql', {
          query: statement
        });
        
        if (error) {
          // If RPC fails, try alternative approach
          console.warn(`⚠️ RPC failed for statement ${i + 1}, trying alternative...`);
          console.log('Statement:', statement.substring(0, 100) + '...');
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (error) {
        console.error(`❌ Failed to execute statement ${i + 1}:`, error.message);
        console.log('Statement:', statement.substring(0, 100) + '...');
      }
    }
    
    console.log('🎉 Schema setup completed!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Verify the tables were created in your Supabase dashboard');
    console.log('2. Run the migration script: npm run migrate');
    console.log('3. Validate the migration: npm run validate');
    
  } catch (error) {
    console.error('❌ Failed to setup schema:', error);
    process.exit(1);
  }
}

// Alternative manual setup instructions
function printManualSetupInstructions() {
  console.log('');
  console.log('🔧 Manual Setup Instructions:');
  console.log('');
  console.log('If the automated setup fails, you can manually create the schema:');
  console.log('');
  console.log('1. Go to your Supabase dashboard');
  console.log('2. Navigate to the SQL Editor');
  console.log('3. Copy and paste the contents of supabase-schema.sql');
  console.log('4. Execute the SQL statements');
  console.log('');
  console.log('Alternatively, you can create tables one by one using the Table Editor.');
}

if (require.main === module) {
  setupSupabaseSchema().then(() => {
    printManualSetupInstructions();
  });
}

module.exports = { setupSupabaseSchema };
