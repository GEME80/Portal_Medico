const fs = require('fs');
const file = 'app/[slug]/admin/personalizar/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace IDENTIDAD tab
content = content.replace(/\{\/\* ── IDENTIDAD ─────────────────────────────────── \*\/\}[\s\S]*?\{\/\* ── HERO ──────────────────────────────────────── \*\/\}/, 
`{/* ── IDENTIDAD ─────────────────────────────────── */}
            {activeTab === "identidad" && (
              <div>
                <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--slate-200)" }}>
                  <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "18px" }}>👨‍⚕️ Identidad y Contacto</h2>
                  <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px" }}>Información básica, foto y datos de contacto.</p>
                </div>
                <div className="modal-body" style={{ maxHeight: "none" }}>
                  <div className="form-grid">
                    <div className="form-group full-width" style={{ borderBottom: "1px solid var(--slate-100)", paddingBottom: "24px", marginBottom: "8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                      <div>
                        <label className="form-label" style={{ fontWeight: 700 }}>Logotipo</label>
                        <div style={{ display: "flex", gap: "16px", alignItems: "center", marginTop: "8px" }}>
                          <div style={{ width: "80px", height: "80px", border: "1px dashed var(--slate-300)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--slate-50)", overflow: "hidden" }}>
                            {config.logo_url ? <img src={config.logo_url} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <span style={{ fontSize: "28px" }}>🛡️</span>}
                          </div>
                          <div>
                            <input type="file" accept="image/*" id="logo-upload" style={{ display: "none" }} onChange={handleLogoUpload} />
                            <label htmlFor="logo-upload" className="btn btn-outline" style={{ cursor: "pointer", fontSize: "13px", display: "inline-block" }}>{isPending ? "Subiendo..." : "Subir Logotipo"}</label>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="form-label" style={{ fontWeight: 700 }}>Foto del Doctor</label>
                        <div style={{ display: "flex", gap: "16px", alignItems: "center", marginTop: "8px" }}>
                          <div style={{ width: "80px", height: "80px", border: "1px dashed var(--slate-300)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--slate-50)", overflow: "hidden" }}>
                            {config.foto_url ? <img src={config.foto_url} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "28px" }}>👨‍⚕️</span>}
                          </div>
                          <div>
                            <input type="file" accept="image/*" id="foto-upload" style={{ display: "none" }} onChange={handleFotoUpload} />
                            <label htmlFor="foto-upload" className="btn btn-outline" style={{ cursor: "pointer", fontSize: "13px", display: "inline-block" }}>{isPending ? "Subiendo..." : "Subir Foto"}</label>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Field label="Nombre del doctor *" id="nombre_doctor" value={config.nombre_doctor} onChange={v => setConfig(c => ({ ...c, nombre_doctor: v }))} placeholder="Dr. Carlos Torres Martínez" />
                    <Field label="Título / Especialidad corta *" id="titulo_doctor" value={config.titulo_doctor} onChange={v => setConfig(c => ({ ...c, titulo_doctor: v }))} placeholder="Infectólogo Pediatra" />
                    <Field label="Especialidad completa" id="especialidad" value={config.especialidad} onChange={v => setConfig(c => ({ ...c, especialidad: v }))} placeholder="Infectología Pediátrica y Vacunología Clínica" fullWidth />
                    <Field label="Nombre de la clínica" id="nombre_clinica" value={config.nombre_clinica} onChange={v => setConfig(c => ({ ...c, nombre_clinica: v }))} placeholder="EcoVaccine Medical" fullWidth />

                    <h3 style={{ gridColumn: "1 / -1", fontSize: "15px", fontWeight: 700, marginTop: "16px", borderBottom: "1px solid var(--slate-200)", paddingBottom: "8px" }}>Información de Contacto</h3>
                    <Field label="Email" id="email" value={config.email} onChange={v => setConfig(c => ({ ...c, email: v }))} placeholder="doctor@clinica.com" type="email" />
                    <Field label="Teléfono" id="telefono" value={config.telefono} onChange={v => setConfig(c => ({ ...c, telefono: v }))} placeholder="+57 300 000 0000" type="tel" />
                    
                    <div className="form-group full-width" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label className="form-label">Canal de Chat</label>
                        <select className="form-input" value={waData.t} onChange={e => setWaData(waData.n, e.target.value)} style={{ background: "white" }}>
                          <option value="w">WhatsApp</option>
                          <option value="t">Telegram</option>
                        </select>
                      </div>
                      <div>
                        <label className="form-label">Número / Usuario</label>
                        <input className="form-input" value={waData.n} onChange={e => setWaData(e.target.value, waData.t)} placeholder="+57300... o @usuario" />
                      </div>
                    </div>

                    <Field label="Dirección" id="direccion" value={config.direccion} onChange={v => setConfig(c => ({ ...c, direccion: v }))} placeholder="Cra 7 # 32-16, Consultorio 401" fullWidth />
                    <Field label="Ciudad" id="ciudad" value={config.ciudad} onChange={v => setConfig(c => ({ ...c, ciudad: v }))} placeholder="Bogotá" />
                    <Field label="País" id="pais" value={config.pais} onChange={v => setConfig(c => ({ ...c, pais: v }))} placeholder="Colombia" />
                    <Field label="LinkedIn URL" id="linkedin" value={config.linkedin_url} onChange={v => setConfig(c => ({ ...c, linkedin_url: v }))} placeholder="https://linkedin.com/in/..." fullWidth />
                    <Field label="Instagram URL" id="instagram" value={config.instagram_url} onChange={v => setConfig(c => ({ ...c, instagram_url: v }))} placeholder="https://instagram.com/..." fullWidth />
                  </div>
                </div>
                <SaveBar onSave={saveConfig} isPending={isPending} />
              </div>
            )}

            {/* ── HERO ──────────────────────────────────────── */}`);

