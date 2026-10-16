'use client';

import React, { useState } from 'react';

/**
 * Icono SVG de una pieza clásica de Matatena (estrella tridimensional de 6 puntas con terminaciones esféricas)
 */
export function MatatenaJackIcon({ size = 28, active = false, color = 'currentColor' }) {
  const strokeColor = active ? '#D9381E' : color;
  const tipFill = active ? '#D9381E' : color;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{
        transition: 'transform 0.3s ease',
        filter: active ? 'drop-shadow(0 0 8px rgba(217, 56, 30, 0.45))' : 'none'
      }}
    >
      {/* Eje vertical */}
      <line x1="32" y1="8" x2="32" y2="56" stroke={strokeColor} strokeWidth="3.2" strokeLinecap="round" />
      {/* Eje diagonal 1 */}
      <line x1="11" y1="19" x2="53" y2="45" stroke={strokeColor} strokeWidth="3.2" strokeLinecap="round" />
      {/* Eje diagonal 2 */}
      <line x1="53" y1="19" x2="11" y2="45" stroke={strokeColor} strokeWidth="3.2" strokeLinecap="round" />
      {/* Centro metálico */}
      <circle cx="32" cy="32" r="5.5" fill={tipFill} />
      {/* 6 Puntas esféricas clásicas de la matatena */}
      <circle cx="32" cy="8" r="4.2" fill={tipFill} />
      <circle cx="32" cy="56" r="4.2" fill={tipFill} />
      <circle cx="11" cy="19" r="4.2" fill={tipFill} />
      <circle cx="53" cy="45" r="4.2" fill={tipFill} />
      <circle cx="53" cy="19" r="4.2" fill={tipFill} />
      <circle cx="11" cy="45" r="4.2" fill={tipFill} />
    </svg>
  );
}

const JACK_NOTES = [
  { id: 1, name: 'I · El Bote (Idea)', freq: 261.63, desc: 'Grado I · Autonomía en el cuarto' },
  { id: 2, name: 'II · Pulso (Consola)', freq: 329.63, desc: 'Grado II · + Ingeniero / Productor' },
  { id: 3, name: 'III · Lirismo (Letra)', freq: 392.0, desc: 'Grado III · + Ingeniero + Compositor' },
  { id: 4, name: 'IV · Comunidad', freq: 493.88, desc: 'Experiencia Compositora · Todas las edades' },
  { id: 5, name: 'V · Timbre (2x Gear)', freq: 587.33, desc: '1 Sala · 1 Consola · 2 de cada instrumento' },
  { id: 6, name: 'VI · Mesa Abierta', freq: 659.25, desc: 'Listening Parties & Sesiones en Vivo' }
];

