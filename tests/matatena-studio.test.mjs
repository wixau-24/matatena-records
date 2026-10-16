import { describe, expect, it } from 'vitest';
import {
  DEFAULT_GEAR_CATALOG,
  DEFAULT_STUDIO_SETTINGS
} from '../lib/matatena-catalog.js';
import {
  calculateQuote,
  computeDayAvailability
} from '../lib/booking-engine.js';

describe('Matatena Records — Modelo de Negocio y Motor de Reservas', () => {
  it('calcula correctamente los 3 grados de Renta de Estudio Personalizado (4h base + $400/h extra)', () => {
    const g1 = calculateQuote({ tierId: 'grado_1', extraHours: 0 });
    expect(g1.baseHours).toBe(4);
    expect(g1.basePriceMxn).toBe(2000);
    expect(g1.totalPriceMxn).toBe(2000);

    const g2 = calculateQuote({ tierId: 'grado_2', extraHours: 2 });
    expect(g2.basePriceMxn).toBe(3000);
    expect(g2.extraPriceMxn).toBe(800);
    expect(g2.totalHours).toBe(6);
    expect(g2.totalPriceMxn).toBe(3800);

    const g3 = calculateQuote({ tierId: 'grado_3', extraHours: 1 });
    expect(g3.basePriceMxn).toBe(4000);
    expect(g3.extraPriceMxn).toBe(400);
    expect(g3.totalHours).toBe(5);
    expect(g3.totalPriceMxn).toBe(4400);
  });

  it('calcula correctamente la Experiencia Compositora ($4,500 MXN base) y Uso Múltiple (Cotización)', () => {
    const exp = calculateQuote({ tierId: 'experiencia', extraHours: 0 });
    expect(exp.basePriceMxn).toBe(4500);
    expect(exp.totalPriceMxn).toBe(4500);
    expect(exp.isCustomQuote).toBe(false);

    const mult = calculateQuote({ tierId: 'evento_multiple', extraHours: 2 });
    expect(mult.isCustomQuote).toBe(true);
    expect(mult.totalHours).toBe(6);
  });

  it('bloquea automáticamente las horas ocupadas entre 10:00 y 22:00 para evitar traslapes', () => {
    const bookings = [
      {
        id: 'bk-1',
        booking_date: '2026-10-20',
        start_hour: 12,
        end_hour: 16,
        tier_title: 'Estudio Personalizado · Grado II',
        status: 'confirmada'
      }
    ];

    const availability = computeDayAvailability({
      date: '2026-10-20',
      durationHours: 4,
      bookings,
      settings: DEFAULT_STUDIO_SETTINGS
    });

    // Un bloque de 4h a las 10:00 (10-14) se traslapa con 12-16, por lo que debe estar bloqueado
    const slot10 = availability.validStartHours.find((s) => s.startHour === 10);
    expect(slot10.available).toBe(false);

    // Un bloque de 4h a las 16:00 (16-20) está libre
    const slot16 = availability.validStartHours.find((s) => s.startHour === 16);
    expect(slot16.available).toBe(true);
  });

  it('cumple con el inventario: 1 Sala, 1 Consola y 2 elementos por categoría de instrumento', () => {
    const countByCat = (cat) => DEFAULT_GEAR_CATALOG.filter((g) => g.category === cat).length;
    expect(countByCat('espacio')).toBe(1);
    expect(countByCat('consola')).toBe(1);
    expect(countByCat('guitarras')).toBe(2);
    expect(countByCat('baterias')).toBe(2);
    expect(countByCat('pianos')).toBe(2);
    expect(countByCat('sintetizadores')).toBe(2);
    expect(countByCat('bajos')).toBe(2);
    expect(countByCat('microfonos')).toBe(2);
    expect(countByCat('software')).toBe(2);
  });
});