// Replace HERO, STATS, CONTACTO
content = content.replace(/\{\/\* ── HERO ──────────────────────────────────────── \*\/\}[\s\S]*?\{\/\* ── ESPECIALIDAD ──────────────────────── \*\/\}/, 
`{/* ── HERO Y CONTENIDO ─────────────────────────────────── */}
            {activeTab === "hero" && (
              <div>
                <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--slate-200)" }}>
                  <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "18px" }}>🖼️ Hero, Textos y Trayectoria</h2>
                  <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px" }}>Contenido principal de la página, biografías y trayectoria profesional.</p>
                </div>
                <div className="modal-body" style={{ maxHeight: "none" }}>
                  <div className="form-grid">
                    <h3 style={{ gridColumn: "1 / -1", fontSize: "15px", fontWeight: 700, borderBottom: "1px solid var(--slate-200)", paddingBottom: "8px" }}>Mensajes Flotantes (Globos sobre la foto)</h3>
                    <div className="form-group full-width" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "var(--slate-50)", padding: "16px", borderRadius: "12px" }}>
                      <Field label="Globo 1: Título" id="g1_t" value={heroData.g1_t} onChange={v => setHeroData("g1_t", v)} placeholder="15K+" />
                      <Field label="Globo 1: Subtítulo" id="g1_s" value={heroData.g1_s} onChange={v => setHeroData("g1_s", v)} placeholder="Pacientes" />
                      <Field label="Globo 2: Título" id="g2_t" value={heroData.g2_t} onChange={v => setHeroData("g2_t", v)} placeholder="100%" />
                      <Field label="Globo 2: Subtítulo" id="g2_s" value={heroData.g2_s} onChange={v => setHeroData("g2_s", v)} placeholder="Seguro" />
                    </div>

                    <h3 style={{ gridColumn: "1 / -1", fontSize: "15px", fontWeight: 700, marginTop: "16px", borderBottom: "1px solid var(--slate-200)", paddingBottom: "8px" }}>Textos del Hero</h3>
                    <Field label="Texto del badge superior" id="hero_badge" value={heroData.badge} onChange={v => setHeroData("badge", v)} placeholder="Infectólogo · +30 años de experiencia" fullWidth />
                    <Field label="Título principal" id="hero_titulo" value={config.hero_titulo} onChange={v => setConfig(c => ({ ...c, hero_titulo: v }))} placeholder="Ciencia, prevención y cuidado para cada familia" fullWidth />
                    <Field label="Subtítulo" id="hero_sub" value={config.hero_subtitulo} onChange={v => setConfig(c => ({ ...c, hero_subtitulo: v }))} placeholder="Vacunación basada en evidencia" fullWidth />
                    
                    <h3 style={{ gridColumn: "1 / -1", fontSize: "15px", fontWeight: 700, marginTop: "16px", borderBottom: "1px solid var(--slate-200)", paddingBottom: "8px" }}>Estadísticas (Hero)</h3>
                    <Field label="Años de experiencia" id="stat_anos" value={config.stat_anos_experiencia} onChange={v => setConfig(c => ({ ...c, stat_anos_experiencia: v }))} placeholder="30+" />
                    <Field label="Publicaciones científicas" id="stat_pub" value={config.stat_publicaciones} onChange={v => setConfig(c => ({ ...c, stat_publicaciones: v }))} placeholder="50+" />
                    <Field label="Pacientes al año" id="stat_pac" value={config.stat_pacientes_anio} onChange={v => setConfig(c => ({ ...c, stat_pacientes_anio: v }))} placeholder="2,000+" />
                    <Field label="Consultorios" id="stat_cons" value={config.stat_consultorios} onChange={v => setConfig(c => ({ ...c, stat_consultorios: v }))} placeholder="3" />

                    <h3 style={{ gridColumn: "1 / -1", fontSize: "15px", fontWeight: 700, marginTop: "16px", borderBottom: "1px solid var(--slate-200)", paddingBottom: "8px" }}>✍️ Redacción de Biografía Profesional</h3>
                    <div className="form-group full-width" style={{ background: "var(--slate-50)", padding: "16px", borderRadius: "12px", border: "1px solid var(--slate-200)" }}>
                      <div className="form-group full-width" style={{ marginBottom: "16px" }}>
                        <label className="form-label" htmlFor="bio_corta">Biografía corta (aparece en el hero)</label>
                        <textarea id="bio_corta" className="form-textarea" value={config.bio_corta} onChange={e => setConfig(c => ({ ...c, bio_corta: e.target.value }))} placeholder="Infectólogo Pediatra con más de 30 años de experiencia..." rows={3} style={{ background: "white" }} />
                      </div>
                      <div className="form-group full-width">
                        <label className="form-label" htmlFor="bio_larga">Biografía completa (página Sobre el Doctor)</label>
                        <textarea id="bio_larga" className="form-textarea" value={config.bio_larga} onChange={e => setConfig(c => ({ ...c, bio_larga: e.target.value }))} rows={6} placeholder="Descripción detallada..." style={{ background: "white" }} />
                      </div>
                    </div>
                    
                    <h3 style={{ gridColumn: "1 / -1", fontSize: "15px", fontWeight: 700, marginTop: "16px", borderBottom: "1px solid var(--slate-200)", paddingBottom: "8px" }}>Optimización para Buscadores (SEO)</h3>
                    <Field label="Meta título" id="meta_titulo" value={config.meta_titulo} onChange={v => setConfig(c => ({ ...c, meta_titulo: v }))} placeholder="Dr. Torres — Infectólogo Pediatra | EcoVaccine" fullWidth />
                    <div className="form-group full-width">
                      <label className="form-label" htmlFor="meta_desc">Meta descripción</label>
                      <textarea id="meta_desc" className="form-textarea" value={config.meta_descripcion} onChange={e => setConfig(c => ({ ...c, meta_descripcion: e.target.value }))} rows={2} placeholder="Describe el portal en 155 caracteres para Google..." />
                    </div>
                  </div>
                </div>
                <SaveBar onSave={saveConfig} isPending={isPending} />
              </div>
            )}

            {/* ── ESPECIALIDAD ──────────────────────── */}`);

