"use client";
import { useState, useEffect, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  revalidateTenantPagesAction,
  getCategoriasAction,
  saveCategoriaAction,
  deleteCategoriaAction,
  uploadImageAction,
  type Categoria,
} from "./actions";
import EmojiPicker from 'emoji-picker-react';
import dynamic from 'next/dynamic';
import CustomConfirmModal from "@/components/CustomConfirmModal";
import { Newspaper, Plus, Tag } from "lucide-react";

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false });

interface Post {
  id: string;
  titulo: string;
  slug: string;
  resumen: string;
  contenido_markdown: string;
  emoji: string;
  categoria: string;
  imagen_portada_url: string;
  infografia_url: string;
  url_referencia: string;
  publicado: boolean;
  created_at: string;
}

interface Props {
  params: Promise<{ slug: string }>;
}

const COLOR_OPTIONS = [
  { value: "teal",    label: "Teal" },
  { value: "emerald", label: "Esmeralda" },
  { value: "rose",    label: "Rosa" },
  { value: "amber",   label: "Ámbar" },
];

const DEFAULT_CATS: Categoria[] = [
  { nombre: "Académico",    emoji: "📚", color: "teal",    orden: 0 },
  { nombre: "Prevención",   emoji: "🛡️", color: "emerald", orden: 1 },
  { nombre: "Epidemiología",emoji: "📊", color: "rose",    orden: 2 },
  { nombre: "HubMed",       emoji: "🔬", color: "amber",   orden: 3 },
];

