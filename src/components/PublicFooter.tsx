import { Link } from 'react-router-dom';
import BrandLogo from './ui/BrandLogo';

export default function PublicFooter() {
  return (
    <footer className="mt-12 border-t border-glass-border bg-surface text-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-3 md:px-8">
        <div>
          <Link to="/" aria-label="VANITY — inicio"><BrandLogo className="h-8" /></Link>
          <p className="mt-5 max-w-xs text-sm leading-7 text-text-secondary">Conectá tu negocio. Simplificá tu día.</p>
          <p className="mt-2 max-w-xs text-sm leading-7 text-text-secondary">Un espacio para descubrir negocios de belleza y organizar tu próximo turno.</p>
        </div>
        <nav aria-label="Explorar VANITY" className="flex flex-col items-start gap-4 text-sm">
          <h2 className="font-semibold">Descubrí VANITY</h2>
          <Link className="hover:underline" to="/">Explorar negocios</Link>
          <Link className="hover:underline" to="/para-negocios">Sumá tu negocio</Link>
        </nav>
        <div className="text-sm">
          <h2 className="font-semibold">Estamos para ayudarte</h2>
          <p className="mt-4 text-text-secondary">Consultas e información para negocios.</p>
          <a className="mt-4 inline-block break-all underline underline-offset-4" href="mailto:ayuda.vanity@gmail.com">ayuda.vanity@gmail.com</a>
        </div>
      </div>
      <div className="mx-auto max-w-7xl border-t border-glass-border px-6 py-5 text-xs text-text-secondary md:px-8">© {new Date().getFullYear()} VANITY · Belleza, gestión y conexión.</div>
    </footer>
  );
}