// Replace ESPECIALIDAD, ALERTAS, INVESTIGACION, TIMELINE
content = content.replace(/\{\/\* ── ESPECIALIDAD ──────────────────────── \*\/\}[\s\S]*?\{\/\* ── LÍNEAS DE INVESTIGACIÓN ───────────────────── \*\/\}/, 
`{/* ── ESTILOS Y CONFIGURACION ─────────────────────────────── */}
            {activeTab === "estilos" && (
              <div>
                <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--slate-200)" }}>
                  <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "18px" }}>🎨 Estilos y Configuración</h2>
                  <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px" }}>Ajusta los colores de marca, el menú público y banners de alerta.</p>
                </div>
                <div className="modal-body" style={{ maxHeight: "none" }}>
                  <div className="form-grid">
                    <h3 style={{ gridColumn: "1 / -1", fontSize: "15px", fontWeight: 700, borderBottom: "1px solid var(--slate-200)", paddingBottom: "8px" }}>Colores de la Marca</h3>
                    <div className="form-group">
                      <label className="form-label">Color primario</label>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input type="color" value={config.color_primario} onChange={e => setConfig(c => ({ ...c, color_primario: e.target.value }))} style={{ width: "44px", height: "44px", border: "1px solid var(--slate-200)", borderRadius: "var(--radius-sm)", cursor: "pointer" }} />
                        <span style={{ fontSize: "13px", color: "var(--slate-600)", fontFamily: "monospace" }}>{config.color_primario}</span>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Color de acento</label>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input type="color" value={config.color_acento} onChange={e => setConfig(c => ({ ...c, color_acento: e.target.value }))} style={{ width: "44px", height: "44px", border: "1px solid var(--slate-200)", borderRadius: "var(--radius-sm)", cursor: "pointer" }} />
                        <span style={{ fontSize: "13px", color: "var(--slate-600)", fontFamily: "monospace" }}>{config.color_acento}</span>
                      </div>
                    </div>

                    <h3 style={{ gridColumn: "1 / -1", fontSize: "15px", fontWeight: 700, marginTop: "16px", borderBottom: "1px solid var(--slate-200)", paddingBottom: "8px" }}>Pestaña de Especialidad / Inventario</h3>
                    <div className="form-group full-width" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <input type="checkbox" id="habilitar_menu_vacunas" checked={config.habilitar_menu_vacunas !== false} onChange={e => setConfig(c => ({ ...c, habilitar_menu_vacunas: e.target.checked }))} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
                      <label htmlFor="habilitar_menu_vacunas" style={{ fontSize: "14px", fontWeight: 700, color: "var(--slate-900)", cursor: "pointer" }}>Habilitar pestaña de portafolio / inventario pública</label>
                    </div>
                    <Field label="Nombre de la pestaña en el menú *" id="nombre_menu_vacunas" value={config.nombre_menu_vacunas || "EcoVaccine"} onChange={v => setConfig(c => ({ ...c, nombre_menu_vacunas: v }))} placeholder="EcoVaccine, Servicios, Tratamientos, etc." fullWidth />
                    <Field label="Título Hero de la página *" id="vacunas_hero_titulo" value={config.vacunas_hero_titulo || "Vacunas seguras, niños protegidos"} onChange={v => setConfig(c => ({ ...c, vacunas_hero_titulo: v }))} placeholder="Vacunas seguras, niños protegidos" fullWidth />
                    <Field label="Subtítulo Hero de la página *" id="vacunas_hero_subtitulo" value={config.vacunas_hero_subtitulo || "EcoVaccine — Vacunación Basada en Evidencia"} onChange={v => setConfig(c => ({ ...c, vacunas_hero_subtitulo: v }))} placeholder="EcoVaccine — Vacunación Basada en Evidencia" fullWidth />
                    <div className="form-group full-width">
                      <label className="form-label" htmlFor="vacunas_hero_descripcion">Descripción Hero de la página</label>
                      <textarea id="vacunas_hero_descripcion" className="form-textarea" value={config.vacunas_hero_descripcion || ""} onChange={e => setConfig(c => ({ ...c, vacunas_hero_descripcion: e.target.value }))} placeholder="Descripción detallada..." rows={2} />
                    </div>
                    <Field label="Título de la sección de preguntas/mitos *" id="vacunas_mitos_titulo" value={config.vacunas_mitos_titulo || "Mitos Vacunales"} onChange={v => setConfig(c => ({ ...c, vacunas_mitos_titulo: v }))} placeholder="Mitos Vacunales, Preguntas Frecuentes, etc." />
                    <Field label="Título de la sección de disponibilidad/esquemas *" id="vacunas_inventario_titulo" value={config.vacunas_inventario_titulo || "Vacunas Disponibles y Esquemas de Aplicación"} onChange={v => setConfig(c => ({ ...c, vacunas_inventario_titulo: v }))} placeholder="Procedimientos Disponibles, Portafolio, etc." />

                    <h3 style={{ gridColumn: "1 / -1", fontSize: "15px", fontWeight: 700, marginTop: "16px", borderBottom: "1px solid var(--slate-200)", paddingBottom: "8px" }}>Alerta Epidemiológica Global</h3>
                    <div className="form-group full-width" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <input type="checkbox" id="alert_activa" checked={alertActiva} onChange={e => setAlertActiva(e.target.checked)} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
                      <label htmlFor="alert_activa" style={{ fontSize: "14px", fontWeight: 700, color: "var(--slate-900)", cursor: "pointer" }}>Activar banner de alerta global en el portal</label>
                    </div>
                    <Field label="Título de la alerta *" id="alert_titulo" value={alertTitulo} onChange={setAlertTitulo} placeholder="Ej: Brote de Sarampión" fullWidth />
                    <div className="form-group full-width">
                      <label className="form-label" htmlFor="alert_descripcion">Descripción detallada</label>
                      <textarea id="alert_descripcion" className="form-textarea" value={alertDescripcion} onChange={e => setAlertDescripcion(e.target.value)} placeholder="Recomendaciones..." rows={2} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="alert_nivel">Nivel de Alerta</label>
                      <select id="alert_nivel" className="form-input" value={alertNivel} onChange={e => setAlertNivel(e.target.value as any)} style={{ height: "46px", background: "white", cursor: "pointer" }}>
                        <option value="info">🔵 Informativa (Info)</option>
                        <option value="warning">🟡 Advertencia (Warning)</option>
                        <option value="critical">🔴 Peligro Inminente (Critical)</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div style={{ padding: "16px 28px", borderTop: "1px solid var(--slate-200)", background: "var(--slate-50)", display: "flex", justifyContent: "space-between" }}>
                  <button type="button" className="btn btn-outline" onClick={saveAlert} disabled={isPending}>Guardar alerta</button>
                  <button type="button" className="btn btn-primary" onClick={saveConfig} disabled={isPending}>{isPending ? "Guardando..." : "✓ Guardar cambios"}</button>
                </div>
              </div>
            )}

            {/* ── LÍNEAS DE INVESTIGACIÓN ───────────────────── */}`);

