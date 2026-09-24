import { useRef, useState, type FormEvent } from 'react';
import { Mail } from 'lucide-react';

export const BUSINESS_CONTACT_EMAIL = 'ayuda.vanity@gmail.com';
export const BUSINESS_CONTACT_SUBJECT = 'Quiero sumar mi negocio a VANITY';
const sectors = ['Barbería', 'Peluquería', 'Spa', 'Estética', 'Uñas', 'Pestañas', 'Maquillaje', 'Estilismo', 'Masajes', 'Otro'];
type Fields = { name: string; business: string; sector: string; email: string };

export default function BusinessContactForm() {
  const [fields, setFields] = useState<Fields>({ name: '', business: '', sector: '', email: '' });
  const [errors, setErrors] = useState<Partial<Fields>>({});
  const [message, setMessage] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const update = (key: keyof Fields, value: string) => {
    setFields(current => ({ ...current, [key]: value }));
    setMessage('');
    setErrors(current => ({ ...current, [key]: undefined }));
  };
  const prepare = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: Partial<Fields> = {};
    if (!fields.name.trim()) next.name = 'Ingresá tu nombre.';
    if (!fields.business.trim()) next.business = 'Ingresá el nombre del negocio.';
    if (!sectors.includes(fields.sector)) next.sector = 'Elegí un rubro.';
    const emailInput = formRef.current?.elements.namedItem('email') as HTMLInputElement | null;
    if (!fields.email.trim() || !emailInput?.validity.valid) next.email = 'Ingresá un email válido.';
    setErrors(next);
    if (Object.keys(next).length) {
      setMessage('');
      const first = Object.keys(next)[0];
      (formRef.current?.elements.namedItem(first) as HTMLElement | null)?.focus();
      return;
    }
    setMessage(`Hola, equipo de VANITY:\n\nQuiero solicitar información para sumar mi negocio.\n\nNombre: ${fields.name.trim()}\nNegocio: ${fields.business.trim()}\nRubro: ${fields.sector}\nEmail de contacto: ${fields.email.trim()}\n\nMe gustaría conocer las funcionalidades, condiciones y pasos para el alta.\n\nGracias.`);
  };
  const mailto = `mailto:${BUSINESS_CONTACT_EMAIL}?subject=${encodeURIComponent(BUSINESS_CONTACT_SUBJECT)}&body=${encodeURIComponent(message)}`;

  return (
    <form ref={formRef} onSubmit={prepare} noValidate className="business-request" aria-label="Solicitud de alta">
      <h3>Contanos sobre tu negocio</h3>
      <p id="business-request-help">Completá tus datos para preparar el correo. No se guardan en VANITY ni se envían automáticamente.</p>
      {Object.values(errors).some(Boolean) && <p role="alert">Revisá los campos indicados antes de continuar.</p>}
      <label htmlFor="business-name">Tu nombre</label>
      <input id="business-name" name="name" autoComplete="name" required maxLength={80} value={fields.name} onChange={e => update('name', e.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'business-name-error' : undefined} />
      {errors.name && <p id="business-name-error" className="business-field-error">{errors.name}</p>}
      <label htmlFor="business-company">Nombre del negocio</label>
      <input id="business-company" name="business" autoComplete="organization" required maxLength={120} value={fields.business} onChange={e => update('business', e.target.value)} aria-invalid={!!errors.business} aria-describedby={errors.business ? 'business-company-error' : undefined} />
      {errors.business && <p id="business-company-error" className="business-field-error">{errors.business}</p>}
      <label htmlFor="business-sector">Rubro</label>
      <select id="business-sector" name="sector" required value={fields.sector} onChange={e => update('sector', e.target.value)} aria-invalid={!!errors.sector} aria-describedby={errors.sector ? 'business-sector-error' : undefined}>
        <option value="">Seleccioná un rubro</option>{sectors.map(sector => <option key={sector}>{sector}</option>)}
      </select>
      {errors.sector && <p id="business-sector-error" className="business-field-error">{errors.sector}</p>}
      <label htmlFor="business-email">Email de contacto</label>
      <input id="business-email" name="email" type="email" autoComplete="email" required maxLength={254} value={fields.email} onChange={e => update('email', e.target.value)} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'business-email-error' : undefined} />
      {errors.email && <p id="business-email-error" className="business-field-error">{errors.email}</p>}
      <button className="business-primary" type="submit">Preparar solicitud <Mail size={18} aria-hidden="true" /></button>
      <div role="status">{message && <p>Correo preparado. Todavía no se envió. Revisalo y abrí tu aplicación de correo para confirmar el envío.</p>}</div>
      {message && <div className="business-message">
        <p>Para: <strong>{BUSINESS_CONTACT_EMAIL}</strong></p>
        <label htmlFor="business-message">Mensaje preparado</label>
        <textarea id="business-message" readOnly value={message} rows={10} />
        <a className="business-primary" href={mailto}>Abrir mi correo <Mail size={18} aria-hidden="true" /></a>
        <p>Si no se abre, copiá el mensaje y envialo desde tu correo habitual a {BUSINESS_CONTACT_EMAIL}.</p>
      </div>}
    </form>
  );
}