export default function AdminNoticiasPage({ params }: Props) {
  const [tenantSlug, setTenantSlug]   = useState("");
  const [tenantId, setTenantId]       = useState("");
  const [posts, setPosts]             = useState<Post[]>([]);
  const [categorias, setCategorias]   = useState<Categoria[]>([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState<"posts" | "categorias">("posts");
  const [isPending, startTransition]  = useTransition();
  const [toast, setToast]             = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Post modal state
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingPost, setEditingPost]         = useState<Partial<Post> | null>(null);
  const [showEmojiPickerPost, setShowEmojiPickerPost] = useState(false);

  // Category modal state
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat]         = useState<Partial<Categoria> | null>(null);
  const [showEmojiPickerCat, setShowEmojiPickerCat] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDanger?: boolean;
    onConfirm: () => void;
  } | null>(null);

  const supabase = createClient();

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadPosts = async (tId: string) => {
    const { data, error } = await supabase
      .from("noticias_posts")
      .select("*")
      .eq("tenant_id", tId)
      .order("created_at", { ascending: false });
    if (error) showToast("Error al cargar publicaciones: " + error.message, "error");
    else setPosts(data || []);
  };

  const loadCategorias = async (tId: string) => {
    const res = await getCategoriasAction(tId);
    if (res.success && res.data.length > 0) {
      setCategorias(res.data);
    }
  };

  useEffect(() => {
    params.then(async (p) => {
      setTenantSlug(p.slug);
      const { data: tenant } = await supabase.from("tenants").select("id").eq("slug", p.slug).single();
      if (!tenant) return;
      setTenantId(tenant.id);
      await Promise.all([loadPosts(tenant.id), loadCategorias(tenant.id)]);
      setLoading(false);
    });
  }, []);

  // ── POST CRUD ────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingPost({
      titulo: "", slug: "", resumen: "", contenido_markdown: "",
      emoji: "📄", categoria: categorias[0]?.nombre || "Académico",
      imagen_portada_url: "", infografia_url: "", url_referencia: "", publicado: false,
    });
    setIsPostModalOpen(true);
  };

  const handleOpenEdit = (post: Post) => {
    setEditingPost({ ...post });
    setIsPostModalOpen(true);
  };

  const handleDeletePost = async (postId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Eliminar Publicación",
      message: "¿Está seguro de que desea eliminar esta publicación? Esta acción no se puede deshacer.",
      isDanger: true,
      onConfirm: () => {
        setConfirmConfig(null);
        startTransition(async () => {
          const { error } = await supabase.from("noticias_posts").delete().eq("id", postId);
          if (error) showToast("Error al eliminar: " + error.message, "error");
          else {
            showToast("✅ Publicación eliminada");
            await revalidateTenantPagesAction(tenantSlug);
            loadPosts(tenantId);
          }
        });
      }
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "imagen_portada_url" | "infografia_url") => {
    const file = e.target.files?.[0];
    if (!file || !editingPost) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tenantId", tenantId);
      formData.append("folder", "posts");

      const res = await uploadImageAction(formData);
      if (!res.success) {
        showToast("Error al subir imagen: " + res.error, "error");
        return;
      }

      setEditingPost(prev => prev ? { ...prev, [field]: res.publicUrl } : null);
      showToast(`✅ ${field === 'imagen_portada_url' ? 'Portada' : 'Infografía'} subida exitosamente`);
    });
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost || !editingPost.titulo) return;
    const slugVal = editingPost.slug?.trim() || editingPost.titulo
      .toLowerCase().trim().normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");

    const payload: Record<string, any> = { ...editingPost, slug: slugVal, tenant_id: tenantId, updated_at: new Date().toISOString() };
    
    // Remove undefined values to avoid Supabase null-insertion conflicts
    Object.keys(payload).forEach(k => { if (payload[k] === undefined) delete payload[k]; });

    startTransition(async () => {
      let error;
      if (editingPost.id) {
        const { error: err } = await supabase.from("noticias_posts").update(payload).eq("id", editingPost.id);
        error = err;
      } else {
        // For new posts, remove id and created_at so DB auto-generates them
        delete payload.id;
        delete payload.created_at;
        const { error: err } = await supabase.from("noticias_posts").insert(payload);
        error = err;
      }
      if (error) showToast("Error al guardar: " + error.message, "error");
      else {
        showToast("✅ Publicación guardada correctamente");
        await revalidateTenantPagesAction(tenantSlug);
        setIsPostModalOpen(false);
        setEditingPost(null);
        loadPosts(tenantId);
      }
    });
  };

  // ── CATEGORY CRUD ────────────────────────────────────────────
  const handleOpenCreateCat = () => {
    setEditingCat({ nombre: "", emoji: "📂", color: "teal", orden: categorias.length });
    setIsCatModalOpen(true);
  };

  const handleOpenEditCat = (cat: Categoria) => {
    setEditingCat({ ...cat });
    setIsCatModalOpen(true);
  };

  const handleDeleteCat = async (cat: Categoria) => {
    if (!cat.id) return;
    setConfirmConfig({
      isOpen: true,
      title: "Eliminar Categoría",
      message: `¿Está seguro de que desea eliminar la categoría "${cat.nombre}"? Esta acción no se puede deshacer.`,
      isDanger: true,
      onConfirm: () => {
        setConfirmConfig(null);
        startTransition(async () => {
          const res = await deleteCategoriaAction(cat.id!, tenantId, cat.nombre);
          if (!res.success) showToast(res.error || "Error al eliminar", "error");
          else {
            showToast("✅ Categoría eliminada");
            loadCategorias(tenantId);
          }
        });
      }
    });
  };

  const handleSaveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat?.nombre) return;
    startTransition(async () => {
      const res = await saveCategoriaAction({ ...editingCat, tenantId } as any);
      if (!res.success) showToast(res.error || "Error al guardar", "error");
      else {
        showToast("✅ Categoría guardada");
        setIsCatModalOpen(false);
        setEditingCat(null);
        loadCategorias(tenantId);
      }
    });
  };

  const badgeClass = (color: string) => {
    const map: Record<string, string> = {
      teal: "badge-teal", emerald: "badge-emerald", rose: "badge-rose", amber: "badge-amber",
    };
    return map[color] || "badge-teal";
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
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            background: "rgba(10, 77, 92, 0.08)",
            color: "var(--doc-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Newspaper size={18} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="admin-topbar-title" style={{ margin: 0, lineHeight: 1.2 }}>Gestión de Publicaciones</h1>
            <p style={{ fontSize: "12px", color: "var(--slate-500)", margin: "2px 0 0" }}>
              Escribe artículos, boletines científicos y gestiona categorías.
            </p>
          </div>
        </div>
        <div className="admin-topbar-right">
          {activeTab === "posts" ? (
            <button onClick={handleOpenCreate} className="btn btn-emerald" style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
              <Plus size={16} /> Nueva Publicación
            </button>
          ) : (
            <button onClick={handleOpenCreateCat} className="btn btn-emerald" style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
              <Plus size={16} /> Nueva Categoría
            </button>
          )}
        </div>
      </div>

      <div className="admin-content">
        {/* TABS */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "20px", background: "var(--slate-100)", borderRadius: "12px", padding: "4px", width: "fit-content" }}>
          {([
            { key: "posts",      label: "Publicaciones", icon: Newspaper },
            { key: "categorias", label: "Categorías", icon: Tag },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "8px 20px", borderRadius: "9px", border: "none", cursor: "pointer",
                fontSize: "13px", fontWeight: 700, fontFamily: "Outfit, sans-serif",
                transition: "all 0.2s ease",
                background: activeTab === tab.key ? "white" : "transparent",
                color: activeTab === tab.key ? "var(--teal-800)" : "var(--slate-500)",
                boxShadow: activeTab === tab.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: POSTS ────────────────────────────────── */}
        {activeTab === "posts" && (
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
                      <th style={thStyle}>Portada</th>
                      <th style={thStyle}>Título</th>
                      <th style={thStyle}>Categoría</th>
                      <th style={thStyle}>Estado</th>
                      <th style={thStyle}>Fecha</th>
                      <th style={thStyle}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((post) => {
                      const cat = categorias.find(c => c.nombre === post.categoria);
                      return (
                        <tr key={post.id} style={{ borderBottom: "1px solid var(--slate-100)" }}>
                          <td style={tdStyle}>
                            <div style={{ width: "48px", height: "48px", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--slate-200)", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--slate-50)" }}>
                              {post.imagen_portada_url ? (
                                <img src={post.imagen_portada_url} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <span style={{ fontSize: "20px" }}>{post.emoji || "📄"}</span>
                              )}
                            </div>
                          </td>
                          <td style={tdStyle}>
                            <div style={{ fontWeight: 700, color: "var(--slate-900)" }}>{post.titulo}</div>
                            <div style={{ fontSize: "12px", color: "var(--slate-400)", marginTop: "2px" }}>/{post.slug}</div>
                          </td>
                          <td style={tdStyle}>
                            <span className={`badge ${badgeClass(cat?.color || "teal")}`}>
                              {cat?.emoji || ""} {post.categoria}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <span className={`badge ${post.publicado ? "badge-emerald" : "badge-rose"}`} style={{ opacity: post.publicado ? 1 : 0.7 }}>
                              {post.publicado ? "✅ Publicado" : "📝 Borrador"}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            {new Date(post.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                          </td>
                          <td style={tdStyle}>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button onClick={() => handleOpenEdit(post)} className="action-btn action-btn-primary">✏️ Editar</button>
                              <button onClick={() => handleDeletePost(post.id)} className="action-btn action-btn-danger">🗑️ Borrar</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: CATEGORÍAS ──────────────────────────── */}
        {activeTab === "categorias" && (
          <div className="card">
            {categorias.length === 0 ? (
              <div style={{ padding: "60px", textAlign: "center", color: "var(--slate-400)" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏷️</div>
                <h3 style={{ fontWeight: 800, color: "var(--slate-800)" }}>Sin categorías configuradas</h3>
                <p style={{ fontSize: "13px", marginTop: "4px" }}>Crea tu primera categoría para organizar las publicaciones.</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--slate-100)", background: "var(--slate-50)" }}>
                      <th style={thStyle}>Icono</th>
                      <th style={thStyle}>Nombre</th>
                      <th style={thStyle}>Color Badge</th>
                      <th style={thStyle}>Orden</th>
                      <th style={thStyle}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categorias.map((cat, i) => (
                      <tr key={cat.id || i} style={{ borderBottom: "1px solid var(--slate-100)" }}>
                        <td style={tdStyle}>
                          <span style={{ fontSize: "24px" }}>{cat.emoji}</span>
                        </td>
                        <td style={tdStyle}>
                          <span className={`badge ${badgeClass(cat.color)}`}>
                            {cat.nombre}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: "13px", color: "var(--slate-600)", textTransform: "capitalize" }}>{cat.color}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: "13px", color: "var(--slate-500)" }}>{cat.orden}</span>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button onClick={() => handleOpenEditCat(cat)} className="action-btn action-btn-primary">✏️ Editar</button>
                            <button onClick={() => handleDeleteCat(cat)} className="action-btn action-btn-danger" disabled={!cat.id}>🗑️ Borrar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL: EDITOR DE PUBLICACIÓN ──────────────── */}
      {isPostModalOpen && editingPost && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "white", borderRadius: "24px", border: "1px solid var(--slate-200)", maxWidth: "900px", width: "100%", maxHeight: "92vh", boxShadow: "var(--shadow-xl)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <form onSubmit={handleSavePost}>
              {/* Header */}
              <div style={{ padding: "20px 28px", borderBottom: "1px solid var(--slate-200)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: "18px", fontWeight: 800 }}>
                  {editingPost.id ? "✏️ Editar Publicación" : "📝 Nueva Publicación"}
                </h2>
                <button type="button" onClick={() => setIsPostModalOpen(false)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: "22px", color: "var(--slate-400)", lineHeight: 1 }}>×</button>
              </div>

              <div style={{ padding: "24px 28px", maxHeight: "68vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px" }}>

                {/* Título */}
                <div>
                  <label style={labelStyle}>Título de la publicación *</label>
                  <input type="text" className="form-input" required placeholder="Ej: Nuevas vacunas contra Influenza Pediátrica 2026"
                    value={editingPost.titulo || ""}
                    onChange={e => setEditingPost(p => p ? { ...p, titulo: e.target.value } : null)}
                  />
                </div>

                {/* Categoría + Emoji */}
                <div className="post-category-emoji-row">
                  <div>
                    <label style={labelStyle}>Categoría</label>
                    <select className="form-input" value={editingPost.categoria || ""}
                      onChange={e => setEditingPost(p => p ? { ...p, categoria: e.target.value } : null)}
                      style={{ background: "white" }}
                    >
                      {categorias.map((c, i) => (
                        <option key={c.id || i} value={c.nombre}>{c.emoji} {c.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ position: "relative" }}>
                    <label style={labelStyle}>Emoji / Ícono</label>
                    <button
                      type="button"
                      onClick={() => setShowEmojiPickerPost(!showEmojiPickerPost)}
                      style={{ fontSize: "22px", background: "white", border: "1px solid var(--slate-200)", borderRadius: "8px", width: "42px", height: "42px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      {editingPost.emoji || "📄"}
                    </button>
                    {showEmojiPickerPost && (
                      <div style={{ position: "absolute", zIndex: 50, top: "100%", left: 0, marginTop: "8px", boxShadow: "var(--shadow-xl)", borderRadius: "8px" }}>
                        <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setShowEmojiPickerPost(false)} />
                        <div style={{ position: "relative", zIndex: 50 }}>
                          <EmojiPicker 
                            onEmojiClick={(emojiData) => {
                              setEditingPost(p => p ? { ...p, emoji: emojiData.emoji } : null);
                              setShowEmojiPickerPost(false);
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Imagen de Portada */}
                <div>
                  <label style={labelStyle}>Imagen de Portada (URL o Subir)</label>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <input type="url" className="form-input" placeholder="https://ejemplo.com/imagen-portada.jpg"
                        value={editingPost.imagen_portada_url || ""}
                        onChange={e => setEditingPost(p => p ? { ...p, imagen_portada_url: e.target.value } : null)}
                      />
                    </div>
                    <input type="file" accept="image/*" id="post-cover-upload" style={{ display: "none" }} onChange={(e) => handleImageUpload(e, "imagen_portada_url")} />
                    <label htmlFor="post-cover-upload" className="btn btn-outline" style={{ cursor: "pointer", fontSize: "12px", padding: "10px 14px", flexShrink: 0 }}>
                      {isPending ? "⏳ Subiendo..." : "📂 Subir"}
                    </label>
                  </div>
                  {isPending && !editingPost.imagen_portada_url && (
                    <div style={{ marginTop: "10px", padding: "16px", borderRadius: "10px", border: "1px dashed var(--slate-300)", background: "var(--slate-50)", textAlign: "center" }}>
                      <span style={{ fontSize: "14px", color: "var(--slate-500)" }}>⏳ Subiendo imagen de portada...</span>
                    </div>
                  )}
                  {editingPost.imagen_portada_url && (
                    <div style={{ marginTop: "10px", borderRadius: "10px", overflow: "hidden", maxHeight: "160px", border: "1px solid var(--slate-200)", position: "relative" }}>
                      <img
                        src={editingPost.imagen_portada_url}
                        alt="Preview portada"
                        style={{ width: "100%", height: "160px", objectFit: "cover" }}
                        onError={e => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                          const parent = (e.currentTarget as HTMLImageElement).parentElement;
                          if (parent && !parent.querySelector(".img-error-msg")) {
                            const msg = document.createElement("div");
                            msg.className = "img-error-msg";
                            msg.style.cssText = "padding:20px;text-align:center;color:var(--slate-500);font-size:13px;";
                            msg.textContent = "⚠️ No se pudo cargar la vista previa. La imagen se mostrará al publicar.";
                            parent.appendChild(msg);
                          }
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Infografía (opcional) */}
                <div>
                  <label style={labelStyle}>
                    Infografía (URL o Subir)
                    <span style={{ fontWeight: 400, color: "var(--slate-400)", marginLeft: "6px" }}>(opcional)</span>
                  </label>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <input type="url" className="form-input" placeholder="https://ejemplo.com/infografia.png"
                        value={editingPost.infografia_url || ""}
                        onChange={e => setEditingPost(p => p ? { ...p, infografia_url: e.target.value } : null)}
                      />
                    </div>
                    <input type="file" accept="image/*" id="post-info-upload" style={{ display: "none" }} onChange={(e) => handleImageUpload(e, "infografia_url")} />
                    <label htmlFor="post-info-upload" className="btn btn-outline" style={{ cursor: "pointer", fontSize: "12px", padding: "10px 14px", flexShrink: 0 }}>
                      {isPending ? "⏳..." : "📂 Subir"}
                    </label>
                  </div>
                  {editingPost.infografia_url && (
                    <div style={{ marginTop: "10px", borderRadius: "10px", overflow: "hidden", border: "1px solid var(--slate-200)", background: "var(--slate-50)", padding: "8px", textAlign: "center" }}>
                      <img src={editingPost.infografia_url} alt="Preview infografía" style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain", borderRadius: "8px" }} onError={e => (e.currentTarget.style.display = "none")} />
                    </div>
                  )}
                </div>

                {/* URL de Referencia */}
                <div>
                  <label style={labelStyle}>
                    URL de Referencia / Más Información
                    <span style={{ fontWeight: 400, color: "var(--slate-400)", marginLeft: "6px" }}>(opcional)</span>
                  </label>
                  <input type="url" className="form-input" placeholder="https://www.who.int/articulo-referencia"
                    value={editingPost.url_referencia || ""}
                    onChange={e => setEditingPost(p => p ? { ...p, url_referencia: e.target.value } : null)}
                  />
                  <p style={{ fontSize: "11px", color: "var(--slate-400)", marginTop: "6px" }}>
                    Se mostrará como botón "Más información →" en la publicación.
                  </p>
                </div>

                {/* Resumen */}
                <div>
                  <label style={labelStyle}>Resumen o extracto corto *</label>
                  <textarea className="form-textarea" required placeholder="Descripción corta de una línea para mostrar en la tarjeta..."
                    value={editingPost.resumen || ""}
                    onChange={e => setEditingPost(p => p ? { ...p, resumen: e.target.value } : null)}
                    rows={2}
                  />
                </div>

                {/* Contenido del Artículo — Editor WYSIWYG */}
                <div>
                  <label style={labelStyle}>Contenido del artículo</label>
                  <RichTextEditor
                    value={editingPost.contenido_markdown || ""}
                    onChange={(html) => setEditingPost(p => p ? { ...p, contenido_markdown: html } : null)}
                    placeholder="Escribe el contenido del artículo aquí. Usa la barra de herramientas para dar formato: negrita, cursiva, títulos, listas, colores y más."
                  />
                  <p style={{ fontSize: "11px", color: "var(--slate-400)", marginTop: "6px" }}>
                    💡 Selecciona texto y usa la barra para aplicar negritas, colores, alineación y más.
                  </p>
                </div>

                {/* Publicar */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 16px", background: "var(--emerald-50, #f0fdf4)", borderRadius: "10px", border: "1px solid rgba(0,212,170,0.2)" }}>
                  <input type="checkbox" id="post_published" checked={editingPost.publicado || false}
                    onChange={e => setEditingPost(p => p ? { ...p, publicado: e.target.checked } : null)}
                    style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "var(--emerald-500)" }}
                  />
                  <label htmlFor="post_published" style={{ fontSize: "13px", fontWeight: 700, color: "var(--slate-800)", cursor: "pointer" }}>
                    Publicar inmediatamente — hacerlo visible para los pacientes
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: "16px 28px", borderTop: "1px solid var(--slate-200)", background: "var(--slate-50)", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsPostModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isPending}>
                  {isPending ? "Guardando..." : "Guardar Publicación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDITOR DE CATEGORÍA ────────────────── */}
      {isCatModalOpen && editingCat !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{ background: "white", borderRadius: "20px", border: "1px solid var(--slate-200)", maxWidth: "440px", width: "100%", boxShadow: "var(--shadow-xl)", overflow: "hidden" }}>
            <form onSubmit={handleSaveCat}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--slate-200)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: "17px", fontWeight: 800 }}>
                  {(editingCat as any).id ? "✏️ Editar Categoría" : "🏷️ Nueva Categoría"}
                </h2>
                <button type="button" onClick={() => setIsCatModalOpen(false)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: "22px", color: "var(--slate-400)", lineHeight: 1 }}>×</button>
              </div>

              <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
                {/* Nombre */}
                <div>
                  <label style={labelStyle}>Nombre de la categoría *</label>
                  <input type="text" className="form-input" required placeholder="Ej: Vacunología"
                    value={editingCat.nombre || ""}
                    onChange={e => setEditingCat(c => c ? { ...c, nombre: e.target.value } : null)}
                  />
                </div>

                {/* Emoji + Color */}
                <div className="post-emoji-color-row">
                  <div style={{ position: "relative" }}>
                    <label style={labelStyle}>Emoji</label>
                    <button
                      type="button"
                      onClick={() => setShowEmojiPickerCat(!showEmojiPickerCat)}
                      style={{ fontSize: "22px", background: "white", border: "1px solid var(--slate-200)", borderRadius: "8px", width: "100%", height: "42px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      {editingCat.emoji || "📂"}
                    </button>
                    {showEmojiPickerCat && (
                      <div style={{ position: "absolute", zIndex: 50, top: "100%", left: 0, marginTop: "8px", boxShadow: "var(--shadow-xl)", borderRadius: "8px" }}>
                        <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setShowEmojiPickerCat(false)} />
                        <div style={{ position: "relative", zIndex: 50 }}>
                          <EmojiPicker 
                            onEmojiClick={(emojiData) => {
                              setEditingCat(c => c ? { ...c, emoji: emojiData.emoji } : null);
                              setShowEmojiPickerCat(false);
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={labelStyle}>Color del badge</label>
                    <select className="form-input" value={editingCat.color || "teal"}
                      onChange={e => setEditingCat(c => c ? { ...c, color: e.target.value } : null)}
                      style={{ background: "white" }}
                    >
                      {COLOR_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Preview */}
                <div style={{ padding: "12px 16px", background: "var(--slate-50)", borderRadius: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: 600 }}>Vista previa:</span>
                  <span className={`badge ${badgeClass(editingCat.color || "teal")}`}>
                    {editingCat.emoji || "📂"} {editingCat.nombre || "Categoría"}
                  </span>
                </div>

                {/* Orden */}
                <div>
                  <label style={labelStyle}>Orden de aparición</label>
                  <input type="number" className="form-input" min={0} placeholder="0"
                    value={editingCat.orden ?? 0}
                    onChange={e => setEditingCat(c => c ? { ...c, orden: Number(e.target.value) } : null)}
                  />
                </div>
              </div>

              <div style={{ padding: "16px 24px", borderTop: "1px solid var(--slate-200)", background: "var(--slate-50)", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsCatModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isPending}>
                  {isPending ? "Guardando..." : "Guardar Categoría"}
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

      {confirmConfig && (
        <CustomConfirmModal
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          isDanger={confirmConfig.isDanger}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
        />
      )}
    </>
  );
}

const thStyle = {
  padding: "14px 20px",
  fontSize: "12px",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  color: "var(--slate-500)",
  letterSpacing: "0.05em",
};

const tdStyle = {
  padding: "16px 20px",
  fontSize: "14px",
  verticalAlign: "middle" as const,
};

const labelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: 700,
  color: "var(--slate-700)",
  marginBottom: "8px",
};