export function InteractiveMatatenaBoard({ onSelectRound }) {
  const [capturedCount, setCapturedCount] = useState(3);
  const [bouncing, setBouncing] = useState(false);
  const [activeNoteLabel, setActiveNoteLabel] = useState(
    'Haz clic en "Lanzar Esfera" o toca las piezas de matatena para escuchar la sala'
  );
  const [soundEnabled, setSoundEnabled] = useState(true);

  function playAnalogTone(frequencies) {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.09 / frequencies.length, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.15);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.045);
        osc.stop(now + 1.2);
      });
    } catch {
      // Ignore audio errors if blocked by browser
    }
  }

  function handleBounceThrow() {
    setBouncing(true);
    const nextCount = capturedCount >= 6 ? 1 : capturedCount + 1;
    setCapturedCount(nextCount);
    const activeNotes = JACK_NOTES.slice(0, nextCount);
    playAnalogTone(activeNotes.map((n) => n.freq));
    setActiveNoteLabel(
      `Jugada de a ${nextCount}: ${activeNotes[activeNotes.length - 1].desc}`
    );
    setTimeout(() => setBouncing(false), 750);
  }

  function handleJackClick(index) {
    const count = index + 1;
    setCapturedCount(count);
    const note = JACK_NOTES[index];
    playAnalogTone([note.freq, note.freq * 1.25]);
    setActiveNoteLabel(`${note.name} — ${note.desc}`);
    if (onSelectRound) {
      if (count === 1) onSelectRound('grado_1');
      if (count === 2) onSelectRound('grado_2');
      if (count === 3) onSelectRound('grado_3');
      if (count === 4) onSelectRound('experiencia');
      if (count >= 5) onSelectRound('evento_multiple');
    }
  }

  return (
    <div className="matatena-stage">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
        <span className="mono-tag" style={{ color: '#D9381E' }}>
          ● SIMBOLOGÍA INTERACTIVA · MATATENA SONORA
        </span>
        <button
          type="button"
          onClick={() => setSoundEnabled((v) => !v)}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.18)',
            color: '#f6f2ea',
            borderRadius: '999px',
            padding: '0.3rem 0.75rem',
            fontSize: '0.72rem',
            cursor: 'pointer'
          }}
        >
          {soundEnabled ? '🔊 Audio Sintetizador ON' : '🔇 Audio OFF'}
        </button>
      </div>

      <div className="matatena-board">
        {/* La Pelota Roja Clásica de Matatena */}
        <button
          type="button"
          onClick={handleBounceThrow}
          title="Lanzar la esfera roja al aire"
          className={bouncing ? 'bouncing-ball' : ''}
          style={{
            width: '66px',
            height: '66px',
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            background:
              'radial-gradient(circle at 32% 28%, #ff8873 0%, #d9381e 52%, #751506 100%)',
            boxShadow:
              '0 14px 30px rgba(217, 56, 30, 0.55), inset 0 -4px 10px rgba(0,0,0,0.4)',
            marginBottom: '1.35rem',
            position: 'relative'
          }}
        >
          <span
            className="mono-tag"
            style={{
              fontSize: '0.62rem',
              color: '#fff',
              fontWeight: 700,
              letterSpacing: '0.06em'
            }}
          >
            BOTAR
          </span>
        </button>

        {/* Las 6 Piezas Metálicas de Matatena */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.9rem',
            width: '100%',
            maxWidth: '340px'
          }}
        >
          {JACK_NOTES.map((item, idx) => {
            const isCaptured = idx < capturedCount;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleJackClick(idx)}
                style={{
                  background: isCaptured
                    ? 'rgba(217, 56, 30, 0.16)'
                    : 'rgba(255, 255, 255, 0.04)',
                  border: isCaptured
                    ? '1px solid rgba(217, 56, 30, 0.7)'
                    : '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '14px',
                  padding: '0.75rem 0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer',
                  color: '#f6f2ea',
                  transition: 'all 0.2s ease'
                }}
              >
                <MatatenaJackIcon
                  size={34}
                  active={isCaptured}
                  color={isCaptured ? '#D9381E' : '#B8BEC8'}
                />
                <span className="mono-tag" style={{ fontSize: '0.63rem', opacity: 0.9 }}>
                  {item.name.split(' · ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        <p
          style={{
            marginTop: '1.15rem',
            fontSize: '0.82rem',
            color: 'rgba(246, 242, 234, 0.82)',
            textAlign: 'center',
            minHeight: '2.4em'
          }}
        >
          {activeNoteLabel}
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          borderTop: '1px solid rgba(255,255,255,0.12)',
          paddingTop: '1rem'
        }}
      >
        <div>
          <div className="mono-tag" style={{ color: 'rgba(246,242,234,0.6)' }}>
            REGLA DEL JUEGO
          </div>
          <div style={{ fontSize: '0.86rem', marginTop: '0.15rem' }}>
            Lanza la idea al aire y elige cuántas piezas necesitas capturar hoy.
          </div>
        </div>
        <button type="button" className="btn-vermilion" onClick={handleBounceThrow}>
          Lanzar Esfera ({capturedCount}/6)
        </button>
      </div>
    </div>
  );
}

