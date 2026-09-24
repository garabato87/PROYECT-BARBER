import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import BusinessContactForm from './BusinessContactForm';

describe('Solicitud de negocio por correo', () => {
  it('rechaza un email inválido aunque los demás campos estén completos', () => {
    render(<BusinessContactForm />);
    fireEvent.change(screen.getByLabelText('Tu nombre'), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByLabelText('Nombre del negocio'), { target: { value: 'Salón' } });
    fireEvent.change(screen.getByLabelText('Rubro'), { target: { value: 'Spa' } });
    fireEvent.change(screen.getByLabelText('Email de contacto'), { target: { value: 'correo-invalido' } });
    fireEvent.submit(screen.getByRole('form', { name: 'Solicitud de alta' }));
    expect(screen.getByLabelText('Email de contacto')).toHaveFocus();
    expect(screen.getByText('Ingresá un email válido.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Abrir mi correo' })).not.toBeInTheDocument();
  });

  it('rechaza campos vacíos y espacios sin preparar un correo', () => {
    render(<BusinessContactForm />);
    fireEvent.change(screen.getByLabelText('Tu nombre'), { target: { value: '   ' } });
    fireEvent.submit(screen.getByRole('form', { name: 'Solicitud de alta' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Abrir mi correo' })).not.toBeInTheDocument();
  });

  it('codifica los datos y permite revisar el mensaje sin afirmar que fue enviado', () => {
    render(<BusinessContactForm />);
    fireEvent.change(screen.getByLabelText('Tu nombre'), { target: { value: 'Ana Pérez' } });
    fireEvent.change(screen.getByLabelText('Nombre del negocio'), { target: { value: 'Corte & Color #1' } });
    fireEvent.change(screen.getByLabelText('Rubro'), { target: { value: 'Peluquería' } });
    fireEvent.change(screen.getByLabelText('Email de contacto'), { target: { value: 'ana@example.com' } });
    fireEvent.submit(screen.getByRole('form', { name: 'Solicitud de alta' }));
    const url = new URL(screen.getByRole('link', { name: 'Abrir mi correo' }).getAttribute('href')!);
    expect(url.pathname).toBe('ayuda.vanity@gmail.com');
    expect(url.searchParams.get('body')).toContain('Corte & Color #1');
    expect(url.searchParams.get('body')).toContain('Ana Pérez');
    expect(url.searchParams.get('body')).toContain('Peluquería');
    expect(url.searchParams.get('body')).toContain('ana@example.com');
    expect(screen.getByRole('status')).toHaveTextContent('Todavía no se envió');
    fireEvent.change(screen.getByLabelText('Tu nombre'), { target: { value: 'Otro nombre' } });
    expect(screen.queryByRole('link', { name: 'Abrir mi correo' })).not.toBeInTheDocument();
  });
});
