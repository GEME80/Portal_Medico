"use client";
import { useState, useEffect, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

interface Post {
  id: string;
  titulo: string;
  slug: string;
  resumen: string;
  contenido_markdown: string;
  emoji: string;
  categoria: "Académico" | "Prevención" | "Epidemiología" | "EcoVaccine";
  imagen_portada_url: string;
  publicado: boolean;
  created_at: string;
}

interface Props {
  params: Promise<{ slug: string }>;
}

export default function AdminNoticiasPage({ params }: Props) {
  const [tenantSlug, setTenantSlug] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Editor modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Partial<Post> | null>(null);

  const supabase = createClient();

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadPosts = async (tId: string) => {
    const { data, error } = await supabase
      .from("noticias_posts")
      .select("*")
      .eq("tenant_id", tId)
      .order("created_at", { ascending: false });

    if (error) {
      showToast("Error al cargar publicaciones: " + error.message, "error");
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    params.then(async (p) => {
      setTenantSlug(p.slug);
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("slug", p.slug)
        .single();

      if (!tenant) return;
      setTenantId(tenant.id);
      loadPosts(tenant.id);
    });
  }, []);

  const handleOpenCreate = () => {
    setEditingPost({
      titulo: "",
      slug: "",
      resumen: "",
      contenido_markdown: "",
      emoji: "📄",
      categoria: "Académico",
      imagen_portada_url: "",
      publicado: false
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (post: Post) => {
    setEditingPost({ ...post });
    setIsModalOpen(true);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("¿Está seguro de que desea eliminar esta publicación?")) return;

    startTransition(async () => {
      const { error } = await supabase
        .from("noticias_posts")
        .delete()
        .eq("id", postId);

      if (error) {
        showToast("Error al eliminar: " + error.message, "error");
      } else {
        showToast("✅ Publicación eliminada");
        loadPosts(tenantId);
      }
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingPost) return;

    startTransition(async () => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${tenantId}/posts/post_${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('portal-media')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (error) {
        showToast("Error al subir imagen: " + error.message, "error");
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('portal-media')
        .getPublicUrl(fileName);

      setEditingPost(prev => prev ? { ...prev, imagen_portada_url: publicUrl } : null);
      showToast("✅ Imagen de portada subida");
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost || !editingPost.titulo) return;

    // Auto-generate slug if empty
    const slugVal = editingPost.slug?.trim() || editingPost.titulo
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");

    const payload = {
      ...editingPost,
      slug: slugVal,
      tenant_id: tenantId,
      updated_at: new Date().toISOString()
    };

    startTransition(async () => {
      let error;
      if (editingPost.id) {
        const { error: err } = await supabase
          .from("noticias_posts")
          .update(payload)
          .eq("id", editingPost.id);
        error = err;
      } else {
        const { error: err } = await supabase
          .from("noticias_posts")
          .insert(payload);
        error = err;
      }

      if (error) {
        showToast("Error al guardar: " + error.message, "error");
      } else {
        showToast("✅ Publicación guardada correctamente");
        setIsModalOpen(false);
        setEditingPost(null);
        loadPosts(tenantId);
      }
    });
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "50vh", color: "var(--slate-400)" }}>
      Cargando publicaciones...
    </div>
  );

  return (
    <>
      {/* TOPBAR */}
      <div className="admin-topbar">
        <div>
          <h1 className="admin-topbar-title">📰 Gestión de Publicaciones</h1>
          <p style={{ fontSize: "12px", color: "var(--slate-500)", marginTop: "2px" }}>
            Escribe artículos, boletines científicos y noticias para tus pacientes.
          </p>
        </div>
        <div className="admin-topbar-right">
          <button onClick={handleOpenCreate} className="btn btn-emerald" style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
            <span>＋</span> Nueva Publicación
          </button>
        </div>
      </div>

      <div className="admin-content">
        <div className="card">
          {posts.length === 0 ? (
            <div style={{ padding: "60px", textAlign: "center", color: "var(--slate-400)" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📰</div>
              <h3 style={{ fontWeight: 800, color: "var(--slate-800)" }}>No tienes publicaciones redactadas</h3>
              <p style={{ fontSize: "13px", marginTop: "4px" }}>Redacta tu primer boletín o noticia pulsando "Nueva Publicación".</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--slate-100)", background: "var(--slate-50)" }}>
                    <th style={thStyle}>Portada / Icono</th>
                    <th style={thStyle}>Título</th>
                    <th style={thStyle}>Categoría</th>
                    <th style={thStyle}>Estado</th>
                    <th style={thStyle}>Fecha de Creación</th>
                    <th style={thStyle}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id} style={{ borderBottom: "1px solid var(--slate-100)" }}>
                      <td style={tdStyle}>
                        <div style={{
                          width: "48px", height: "48px",
                          borderRadius: "8px", overflow: "hidden",
                          border: "1px solid var(--slate-200)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: "var(--slate-50)"
                        }}>
                          {post.imagen_portada_url ? (
                            <img src={post.imagen_portada_url} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <span style={{ fontSize: "20px" }}>{post.emoji || "📄"}</span>
                          )}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 700, color: "var(--slate-900)" }}>{post.titulo}</div>
                        <div style={{ fontSize: "12px", color: "var(--slate-400)", marginTop: "2px" }}>slug: /{post.slug}</div>
                      </td>
                      <td style={tdStyle}>
                        <span className={`badge ${post.categoria === "Académico" ? "badge-teal" : post.categoria === "Epidemiología" ? "badge-rose" : "badge-emerald"}`}>
                          {post.categoria}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span className={`badge ${post.publicado ? "badge-emerald" : "badge-rose"}`} style={{ opacity: post.publicado ? 1 : 0.6 }}>
                          {post.publicado ? "Publicado" : "Borrador"}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {new Date(post.created_at).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric"
                        })}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button onClick={() => handleOpenEdit(post)} className="action-btn action-btn-primary">
                            ✏️ Editar
                          </button>
                          <button onClick={() => handleDelete(post.id)} className="action-btn action-btn-danger">
                            🗑️ Borrar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* EDITOR MODAL / DIALOG */}
      {isModalOpen && editingPost && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(15, 23, 42, 0.45)",
          backdropFilter: "blur(4px)",
          zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "24px"
        }}>
          <div style={{
            background: "white",
            borderRadius: "24px",
            border: "1px solid var(--slate-200)",
            maxWidth: "680px",
            width: "100%",
            boxShadow: "var(--shadow-xl)",
            fontFamily: "inherit",
            overflow: "hidden"
          }}>
            <form onSubmit={handleSave}>
              <div style={{ padding: "20px 28px", borderBottom: "1px solid var(--slate-200)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: "18px", fontWeight: 800 }}>
                  {editingPost.id ? "✏️ Editar Publicación" : "📝 Nueva Publicación"}
                </h2>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: "20px" }}>×</button>
              </div>

              <div style={{ padding: "24px 28px", maxHeight: "65vh", overflowY: "auto" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  
                  {/* Title */}
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={labelStyle}>Título de la publicación *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="Ej: Nuevas vacunas contra Influenza Pediátrica 2026"
                      value={editingPost.titulo || ""}
                      onChange={e => setEditingPost(p => p ? { ...p, titulo: e.target.value } : null)}
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label style={labelStyle}>Slug de ruta (opcional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="ej-mi-articulo-2026"
                      value={editingPost.slug || ""}
                      onChange={e => setEditingPost(p => p ? { ...p, slug: e.target.value } : null)}
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label style={labelStyle}>Categoría</label>
                    <select
                      className="form-input"
                      value={editingPost.categoria}
                      onChange={e => setEditingPost(p => p ? { ...p, categoria: e.target.value as any } : null)}
                      style={{ background: "white" }}
                    >
                      <option value="Académico">Académico</option>
                      <option value="Prevención">Prevención</option>
                      <option value="Epidemiología">Epidemiología</option>
                      <option value="EcoVaccine">EcoVaccine</option>
                    </select>
                  </div>

                  {/* Emoji Icon */}
                  <div>
                    <label style={labelStyle}>Emoji de respaldo (Fallback)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="📄"
                      value={editingPost.emoji || ""}
                      onChange={e => setEditingPost(p => p ? { ...p, emoji: e.target.value } : null)}
                    />
                  </div>

                  {/* Upload Image */}
                  <div>
                    <label style={labelStyle}>Imagen de Portada (Carga Local)</label>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      {editingPost.imagen_portada_url ? (
                        <div style={{ width: "40px", height: "40px", borderRadius: "6px", overflow: "hidden", border: "1px solid var(--slate-200)" }}>
                          <img src={editingPost.imagen_portada_url} alt="Cover Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      ) : null}
                      <div style={{ flex: 1 }}>
                        <input type="file" accept="image/*" id="post-cover-upload" style={{ display: "none" }} onChange={handleImageUpload} />
                        <label htmlFor="post-cover-upload" className="btn btn-outline" style={{ cursor: "pointer", fontSize: "12px", padding: "8px 12px", display: "inline-block" }}>
                          {isPending ? "Subiendo..." : "Subir Portada"}
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={labelStyle}>Resumen o extracto corto *</label>
                    <textarea
                      className="form-textarea"
                      required
                      placeholder="Descripción corta de una línea para mostrar en la tarjeta..."
                      value={editingPost.resumen || ""}
                      onChange={e => setEditingPost(p => p ? { ...p, resumen: e.target.value } : null)}
                      rows={2}
                    />
                  </div>

                  {/* Markdown Content */}
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={labelStyle}>Contenido del artículo (soporta Markdown)</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Escribe tu artículo aquí..."
                      value={editingPost.contenido_markdown || ""}
                      onChange={e => setEditingPost(p => p ? { ...p, contenido_markdown: e.target.value } : null)}
                      rows={8}
                      style={{ fontFamily: "monospace" }}
                    />
                  </div>

                  {/* Published status */}
                  <div style={{ gridColumn: "span 2", display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                      type="checkbox"
                      id="post_published"
                      checked={editingPost.publicado || false}
                      onChange={e => setEditingPost(p => p ? { ...p, publicado: e.target.checked } : null)}
                      style={{ width: "16px", height: "16px", cursor: "pointer" }}
                    />
                    <label htmlFor="post_published" style={{ fontSize: "13px", fontWeight: 700, color: "var(--slate-800)", cursor: "pointer" }}>
                      Publicar inmediatamente (hacerlo visible para los pacientes)
                    </label>
                  </div>

                </div>
              </div>

              <div style={{ padding: "16px 28px", borderTop: "1px solid var(--slate-200)", background: "var(--slate-50)", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isPending}>
                  {isPending ? "Guardando..." : "Guardar Publicación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type === "success" ? "success" : "error"}`}>
            {toast.msg}
          </div>
        </div>
      )}
    </>
  );
}

const thStyle = {
  padding: "16px 20px",
  fontSize: "12px",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  color: "var(--slate-500)",
  letterSpacing: "0.05em"
};

const tdStyle = {
  padding: "16px 20px",
  fontSize: "14px",
  verticalAlign: "middle"
};

const labelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: 700,
  color: "var(--slate-700)",
  marginBottom: "8px"
};
