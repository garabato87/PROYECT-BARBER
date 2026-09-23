import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Calendar, Scissors, Users, Loader2 } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [statsData, setStatsData] = useState({ appointments: 0, services: 0, professionals: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.barbershopId) return;

      try {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const formattedDate = `${yyyy}-${mm}-${dd}`;

        // Citas Hoy
        const appointmentsQ = query(
          collection(db, 'businesses', user.barbershopId, 'appointments'),
          where('date', '==', formattedDate),
          where('status', 'in', ['pending', 'confirmed'])
        );
        const appsSnap = await getDocs(appointmentsQ);
        
        // Servicios Activos
        const servicesQ = query(collection(db, 'businesses', user.barbershopId, 'services'));
        const srvSnap = await getDocs(servicesQ);

        // Profesionales Activos
        const professionalsQ = query(
          collection(db, 'businesses', user.barbershopId, 'professionals'),
          where('isActive', '==', true)
        );
        const proSnap = await getDocs(professionalsQ);

        setStatsData({
          appointments: appsSnap.size,
          services: srvSnap.size,
          professionals: proSnap.size
        });
      } catch (error) {
        console.error("Error al obtener datos del dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const stats = [
    { label: 'Citas Hoy', value: statsData.appointments, icon: Calendar, color: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Servicios Activos', value: statsData.services, icon: Scissors, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Equipo', value: statsData.professionals, icon: Users, color: 'text-text-secondary', bg: 'bg-glass-border' },
  ];

  return (
    <Layout title="Dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-2">
            Bienvenido al Sistema de Gestión
          </h2>
          <p className="text-text-secondary text-lg">
            Aquí tienes un resumen de la actividad de tu local.
          </p>
        </motion.div>
        
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-surface border border-glass-border p-6 rounded-2xl flex items-center justify-between hover:bg-surface-hover transition-colors shadow-sm"
              >
                <div>
                  <span className="text-sm font-bold text-text-muted uppercase tracking-wider">
                    {stat.label}
                  </span>
                  <h3 className="text-4xl font-black text-foreground mt-2">
                    {stat.value}
                  </h3>
                </div>
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                  <stat.icon size={28} strokeWidth={2.5} />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DashboardPage;
