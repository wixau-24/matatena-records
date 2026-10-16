import { NextResponse } from 'next/server';
import {
  createStudioBooking,
  getStudioBundle,
  updateBookingStatus,
  updateGearCatalog,
  updateStudioSettings,
  verifyAdminPassword
} from '../../../lib/store.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const password = request.headers.get('x-admin-password') || body.password || '';

    if (!verifyAdminPassword(password)) {
      return NextResponse.json(
        { ok: false, error: 'Contraseña de administrador incorrecta.' },
        { status: 401 }
      );
    }

    const action = body.action || 'verify';

    if (action === 'verify') {
      const bundle = await getStudioBundle();
      return NextResponse.json({ ok: true, ...bundle });
    }

    if (action === 'update_booking') {
      const booking = await updateBookingStatus({
        id: body.id,
        status: body.status,
        adminNotes: body.adminNotes
      });
      return NextResponse.json({ ok: true, booking });
    }

    if (action === 'create_manual_booking') {
      const booking = await createStudioBooking(body.payload || {});
      return NextResponse.json({ ok: true, booking });
    }

    if (action === 'update_settings') {
      const settings = await updateStudioSettings(body.settings || {});
      return NextResponse.json({ ok: true, settings });
    }

    if (action === 'update_gear') {
      const gear = await updateGearCatalog(body.gearItem || {});
      return NextResponse.json({ ok: true, gear });
    }

    return NextResponse.json({ ok: false, error: 'Acción no reconocida.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Error en operación de administrador.' },
      { status: 400 }
    );
  }
}
