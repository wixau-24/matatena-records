import { NextResponse } from 'next/server';
import { createStudioBooking, getStudioBundle } from '../../../lib/store.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const bundle = await getStudioBundle();
    return NextResponse.json({
      ok: true,
      settings: bundle.settings,
      gear: bundle.gear,
      bookings: bundle.bookings,
      storageMode: bundle.storageMode
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Error al cargar datos del estudio.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const booking = await createStudioBooking(body);
    return NextResponse.json({ ok: true, booking }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'No se pudo registrar la reservación.' },
      { status: 400 }
    );
  }
}
