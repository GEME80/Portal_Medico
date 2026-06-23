const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
  if (match) {
    const key = match[1].trim();
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    env[key] = val;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY; // Let's use service_role to verify if it's a schema issue or RLS issue

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const tenantId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  
  // Test 1: Update including id and tenant_id
  console.log("Test 1: Updating with id and tenant_id...");
  const payload1 = {
    id: '12bd435d-0e82-48a1-b356-3da990cf58fa',
    tenant_id: tenantId,
    bio_corta: 'Infectólogo Pediatra con más de 30 años de experiencia en Colombia y Latinoamérica. (Test 1)',
    updated_at: new Date().toISOString()
  };
  
  const res1 = await supabase
    .from('configuracion_portal')
    .update(payload1)
    .eq('tenant_id', tenantId);
    
  console.log("Test 1 Result:", res1.error ? `Error: ${res1.error.message} (${res1.error.code})` : "Success!");

  // Test 2: Update excluding id and tenant_id
  console.log("\nTest 2: Updating WITHOUT id and tenant_id...");
  const payload2 = {
    bio_corta: 'Infectólogo Pediatra con más de 30 años de experiencia en Colombia y Latinoamérica.',
    updated_at: new Date().toISOString()
  };
  
  const res2 = await supabase
    .from('configuracion_portal')
    .update(payload2)
    .eq('tenant_id', tenantId);
    
  console.log("Test 2 Result:", res2.error ? `Error: ${res2.error.message} (${res2.error.code})` : "Success!");
}

run();
