const dotenv = require('dotenv');
dotenv.config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function testFetchCsv() {
  try {
    // 1. Sign in with our test admin credentials to get a session JWT token
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@admin.com',
      password: 'adminpassword'
    });
    if (error) {
      console.error('Login error:', error);
      return;
    }
    const token = data.session.access_token;
    console.log('JWT Token retrieved successfully.');

    // 2. Fetch the report?format=csv using the auth token
    const res = await fetch('http://localhost:4000/api/report?format=csv', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Response Status:', res.status);
    console.log('Response OK:', res.ok);
    console.log('Headers:');
    res.headers.forEach((val, key) => {
      console.log(`  ${key}: ${val}`);
    });

    const text = await res.text();
    console.log('Response Text length:', text.length);
    console.log('Response sample:', text.substring(0, 200));

  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testFetchCsv();
