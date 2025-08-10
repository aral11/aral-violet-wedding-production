const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase connectivity...');
console.log('URL configured:', supabaseUrl ? 'YES' : 'NO');
console.log('Key configured:', supabaseKey ? 'YES' : 'NO');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Environment variables not set properly');
  console.log('This is why the photos are not displaying from Supabase');
  process.exit(1);
}

console.log('URL preview:', supabaseUrl.substring(0, 40) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🔗 Testing connection to photos table...');
    const { data, error, count } = await supabase
      .from('photos')
      .select('*', { count: 'exact' });
    
    if (error) {
      console.log('❌ Supabase query error:', error.message);
      return;
    }
    
    console.log('✅ Connection successful!');
    console.log(`📸 Found ${count} total photos in database`);
    
    if (data && data.length > 0) {
      console.log('Sample photo data:');
      console.log({
        id: data[0].id,
        uploaded_by: data[0].uploaded_by,
        guest_name: data[0].guest_name,
        data_preview: data[0].photo_data?.substring(0, 50) + '...',
        created_at: data[0].created_at
      });
    } else {
      console.log('⚠️ No photos found in database - this is why gallery is empty');
    }
    
  } catch (err) {
    console.log('❌ Connection failed:', err.message);
    console.log('This explains why photos are not displaying');
  }
}

testConnection();
