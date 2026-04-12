"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const navItems = [
  { label: "About", href: "#about" },
  { label: "R&D", href: "#rnd" },
  { label: "Products", href: "#products" },
  { label: "Careers", href: "#careers" },
  { label: "Contact", href: "#contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "glass border-b border-border shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          <span
            className={`font-bold text-lg tracking-tight transition-colors ${
              scrolled ? "text-foreground" : "text-foreground"
            }`}
          >
            FLEXLAB
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                scrolled ? "text-muted" : "text-muted"
              }`}
            >
              {item.label}
            </a>
          ))}
          <a
            href="#careers"
            className="text-sm font-semibold px-5 py-2 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            Join Us
          </a>
        </nav>

        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <X className="text-foreground" size={24} />
          ) : (
            <Menu className="text-foreground" size={24} />
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden glass border-t border-border">
          <nav className="flex flex-col p-6 gap-4">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-foreground font-medium py-2"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <a
              href="#careers"
              className="text-center font-semibold px-5 py-3 rounded-full bg-primary text-white"
              onClick={() => setMobileOpen(false)}
            >
              Join Us
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
