const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nstiomejmhmcasxqxnbf.supabase.co';
const supabaseKey = 'sb_secret_SsKNgZ82ZkbgeJHeCrE7mg_eEJ4ZVS2';

const supabase = createClient(supabaseUrl, supabaseKey);
const tenantId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'; // Dr. Carlos Torres

async function run() {
  try {
    console.log("Iniciando generación de datos de prueba multicategoría...");

    // 1. Crear / Asegurar Categorías
    console.log("1. Creando/Asegurando categorías...");
    const { data: existingCats, error: getCatsErr } = await supabase
      .from('categorias_inventario')
      .select('*')
      .eq('tenant_id', tenantId);
      
    if (getCatsErr) throw getCatsErr;
    
    let jeringasCat = existingCats.find(c => c.nombre === 'Jeringas');
    let suerosCat = existingCats.find(c => c.nombre === 'Sueros');
    
    if (!jeringasCat) {
      console.log("Insertando categoría Jeringas...");
      const { data: insCat, error: insErr } = await supabase
        .from('categorias_inventario')
        .insert({ tenant_id: tenantId, nombre: 'Jeringas', color: '#f59e0b', activo: true })
        .select()
        .single();
      if (insErr) throw insErr;
      jeringasCat = insCat;
    }
    
    if (!suerosCat) {
      console.log("Insertando categoría Sueros...");
      const { data: insCat, error: insErr } = await supabase
        .from('categorias_inventario')
        .insert({ tenant_id: tenantId, nombre: 'Sueros', color: '#3b82f6', activo: true })
        .select()
        .single();
      if (insErr) throw insErr;
      suerosCat = insCat;
    }
    
    console.log("Categorías listas:", jeringasCat.nombre, suerosCat.nombre);

    // 2. Crear / Asegurar Ítems
    console.log("2. Creando/Asegurando productos...");
    const { data: existingItems, error: getItemsErr } = await supabase
      .from('inventario_medico')
      .select('*')
      .eq('tenant_id', tenantId);
      
    if (getItemsErr) throw getItemsErr;
    
    const itemsToUpsert = [
      {
        nombre: 'Jeringa BD 1ml',
        nombre_generico: 'Jeringa Tuberculina',
        laboratorio: 'Becton Dickinson',
        via_admin: 'Subcutánea',
        stock_actual: 50,
        stock_minimo: 20,
        precio_venta: 1500,
        valor_mayorista: 600,
        categoria_id: jeringasCat.id
      },
      {
        nombre: 'Jeringa BD 5ml',
        nombre_generico: 'Jeringa Descartable 5ml',
        laboratorio: 'Becton Dickinson',
        via_admin: 'Intramuscular',
        stock_actual: 80,
        stock_minimo: 25,
        precio_venta: 2000,
        valor_mayorista: 800,
        categoria_id: jeringasCat.id
      },
      {
        nombre: 'Solución Salina 0.9% 500ml',
        nombre_generico: 'Suero Fisiológico',
        laboratorio: 'Baxter Labs',
        via_admin: 'Intravenosa',
        stock_actual: 30,
        stock_minimo: 10,
        precio_venta: 12000,
        valor_mayorista: 4500,
        categoria_id: suerosCat.id
      },
      {
        nombre: 'Ringer Lactato 500ml',
        nombre_generico: 'Solución Hartmann',
        laboratorio: 'Baxter Labs',
        via_admin: 'Intravenosa',
        stock_actual: 0,
        stock_minimo: 8,
        precio_venta: 15000,
        valor_mayorista: 5200,
        categoria_id: suerosCat.id
      }
    ];
    
    const finalItems = [];
    for (const item of itemsToUpsert) {
      let existingItem = existingItems.find(i => i.nombre === item.nombre);
      if (!existingItem) {
        console.log(`Insertando producto ${item.nombre}...`);
        const { data: insItem, error: insErr } = await supabase
          .from('inventario_medico')
          .insert({ tenant_id: tenantId, ...item })
          .select()
          .single();
        if (insErr) throw insErr;
        existingItem = insItem;
      } else {
        console.log(`Actualizando producto ${item.nombre}...`);
        const { data: updItem, error: updErr } = await supabase
          .from('inventario_medico')
          .update({ categoria_id: item.categoria_id, precio_venta: item.precio_venta, valor_mayorista: item.valor_mayorista })
          .eq('id', existingItem.id)
          .select()
          .single();
        if (updErr) throw updErr;
        existingItem = updItem;
      }
      finalItems.push(existingItem);
    }

    const jeringa1 = finalItems.find(i => i.nombre === 'Jeringa BD 1ml');
    const jeringa5 = finalItems.find(i => i.nombre === 'Jeringa BD 5ml');
    const sueroSal = finalItems.find(i => i.nombre === 'Solución Salina 0.9% 500ml');

    // 3. Crear Lotes de compra históricos
    console.log("3. Creando lotes de compra históricos con inflación...");
    const lotesData = [];
    const today = new Date();
    
    // Jeringa 1ml (hace 4 meses vs hace 1 mes: incremento de 400 a 500 = +25%)
    const f4Meses = new Date(); f4Meses.setMonth(today.getMonth() - 4);
    const f1Mes = new Date(); f1Mes.setMonth(today.getMonth() - 1);
    lotesData.push({
      tenant_id: tenantId,
      item_id: jeringa1.id,
      numero_lote: 'JER-L1-4M',
      cantidad: 100,
      fecha_vencimiento: '2028-12-31',
      precio_compra: 400,
      proveedor: 'Distribuidora Médica Andina',
      fecha_registro: f4Meses.toISOString().split('T')[0]
    });
    lotesData.push({
      tenant_id: tenantId,
      item_id: jeringa1.id,
      numero_lote: 'JER-L2-1M',
      cantidad: 100,
      fecha_vencimiento: '2029-06-30',
      precio_compra: 500,
      proveedor: 'Distribuidora Médica Andina',
      fecha_registro: f1Mes.toISOString().split('T')[0]
    });

    // Jeringa 5ml (hace 3 meses vs hace 10 dias: incremento de 600 a 720 = +20%)
    const f3Meses = new Date(); f3Meses.setMonth(today.getMonth() - 3);
    const f10Dias = new Date(); f10Dias.setDate(today.getDate() - 10);
    lotesData.push({
      tenant_id: tenantId,
      item_id: jeringa5.id,
      numero_lote: 'JER5-L1-3M',
      cantidad: 120,
      fecha_vencimiento: '2028-10-15',
      precio_compra: 600,
      proveedor: 'Farma Express',
      fecha_registro: f3Meses.toISOString().split('T')[0]
    });
    lotesData.push({
      tenant_id: tenantId,
      item_id: jeringa5.id,
      numero_lote: 'JER5-L2-10D',
      cantidad: 100,
      fecha_vencimiento: '2029-04-12',
      precio_compra: 720,
      proveedor: 'Farma Express',
      fecha_registro: f10Dias.toISOString().split('T')[0]
    });

    // Suero Salino (hace 5 meses vs hace 15 dias: incremento de 3200 a 4000 = +25%)
    const f5Meses = new Date(); f5Meses.setMonth(today.getMonth() - 5);
    const f15Dias = new Date(); f15Dias.setDate(today.getDate() - 15);
    lotesData.push({
      tenant_id: tenantId,
      item_id: sueroSal.id,
      numero_lote: 'SAL-L1-5M',
      cantidad: 50,
      fecha_vencimiento: '2028-06-01',
      precio_compra: 3200,
      proveedor: 'Baxter Distribuciones',
      fecha_registro: f5Meses.toISOString().split('T')[0]
    });
    lotesData.push({
      tenant_id: tenantId,
      item_id: sueroSal.id,
      numero_lote: 'SAL-L2-15D',
      cantidad: 50,
      fecha_vencimiento: '2029-03-24',
      precio_compra: 4000,
      proveedor: 'Baxter Distribuciones',
      fecha_registro: f15Dias.toISOString().split('T')[0]
    });

    const { data: lotes, error: lotesErr } = await supabase
      .from('lotes_inventario')
      .insert(lotesData)
      .select();

    if (lotesErr) throw lotesErr;
    console.log(`Lotes creados: ${lotes.length}`);

    // 4. Crear Movimientos (Salidas / Consumos)
    console.log("4. Creando movimientos de salidas...");
    const movsData = [];

    // Generar salidas distribuidas en el tiempo para ver gráficas
    const itemsList = [jeringa1, jeringa5, sueroSal];
    itemsList.forEach(item => {
      // Salidas hace varios meses
      for (let monthOffset = 0; monthOffset <= 4; monthOffset++) {
        const date = new Date();
        date.setMonth(today.getMonth() - monthOffset);
        date.setDate(15);

        // Salida normal (Precio Paciente)
        movsData.push({
          tenant_id: tenantId,
          item_id: item.id,
          tipo_movimiento: 'SALIDA',
          cantidad: Math.floor(Math.random() * 8) + 2,
          fecha: date.toISOString().split('T')[0],
          notas: 'Consumo clínico diario',
          valor_unitario_cobrado: item.precio_venta
        });

        // Salida a costo mayorista (Convenios)
        movsData.push({
          tenant_id: tenantId,
          item_id: item.id,
          tipo_movimiento: 'SALIDA',
          cantidad: Math.floor(Math.random() * 5) + 1,
          fecha: date.toISOString().split('T')[0],
          notas: 'Consumo convenio mayorista',
          valor_unitario_cobrado: item.valor_mayorista
        });
      }
    });

    // Registrar alguna Merma para probar
    movsData.push({
      tenant_id: tenantId,
      item_id: jeringa1.id,
      tipo_movimiento: 'SALIDA',
      cantidad: 5,
      fecha: today.toISOString().split('T')[0],
      motivo: 'MERMA_VENCIMIENTO',
      notas: 'Merma por vencimiento de lote antiguo',
      valor_unitario_cobrado: 0
    });

    movsData.push({
      tenant_id: tenantId,
      item_id: sueroSal.id,
      tipo_movimiento: 'SALIDA',
      cantidad: 2,
      fecha: today.toISOString().split('T')[0],
      motivo: 'MERMA_ROTO',
      notas: 'Merma por rotura de cadena de frío/embalaje',
      valor_unitario_cobrado: 0
    });

    const { data: movs, error: movsErr } = await supabase
      .from('movimientos_inventario')
      .insert(movsData)
      .select();

    if (movsErr) throw movsErr;
    console.log(`Movimientos creados: ${movs.length}`);

    console.log("\n¡Felicidades! Los datos multicategoría (Jeringas, Sueros y Vacunas) han sido seeded con éxito en la base de datos.");
    console.log("Puedes verificar el dashboard para probar los filtros de categoría y los gráficos dinámicos.");

  } catch (err) {
    console.error("Error en ejecución de script:", err);
  }
}

run();
