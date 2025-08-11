// Simple test to check if Supabase Storage bucket exists
import { createClient } from '@supabase/supabase-js';

// Use the environment variables that are now set
const supabaseUrl = 'https://hhuecxtsebhitmpcpubt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhodWVjeHRzZWJoaXRtcGNwdWJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0OTY3NTEsImV4cCI6MjA3MDA3Mjc1MX0.CIyqNK3LAaDGQd-zURt-eaPcmbhn1ZgTNKKYw832y9A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSetup() {
  console.log('🔍 Testing Supabase setup...');
  
  try {
    // Test database connection
    console.log('📊 Testing database connection...');
    const { data, error } = await supabase
      .from('photos')
      .select('count', { count: 'exact', head: true });
      
    if (error) {
      console.error('❌ Database error:', error.message);
      return;
    }
    console.log('✅ Database connection successful');
    
    // Test storage buckets
    console.log('🗂️ Checking storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Storage error:', bucketsError.message);
      return;
    }
    
    console.log('Available buckets:', buckets.map(b => b.name));
    
    const weddingPhotosBucket = buckets.find(bucket => bucket.name === 'wedding-photos');
    
    if (!weddingPhotosBucket) {
      console.log('⚠️ wedding-photos bucket not found. Creating it...');
      
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('wedding-photos', {
        public: true,
        fileSizeLimit: 26214400, // 25MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp']
      });
      
      if (createError) {
        console.error('❌ Failed to create bucket:', createError.message);
        console.log('💡 Please manually create "wedding-photos" bucket in Supabase Dashboard');
        return;
      }
      
      console.log('✅ wedding-photos bucket created successfully');
    } else {
      console.log('✅ wedding-photos bucket exists');
    }
    
    console.log('🎉 Setup check complete!');
    
  } catch (error) {
    console.error('❌ Setup test failed:', error.message);
  }
}

testSetup();