// We also need to move lineas de investigacion and timeline INTO the "hero" tab? No, wait! They are not currently active in TABS!
// TABS only has "identidad", "hero", "estilos".
// If they are not in TABS, how do we reach them?
// The plan says: "Hero y Contenido: Biografías, Estadísticas, Líneas de Investigación, Trayectoria."
// I will just change the conditional for LÍNEAS and TIMELINE to render inside the "hero" tab!
content = content.replace(/\{\/\* ── LÍNEAS DE INVESTIGACIÓN ───────────────────── \*\/\}[\s\S]*?\{\/\* ── TIMELINE ──────────────────────────────────── \*\/\}/, 
`{/* ── LÍNEAS DE INVESTIGACIÓN ───────────────────── */}
            {activeTab === "hero" && (
              <div>
                <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--slate-200)", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "4px solid var(--slate-100)" }}>
                  <div>
                    <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "18px" }}>🔬 Líneas de Investigación</h2>
                    <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px" }}>Tarjetas que aparecen en el home.</p>
                  </div>
                  <button type="button" className="btn btn-emerald" style={{ fontSize: "13px" }} onClick={() => setLineas(l => [...l, { id: uid(), icono: "🔬", titulo: "", descripcion: "", orden: l.length + 1 }])}>＋ Agregar</button>
                </div>
                <div className="modal-body" style={{ maxHeight: "none" }}>
                  {lineas.length === 0 && <div className="empty-state"><div className="empty-state-icon">🔬</div><div className="empty-state-title">Sin líneas aún</div></div>}
                  {lineas.map((l, i) => (
                    <div key={l.id} style={{ border: "1px solid var(--slate-200)", borderRadius: "var(--radius-lg)", padding: "20px", marginBottom: "16px" }}>
                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label">Ícono (emoji)</label>
                          <input className="form-input" value={l.icono} onChange={e => setLineas(ls => ls.map((x, j) => j === i ? { ...x, icono: e.target.value } : x))} placeholder="🔬" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Título *</label>
                          <input className="form-input" value={l.titulo} onChange={e => setLineas(ls => ls.map((x, j) => j === i ? { ...x, titulo: e.target.value } : x))} placeholder="Vacunología Clínica" required />
                        </div>
                        <div className="form-group full-width">
                          <label className="form-label">Descripción</label>
                          <textarea className="form-textarea" value={l.descripcion} onChange={e => setLineas(ls => ls.map((x, j) => j === i ? { ...x, descripcion: e.target.value } : x))} rows={2} />
                        </div>
                      </div>
                      <button type="button" className="action-btn action-btn-danger" style={{ marginTop: "8px" }} onClick={() => setLineas(ls => ls.filter((_, j) => j !== i))}>🗑 Eliminar</button>
                    </div>
                  ))}
                </div>
                <SaveBar onSave={saveLineas} isPending={isPending} label="Guardar líneas" />
              </div>
            )}

            {/* ── TIMELINE ──────────────────────────────────── */}`);

