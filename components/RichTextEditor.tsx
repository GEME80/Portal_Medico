"use client";
import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const TEXT_COLORS = [
  { label: "Negro", value: "#0f172a" },
  { label: "Gris", value: "#64748b" },
  { label: "Teal", value: "#0A4D5C" },
  { label: "Verde", value: "#059669" },
  { label: "Azul", value: "#2563eb" },
  { label: "Rojo", value: "#dc2626" },
  { label: "Naranja", value: "#ea580c" },
  { label: "Morado", value: "#7c3aed" },
];

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault(); // prevent losing editor focus
        onClick();
      }}
      style={{
        padding: "4px 9px",
        border: "1px solid",
        borderColor: active ? "var(--slate-400)" : "var(--slate-200)",
        borderRadius: "6px",
        background: active ? "var(--slate-200)" : "white",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: 600,
        fontFamily: "inherit",
        color: active ? "var(--slate-900)" : "var(--slate-700)",
        transition: "background .12s, border-color .12s",
        minWidth: "30px",
        textAlign: "center" as const,
        lineHeight: "1.4",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "var(--slate-100)";
          e.currentTarget.style.borderColor = "var(--slate-300)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "white";
          e.currentTarget.style.borderColor = "var(--slate-200)";
        }
      }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return (
    <div
      style={{
        width: "1px",
        height: "22px",
        background: "var(--slate-200)",
        margin: "0 2px",
        alignSelf: "center",
        flexShrink: 0,
      }}
    />
  );
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Escribe el contenido del artículo aquí...",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TextStyle,
      Color,
      Underline,
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        style:
          "min-height: 320px; padding: 16px; font-size: 15px; line-height: 1.8; font-family: Inter, sans-serif; color: var(--slate-800); outline: none;",
      },
    },
  });

  // Sync external value changes (e.g. when editing an existing post)
  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    if (value !== currentHtml) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  const activeAlign = editor.isActive({ textAlign: "center" })
    ? "center"
    : editor.isActive({ textAlign: "right" })
    ? "right"
    : editor.isActive({ textAlign: "justify" })
    ? "justify"
    : "left";

  return (
    <div
      style={{
        border: "1px solid var(--slate-200)",
        borderRadius: "12px",
        overflow: "hidden",
        background: "white",
      }}
    >
      {/* ── TOOLBAR ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px",
          padding: "8px 12px",
          background: "var(--slate-50)",
          borderBottom: "1px solid var(--slate-200)",
          alignItems: "center",
        }}
      >
        {/* Tipo de párrafo */}
        <select
          onMouseDown={(e) => e.preventDefault()}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "paragraph") editor.chain().focus().setParagraph().run();
            else editor.chain().focus().setHeading({ level: parseInt(val) as 2 | 3 | 4 }).run();
          }}
          value={
            editor.isActive("heading", { level: 2 })
              ? "2"
              : editor.isActive("heading", { level: 3 })
              ? "3"
              : editor.isActive("heading", { level: 4 })
              ? "4"
              : "paragraph"
          }
          style={{
            padding: "4px 8px",
            border: "1px solid var(--slate-200)",
            borderRadius: "6px",
            background: "white",
            fontSize: "12px",
            fontFamily: "inherit",
            color: "var(--slate-700)",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          <option value="paragraph">Párrafo</option>
          <option value="2">Título H2</option>
          <option value="3">Subtítulo H3</option>
          <option value="4">Sección H4</option>
        </select>

        <Divider />

        {/* Negrita */}
        <ToolbarButton
          title="Negrita (Ctrl+B)"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>N</strong>
        </ToolbarButton>

        {/* Cursiva */}
        <ToolbarButton
          title="Cursiva (Ctrl+I)"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </ToolbarButton>

        {/* Subrayado */}
        <ToolbarButton
          title="Subrayado (Ctrl+U)"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <span style={{ textDecoration: "underline" }}>S</span>
        </ToolbarButton>

        <Divider />

        {/* Alineación izquierda */}
        <ToolbarButton
          title="Alinear izquierda"
          active={activeAlign === "left"}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/>
          </svg>
        </ToolbarButton>

        {/* Alineación centro */}
        <ToolbarButton
          title="Centrar"
          active={activeAlign === "center"}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
          </svg>
        </ToolbarButton>

        {/* Alineación derecha */}
        <ToolbarButton
          title="Alinear derecha"
          active={activeAlign === "right"}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/>
          </svg>
        </ToolbarButton>

        {/* Justificado */}
        <ToolbarButton
          title="Justificar"
          active={activeAlign === "justify"}
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </ToolbarButton>

        <Divider />

        {/* Lista con viñetas */}
        <ToolbarButton
          title="Lista con viñetas"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/>
            <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/>
            <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/>
            <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/>
          </svg>
        </ToolbarButton>

        {/* Lista numerada */}
        <ToolbarButton
          title="Lista numerada"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/>
            <path d="M4 6h1v4" strokeWidth="2"/><path d="M4 10h2" strokeWidth="2"/>
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" strokeWidth="2"/>
          </svg>
        </ToolbarButton>

        {/* Cita */}
        <ToolbarButton
          title="Cita en bloque"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          ❝
        </ToolbarButton>

        {/* Separador horizontal */}
        <ToolbarButton
          title="Separador horizontal"
          active={false}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          —
        </ToolbarButton>

        <Divider />

        {/* Color de texto */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ fontSize: "11px", color: "var(--slate-500)", fontWeight: 600 }}>Color:</span>
          {TEXT_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().setColor(c.value).run();
              }}
              style={{
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                background: c.value,
                border: editor.isActive("textStyle", { color: c.value })
                  ? "2px solid var(--slate-700)"
                  : "2px solid transparent",
                cursor: "pointer",
                padding: 0,
                flexShrink: 0,
              }}
            />
          ))}
          {/* Reset color */}
          <button
            type="button"
            title="Color por defecto"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().unsetColor().run();
            }}
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              background: "white",
              border: "2px solid var(--slate-300)",
              cursor: "pointer",
              padding: 0,
              fontSize: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--slate-400)",
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── EDITOR CONTENT ── */}
      <EditorContent
        editor={editor}
        style={{ minHeight: "320px" }}
      />

      {/* Estilos para el contenido del editor */}
      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #94a3b8;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror:focus { outline: none; }
        .ProseMirror h2 { font-size: 22px; font-weight: 800; margin: 24px 0 12px; font-family: Outfit, sans-serif; }
        .ProseMirror h3 { font-size: 18px; font-weight: 700; margin: 20px 0 10px; font-family: Outfit, sans-serif; }
        .ProseMirror h4 { font-size: 15px; font-weight: 700; margin: 16px 0 8px; }
        .ProseMirror p { margin: 0 0 12px 0; }
        .ProseMirror ul, .ProseMirror ol { padding-left: 24px; margin: 12px 0; }
        .ProseMirror li { margin-bottom: 4px; }
        .ProseMirror blockquote { border-left: 4px solid #00D4AA; padding-left: 16px; margin: 16px 0; color: #64748b; font-style: italic; }
        .ProseMirror hr { border: none; border-top: 2px solid #e2e8f0; margin: 24px 0; }
        .ProseMirror strong { font-weight: 800; }
        .ProseMirror em { font-style: italic; }
        .ProseMirror u { text-decoration: underline; }
      `}</style>
    </div>
  );
}
