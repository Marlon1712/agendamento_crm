import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT * FROM procedures WHERE active = true ORDER BY display_order ASC');
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar procedimentos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, duration, price, isPromotional, promoPrice, promoStartDate, promoEndDate, description, observation, promoType, promoGiftItem, promoSlots } = await request.json();
    
    // Tratamento de valores opcionais para garantir null se vazio
    const pPrice = isPromotional && promoPrice ? parseFloat(promoPrice) : null;
    const pStartDate = isPromotional && promoStartDate ? promoStartDate : null;
    const pEndDate = isPromotional && promoEndDate ? promoEndDate : null;
    const pType = isPromotional && promoType ? promoType : 'discount';
    const pGiftItem = isPromotional && promoGiftItem ? promoGiftItem : null;
    const pSlots = isPromotional && promoSlots ? parseInt(promoSlots) : null;
    const isPromo = isPromotional ? 1 : 0;

    await pool.query(
        'INSERT INTO procedures (name, duration_minutes, price, is_promotional, promo_price, promo_start_date, promo_end_date, description, observation, promo_type, promo_gift_item, promo_slots) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
        [name, duration, price, isPromo, pPrice, pStartDate, pEndDate, description || null, observation || null, pType, pGiftItem, pSlots]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar procedimento' }, { status: 500 });
  }
}
