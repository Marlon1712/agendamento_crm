import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';

const sendEmail = async (to: string, subject: string, html: string) => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !port || !user || !pass || !from) {
    return false;
  }

  const nodemailer = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass }
  });

  await transporter.sendMail({ from, to, subject, html });
  return true;
};

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 });

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h

    const [rows]: any = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return NextResponse.json({ success: true });
    }

    await pool.query('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?', [tokenHash, expires, email]);

    const appUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'http://localhost:3000';
    const link = `${appUrl}/reset-password?token=${token}`;

    const sent = await sendEmail(
      email,
      'Redefinir senha',
      `<p>Olá! Clique no link para criar uma nova senha:</p><p><a href="${link}">${link}</a></p>`
    );

    if (!sent && process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ success: true, token });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao solicitar redefinição' }, { status: 500 });
  }
}
