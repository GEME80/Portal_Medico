-- ============================================================
-- EcoVaccine Platform — Schema Multi-Tenant
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- ─── EXTENSIONES ────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. TENANTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  nombre      TEXT NOT NULL,
  plan        TEXT DEFAULT 'starter' CHECK (plan IN ('starter','pro','enterprise')),
  activo      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── 2. CONFIGURACIÓN DEL PORTAL (home parametrizable) ──────
CREATE TABLE IF NOT EXISTS configuracion_portal (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id             UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,

  -- Identidad
  nombre_doctor         TEXT DEFAULT '',
  titulo_doctor         TEXT DEFAULT '',
  especialidad          TEXT DEFAULT '',
  foto_url              TEXT DEFAULT '',
  nombre_clinica        TEXT DEFAULT '',
  logo_url              TEXT DEFAULT '',
  bio_corta             TEXT DEFAULT '',
  bio_larga             TEXT DEFAULT '',

  -- Hero
  hero_titulo           TEXT DEFAULT '',
  hero_subtitulo        TEXT DEFAULT '',
  hero_badge_texto      TEXT DEFAULT '',

  -- Stats contadores
  stat_anos_experiencia TEXT DEFAULT '30+',
  stat_publicaciones    TEXT DEFAULT '50+',
  stat_pacientes_anio   TEXT DEFAULT '2,000+',
  stat_consultorios     TEXT DEFAULT '3',

  -- Contacto
  email                 TEXT DEFAULT '',
  telefono              TEXT DEFAULT '',
  whatsapp              TEXT DEFAULT '',
  direccion             TEXT DEFAULT '',
  ciudad                TEXT DEFAULT '',
  pais                  TEXT DEFAULT 'Colombia',

  -- Redes
  linkedin_url          TEXT DEFAULT '',
  instagram_url         TEXT DEFAULT '',

  -- Tema visual
  color_primario        TEXT DEFAULT '#0A4D5C',
  color_acento          TEXT DEFAULT '#00D4AA',

  -- SEO
  meta_titulo           TEXT DEFAULT '',
  meta_descripcion      TEXT DEFAULT '',

  updated_at            TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id)
);

-- ─── 3. LÍNEAS DE INVESTIGACIÓN ─────────────────────────────
CREATE TABLE IF NOT EXISTS lineas_investigacion (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  icono       TEXT DEFAULT '🔬',
  titulo      TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  orden       INT DEFAULT 0,
  activo      BOOLEAN DEFAULT true
);

-- ─── 4. HITOS TIMELINE ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS hitos_timeline (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  anio        TEXT NOT NULL,
  titulo      TEXT NOT NULL,
  institucion TEXT DEFAULT '',
  orden       INT DEFAULT 0
);

-- ─── 5. NOTICIAS / CMS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS noticias_posts (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id           UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  titulo              TEXT NOT NULL,
  slug                TEXT NOT NULL,
  contenido_markdown  TEXT DEFAULT '',
  resumen             TEXT DEFAULT '',
  emoji               TEXT DEFAULT '📄',
  categoria           TEXT CHECK (categoria IN ('Académico','Prevención','Epidemiología','EcoVaccine')) DEFAULT 'Académico',
  imagen_portada_url  TEXT DEFAULT '',
  enviar_telegram     BOOLEAN DEFAULT false,
  publicado           BOOLEAN DEFAULT false,
  autor_id            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, slug)
);

-- ─── 6. MITOS VACUNALES ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS mitos_vacunales (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  mito      TEXT NOT NULL,
  respuesta TEXT NOT NULL,
  fuente    TEXT DEFAULT '',
  orden     INT DEFAULT 0,
  activo    BOOLEAN DEFAULT true
);

-- ─── 7. INVENTARIO VACUNAS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS inventario_vacunas (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  nombre          TEXT NOT NULL,
  nombre_generico TEXT DEFAULT '',
  laboratorio     TEXT DEFAULT '',
  enfermedad      TEXT DEFAULT '',
  via_admin       TEXT DEFAULT 'Intramuscular',
  esquema_dosis   TEXT DEFAULT '',
  stock_actual    INT DEFAULT 0,
  stock_minimo    INT DEFAULT 5,
  precio_venta    NUMERIC(12,2) DEFAULT 0,
  temperatura     TEXT DEFAULT '2-8°C',
  descripcion     TEXT DEFAULT '',
  lote_activo     TEXT DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── 8. MOVIMIENTOS DE VACUNAS ──────────────────────────────
CREATE TABLE IF NOT EXISTS movimientos_vacunas (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  vacuna_id       UUID REFERENCES inventario_vacunas(id) ON DELETE CASCADE NOT NULL,
  tipo_movimiento TEXT CHECK (tipo_movimiento IN ('ENTRADA','SALIDA')) NOT NULL,
  cantidad        INT NOT NULL,
  motivo          TEXT DEFAULT '',
  notas           TEXT DEFAULT '',
  usuario_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  fecha           DATE DEFAULT CURRENT_DATE
);

-- ─── 9. LOTES DE VACUNAS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS lotes_vacunas (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id          UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  vacuna_id          UUID REFERENCES inventario_vacunas(id) ON DELETE CASCADE NOT NULL,
  numero_lote        TEXT NOT NULL,
  cantidad           INT NOT NULL,
  fecha_fabricacion  DATE,
  fecha_vencimiento  DATE NOT NULL,
  proveedor          TEXT DEFAULT '',
  precio_compra      NUMERIC(12,2),
  numero_factura     TEXT DEFAULT '',
  fecha_registro     DATE DEFAULT CURRENT_DATE
);

-- ─── 10. ALERTAS EPIDEMIOLÓGICAS ────────────────────────────
CREATE TABLE IF NOT EXISTS alertas_epidemiologicas (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  titulo      TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  nivel       TEXT CHECK (nivel IN ('info','warning','critical')) DEFAULT 'info',
  activa      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── ÍNDICES DE PERFORMANCE ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_config_tenant    ON configuracion_portal(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lineas_tenant    ON lineas_investigacion(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hitos_tenant     ON hitos_timeline(tenant_id);
CREATE INDEX IF NOT EXISTS idx_noticias_tenant  ON noticias_posts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mitos_tenant     ON mitos_vacunales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vacunas_tenant   ON inventario_vacunas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_tenant ON movimientos_vacunas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lotes_tenant     ON lotes_vacunas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_alertas_tenant   ON alertas_epidemiologicas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_noticias_slug    ON noticias_posts(tenant_id, slug);

-- ─── TRIGGER: updated_at automático ─────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_config_updated
  BEFORE UPDATE ON configuracion_portal
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_noticias_updated
  BEFORE UPDATE ON noticias_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
