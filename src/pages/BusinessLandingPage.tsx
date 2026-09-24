import { useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowUpRight, CalendarDays, Check, Scissors, Store, Users } from 'lucide-react';
import BusinessContactForm, { BUSINESS_CONTACT_EMAIL, BUSINESS_CONTACT_SUBJECT } from '../components/BusinessContactForm';
import ExploreLayout from '../components/ExploreLayout';
import './BusinessLandingPage.css';

const contactEmail = BUSINESS_CONTACT_EMAIL;
const contactHref = `mailto:${contactEmail}?subject=${encodeURIComponent(BUSINESS_CONTACT_SUBJECT)}`;
const features = [
  { icon: CalendarDays, title: 'Tu agenda, organizada', text: 'Consultá los turnos y sus estados. Encontrá la información que necesitás para organizar cada jornada.' },
  { icon: Scissors, title: 'Servicios claros', text: 'Administrá los servicios que ofrecés, sus precios y su duración desde el panel de tu negocio.' },
  { icon: Users, title: 'Tu equipo, conectado', text: 'Gestioná los profesionales que forman parte de tu negocio desde un mismo espacio.' },
];
const questions = [
  { title: '¿Para qué negocios está pensado?', answer: 'Para barberías, peluquerías y espacios de belleza y cuidado personal. Escribinos para conocer cómo se adapta la plataforma a tu rubro.' },
  { title: '¿Cómo reservan mis clientes?', answer: 'Exploran tu negocio, consultan los servicios y eligen profesional y horario. Para confirmar su reserva, deben iniciar sesión.' },
  { title: '¿Cuánto cuesta?', answer: 'Consultá las condiciones vigentes escribiendo a ayuda.vanity@gmail.com. Antes de incorporar tu negocio, acordamos el alcance y las condiciones del servicio.' },
  { title: '¿El alta es automática?', answer: 'No. Primero nos contactás por email. Conversamos sobre tu negocio y coordinamos los pasos para incorporarlo a VANITY.' },
];

export default function BusinessLandingPage() {
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  return (
    <ExploreLayout title="Para negocios">
      <div className="business-landing">
        <div className="business-wrap">
          <nav className="business-subnav" aria-label="Información para negocios">
            <Link to="/" className="business-back"><ArrowLeft size={16} aria-hidden="true" /> Volver a explorar</Link>
            <a href="#funcionalidades">Funcionalidades</a>
            <a href="#preguntas">Preguntas frecuentes</a>
          </nav>
          <section className="business-hero" aria-labelledby="business-title">
            <div>
              <p className="business-eyebrow">VANITY PARA NEGOCIOS</p>
              <h1 id="business-title">Tu negocio.<br />Tu equipo.<br /><span>Todo más organizado.</span></h1>
              <p className="business-intro">Vos ponés el talento. VANITY te ayuda a organizar tus turnos, servicios y profesionales en un mismo lugar.</p>
              <div className="business-actions">
                <a className="business-primary" href="#contacto">Quiero sumar mi negocio <ArrowUpRight size={18} aria-hidden="true" /></a>
                <a className="business-secondary" href="#funcionalidades">Ver cómo funciona <ArrowDown size={16} aria-hidden="true" /></a>
              </div>
              <p className="business-caption">Para barberías, peluquerías y espacios de belleza.</p>
            </div>
            <aside className="business-overview" aria-label="Áreas de gestión de VANITY">
              <div className="business-overview-heading"><Store size={22} aria-hidden="true" /><span>El espacio de tu negocio</span></div>
              <p className="business-overview-title">Todo empieza<br />con una buena organización.</p>
              <div className="business-overview-row"><CalendarDays aria-hidden="true" size={21} /><div><strong>Agenda</strong><span>Turnos y estados, a mano.</span></div><Check size={16} aria-hidden="true" /></div>
              <div className="business-overview-row"><Scissors aria-hidden="true" size={21} /><div><strong>Servicios</strong><span>Tu propuesta, bien definida.</span></div><Check size={16} aria-hidden="true" /></div>
              <div className="business-overview-row"><Users aria-hidden="true" size={21} /><div><strong>Profesionales</strong><span>Tu equipo, en un mismo lugar.</span></div><Check size={16} aria-hidden="true" /></div>
            </aside>
          </section>

          <section className="business-section" id="funcionalidades" aria-labelledby="features-title">
            <p className="business-eyebrow">MENOS DISPERSIÓN. MÁS CLARIDAD.</p>
            <h2 id="features-title">Un lugar para organizar tu día.</h2>
            <div className="business-grid">{features.map(({ icon: Icon, title, text }) => (
              <article key={title} className="business-feature"><Icon size={26} aria-hidden="true" /><h3>{title}</h3><p>{text}</p></article>
            ))}</div>
          </section>

          <section className="business-section" aria-labelledby="client-journey-title">
            <p className="business-eyebrow">TAMBIÉN PENSADO PARA TUS CLIENTES</p>
            <h2 id="client-journey-title">De descubrir tu negocio<br />a elegir su próximo turno.</h2>
            <ol className="business-grid business-journey">
              <li><span className="business-step">01</span><h3>Te encuentran</h3><p>Exploran negocios por nombre, dirección o categoría y conocen tu propuesta.</p></li>
              <li><span className="business-step">02</span><h3>Eligen su visita</h3><p>Consultan los servicios, profesionales y horarios disponibles para reservar.</p></li>
              <li><span className="business-step">03</span><h3>Confirman su turno</h3><p>Ingresan a su cuenta para confirmar y luego consultan sus reservas.</p></li>
            </ol>
          </section>

          <section className="business-start business-section" aria-labelledby="start-title">
            <div><p className="business-eyebrow">ALTA ASISTIDA</p><h2 id="start-title">Empecemos<br />por tu negocio.</h2><p>No necesitás resolver todo ahora. Contanos qué hacés y coordinamos los próximos pasos.</p></div>
            <ol className="business-start-list">
              <li><span>1</span><div><h3>Escribinos</h3><p>Contanos el nombre de tu negocio, su rubro y qué necesitás organizar.</p></div></li>
              <li><span>2</span><div><h3>Conocé las posibilidades</h3><p>Revisamos juntos las funcionalidades y las condiciones del servicio.</p></div></li>
              <li><span>3</span><div><h3>Coordinamos el alta</h3><p>Acordamos cómo incorporar tu negocio y configurar su información.</p></div></li>
            </ol>
          </section>

          <section className="business-section business-faq" id="preguntas" aria-labelledby="faq-title">
            <h2 id="faq-title">Antes de dar el próximo paso.</h2>
            {questions.map(({ title, answer }) => <details key={title}><summary>{title}</summary><p>{answer}</p></details>)}
          </section>

          <section className="business-contact" id="contacto" aria-labelledby="contact-title">
            <div><p className="business-eyebrow">HABLEMOS</p><h2 id="contact-title">Conectá tu negocio.<br />Simplificá tu día.</h2><p>Escribinos para conocer VANITY y solicitar el alta de tu negocio.</p></div>
            <div className="business-contact-actions"><BusinessContactForm /><a className="business-email" href={contactHref}>{contactEmail}</a><p>El mensaje se envía cuando vos lo confirmás en tu aplicación de correo. También podés escribirnos directamente.</p></div>
          </section>

        </div>
      </div>
    </ExploreLayout>
  );
}
