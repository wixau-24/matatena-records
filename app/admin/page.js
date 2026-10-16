'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatMxn } from '../../lib/matatena-catalog.js';
import { runAdminActionClient } from '../../lib/client-data.js';
import { MatatenaJackIcon } from '../../components/MatatenaJackIcon.jsx';

export default function AdminDashboardPage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('reservas');
  const [storageMode, setStorageMode] = useState('supabase');
  const [settings, setSettings] = useState(null);
  const [gear, setGear] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('todas');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Estado para nuevo bloqueo manual de calendario
  const [blockDate, setBlockDate] = useState('');
  const [blockStart, setBlockStart] = useState(10);
  const [blockEnd, setBlockEnd] = useState(14);
  const [blockReason, setBlockReason] = useState('Sesión interna / Mantenimiento');

  async function callAdminApi(payload) {
    return runAdminActionClient({ ...payload, password });
  }

  async function handleLogin(e) {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    try {
      const data = await callAdminApi({ action: 'verify' });
      setSettings(data.settings);
      setGear(data.gear || []);
      setBookings(data.bookings || []);
      setStorageMode(data.storageMode || 'supabase');
      setAuthenticated(true);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(bookingId, newStatus) {
    try {
      const data = await callAdminApi({
        action: 'update_booking',
        id: bookingId,
        status: newStatus
      });
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? data.booking : b)));
      setFeedbackMsg(`Estado actualizado a "${newStatus}".`);
    } catch (err) {
      setFeedbackMsg(`Error: ${err.message}`);
    }
  }

  async function handleSaveSettings(e) {
    e.preventDefault();
    try {
      const data = await callAdminApi({
        action: 'update_settings',
        settings
      });
      setSettings(data.settings);
      setFeedbackMsg('Configuración de precios y horarios guardada correctamente.');
    } catch (err) {
      setFeedbackMsg(`Error: ${err.message}`);
    }
  }

  async function handleAddBlockSlot(e) {
    e.preventDefault();
    if (!blockDate) return;
    const nextBlocks = [
      ...(settings.blocked_slots || []),
      {
        id: `blk-${Date.now()}`,
        date: blockDate,
        startHour: Number(blockStart),
        endHour: Number(blockEnd),
        reason: blockReason
      }
    ];
    try {
      const data = await callAdminApi({
        action: 'update_settings',
        settings: { ...settings, blocked_slots: nextBlocks }
      });
      setSettings(data.settings);
      setFeedbackMsg(`Horario bloqueado el ${blockDate} de ${blockStart}:00 a ${blockEnd}:00.`);
    } catch (err) {
      setFeedbackMsg(`Error: ${err.message}`);
    }
  }

  async function handleRemoveBlockSlot(blockId) {
    const nextBlocks = (settings.blocked_slots || []).filter((b) => b.id !== blockId);
    try {
      const data = await callAdminApi({
        action: 'update_settings',
        settings: { ...settings, blocked_slots: nextBlocks }
      });
      setSettings(data.settings);
      setFeedbackMsg('Bloqueo eliminado.');
    } catch (err) {
      setFeedbackMsg(`Error: ${err.message}`);
    }
  }

  async function handleUpdateGearItem(item) {
    try {
      const data = await callAdminApi({
        action: 'update_gear',
        gearItem: item
      });
      setGear(data.gear);
      setFeedbackMsg(`Equipo "${item.name}" actualizado.`);
    } catch (err) {
      setFeedbackMsg(`Error: ${err.message}`);
    }
  }

  if (!authenticated) {
    return (
      <div className="gallery-shell" style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <form
          onSubmit={handleLogin}
          className="config-panel"
          style={{ maxWidth: '460px', width: '100%' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="mono-tag" style={{ color: 'var(--accent-vermilion)' }}>
              MATATENA RECORDS · ADMIN
            </span>
            <MatatenaJackIcon size={24} active />
          </div>
          <h1 className="editorial-serif" style={{ fontSize: '2.35rem', margin: '0.6rem 0 0.4rem' }}>
            Control de Estudio
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Ingresa tu contraseña de administrador para gestionar reservaciones, bloquear horarios y
            editar precios o instrumentos.
          </p>

          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="input-field"
            required
          />

          {authError && (
            <p style={{ color: 'var(--accent-vermilion)', fontSize: '0.84rem', marginTop: '0.65rem' }}>
              {authError}
            </p>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.35rem' }}>
            <button type="submit" className="btn-vermilion" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
              {loading ? 'Verificando...' : 'Entrar al Panel →'}
            </button>
            <Link href="/" className="btn-outline">
              Volver al Sitio
            </Link>
          </div>
        </form>
      </div>
    );
  }

  const filteredBookings =
    statusFilter === 'todas'
      ? bookings
      : bookings.filter((b) => b.status === statusFilter);

  return (
    <div>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand-lockup">
            <span className="brand-ball" />
            <div>
              <div className="brand-title">Matatena Records · Admin</div>
              <div className="mono-tag" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                MOTOR DE DATOS: {storageMode.toUpperCase()}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={activeTab === 'reservas' ? 'btn-ink' : 'btn-outline'}
              onClick={() => setActiveTab('reservas')}
            >
              Agenda &amp; Reservas ({bookings.length})
            </button>
            <button
              type="button"
              className={activeTab === 'config' ? 'btn-ink' : 'btn-outline'}
              onClick={() => setActiveTab('config')}
            >
              Precios &amp; Bloqueos de Horario
            </button>
            <button
              type="button"
              className={activeTab === 'gear' ? 'btn-ink' : 'btn-outline'}
              onClick={() => setActiveTab('gear')}
            >
              Inventario ({gear.length})
            </button>
            <Link href="/" className="btn-vermilion">
              Ver Página Pública ↗
            </Link>
          </div>
        </div>
      </header>

      <main className="gallery-shell" style={{ paddingTop: '2.5rem' }}>
        {feedbackMsg && (
          <div
            style={{
              background: 'var(--bg-ink)',
              color: 'var(--text-on-ink)',
              padding: '0.85rem 1.25rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>{feedbackMsg}</span>
            <button
              type="button"
              onClick={() => setFeedbackMsg('')}
              style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* PESTAÑA 1: RESERVAS */}
        {activeTab === 'reservas' && (
          <section>
            <div className="section-header" style={{ marginBottom: '1.5rem' }}>
              <div>
                <span className="mono-tag" style={{ color: 'var(--accent-vermilion)' }}>
                  GESTIÓN DE SESIONES Y EVENTOS
                </span>
                <h1 className="section-title">Reservaciones y Solicitudes</h1>
              </div>

              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                {['todas', 'pendiente', 'confirmada', 'cotizacion', 'completada', 'cancelada'].map(
                  (st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={statusFilter === st ? 'btn-ink' : 'btn-outline'}
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
                    >
                      {st.toUpperCase()}
                    </button>
                  )
                )}
              </div>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="config-panel" style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: 'var(--text-secondary)' }}>
                  No hay reservaciones registradas en este filtro todavía.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {filteredBookings.map((b) => (
                  <div key={b.id} className="config-panel">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '1rem',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div>
                        <span className="mono-tag" style={{ color: 'var(--accent-vermilion)' }}>
                          FOLIO {b.folio} · ESTADO: {b.status.toUpperCase()}
                        </span>
                        <h3 className="editorial-serif" style={{ fontSize: '1.8rem', marginTop: '0.2rem' }}>
                          {b.tier_title} — {b.booking_date} ({b.start_hour}:00 a {b.end_hour}:00 hrs)
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                          <strong>Cliente:</strong> {b.customer_name} · <strong>Tel:</strong>{' '}
                          {b.customer_phone} · <strong>Correo:</strong> {b.customer_email || 'N/A'} ·{' '}
                          <strong>Asistentes:</strong> {b.attendees_count} ({b.age_group})
                        </p>
                        {b.event_details && (
                          <p style={{ fontSize: '0.88rem', marginTop: '0.45rem' }}>
                            <strong>Idea / Evento:</strong> {b.event_details}
                          </p>
                        )}
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div className="editorial-serif" style={{ fontSize: '2rem' }}>
                          {b.is_custom_quote ? 'Cotización' : formatMxn(b.total_price_mxn)}
                        </div>
                        <div className="mono-tag" style={{ color: 'var(--text-muted)' }}>
                          {b.total_hours} HORAS ({b.extra_hours} EXTRA)
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                        marginTop: '1rem',
                        paddingTop: '1rem',
                        borderTop: '1px solid var(--border-hairline)'
                      }}
                    >
                      <button
                        type="button"
                        className="btn-ink"
                        style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem' }}
                        onClick={() => handleStatusChange(b.id, 'confirmada')}
                      >
                        ✓ Confirmar
                      </button>
                      <button
                        type="button"
                        className="btn-outline"
                        style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem' }}
                        onClick={() => handleStatusChange(b.id, 'completada')}
                      >
                        Marcar Completada
                      </button>
                      <button
                        type="button"
                        className="btn-outline"
                        style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem', color: 'var(--accent-vermilion)' }}
                        onClick={() => handleStatusChange(b.id, 'cancelada')}
                      >
                        Cancelar y Liberar Horario
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* PESTAÑA 2: PRECIOS, HORARIOS Y BLOQUEOS */}
        {activeTab === 'config' && settings && (
          <div className="configurator-layout">
            <form onSubmit={handleSaveSettings} className="config-panel">
              <span className="mono-tag" style={{ color: 'var(--accent-vermilion)' }}>
                PARÁMETROS DE OPERACIÓN Y TARIFAS (MXN)
              </span>
              <h2 className="editorial-serif" style={{ fontSize: '2rem', margin: '0.4rem 0 1.25rem' }}>
                Precios y Horario del Estudio
              </h2>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1.25rem'
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600 }}>
                    Grado I · Solo Espacio (MXN)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={settings.pricing?.grado_1 ?? 2000}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        pricing: { ...settings.pricing, grado_1: Number(e.target.value) }
                      })
                    }
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600 }}>
                    Grado II · + Ingeniero/Productor (MXN)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={settings.pricing?.grado_2 ?? 3000}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        pricing: { ...settings.pricing, grado_2: Number(e.target.value) }
                      })
                    }
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600 }}>
                    Grado III · + Ingeniero + Compositor (MXN)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={settings.pricing?.grado_3 ?? 4000}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        pricing: { ...settings.pricing, grado_3: Number(e.target.value) }
                      })
                    }
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600 }}>
                    Experiencia Compositora (MXN)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={settings.pricing?.experiencia_compositora ?? 4500}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        pricing: {
                          ...settings.pricing,
                          experiencia_compositora: Number(e.target.value)
                        }
                      })
                    }
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600 }}>
                    Costo por Hora Extra (MXN)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={settings.extra_hour_rate ?? 400}
                    onChange={(e) =>
                      setSettings({ ...settings, extra_hour_rate: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600 }}>
                    Horas Base por Paquete
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={settings.base_hours ?? 4}
                    onChange={(e) =>
                      setSettings({ ...settings, base_hours: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <button type="submit" className="btn-vermilion">
                Guardar Tarifas y Horarios
              </button>
            </form>

            <div className="config-panel">
              <span className="mono-tag" style={{ color: 'var(--accent-vermilion)' }}>
                BLOQUEO MANUAL DE FECHAS Y HORAS
              </span>
              <h2 className="editorial-serif" style={{ fontSize: '2rem', margin: '0.4rem 0 1rem' }}>
                Bloquear Horario en Calendario
              </h2>

              <form onSubmit={handleAddBlockSlot} style={{ display: 'grid', gap: '0.85rem' }}>
                <input
                  type="date"
                  value={blockDate}
                  onChange={(e) => setBlockDate(e.target.value)}
                  className="input-field"
                  required
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem' }}>Hora inicio (24h)</label>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={blockStart}
                      onChange={(e) => setBlockStart(Number(e.target.value))}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem' }}>Hora fin (24h)</label>
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={blockEnd}
                      onChange={(e) => setBlockEnd(Number(e.target.value))}
                      className="input-field"
                    />
                  </div>
                </div>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Motivo del bloqueo"
                  className="input-field"
                />
                <button type="submit" className="btn-ink">
                  + Agregar Bloqueo al Calendario
                </button>
              </form>

              <div style={{ marginTop: '1.5rem', display: 'grid', gap: '0.5rem' }}>
                {(settings.blocked_slots || []).map((blk) => (
                  <div
                    key={blk.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.6rem 0.85rem',
                      background: 'var(--bg-elevated)',
                      borderRadius: '10px',
                      fontSize: '0.84rem'
                    }}
                  >
                    <span>
                      <strong>{blk.date}</strong> ({blk.startHour}:00–{blk.endHour}:00) ·{' '}
                      {blk.reason}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBlockSlot(blk.id)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--accent-vermilion)',
                        cursor: 'pointer',
                        fontWeight: 700
                      }}
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 3: INVENTARIO (1 SALA, 1 CONSOLA, 2 DE CADA PIEZA) */}
        {activeTab === 'gear' && (
          <section>
            <div className="section-header" style={{ marginBottom: '1.5rem' }}>
              <div>
                <span className="mono-tag" style={{ color: 'var(--accent-vermilion)' }}>
                  CATÁLOGO EDITABLE DE EQUIPAMIENTO
                </span>
                <h2 className="section-title">1 Sala · 1 Consola · 2 de Cada Categoría</h2>
              </div>
            </div>

            <div className="gear-grid">
              {gear.map((item) => (
                <div key={item.id} className="config-panel" style={{ padding: '1.25rem' }}>
                  <div className="mono-tag" style={{ color: 'var(--accent-vermilion)', marginBottom: '0.5rem' }}>
                    {item.category_label} ({item.badge})
                  </div>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setGear((prev) =>
                        prev.map((g) => (g.id === item.id ? { ...g, name: val } : g))
                      );
                    }}
                    className="input-field"
                    style={{ marginBottom: '0.6rem', fontWeight: 600 }}
                  />
                  <textarea
                    rows={2}
                    value={item.spec}
                    onChange={(e) => {
                      const val = e.target.value;
                      setGear((prev) =>
                        prev.map((g) => (g.id === item.id ? { ...g, spec: val } : g))
                      );
                    }}
                    className="input-field"
                    style={{ marginBottom: '0.75rem', fontSize: '0.84rem' }}
                  />
                  <button
                    type="button"
                    className="btn-ink"
                    style={{ width: '100%', padding: '0.5rem' }}
                    onClick={() => handleUpdateGearItem(item)}
                  >
                    Guardar Cambios
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

