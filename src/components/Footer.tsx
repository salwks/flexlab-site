export default function Footer() {
  return (
    <footer className="border-t border-border/30 py-8">
      <div className="max-w-4xl mx-auto px-8 flex items-center justify-between">
        <span className="text-sm font-light text-muted">FLEXLAB</span>
        <span className="text-sm font-mono text-muted/40">
          &copy; {new Date().getFullYear()}
        </span>
      </div>
    </footer>
  );
}
