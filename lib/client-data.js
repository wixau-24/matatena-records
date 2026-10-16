'use client';

import { createClient } from '@supabase/supabase-js';
import { DEFAULT_GEAR_CATALOG, DEFAULT_STUDIO_SETTINGS } from './matatena-catalog.js';
import { calculateQuote, computeDayAvailability, generateFolio } from './booking-engine.js';

const STORAGE_KEY = 'matatena_records_demo_state_v1';

const FALLBACK_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://shgjjparqaiwchqalgle.supabase.co';
const FALLBACK_SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_uEAaA5N0RAB7Dh_m2hjs3w_dV2zCHHQ';

function getBrowserSupabase() {
  if (!FALLBACK_SUPABASE_URL || !FALLBACK_SUPABASE_KEY) return null;
  try {
    return createClient(FALLBACK_SUPABASE_URL, FALLBACK_SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  } catch {
    return null;
  }
}

function readBrowserStore() {
  if (typeof window === 'undefined') {
    return {
      settings: { ...DEFAULT_STUDIO_SETTINGS },
      gear: [...DEFAULT_GEAR_CATALOG],
      bookings: []
    };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        settings: { ...DEFAULT_STUDIO_SETTINGS, ...(parsed.settings || {}) },
        gear:
          Array.isArray(parsed.gear) && parsed.gear.length > 0
            ? parsed.gear
            : [...DEFAULT_GEAR_CATALOG],
        bookings: Array.isArray(parsed.bookings) ? parsed.bookings : []
      };
    }
  } catch {
    // Ignore storage read errors
  }
  return {
    settings: { ...DEFAULT_STUDIO_SETTINGS },
    gear: [...DEFAULT_GEAR_CATALOG],
    bookings: []
  };
}

function writeBrowserStore(state) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota errors
  }
}

export async function fetchStudioDataClient() {
  // 1. Intentar API del servidor si existe (localhost o servidor Node/Vercel)
  try {
    const res = await fetch('/api/studio', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data?.ok) {
        writeBrowserStore({
          settings: data.settings,
          gear: data.gear,
          bookings: data.bookings
        });
        return data;
      }
    }
  } catch {
    // Continuar con Supabase directo / navegador
  }

  // 2. Intentar Supabase directo desde el navegador
  const local = readBrowserStore();
  const supabase = getBrowserSupabase();
  if (supabase) {
    try {
      const [settingsRes, gearRes, bookingsRes] = await Promise.all([
        supabase.from('matatena_settings').select('*').eq('id', 'default').maybeSingle(),
        supabase.from('matatena_gear').select('*').order('sort_order', { ascending: true }),
        supabase
          .from('matatena_bookings')
          .select('*')
          .order('booking_date', { ascending: true })
          .order('start_hour', { ascending: true })
      ]);

      if (!settingsRes.error && !gearRes.error && !bookingsRes.error) {
        const settings = settingsRes.data || local.settings;
        const gear =
          Array.isArray(gearRes.data) && gearRes.data.length > 0 ? gearRes.data : local.gear;
        const bookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : local.bookings;
        const nextState = { settings, gear, bookings };
        writeBrowserStore(nextState);
        return { ok: true, ...nextState, storageMode: 'supabase-online' };
      }
    } catch {
      // Continuar con almacenamiento local del navegador
    }
  }

  return { ok: true, ...local, storageMode: 'demo-online' };
}

