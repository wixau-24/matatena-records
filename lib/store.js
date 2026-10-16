import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_GEAR_CATALOG, DEFAULT_STUDIO_SETTINGS } from './matatena-catalog.js';
import { calculateQuote, computeDayAvailability, generateFolio } from './booking-engine.js';

const LOCAL_DIR = path.join(process.cwd(), '.matatena-local');
const LOCAL_FILE = path.join(LOCAL_DIR, 'store.json');

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url.includes('YOUR_PROJECT')) {
    return null;
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function readLocalState() {
  try {
    if (fs.existsSync(LOCAL_FILE)) {
      const raw = fs.readFileSync(LOCAL_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      return {
        settings: { ...DEFAULT_STUDIO_SETTINGS, ...(parsed.settings || {}) },
        gear: Array.isArray(parsed.gear) && parsed.gear.length > 0 ? parsed.gear : DEFAULT_GEAR_CATALOG,
        bookings: Array.isArray(parsed.bookings) ? parsed.bookings : []
      };
    }
  } catch {
    // Fallback to defaults if file is corrupted
  }
  return {
    settings: { ...DEFAULT_STUDIO_SETTINGS },
    gear: [...DEFAULT_GEAR_CATALOG],
    bookings: []
  };
}

function writeLocalState(state) {
  try {
    if (!fs.existsSync(LOCAL_DIR)) {
      fs.mkdirSync(LOCAL_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch {
    // Ignore write errors in read-only environments
  }
}

export async function getStudioBundle() {
  const local = readLocalState();
  const supabase = getSupabaseClient();

  if (!supabase) {
    return { ...local, storageMode: 'local' };
  }

  try {
    const [settingsRes, gearRes, bookingsRes] = await Promise.all([
      supabase.from('matatena_settings').select('*').eq('id', 'default').maybeSingle(),
      supabase.from('matatena_gear').select('*').order('sort_order', { ascending: true }),
      supabase.from('matatena_bookings').select('*').order('booking_date', { ascending: true }).order('start_hour', { ascending: true })
    ]);

    if (settingsRes.error || gearRes.error || bookingsRes.error) {
      return { ...local, storageMode: 'local-fallback' };
    }

    let settings = settingsRes.data || null;
    if (!settings) {
      await supabase.from('matatena_settings').upsert(DEFAULT_STUDIO_SETTINGS);
      settings = { ...DEFAULT_STUDIO_SETTINGS };
    }

    let gear = gearRes.data || [];
    if (gear.length === 0) {
      await supabase.from('matatena_gear').upsert(DEFAULT_GEAR_CATALOG);
      gear = [...DEFAULT_GEAR_CATALOG];
    }

    const bookings = bookingsRes.data || [];
    const syncedState = { settings, gear, bookings };
    writeLocalState(syncedState);
    return { ...syncedState, storageMode: 'supabase' };
  } catch {
    return { ...local, storageMode: 'local-fallback' };
  }
}

export async function createStudioBooking(payload) {
  const bundle = await getStudioBundle();
  const { settings, bookings } = bundle;

  const tierId = String(payload.tierId || 'grado_1');
  const extraHours = Number(payload.extraHours || 0);
  const bookingDate = String(payload.bookingDate || '').trim();
  const startHour = Number(payload.startHour ?? 10);
  const customerName = String(payload.customerName || '').trim();
  const customerPhone = String(payload.customerPhone || '').trim();
  const customerEmail = String(payload.customerEmail || '').trim();

  if (!bookingDate || !/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
    throw new Error('Selecciona una fecha válida para la sesión.');
  }
  if (!customerName) {
    throw new Error('Por favor ingresa tu nombre o el de tu proyecto.');
  }
  if (!customerPhone) {
    throw new Error('Por favor ingresa un número de WhatsApp o teléfono de contacto.');
  }

  const quote = calculateQuote({ tierId, extraHours, settings });
  const availability = computeDayAvailability({
    date: bookingDate,
    durationHours: quote.totalHours,
    bookings,
    settings
  });

  const slotCheck = availability.validStartHours.find((s) => s.startHour === startHour);
  if (!slotCheck || !slotCheck.available) {
    throw new Error(
      `El horario de ${startHour}:00 a ${startHour + quote.totalHours}:00 ya no está disponible en esa fecha. Por favor elige otro bloque.`
    );
  }

  const newBooking = {
    id: crypto.randomUUID(),
    folio: generateFolio(bookingDate),
    service_type: quote.serviceType,
    tier_id: quote.tierId,
    tier_title: quote.tierTitle,
    booking_date: bookingDate,
    start_hour: startHour,
    end_hour: startHour + quote.totalHours,
    base_hours: quote.baseHours,
    extra_hours: quote.extraHours,
    total_hours: quote.totalHours,
    base_price_mxn: quote.basePriceMxn,
    extra_price_mxn: quote.extraPriceMxn,
    total_price_mxn: quote.totalPriceMxn,
    is_custom_quote: quote.isCustomQuote,
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    project_name: String(payload.projectName || '').trim(),
    attendees_count: Math.max(1, Number(payload.attendeesCount || 1)),
    age_group: String(payload.ageGroup || 'Todas las edades').trim(),
    selected_gear: Array.isArray(payload.selectedGear) ? payload.selectedGear : [],
    event_details: String(payload.eventDetails || '').trim(),
    status: quote.isCustomQuote ? 'cotizacion' : 'pendiente',
    admin_notes: String(payload.adminNotes || '').trim(),
    created_at: new Date().toISOString()
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('matatena_bookings').insert(newBooking);
    } catch {
      // Fallback to local state persistence
    }
  }

  const updatedBookings = [...bookings, newBooking];
  writeLocalState({ settings, gear: bundle.gear, bookings: updatedBookings });
  return newBooking;
}

export async function updateBookingStatus({ id, status, adminNotes }) {
  const bundle = await getStudioBundle();
  const target = bundle.bookings.find((b) => b.id === id);
  if (!target) {
    throw new Error('Reservación no encontrada.');
  }

  const updated = {
    ...target,
    status: status ?? target.status,
    admin_notes: adminNotes !== undefined ? adminNotes : target.admin_notes
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase
        .from('matatena_bookings')
        .update({ status: updated.status, admin_notes: updated.admin_notes })
        .eq('id', id);
    } catch {
      // Continue with local update
    }
  }

  const bookings = bundle.bookings.map((b) => (b.id === id ? updated : b));
  writeLocalState({ settings: bundle.settings, gear: bundle.gear, bookings });
  return updated;
}

export async function updateStudioSettings(newSettings) {
  const bundle = await getStudioBundle();
  const merged = {
    ...bundle.settings,
    ...newSettings,
    id: 'default',
    pricing: {
      ...bundle.settings.pricing,
      ...(newSettings.pricing || {})
    },
    blocked_slots: Array.isArray(newSettings.blocked_slots)
      ? newSettings.blocked_slots
      : bundle.settings.blocked_slots,
    updated_at: new Date().toISOString()
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('matatena_settings').upsert(merged);
    } catch {
      // Continue with local update
    }
  }

  writeLocalState({ settings: merged, gear: bundle.gear, bookings: bundle.bookings });
  return merged;
}

export async function updateGearCatalog(gearItem) {
  const bundle = await getStudioBundle();
  const existingIdx = bundle.gear.findIndex((g) => g.id === gearItem.id);
  const normalizedItem = {
    id: gearItem.id || `gear-${Date.now()}`,
    category: String(gearItem.category || 'instrumento'),
    category_label: String(gearItem.category_label || 'Equipamiento'),
    name: String(gearItem.name || '').trim(),
    spec: String(gearItem.spec || '').trim(),
    badge: String(gearItem.badge || '').trim(),
    available: Boolean(gearItem.available ?? true),
    sort_order: Number(gearItem.sort_order ?? bundle.gear.length + 1),
    updated_at: new Date().toISOString()
  };

  let updatedGear;
  if (existingIdx >= 0) {
    updatedGear = bundle.gear.map((g, i) => (i === existingIdx ? normalizedItem : g));
  } else {
    updatedGear = [...bundle.gear, normalizedItem];
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('matatena_gear').upsert(normalizedItem);
    } catch {
      // Continue with local update
    }
  }

  writeLocalState({ settings: bundle.settings, gear: updatedGear, bookings: bundle.bookings });
  return updatedGear;
}

export function verifyAdminPassword(candidate) {
  const expected = process.env.MATATENA_ADMIN_PASSWORD || 'TbCppNk2DZ+K4j?';
  return Boolean(candidate && String(candidate) === String(expected));
}
