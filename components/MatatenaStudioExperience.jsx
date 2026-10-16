'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  DEFAULT_GEAR_CATALOG,
  DEFAULT_STUDIO_SETTINGS,
  SERVICE_TIERS,
  formatHourLabel,
  formatMxn
} from '../lib/matatena-catalog.js';
import { calculateQuote, computeDayAvailability } from '../lib/booking-engine.js';
import { fetchStudioDataClient, submitBookingClient } from '../lib/client-data.js';
import { InteractiveMatatenaBoard, MatatenaJackIcon } from './MatatenaJackIcon.jsx';

function getTodayIso() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function MatatenaStudioExperience({ initialBundle }) {
  const [settings, setSettings] = useState(initialBundle?.settings || DEFAULT_STUDIO_SETTINGS);
  const [gearList, setGearList] = useState(initialBundle?.gear || DEFAULT_GEAR_CATALOG);
  const [bookings, setBookings] = useState(initialBundle?.bookings || []);

  // Estado del Configurador ("Arma tu Jugada")
  const [selectedTierId, setSelectedTierId] = useState('grado_2');
  const [extraHours, setExtraHours] = useState(0);
  const [bookingDate, setBookingDate] = useState(getTodayIso());
  const [startHour, setStartHour] = useState(10);
  const [selectedGearIds, setSelectedGearIds] = useState([
    'consola-principal',
    'guitarra-1',
    'piano-1',
    'sinte-1'
  ]);
  const [gearCategoryFilter, setGearCategoryFilter] = useState('todos');

  // Datos del cliente
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [projectName, setProjectName] = useState('');
  const [attendeesCount, setAttendeesCount] = useState(2);
  const [ageGroup, setAgeGroup] = useState('Todas las edades / Comunidad');
  const [eventDetails, setEventDetails] = useState('');

  // Estado de envío
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdBooking, setCreatedBooking] = useState(null);

  // Sincronización con API / Supabase en vivo
  useEffect(() => {
    async function refreshStudioData() {
      try {
        const data = await fetchStudioDataClient();
        if (data?.ok) {
          if (data.settings) setSettings(data.settings);
          if (Array.isArray(data.gear)) setGearList(data.gear);
          if (Array.isArray(data.bookings)) setBookings(data.bookings);
        }
      } catch {
        // Mantiene el estado inicial si falla la red
      }
    }
    refreshStudioData();
  }, []);

  const quote = useMemo(
    () => calculateQuote({ tierId: selectedTierId, extraHours, settings }),
    [selectedTierId, extraHours, settings]
  );

  const dayAvailability = useMemo(
    () =>
      computeDayAvailability({
        date: bookingDate,
        durationHours: quote.totalHours,
        bookings,
        settings
      }),
    [bookingDate, quote.totalHours, bookings, settings]
  );

  // Si la hora de inicio seleccionada queda bloqueada al cambiar fecha o duración, mover a la primera disponible
  useEffect(() => {
    const currentSlot = dayAvailability.validStartHours.find((s) => s.startHour === startHour);
    if (!currentSlot || !currentSlot.available) {
      const firstAvailable = dayAvailability.validStartHours.find((s) => s.available);
      if (firstAvailable) {
        setStartHour(firstAvailable.startHour);
      }
    }
  }, [dayAvailability, startHour]);

  function handleSelectTierAndScroll(tierId) {
    setSelectedTierId(tierId);
    setCreatedBooking(null);
    setErrorMessage('');
    const el = document.getElementById('configurador');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  function toggleGearSelection(gearId) {
    setSelectedGearIds((prev) =>
      prev.includes(gearId) ? prev.filter((id) => id !== gearId) : [...prev, gearId]
    );
  }

  const filteredGear = useMemo(() => {
    if (gearCategoryFilter === 'todos') return gearList;
    if (gearCategoryFilter === 'base') {
      return gearList.filter((g) => g.category === 'espacio' || g.category === 'consola');
    }
    return gearList.filter((g) => g.category === gearCategoryFilter);
  }, [gearList, gearCategoryFilter]);

  const studioRentalTiers = SERVICE_TIERS.filter((t) => t.serviceType === 'estudio_personalizado');
  const specialTiers = SERVICE_TIERS.filter((t) => t.serviceType !== 'estudio_personalizado');

  async function handleSubmitBooking(e) {
    e.preventDefault();
    setErrorMessage('');
    setCreatedBooking(null);
    setSubmitting(true);

    try {
      const selectedGearNames = gearList
        .filter((g) => selectedGearIds.includes(g.id))
        .map((g) => g.name);

      const booking = await submitBookingClient({
        tierId: selectedTierId,
        extraHours,
        bookingDate,
        startHour,
        customerName,
        customerPhone,
        customerEmail,
        projectName,
        attendeesCount,
        ageGroup,
        selectedGear: selectedGearNames,
        eventDetails
      });

      setCreatedBooking(booking);
      setBookings((prev) => [...prev, booking]);
    } catch (err) {
      setErrorMessage(err.message || 'Ocurrió un error al procesar tu solicitud.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* BARRA SUPERIOR EDITORIAL */}
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand-lockup">
            <span className="brand-ball" />
            <div>
              <div className="brand-title">Matatena Records</div>
              <div className="mono-tag" style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                ESPACIO DE COMPOSICIÓN &amp; CREATIVIDAD SONORA
              </div>
            </div>
          </div>

          <nav className="nav-links" aria-label="Navegación principal">
            <a href="#manifiesto" className="nav-link">
              01 · El Juego
            </a>
            <a href="#jugadas" className="nav-link">
              02 · Las Jugadas
            </a>
            <a href="#inventario" className="nav-link">
              03 · La Sala (2x Gear)
            </a>
            <a href="#configurador" className="nav-link">
              04 · Calendario &amp; Cotizador
            </a>
            <Link
              href="/admin"
              className="mono-tag"
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                border: '1px solid var(--border-hairline)',
                color: 'var(--text-secondary)'
              }}
            >
              Admin
            </Link>
            <a href="#configurador" className="btn-vermilion">
              Armar mi Jugada →
            </a>
          </nav>
        </div>
      </header>

      <main className="gallery-shell">
        {/* HERO SECTION */}
        <section className="hero-grid">
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <span
                  className="mono-tag"
                  style={{
                    background: 'var(--bg-ink)',
                    color: 'var(--text-on-ink)',
                    padding: '0.3rem 0.75rem',
                    borderRadius: '999px'
                  }}
                >
                  ESTUDIO CREATIVO · 10:00 A 22:00 HRS
                </span>
                <span
                  className="mono-tag"
                  style={{
                    border: '1px solid var(--border-strong)',
                    padding: '0.3rem 0.75rem',
                    borderRadius: '999px'
                  }}
                >
                  BLOQUES DE 4 HORAS + $400 MXN / HR EXTRA
                </span>
              </div>

              <h1 className="hero-headline">
                Donde las ideas se atrapan <em>en pleno bote</em> antes de tocar el suelo.
              </h1>

              <p className="hero-lead">
                <strong>Matatena Records</strong> no es un estudio frío de alquiler por minuto: es un
                espacio vivo de composición, juego y hallazgo artístico. Como en el juego clásico de
                la matatena, lanzas la esfera roja al aire y decides cuántas piezas quieres capturar
                en tu jugada: desde rentar el cuarto en autonomía total hasta co-componer en
                comunidad.
              </p>

              <div style={{ display: 'flex', gap: '0.9rem', flexWrap: 'wrap' }}>
                <a href="#configurador" className="btn-ink">
                  Configurar Paquete y Fecha →
                </a>
                <a href="#jugadas" className="btn-outline">
                  Explorar las 3 Modalidades
                </a>
              </div>
            </div>

            <div className="hero-KPIs">
              <div>
                <div className="mono-tag" style={{ color: 'var(--accent-vermilion)' }}>
                  01 · RENTA PERSONALIZADA
                </div>
                <div className="editorial-serif" style={{ fontSize: '1.75rem', marginTop: '0.2rem' }}>
                  $2,000 — $4,000 <span style={{ fontSize: '0.95rem' }}>MXN</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Grado I (Solo cuarto), Grado II (+ Ingeniero/Productor) o Grado III (+ Ingeniero +
                  Compositor). 4 hrs incluidas.
                </p>
              </div>

              <div>
                <div className="mono-tag" style={{ color: 'var(--accent-vermilion)' }}>
                  02 · EXPERIENCIA COMPOSITORA
                </div>
                <div className="editorial-serif" style={{ fontSize: '1.75rem', marginTop: '0.2rem' }}>
                  $4,500 <span style={{ fontSize: '0.95rem' }}>MXN</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Inmersión musical guiada por mí y artistas invitados. Individual o en grupo para
                  todas las edades.
                </p>
              </div>

              <div>
                <div className="mono-tag" style={{ color: 'var(--accent-vermilion)' }}>
                  03 · USO MÚLTIPLE
                </div>
                <div className="editorial-serif" style={{ fontSize: '1.75rem', marginTop: '0.2rem' }}>
                  Mesa Abierta
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Listening parties de lanzamiento de disco, showcases con instrumentos en vivo o
                  eventos creativos.
                </p>
              </div>
            </div>
          </div>

          <InteractiveMatatenaBoard onSelectRound={handleSelectTierAndScroll} />
        </section>

        {/* SECCIÓN 01: EL CONCEPTO / MANIFIESTO */}
        <section id="manifiesto" className="section-block">
          <div className="section-header">
            <div>
              <span className="mono-tag" style={{ color: 'var(--accent-vermilion)' }}>
                01 / FILOSOFÍA &amp; SIMBOLOGÍA
              </span>
              <h2 className="section-title">El Arte del Bote y la Captura</h2>
            </div>
            <p style={{ maxWidth: '520px', color: 'var(--text-secondary)', fontSize: '0.98rem' }}>
              En el juego tradicional de la <strong>Matatena</strong>, todo ocurre en el instante
              suspendido entre que lanzas la pelota roja y la vuelves a atrapar. Primero tomas las
              piezas <em>de a una</em>, luego <em>de a dos</em>, después <em>de a tres</em>. Así
              funciona nuestro modelo creativo.
            </p>
          </div>

          <div className="tiers-grid">
            <div
              style={{
                background: 'var(--bg-elevated)',
                padding: '1.75rem',
                borderRadius: '18px',
                border: '1px solid var(--border-hairline)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="mono-tag">SÍMBOLO I · LA ESFERA ROJA</span>
                <span className="brand-ball" />
              </div>
              <h3 className="editorial-serif" style={{ fontSize: '1.85rem', margin: '0.75rem 0 0.5rem' }}>
                La Chispa en el Aire
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Una melodía tarareada en nota de voz, un riff suelto o una historia que quieres
                contar. El estudio está dispuesto sin fricción para que cuando la idea bote, todo
                esté encendido y listo para capturarla.
              </p>
            </div>

            <div
              style={{
                background: 'var(--bg-elevated)',
                padding: '1.75rem',
                borderRadius: '18px',
                border: '1px solid var(--border-hairline)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="mono-tag">SÍMBOLO II · LOS 6 PICOS</span>
                <MatatenaJackIcon size={24} active />
              </div>
              <h3 className="editorial-serif" style={{ fontSize: '1.85rem', margin: '0.75rem 0 0.5rem' }}>
                Grados de Acompañamiento
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Tú decides qué piezas sumar a tu mesa: solo el cuarto con instrumentos (Grado I),
                sumar el oído técnico de un ingeniero/productor (Grado II), o integrar también a un
                compositor en vivo (Grado III).
              </p>
            </div>

            <div
              style={{
                background: 'var(--bg-elevated)',
                padding: '1.75rem',
                borderRadius: '18px',
                border: '1px solid var(--border-hairline)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="mono-tag">SÍMBOLO III · EL PATIO COMÚN</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <MatatenaJackIcon size={20} active />
                  <MatatenaJackIcon size={20} active />
                </div>
              </div>
              <h3 className="editorial-serif" style={{ fontSize: '1.85rem', margin: '0.75rem 0 0.5rem' }}>
                Comunidad y Escucha
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                La música no es exclusiva de expertos. Abrimos la sala para que familias, amigos o
                personas de cualquier edad vivan la Experiencia Compositora, o para celebrar el
                lanzamiento de un disco en íntimo.
              </p>
            </div>
          </div>
        </section>

        {/* SECCIÓN 02: LAS JUGADAS (PAQUETES Y MODELO DE NEGOCIO) */}
        <section id="jugadas" className="section-block">
          <div className="section-header">
            <div>
              <span className="mono-tag" style={{ color: 'var(--accent-vermilion)' }}>
                02 / MODELO DE ESTUDIO · LAS 3 LÍNEAS
              </span>
              <h2 className="section-title">Elige tu Jugada en Matatena</h2>
            </div>
            <div
              style={{
                background: 'var(--bg-ink)',
                color: 'var(--text-on-ink)',
                padding: '0.75rem 1.15rem',
                borderRadius: '12px',
                fontSize: '0.84rem'
              }}
            >
              <strong>Regla general de tiempo:</strong> Todos los paquetes incluyen{' '}
              <strong>{settings.base_hours} horas base</strong>. Hora extra adicional:{' '}
              <strong>+{formatMxn(settings.extra_hour_rate)} MXN / hora</strong>.
            </div>
          </div>

          {/* 1. RENTA DE ESTUDIO PERSONALIZADO (LOS 3 GRADOS) */}
          <div style={{ marginBottom: '1.25rem' }}>
            <span className="mono-tag">
              MODALIDAD 1 · RENTA DE ESTUDIO PERSONALIZADO (ELIGE TU GRADO)
            </span>
          </div>

          <div className="tiers-grid">
            {studioRentalTiers.map((tier) => {
              const priceMxn = settings?.pricing?.[tier.priceKey] ?? tier.defaultPriceMxn;
              const isFeatured = tier.id === 'grado_2';
              return (
                <article
                  key={tier.id}
                  className={`tier-card ${isFeatured ? 'featured' : ''}`}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <span
                        className="mono-tag"
                        style={{
                          color: isFeatured ? '#ff7c66' : 'var(--accent-vermilion)'
                        }}
                      >
                        {tier.code} · {tier.jackLabel}
                      </span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {Array.from({ length: tier.jacksCount }).map((_, idx) => (
                          <MatatenaJackIcon
                            key={idx}
                            size={22}
                            active
                            color={isFeatured ? '#ff7c66' : '#D9381E'}
                          />
                        ))}
                      </div>
                    </div>

                    <h3
                      className="editorial-serif"
                      style={{ fontSize: '2rem', marginTop: '0.85rem', lineHeight: 1.08 }}
                    >
                      {tier.title}
                    </h3>
                    <p
                      style={{
                        fontSize: '0.86rem',
                        marginTop: '0.35rem',
                        color: isFeatured ? 'rgba(246,242,234,0.78)' : 'var(--text-secondary)',
                        fontWeight: 600
                      }}
                    >
                      {tier.subtitle}
                    </p>

                    <div className="tier-price">{formatMxn(priceMxn)}</div>
                    <div
                      className="mono-tag"
                      style={{
                        color: isFeatured ? 'rgba(246,242,234,0.68)' : 'var(--text-muted)',
                        marginBottom: '1.1rem'
                      }}
                    >
                      INCLUYE {settings.base_hours} HORAS · +{formatMxn(settings.extra_hour_rate)} /
                      HR EXTRA
                    </div>

                    <p
                      style={{
                        fontSize: '0.9rem',
                        color: isFeatured ? 'rgba(246,242,234,0.86)' : 'var(--text-secondary)',
                        marginBottom: '1.25rem'
                      }}
                    >
                      {tier.description}
                    </p>

                    <ul
                      style={{
                        listStyle: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.55rem',
                        marginBottom: '1.5rem',
                        fontSize: '0.86rem'
                      }}
                    >
                      {tier.includes.map((inc, i) => (
                        <li key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                          <span style={{ color: 'var(--accent-vermilion)', fontWeight: 700 }}>✦</span>
                          <span>{inc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    className={isFeatured ? 'btn-vermilion' : 'btn-ink'}
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => handleSelectTierAndScroll(tier.id)}
                  >
                    Seleccionar {tier.shortTitle} →
                  </button>
                </article>
              );
            })}
          </div>

          {/* 2 & 3. EXPERIENCIA COMPOSITORA Y USO MÚLTIPLE */}
          <div style={{ marginTop: '2.5rem', marginBottom: '1rem' }}>
            <span className="mono-tag">
              MODALIDADES 2 &amp; 3 · EXPERIENCIA EN COMUNIDAD Y FORO DE USO MÚLTIPLE
            </span>
          </div>

          <div className="special-experiences-grid">
            {specialTiers.map((tier) => {
              const priceMxn = tier.priceKey
                ? settings?.pricing?.[tier.priceKey] ?? tier.defaultPriceMxn
                : 0;
              return (
                <article key={tier.id} className="tier-card">
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                      }}
                    >
                      <span className="mono-tag" style={{ color: 'var(--accent-vermilion)' }}>
                        {tier.code}
                      </span>
                      <span
                        className="mono-tag"
                        style={{
                          background: 'var(--bg-elevated)',
                          padding: '0.28rem 0.7rem',
                          borderRadius: '999px'
                        }}
                      >
                        {tier.badge}
                      </span>
                    </div>

                    <h3
                      className="editorial-serif"
                      style={{ fontSize: '2.25rem', marginTop: '0.75rem', lineHeight: 1.05 }}
                    >
                      {tier.title}
                    </h3>
                    <p
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        marginTop: '0.3rem'
                      }}
                    >
                      {tier.subtitle}
                    </p>

                    <div className="tier-price">
                      {tier.isCustomQuote ? 'Cotización a Medida' : formatMxn(priceMxn)}
                    </div>
                    <div
                      className="mono-tag"
                      style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}
                    >
                      {tier.isCustomQuote
                        ? 'LISTENING PARTIES · LANZAMIENTOS · INSTRUMENTOS EN VIVO'
                        : `SESIÓN GUIADA DE ${settings.base_hours} HORAS · INDIVIDUAL O GRUPAL`}
                    </div>

                    <p
                      style={{
                        fontSize: '0.92rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '1.2rem'
                      }}
                    >
                      {tier.description}
                    </p>

                    <ul
                      style={{
                        listStyle: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        marginBottom: '1.5rem',
                        fontSize: '0.86rem'
                      }}
                    >
                      {tier.includes.map((inc, i) => (
                        <li key={i} style={{ display: 'flex', gap: '0.5rem' }}>
                          <span style={{ color: 'var(--accent-vermilion)', fontWeight: 700 }}>●</span>
                          <span>{inc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    className="btn-ink"
                    style={{ width: '100%' }}
                    onClick={() => handleSelectTierAndScroll(tier.id)}
                  >
                    {tier.isCustomQuote
                      ? 'Cotizar Evento o Listening Party →'
                      : 'Reservar Experiencia Compositora →'}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        {/* SECCIÓN 03: LA SALA Y EL INVENTARIO (1 SALA, 1 CONSOLA, 2 DE CADA INSTRUMENTO) */}
        <section id="inventario" className="section-block">
          <div className="section-header">
            <div>
              <span className="mono-tag" style={{ color: 'var(--accent-vermilion)' }}>
                03 / ARQUITECTURA E INSTRUMENTOS
              </span>
              <h2 className="section-title">1 Sala · 1 Consola · 2 de Cada Pieza</h2>
            </div>
            <p style={{ maxWidth: '520px', color: 'var(--text-secondary)', fontSize: '0.94rem' }}>
              Para que dos mentes puedan dialogar al mismo tiempo, cada familia de instrumentos
              cuenta con <strong>dos opciones con personalidad distinta</strong>. Haz clic en las
              piezas que quieras tener listas para tu llegada.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap',
              marginBottom: '1.75rem'
            }}
          >
            {[
              { id: 'todos', label: 'Todo el Inventario' },
              { id: 'base', label: '1 Sala & 1 Consola' },
              { id: 'guitarras', label: '2 Guitarras' },
              { id: 'baterias', label: '2 Baterías' },
              { id: 'pianos', label: '2 Pianos' },
              { id: 'sintetizadores', label: '2 Sintetizadores' },
              { id: 'bajos', label: '2 Bajos' },
              { id: 'microfonos', label: '2 Micrófonos' },
              { id: 'software', label: '2 Entornos DAW' }
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setGearCategoryFilter(cat.id)}
                className={gearCategoryFilter === cat.id ? 'btn-ink' : 'btn-outline'}
                style={{ padding: '0.45rem 0.95rem', fontSize: '0.8rem' }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="gear-grid">
            {filteredGear.map((item) => {
              const isSelected = selectedGearIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  className={`gear-card ${isSelected ? 'selected' : ''}`}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.55rem'
                      }}
                    >
                      <span className="mono-tag" style={{ color: 'var(--accent-vermilion)' }}>
                        {item.category_label}
                      </span>
                      <span
                        className="mono-tag"
                        style={{
                          fontSize: '0.66rem',
                          background: 'var(--bg-elevated)',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '999px'
                        }}
                      >
                        {item.badge}
                      </span>
                    </div>

                    <h3 className="editorial-serif" style={{ fontSize: '1.45rem', lineHeight: 1.15 }}>
                      {item.name}
                    </h3>
                    <p
                      style={{
                        fontSize: '0.84rem',
                        color: 'var(--text-secondary)',
                        marginTop: '0.4rem'
                      }}
                    >
                      {item.spec}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleGearSelection(item.id)}
                    className={isSelected ? 'btn-vermilion' : 'btn-outline'}
                    style={{ width: '100%', justifyContent: 'center', padding: '0.5rem 0.85rem' }}
                  >
                    {isSelected ? '✓ Incluido en tu Jugada' : '+ Pre-seleccionar para mi sesión'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECCIÓN 04: CONFIGURADOR INTERACTIVO + CALENDARIO DE RESERVAS */}
        <section id="configurador" className="section-block" style={{ borderBottom: 'none' }}>
          <div className="section-header">
            <div>
              <span className="mono-tag" style={{ color: 'var(--accent-vermilion)' }}>
                04 / CONFIGURADOR &amp; AGENDA EN TIEMPO REAL
              </span>
              <h2 className="section-title">Arma tu Jugada y Reserva tu Bloque</h2>
            </div>
            <p style={{ maxWidth: '500px', color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              Personaliza tu paquete, agrega horas extra si lo necesitas y selecciona tu horario en
              el calendario. Las horas reservadas se bloquean automáticamente para evitar traslapes.
            </p>
          </div>

          <div className="configurator-layout">
            <form className="config-panel" onSubmit={handleSubmitBooking}>
              {/* PASO 1: MODALIDAD / GRADO */}
              <div style={{ marginBottom: '2rem' }}>
                <div className="mono-tag" style={{ color: 'var(--accent-vermilion)', marginBottom: '0.6rem' }}>
                  PASO 01 · ELIGE LA MODALIDAD O GRADO DE ESTUDIO
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                    gap: '0.75rem'
                  }}
                >
                  {SERVICE_TIERS.map((tier) => {
                    const active = selectedTierId === tier.id;
                    const tierPrice = tier.priceKey
                      ? settings?.pricing?.[tier.priceKey] ?? tier.defaultPriceMxn
                      : 0;
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setSelectedTierId(tier.id)}
                        style={{
                          textAlign: 'left',
                          padding: '1rem',
                          borderRadius: '14px',
                          border: active
                            ? '2px solid var(--accent-vermilion)'
                            : '1px solid var(--border-hairline)',
                          background: active ? '#fff8f6' : '#fff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <span className="mono-tag" style={{ fontSize: '0.65rem' }}>
                            {tier.jackLabel}
                          </span>
                          <MatatenaJackIcon size={18} active={active} />
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.94rem', marginTop: '0.35rem' }}>
                          {tier.shortTitle}
                        </div>
                        <div
                          style={{
                            fontSize: '0.84rem',
                            color: 'var(--accent-vermilion)',
                            fontWeight: 600,
                            marginTop: '0.2rem'
                          }}
                        >
                          {tier.isCustomQuote ? 'Cotización a medida' : formatMxn(tierPrice)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PASO 2: DURACIÓN Y HORAS EXTRA */}
              <div
                style={{
                  marginBottom: '2rem',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid var(--border-hairline)'
                }}
              >
                <div className="mono-tag" style={{ color: 'var(--accent-vermilion)', marginBottom: '0.6rem' }}>
                  PASO 02 · DURACIÓN DE LA SESIÓN ({settings.base_hours} HRS INCLUIDAS + HORAS EXTRA)
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    background: 'var(--bg-elevated)',
                    padding: '1rem 1.25rem',
                    borderRadius: '14px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      Bloque base: {settings.base_hours} horas incluidas
                    </div>
                    <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                      Cada hora extra suma +{formatMxn(settings.extra_hour_rate)} MXN al paquete
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => setExtraHours((h) => Math.max(0, h - 1))}
                      aria-label="Restar hora extra"
                    >
                      −
                    </button>
                    <span
                      className="mono-tag"
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        minWidth: '115px',
                        textAlign: 'center'
                      }}
                    >
                      +{extraHours} hrs extra
                    </span>
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => setExtraHours((h) => Math.min(6, h + 1))}
                      aria-label="Sumar hora extra"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* PASO 3: FECHA Y HORARIO EN CALENDARIO */}
              <div
                style={{
                  marginBottom: '2rem',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid var(--border-hairline)'
                }}
              >
                <div className="mono-tag" style={{ color: 'var(--accent-vermilion)', marginBottom: '0.6rem' }}>
                  PASO 03 · FECHA Y DISPONIBILIDAD (10:00 AM — 10:00 PM)
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1rem'
                  }}
                >
                  <div>
                    <label
                      htmlFor="booking-date-input"
                      style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.35rem' }}
                    >
                      Fecha de tu sesión
                    </label>
                    <input
                      id="booking-date-input"
                      type="date"
                      min={getTodayIso()}
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="start-hour-select"
                      style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.35rem' }}
                    >
                      Hora de inicio ({quote.totalHours} horas continuas)
                    </label>
                    <select
                      id="start-hour-select"
                      value={startHour}
                      onChange={(e) => setStartHour(Number(e.target.value))}
                      className="input-field"
                    >
                      {dayAvailability.validStartHours.map((slot) => (
                        <option
                          key={slot.startHour}
                          value={slot.startHour}
                          disabled={!slot.available}
                        >
                          {slot.startHour}:00 a {slot.endHour}:00 hrs{' '}
                          {slot.available ? '— Disponible' : '— Ocupado'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Línea de tiempo visual hora por hora */}
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Estado de la sala el <strong>{bookingDate}</strong> (Rojo = tu bloque seleccionado
                  de {startHour}:00 a {startHour + quote.totalHours}:00 hrs):
                </div>
                <div className="hour-timeline">
                  {dayAvailability.hourCells.map((cell) => {
                    const isWithinSelectedWindow =
                      !cell.occupied &&
                      cell.hour >= startHour &&
                      cell.hour < startHour + quote.totalHours;

                    const cellClass = cell.occupied
                      ? 'hour-cell busy'
                      : isWithinSelectedWindow
                        ? 'hour-cell active-window'
                        : 'hour-cell free';

                    return (
                      <div key={cell.hour} className={cellClass} title={cell.reason}>
                        <div>{String(cell.hour).padStart(2, '0')}:00</div>
                        <div style={{ fontSize: '0.62rem', marginTop: '2px' }}>
                          {cell.occupied ? 'Ocupado' : isWithinSelectedWindow ? 'Tu Jugada' : 'Libre'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PASO 4: DATOS DEL CREADOR / PROYECTO */}
              <div
                style={{
                  paddingTop: '1.5rem',
                  borderTop: '1px solid var(--border-hairline)'
                }}
              >
                <div className="mono-tag" style={{ color: 'var(--accent-vermilion)', marginBottom: '0.8rem' }}>
                  PASO 04 · DATOS DE CONTACTO Y DETALLES DE LA IDEA
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1rem'
                  }}
                >
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Sofía Morales"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                      WhatsApp / Teléfono *
                    </label>
                    <input
                      type="tel"
                      placeholder="Ej. 55 1234 5678"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      placeholder="artista@ejemplo.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                      Proyecto / Banda / Motivo
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. EP Debut / Experiencia en familia / Listening Party"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                      Número de asistentes / músicos
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={attendeesCount}
                      onChange={(e) => setAttendeesCount(Number(e.target.value))}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                      Perfil de edad (Comunidad / Estudio)
                    </label>
                    <select
                      value={ageGroup}
                      onChange={(e) => setAgeGroup(e.target.value)}
                      className="input-field"
                    >
                      <option value="Todas las edades / Comunidad">
                        Todas las edades / Familiar / Comunidad
                      </option>
                      <option value="Adultos (+18)">Adultos (+18)</option>
                      <option value="Jóvenes / Adolescentes">Jóvenes / Adolescentes</option>
                      <option value="Infantil / Niños acompañados">Infantil / Niños acompañados</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                    Cuéntanos qué quieres crear, qué programas usas o de qué trata tu evento
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ej. Queremos maquetar 2 canciones indie pop con el Prophet-6 y el piano Yamaha, o celebrar el lanzamiento de nuestro disco..."
                    value={eventDetails}
                    onChange={(e) => setEventDetails(e.target.value)}
                    className="input-field"
                  />
                </div>

                {errorMessage && (
                  <div
                    style={{
                      background: '#fde8e4',
                      color: '#9e210e',
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      fontSize: '0.88rem',
                      marginBottom: '1rem'
                    }}
                  >
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-vermilion"
                  disabled={submitting}
                  style={{ width: '100%', justifyContent: 'center', padding: '0.95rem', fontSize: '0.96rem' }}
                >
                  {submitting
                    ? 'Registrando tu Jugada en Matatena Records...'
                    : quote.isCustomQuote
                      ? 'Solicitar Cotización y Apartar Fecha →'
                      : `Confirmar Reserva por ${formatMxn(quote.totalPriceMxn)} MXN →`}
                </button>
              </div>
            </form>

            {/* TICKET / RECIBO EDITORIAL DE LA JUGADA */}
            <aside className="receipt-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="mono-tag" style={{ color: '#ff7c66' }}>
                  TICKET DE JUGADA · MATATENA
                </span>
                <MatatenaJackIcon size={24} active color="#ff7c66" />
              </div>

              <h3 className="editorial-serif" style={{ fontSize: '2.1rem', marginTop: '0.6rem' }}>
                {quote.tier.title}
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'rgba(246,242,234,0.72)', marginTop: '0.2rem' }}>
                {quote.tier.subtitle}
              </p>

              <div
                style={{
                  margin: '1.5rem 0',
                  padding: '1.15rem 0',
                  borderTop: '1px dashed rgba(255,255,255,0.2)',
                  borderBottom: '1px dashed rgba(255,255,255,0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                  fontSize: '0.88rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(246,242,234,0.72)' }}>Fecha seleccionada:</span>
                  <strong>{bookingDate}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(246,242,234,0.72)' }}>Horario en sala:</span>
                  <strong>
                    {formatHourLabel(startHour).split(' ')[0]} a{' '}
                    {formatHourLabel(startHour + quote.totalHours).split(' ')[0]} hrs
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(246,242,234,0.72)' }}>
                    Paquete base ({quote.baseHours} horas):
                  </span>
                  <strong>
                    {quote.isCustomQuote ? 'Por cotizar' : formatMxn(quote.basePriceMxn)}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(246,242,234,0.72)' }}>
                    Horas extra (+{quote.extraHours} hrs × {formatMxn(quote.extraHourRate)}):
                  </span>
                  <strong>{formatMxn(quote.extraPriceMxn)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(246,242,234,0.72)' }}>Duración total:</span>
                  <strong>{quote.totalHours} horas</strong>
                </div>
              </div>

              <div>
                <div className="mono-tag" style={{ color: 'rgba(246,242,234,0.6)' }}>
                  TOTAL ESTIMADO (MXN)
                </div>
                <div className="editorial-serif" style={{ fontSize: '2.8rem', lineHeight: 1.05, marginTop: '0.25rem' }}>
                  {quote.isCustomQuote ? 'Cotización Personalizada' : formatMxn(quote.totalPriceMxn)}
                </div>
              </div>

              {createdBooking && (
                <div
                  style={{
                    marginTop: '1.5rem',
                    background: 'rgba(45, 106, 79, 0.28)',
                    border: '1px solid #52b788',
                    borderRadius: '14px',
                    padding: '1.1rem'
                  }}
                >
                  <div className="mono-tag" style={{ color: '#74c69d' }}>
                    ✓ JUGADA REGISTRADA · FOLIO {createdBooking.folio}
                  </div>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.4rem' }}>
                    Tu horario ({createdBooking.booking_date} de {createdBooking.start_hour}:00 a{' '}
                    {createdBooking.end_hour}:00) ha quedado registrado en el sistema.
                  </p>
                </div>
              )}
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}

