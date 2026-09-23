import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

// Vercel serverless functions inject env vars automatically from the dashboard
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { to, subject, type, data } = req.body;

    if (!to || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Determine content based on type
    let htmlContent = '';
    
    if (type === 'confirmation') {
      htmlContent = `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>¡Turno Confirmado!</h2>
          <p>Hola ${data.clientName || 'cliente'}, tu turno en <strong>${data.shopName || 'nuestro local'}</strong> ha sido confirmado.</p>
          <ul>
            <li><strong>Servicio:</strong> ${data.serviceName || 'Desconocido'}</li>
            <li><strong>Profesional:</strong> ${data.professionalName || 'Cualquiera'}</li>
            <li><strong>Fecha:</strong> ${data.date}</li>
            <li><strong>Hora:</strong> ${data.startTime}</li>
          </ul>
          <p>¡Te esperamos!</p>
        </div>
      `;
    } else if (type === 'cancellation') {
      htmlContent = `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Turno Cancelado</h2>
          <p>Hola ${data.clientName || 'cliente'}, tu turno en <strong>${data.shopName || 'nuestro local'}</strong> para el ${data.date} a las ${data.startTime} ha sido cancelado.</p>
          <p>Si fue un error, por favor comunícate con el local o vuelve a agendar a través de la aplicación.</p>
        </div>
      `;
    } else {
      return res.status(400).json({ error: 'Invalid email type' });
    }

    // En beta mandamos los emails al correo del dueño/developer de pruebas
    const recipient = 'alvarez.braian87@gmail.com'; 

    const resendSubject = subject || (type === 'confirmation' ? '¡Turno Confirmado!' : 'Turno Cancelado');

    const result = await resend.emails.send({
      from: 'Sistema de Turnos <onboarding@resend.dev>', // Sender por defecto para Testing en Resend
      to: recipient,
      subject: resendSubject,
      html: htmlContent,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
