import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

// DELETE (Already exists, keeping it for completeness of file if we were overwriting, but we are viewing [id]/route.ts)
// We will append PUT

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;

    await pool.query('UPDATE procedures SET active = false WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover procedimento' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const { name, duration, price, isPromotional, promoPrice, promoStartDate, promoEndDate, description, observation, promoType, promoGiftItem, promoSlots } = await request.json();

    const pPrice = isPromotional && promoPrice ? parseFloat(promoPrice) : null;
    const pStartDate = isPromotional && promoStartDate ? promoStartDate : null;
    const pEndDate = isPromotional && promoEndDate ? promoEndDate : null;
    const pType = isPromotional && promoType ? promoType : 'discount';
    const pGiftItem = isPromotional && promoGiftItem ? promoGiftItem : null;
    const pSlots = isPromotional && promoSlots ? parseInt(promoSlots) : null;
    const isPromo = isPromotional ? 1 : 0;

    await pool.query(
        'UPDATE procedures SET name = ?, duration_minutes = ?, price = ?, is_promotional = ?, promo_price = ?, promo_start_date = ?, promo_end_date = ?, description = ?, observation = ?, promo_type = ?, promo_gift_item = ?, promo_slots = ? WHERE id = ?', 
        [name, duration, price, isPromo, pPrice, pStartDate, pEndDate, description || null, observation || null, pType, pGiftItem, pSlots, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar procedimento' }, { status: 500 });
  }
}
