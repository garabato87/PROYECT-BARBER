import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BusinessLandingPage from './BusinessLandingPage';

vi.mock('../components/ExploreLayout', () => ({ default: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));

describe('Página pública para negocios', () => {
  beforeEach(() => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('abre desde arriba sin volver a mover el scroll al interactuar con la página', () => {
    render(<MemoryRouter><BusinessLandingPage /></MemoryRouter>);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });
    fireEvent.click(screen.getByText('¿Cuánto cuesta?'));
    expect(window.scrollTo).toHaveBeenCalledTimes(1);
  });

  it('explica la oferta y permite volver a explorar sin registro', () => {
    render(<MemoryRouter><BusinessLandingPage /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Tu negocio');
    expect(screen.getByRole('link', { name: /volver a explorar/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('heading', { name: 'Servicios claros' })).toBeInTheDocument();
  });

  it('ofrece un correo real sin simular un envío', () => {
    render(<MemoryRouter><BusinessLandingPage /></MemoryRouter>);
    const link = screen.getByRole('link', { name: 'ayuda.vanity@gmail.com' });
    const url = new URL(link.getAttribute('href')!);
    expect(url.protocol).toBe('mailto:');
    expect(url.pathname).toBe('ayuda.vanity@gmail.com');
    expect(url.searchParams.get('subject')).toBe('Quiero sumar mi negocio a VANITY');
    expect(screen.getByText(/el mensaje se envía cuando vos lo confirmás/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /enviar/i })).not.toBeInTheDocument();
  });

  it('permite consultar condiciones sin inventar precios', () => {
    render(<MemoryRouter><BusinessLandingPage /></MemoryRouter>);
    const question = screen.getByText('¿Cuánto cuesta?');
    fireEvent.click(question);
    expect(question.closest('details')).toHaveAttribute('open');
    expect(screen.getByText(/consultá las condiciones vigentes/i)).toBeInTheDocument();
  });
});
