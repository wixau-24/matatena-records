import { DEFAULT_STUDIO_SETTINGS, SERVICE_TIERS } from './matatena-catalog.js';

export function getTierById(tierId) {
  return SERVICE_TIERS.find((t) => t.id === tierId) || SERVICE_TIERS[0];
}

/**
 * Calcula el desglose de precios y horas para un paquete seleccionado.
 */
export function calculateQuote({ tierId, extraHours = 0, settings = DEFAULT_STUDIO_SETTINGS }) {
  const tier = getTierById(tierId);
  const safeExtraHours = Math.max(0, Math.min(8, Math.floor(Number(extraHours) || 0)));
  const baseHours = Number(settings?.base_hours) || 4;
  const extraHourRate = Number(settings?.extra_hour_rate) || 400;
  const totalHours = baseHours + safeExtraHours;

  if (tier.isCustomQuote) {
    return {
      tier,
      serviceType: tier.serviceType,
      tierId: tier.id,
      tierTitle: tier.title,
      baseHours,
      extraHours: safeExtraHours,
      totalHours,
      extraHourRate,
      basePriceMxn: 0,
      extraPriceMxn: 0,
      totalPriceMxn: 0,
      isCustomQuote: true
    };
  }

  const configuredBasePrice =
    settings?.pricing && typeof settings.pricing[tier.priceKey] === 'number'
      ? settings.pricing[tier.priceKey]
      : tier.defaultPriceMxn;

  const basePriceMxn = Number(configuredBasePrice) || tier.defaultPriceMxn;
  const extraPriceMxn = safeExtraHours * extraHourRate;
  const totalPriceMxn = basePriceMxn + extraPriceMxn;

  return {
    tier,
    serviceType: tier.serviceType,
    tierId: tier.id,
    tierTitle: tier.title,
    baseHours,
    extraHours: safeExtraHours,
    totalHours,
    extraHourRate,
    basePriceMxn,
    extraPriceMxn,
    totalPriceMxn,
    isCustomQuote: false
  };
}

/**
 * Determina qué horas individuales [open_hour .. close_hour - 1] están ocupadas en una fecha
 * y qué horas de inicio son válidas para una sesión de `durationHours`.
 */
export function computeDayAvailability({
  date,
  durationHours = 4,
  bookings = [],
  settings = DEFAULT_STUDIO_SETTINGS
}) {
  const openHour = Number(settings?.open_hour ?? 10);
  const closeHour = Number(settings?.close_hour ?? 22);
  const safeDuration = Math.max(1, Math.floor(Number(durationHours) || 4));

  const activeBookings = (bookings || []).filter(
    (b) => b.booking_date === date && b.status !== 'cancelada'
  );

  const manualBlocks = (settings?.blocked_slots || []).filter((blk) => blk.date === date);

  const hourCells = [];
  for (let h = openHour; h < closeHour; h++) {
    const bookingHit = activeBookings.find(
      (b) => h >= Number(b.start_hour) && h < Number(b.end_hour)
    );
    const blockHit = manualBlocks.find(
      (blk) => h >= Number(blk.startHour) && h < Number(blk.endHour)
    );

    hourCells.push({
      hour: h,
      occupied: Boolean(bookingHit || blockHit),
      reason: bookingHit
        ? `Reservado (${bookingHit.tier_title})`
        : blockHit
          ? blockHit.reason || 'Horario bloqueado'
          : 'Disponible',
      bookingId: bookingHit?.id || null
    });
  }

  const validStartHours = [];
  for (let start = openHour; start + safeDuration <= closeHour; start++) {
    const end = start + safeDuration;
    let hasConflict = false;
    for (let h = start; h < end; h++) {
      const cell = hourCells.find((c) => c.hour === h);
      if (!cell || cell.occupied) {
        hasConflict = true;
        break;
      }
    }
    validStartHours.push({
      startHour: start,
      endHour: end,
      available: !hasConflict
    });
  }

  return {
    date,
    openHour,
    closeHour,
    durationHours: safeDuration,
    hourCells,
    validStartHours
  };
}

export function generateFolio(dateStr = '') {
  const cleanDate = String(dateStr || new Date().toISOString().slice(0, 10)).replace(/-/g, '').slice(2);
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `MAT-${cleanDate}-${randomSuffix}`;
}

