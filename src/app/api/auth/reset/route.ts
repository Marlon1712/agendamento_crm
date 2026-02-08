import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();
    if (!token || !password) return NextResponse.json({ error: 'Dados obrigatórios' }, { status: 400 });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [rows]: any = await pool.query(
      'SELECT id, reset_token_expires FROM users WHERE reset_token = ?',
      [tokenHash]
    );

    if (rows.length === 0) return NextResponse.json({ error: 'Token inválido' }, { status: 400 });

    const expires = rows[0].reset_token_expires ? new Date(rows[0].reset_token_expires) : null;
    if (!expires || expires.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Token expirado' }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [hashed, rows[0].id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao redefinir senha' }, { status: 500 });
  }
}
