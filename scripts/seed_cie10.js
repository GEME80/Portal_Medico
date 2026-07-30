const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const JSON_URL = 'https://raw.githubusercontent.com/cayasso/cie10/master/cie10-array.json';

async function seedCIE10() {
  console.log('Iniciando descarga de CIE-10...');
  
  https.get(JSON_URL, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', async () => {
      try {
        const cie10Data = JSON.parse(data);
        console.log(`Descargados ${cie10Data.length} registros. Procesando...`);
        
        // Formatear para BD
        const records = cie10Data.map(item => ({
          codigo: item.c,
          descripcion: item.d,
          activo: true
        }));

        // Insertar en lotes de 1000 para no sobrecargar
        const BATCH_SIZE = 1000;
        let inserted = 0;

        for (let i = 0; i < records.length; i += BATCH_SIZE) {
          const batch = records.slice(i, i + BATCH_SIZE);
          const { error } = await supabase.from('catalogo_cie10').insert(batch);
          
          if (error) {
            console.error('Error insertando lote:', error);
            return;
          }
          
          inserted += batch.length;
          console.log(`Progreso: ${inserted} / ${records.length}`);
        }
        
        console.log('¡Seeding de CIE-10 completado con éxito!');
      } catch (err) {
        console.error('Error procesando JSON:', err);
      }
    });
  }).on('error', (err) => {
    console.error('Error descargando JSON:', err);
  });
}

seedCIE10();
