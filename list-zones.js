const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listZones() {
  const { data, error } = await supabase
    .from('zones')
    .select('id, name, is_active');
  
  if (error) {
    console.error('Erreur:', error);
  } else {
    console.log('Zones disponibles:');
    data.forEach(z => {
      console.log(`  - ${z.name} (${z.id}) - ${z.is_active ? 'ACTIVE' : 'INACTIVE'}`);
    });
    console.log('\nURL d\'achat:');
    data.filter(z => z.is_active).forEach(z => {
      console.log(`  http://localhost:3000/zone/${z.id}/buy`);
    });
  }
}

listZones();
