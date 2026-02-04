import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'secret-key-change-me');

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
    }

    // @ts-ignore
    const [rows]: any = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      // For security, don't reveal user existence, but for MVP clarity:
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    // Compare password (assuming stored hash, OR plain text if just testing/seeded manually without hash)
    // For this implementation, we try verify hash. If it fails, check plain text (fallback for simple seeds)
    let isValid = false;
    try {
        isValid = await bcrypt.compare(password, user.password);
    } catch (e) {
        // Fallback for plain text passwords in legacy/dev
        isValid = password === user.password;
    }

    // Force plain text check if bcrypt failed but plain match works (ONLY FOR DEV/MVP SEEDS)
    if (!isValid && password === user.password) isValid = true;

    if (!isValid) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    // Create Token
    const token = await new SignJWT({ id: user.id, email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(SECRET);

    const response = NextResponse.json({ success: true });
    
    // Set HTTP-only cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