export async function submitBookingClient(payload) {
  // 1. Intentar API del servidor primero
  try {
    const res = await fetch('/api/studio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.ok) return data.booking;
    } else if (res.status === 400) {
      const errData = await res.json();
      throw new Error(errData.error || 'No se pudo registrar la reservación.');
    }
  } catch (err) {
    if (err.message && !err.message.includes('fetch') && !err.message.includes('JSON')) {
      throw err;
    }
  }

  // 2. Modo directo (Demo Online / GitHub Pages + Supabase)
  const bundle = await fetchStudioDataClient();
  const { settings, bookings, gear } = bundle;

  const tierId = String(payload.tierId || 'grado_1');
  const extraHours = Number(payload.extraHours || 0);
  const bookingDate = String(payload.bookingDate || '').trim();
  const startHour = Number(payload.startHour ?? 10);
  const customerName = String(payload.customerName || '').trim();
  const customerPhone = String(payload.customerPhone || '').trim();
  const customerEmail = String(payload.customerEmail || '').trim();

  if (!bookingDate) throw new Error('Selecciona una fecha válida para la sesión.');
  if (!customerName) throw new Error('Por favor ingresa tu nombre o el de tu proyecto.');
  if (!customerPhone) throw new Error('Por favor ingresa un número de WhatsApp o teléfono.');

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
      `El horario de ${startHour}:00 a ${startHour + quote.totalHours}:00 ya está ocupado en esa fecha.`
    );
  }

  const newBooking = {
    id: `bk-${Date.now()}`,
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
    admin_notes: '',
    created_at: new Date().toISOString()
  };

  const supabase = getBrowserSupabase();
  if (supabase) {
    try {
      await supabase.from('matatena_bookings').insert(newBooking);
    } catch {
      // Fallback a localStorage
    }
  }

  const nextBookings = [...bookings, newBooking];
  writeBrowserStore({ settings, gear, bookings: nextBookings });
  return newBooking;
}

export async function runAdminActionClient(payload) {
  // 1. Intentar API del servidor primero
  try {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': payload.password || ''
      },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.ok) return data;
    } else if (res.status === 401) {
      throw new Error('Contraseña de administrador incorrecta.');
    }
  } catch (err) {
    if (err.message === 'Contraseña de administrador incorrecta.') {
      throw err;
    }
  }

  // 2. Respaldo directo en navegador para la Demo Online (GitHub Pages)
  if (payload.password !== 'TbCppNk2DZ+K4j?') {
    throw new Error('Contraseña de administrador incorrecta.');
  }

  const current = await fetchStudioDataClient();
  const supabase = getBrowserSupabase();

  if (payload.action === 'verify') {
    return { ok: true, ...current };
  }

  if (payload.action === 'update_booking') {
    const updatedBookings = current.bookings.map((b) =>
      b.id === payload.id
        ? { ...b, status: payload.status ?? b.status, admin_notes: payload.adminNotes ?? b.admin_notes }
        : b
    );
    const updatedItem = updatedBookings.find((b) => b.id === payload.id);
    if (supabase && updatedItem) {
      try {
        await supabase
          .from('matatena_bookings')
          .update({ status: updatedItem.status, admin_notes: updatedItem.admin_notes })
          .eq('id', payload.id);
      } catch {
        // Ignore
      }
    }
    writeBrowserStore({ settings: current.settings, gear: current.gear, bookings: updatedBookings });
    return { ok: true, booking: updatedItem };
  }

  if (payload.action === 'update_settings') {
    const mergedSettings = {
      ...current.settings,
      ...(payload.settings || {}),
      pricing: {
        ...current.settings.pricing,
        ...(payload.settings?.pricing || {})
      }
    };
    if (supabase) {
      try {
        await supabase.from('matatena_settings').upsert(mergedSettings);
      } catch {
        // Ignore
      }
    }
    writeBrowserStore({ settings: mergedSettings, gear: current.gear, bookings: current.bookings });
    return { ok: true, settings: mergedSettings };
  }

  if (payload.action === 'update_gear') {
    const item = payload.gearItem;
    const updatedGear = current.gear.map((g) => (g.id === item.id ? { ...g, ...item } : g));
    if (supabase && item) {
      try {
        await supabase.from('matatena_gear').upsert(item);
      } catch {
        // Ignore
      }
    }
    writeBrowserStore({ settings: current.settings, gear: updatedGear, bookings: current.bookings });
    return { ok: true, gear: updatedGear };
  }

  return { ok: true, ...current };
}
