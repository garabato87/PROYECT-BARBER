import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BUSINESS_CATEGORIES } from '../constants/categories';
import ClientLayout from '../components/ClientLayout';
import { Search, MapPin, Store, Loader2 } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import './HomePage.css';

const CATEGORY_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'barberia',   label: '✂️ Barberías' },
  { key: 'peluqueria', label: '💇 Peluquerías' },
  { key: 'spa',        label: '🧖 Spa' },
  { key: 'estetica',   label: '✨ Estética' },
  { key: 'unas',       label: '💅 Uñas' },
  { key: 'masajes',    label: '🤲 Masajes' },
];

const HomePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBusinesses = async () => {
      setIsLoading(true);
      try {
        let qConstraints = [where('status', '==', 'active')];
        if (activeCategory !== 'all') {
          qConstraints.push(where('category', '==', activeCategory));
        }
        const q = query(collection(db, 'businesses'), ...qConstraints);
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBusinesses(data);
      } catch (err) {
        console.error('Error fetching businesses:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBusinesses();
  }, [activeCategory]);

  const filtered = businesses.filter(b => {
    return b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           b.address.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <ClientLayout title="Descubrir Servicios">
      <motion.div 
        className="home-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >

        <header className="home-hero glass-panel">
          <div className="hero-content">
            <h1>Encontrá tu servicio ideal</h1>
            <p className="text-muted">
              Reservá en las mejores barberías, peluquerías, spas y centros de estética cerca tuyo.
            </p>

            <div className="search-bar-premium">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Buscar por nombre, servicio o ubicación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* Category filters */}
        <div className="category-filters-container">
          {CATEGORY_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`category-btn ${activeCategory === key ? 'active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>

        <section className="results-section">
          <h3 className="section-title">
            {activeCategory === 'all'
              ? 'Todos los locales'
              : BUSINESS_CATEGORIES[activeCategory as keyof typeof BUSINESS_CATEGORIES]?.label ?? 'Resultados'}
            <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '0.75rem' }}>
              ({filtered.length})
            </span>
          </h3>

          <motion.div 
            className="barbershop-grid"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.05 }
              }
            }}
          >
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>
                  <Loader2 size={32} className="spinner" style={{ color: 'var(--accent)', margin: '0 auto' }} />
                </div>
              ) : filtered.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="empty-search-state glass-panel"
                >
                  <Search size={48} className="text-muted" style={{ opacity: 0.5, marginBottom: '1rem' }} />
                  <h4>No encontramos resultados</h4>
                  <p className="text-muted">Intenta buscar con otros términos o cambiar de categoría.</p>
                </motion.div>
              ) : filtered.map(business => {

                const cat = BUSINESS_CATEGORIES[business.category as keyof typeof BUSINESS_CATEGORIES];
                return (
                  <motion.div
                    layout
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
                    }}
                    key={business.id}
                    className="glass-panel barber-card-premium"
                    onClick={() => navigate(`/barbershop/${business.id}`)}
                  >
                    <div className="card-image-wrapper">
                      <div className="image-overlay" />
                      <Store size={48} className="placeholder-icon" />
                      <span className={`status-pill-premium ${business.status}`}>
                        {business.status === 'active' ? 'Abierto ahora' : 'Cerrado'}
                      </span>
                      {cat && (
                        <span style={{
                          position: 'absolute',
                          top: '0.75rem',
                          left: '0.75rem',
                          background: 'rgba(0,0,0,0.6)',
                          backdropFilter: 'blur(8px)',
                          color: '#fff',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: '20px',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}>
                          {cat.emoji} {cat.label}
                        </span>
                      )}
                    </div>

                    <div className="card-content">
                      <h3>{business.name}</h3>
                      <div className="location-row text-muted">
                        <MapPin size={16} />
                        <span>{business.address}</span>
                      </div>
                      <div className="card-actions">
                        <button className="action-btn">Reservar Turno</button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </section>

      </motion.div>
    </ClientLayout>
  );
};

export default HomePage;
