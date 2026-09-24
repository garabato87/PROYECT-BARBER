import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Store, User as UserIcon, LayoutDashboard, CreditCard, PieChart, ShieldAlert, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/firebase';
import { collection, query, orderBy, startAt, endAt, limit, getDocs } from 'firebase/firestore';

type ResultItem = {
  id: string;
  title: string;
  subtitle: string;
  type: 'route' | 'user' | 'shop';
  path?: string;
  icon: React.ReactNode;
};

const STATIC_ROUTES: ResultItem[] = [
  { id: 'r1', title: 'Dashboard', subtitle: 'Ir al panel principal', type: 'route', path: '/superadmin', icon: <LayoutDashboard size={16}/> },
  { id: 'r2', title: 'Gestión de Locales', subtitle: 'Administrar barberías', type: 'route', path: '/superadmin/locales', icon: <Store size={16}/> },
  { id: 'r3', title: 'Usuarios', subtitle: 'Administrar roles', type: 'route', path: '/superadmin/usuarios', icon: <UserIcon size={16}/> },
  { id: 'r4', title: 'Suscripciones', subtitle: 'Pagos y estados', type: 'route', path: '/superadmin/suscripciones', icon: <CreditCard size={16}/> },
  { id: 'r5', title: 'Reportes', subtitle: 'Métricas de la plataforma', type: 'route', path: '/superadmin/reportes', icon: <PieChart size={16}/> },
  { id: 'r6', title: 'Auditoría', subtitle: 'Registro de seguridad', type: 'route', path: '/superadmin/audit', icon: <ShieldAlert size={16}/> },
];

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<ResultItem[]>(STATIC_ROUTES);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    if (isOpen) {
      setSearch('');
      setResults(STATIC_ROUTES);
      setSelectedIndex(0);
      timeoutId = setTimeout(() => inputRef.current?.focus(), 100);
    }
    return () => clearTimeout(timeoutId);
  }, [isOpen]);

  useEffect(() => {
    let isActive = true;

    const fetchResults = async () => {
      if (!search.trim()) {
        if (isActive) setResults(STATIC_ROUTES);
        return;
      }
      
      if (isActive) setLoading(true);
      try {
        const routeResults = STATIC_ROUTES.filter(r => 
          r.title.toLowerCase().includes(search.toLowerCase())
        );

        const usersRef = collection(db, 'users');
        const shopsRef = collection(db, 'businesses');
        
        const term = search.toLowerCase();
        const usersQ = query(usersRef, orderBy('email'), startAt(term), endAt(term + '\uf8ff'), limit(5));
        const shopsQ = query(shopsRef, orderBy('name'), startAt(term), endAt(term + '\uf8ff'), limit(5));

        const [usersSnap, shopsSnap] = await Promise.all([
          getDocs(usersQ).catch(() => ({ docs: [] })), 
          getDocs(shopsQ).catch(() => ({ docs: [] }))
        ]);
        
        if (!isActive) return;

        const userResults: ResultItem[] = usersSnap.docs.map(doc => ({
          id: doc.id,
          title: doc.data().name || doc.data().email,
          subtitle: doc.data().email,
          type: 'user',
          icon: <UserIcon size={16} />,
          path: '/superadmin/usuarios'
        }));

        const shopResults: ResultItem[] = shopsSnap.docs.map(doc => ({
          id: doc.id,
          title: doc.data().name,
          subtitle: 'Local registrado',
          type: 'shop',
          icon: <Store size={16} />,
          path: '/superadmin/locales'
        }));

        setResults([...routeResults, ...shopResults, ...userResults]);
        setSelectedIndex(0);
      } catch (error) {
        if (!isActive) return;
        console.error('Búsqueda fallida:', error);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    const debounce = setTimeout(fetchResults, 300);
    return () => {
      isActive = false;
      clearTimeout(debounce);
    };
  }, [search]);

  const handleSelect = (item: ResultItem) => {
    setIsOpen(false);
    if (item.path) {
      navigate(item.path);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    }
    if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="w-full max-w-2xl bg-surface border border-glass-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-glass-border">
              <Search className="text-accent shrink-0" size={20} />
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded={isOpen}
                aria-controls="command-palette-listbox"
                placeholder="Buscar locales, usuarios o acciones..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={onKeyDown}
                className="flex-1 bg-transparent border-none outline-none text-foreground text-lg placeholder:text-text-muted"
              />
              <div className="flex items-center gap-1.5">
                <kbd className="px-2 py-1 bg-background rounded text-xs font-mono text-text-muted border border-glass-border">ESC</kbd>
              </div>
            </div>

            {/* Results */}
            <div id="command-palette-listbox" role="listbox" className="max-h-[60vh] overflow-y-auto p-2">
              {loading && (
                <div className="p-4 text-center text-sm text-text-muted">Buscando...</div>
              )}
              {!loading && results.length === 0 && (
                <div className="p-4 text-center text-sm text-text-muted">No se encontraron resultados para "{search}"</div>
              )}
              {!loading && results.map((item, idx) => (
                <button
                  key={item.id}
                  role="option"
                  aria-selected={idx === selectedIndex}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all outline-none ${
                    idx === selectedIndex ? 'bg-accent/10' : 'hover:bg-background'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={"p-2 rounded-lg "}>
                      {item.icon}
                    </div>
                    <div className="text-left">
                      <p className={"text-sm font-bold "}>{item.title}</p>
                      <p className="text-xs text-text-muted">{item.subtitle}</p>
                    </div>
                  </div>
                  {idx === selectedIndex && <ArrowRight className="text-accent" size={16} />}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