content = content.replace(/\{\/\* ── TIMELINE ──────────────────────────────────── \*\/\}[\s\S]*?<\/div>\n\s*<\/div>\n\s*<\/div>\n\n\s*\{\/\* TOAST \*\/\}/, 
`{/* ── TIMELINE ──────────────────────────────────── */}
            {activeTab === "hero" && (
              <div>
                <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--slate-200)", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "4px solid var(--slate-100)" }}>
                  <div>
                    <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "18px" }}>🎓 Trayectoria Académica</h2>
                    <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px" }}>Hitos que aparecen en el timeline del home.</p>
                  </div>
                  <button type="button" className="btn btn-emerald" style={{ fontSize: "13px" }} onClick={() => setHitos(h => [...h, { id: uid(), anio: "", titulo: "", institucion: "", orden: h.length + 1 }])}>＋ Agregar</button>
                </div>
                <div className="modal-body" style={{ maxHeight: "none" }}>
                  {hitos.length === 0 && <div className="empty-state"><div className="empty-state-icon">🎓</div><div className="empty-state-title">Sin hitos aún</div></div>}
                  {hitos.map((h, i) => (
                    <div key={h.id} style={{ border: "1px solid var(--slate-200)", borderRadius: "var(--radius-lg)", padding: "20px", marginBottom: "16px" }}>
                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label">Año *</label>
                          <input className="form-input" value={h.anio} onChange={e => setHitos(hs => hs.map((x, j) => j === i ? { ...x, anio: e.target.value } : x))} placeholder="2002" inputMode="numeric" required />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Título *</label>
                          <input className="form-input" value={h.titulo} onChange={e => setHitos(hs => hs.map((x, j) => j === i ? { ...x, titulo: e.target.value } : x))} placeholder="Fellowship en Infectología" required />
                        </div>
                        <div className="form-group full-width">
                          <label className="form-label">Institución</label>
                          <input className="form-input" value={h.institucion} onChange={e => setHitos(hs => hs.map((x, j) => j === i ? { ...x, institucion: e.target.value } : x))} placeholder="Hospital Garrahan, Buenos Aires" />
                        </div>
                      </div>
                      <button type="button" className="action-btn action-btn-danger" style={{ marginTop: "8px" }} onClick={() => setHitos(hs => hs.filter((_, j) => j !== i))}>🗑 Eliminar</button>
                    </div>
                  ))}
                </div>
                <SaveBar onSave={saveHitos} isPending={isPending} label="Guardar trayectoria" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TOAST */}`);

fs.writeFileSync(file, content, 'utf8');
console.log('Tabs refactored successfully.');
