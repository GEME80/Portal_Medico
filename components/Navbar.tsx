"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav className={`navbar${scrolled ? " scrolled" : ""}`}>
        <div className="container">
          <div className="navbar-inner">
            {/* Brand */}
            <Link href="/" className="navbar-brand">
              <div className="navbar-logo-icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L13.5 8.5H20L14.5 12.5L16 19L12 15L8 19L9.5 12.5L4 8.5H10.5Z"/>
                  <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>
                </svg>
              </div>
              <div className="navbar-brand-text">
                <span className="navbar-brand-name">Dr. Carlos Torres</span>
                <span className="navbar-brand-sub">Infectólogo Pediatra</span>
              </div>
            </Link>

            {/* Desktop Links */}
            <ul className="navbar-links" id="nav-links">
              <li><Link href="/#sobre-el-doctor">Sobre el Doctor</Link></li>
              <li><Link href="/noticias">Publicaciones</Link></li>
              <li><Link href="/vacunas">EcoVaccine</Link></li>
              <li><Link href="/#contacto">Contacto</Link></li>
            </ul>

            {/* CTA */}
            <div className="navbar-cta">
              <Link href="/admin" className="btn btn-primary" style={{ padding: "10px 20px", fontSize: "13px" }}>
                Panel Admin
              </Link>
            </div>

            {/* Hamburger */}
            <button
              className="navbar-hamburger"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Abrir menú"
              aria-expanded={menuOpen}
              id="hamburger-btn"
            >
              {menuOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu${menuOpen ? " open" : ""}`} id="mobile-menu" aria-hidden={!menuOpen}>
        <Link href="/#sobre-el-doctor" onClick={() => setMenuOpen(false)}>Sobre el Doctor</Link>
        <Link href="/noticias" onClick={() => setMenuOpen(false)}>Publicaciones</Link>
        <Link href="/vacunas" onClick={() => setMenuOpen(false)}>EcoVaccine</Link>
        <Link href="/#contacto" onClick={() => setMenuOpen(false)}>Contacto</Link>
        <Link href="/admin" onClick={() => setMenuOpen(false)} style={{ marginTop: "8px" }}>
          <span className="btn btn-primary" style={{ width: "100%", padding: "12px", fontSize: "14px" }}>
            Panel Admin
          </span>
        </Link>
      </div>
    </>
  );
}
