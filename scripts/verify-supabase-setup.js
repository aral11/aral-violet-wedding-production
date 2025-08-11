import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.log('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySetup() {
  console.log('🔍 Verifying Supabase setup...');
  
  try {
    // Test database connection
    console.log('📊 Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('photos')
      .select('count', { count: 'exact', head: true });
      
    if (testError) {
      console.error('❌ Database connection failed:', testError.message);
      return false;
    }
    console.log('✅ Database connection successful');
    
    // Check if photos table has correct schema
    console.log('📋 Checking photos table schema...');
    const { data: schemaData, error: schemaError } = await supabase
      .from('photos')
      .select('*')
      .limit(1);
      
    if (schemaError) {
      console.error('❌ Photos table check failed:', schemaError.message);
      console.log('💡 Make sure the photos table exists with this schema:');
      console.log(`
CREATE TABLE public.photos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  photo_data text NOT NULL,
  uploaded_by text NULL DEFAULT 'admin'::text,
  created_at timestamp with time zone NULL DEFAULT now(),
  guest_name text NULL,
  CONSTRAINT photos_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_photos_created_at 
ON public.photos USING btree (created_at);
      `);
      return false;
    }
    console.log('✅ Photos table schema looks good');
    
    // Test storage bucket
    console.log('🗂️ Testing storage bucket...');
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('❌ Storage access failed:', bucketsError.message);
        return false;
      }
      
      const weddingPhotosBucket = buckets.find(bucket => bucket.name === 'wedding-photos');
      
      if (!weddingPhotosBucket) {
        console.log('⚠️ wedding-photos bucket not found');
        console.log('💡 Creating wedding-photos bucket...');
        
        const { data: newBucket, error: createError } = await supabase.storage.createBucket('wedding-photos', {
          public: true,
          fileSizeLimit: 26214400, // 25MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp']
        });
        
        if (createError) {
          console.error('❌ Failed to create bucket:', createError.message);
          console.log('💡 Please create the "wedding-photos" bucket manually in Supabase Dashboard');
          console.log('   - Go to Storage in your Supabase dashboard');
          console.log('   - Create a new bucket named "wedding-photos"');
          console.log('   - Make it public for read access');
          return false;
        }
        
        console.log('✅ wedding-photos bucket created successfully');
      } else {
        console.log('✅ wedding-photos bucket exists');
      }
      
      // Test file upload/delete
      console.log('📤 Testing file upload...');
      const testFile = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
      const testFileName = `test-${Date.now()}.png`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('wedding-photos')
        .upload(testFileName, testFile, {
          contentType: 'image/png'
        });
        
      if (uploadError) {
        console.error('❌ Test upload failed:', uploadError.message);
        return false;
      }
      
      console.log('✅ Test upload successful');
      
      // Clean up test file
      const { error: deleteError } = await supabase.storage
        .from('wedding-photos')
        .remove([testFileName]);
        
      if (deleteError) {
        console.warn('⚠️ Failed to clean up test file:', deleteError.message);
      } else {
        console.log('✅ Test file cleaned up');
      }
      
    } catch (storageError) {
      console.error('❌ Storage test failed:', storageError.message);
      return false;
    }
    
    console.log('🎉 All Supabase setup checks passed!');
    console.log('📸 Photo upload and display should work correctly');
    return true;
    
  } catch (error) {
    console.error('❌ Setup verification failed:', error.message);
    return false;
  }
}

verifySetup().then(success => {
  process.exit(success ? 0 : 1);
});
