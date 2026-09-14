import React, { useState, useRef } from 'react';

const REGIONES = [
  { value: 'auto',      label: 'Auto (según el CSV)' },
  { value: 'argentina', label: 'Argentina' },
  { value: 'brasil',    label: 'Brasil' },
  { value: 'chile',     label: 'Chile' },
  { value: 'colombia',  label: 'Colombia' },
  { value: 'mexico',    label: 'México' },
  { value: 'peru',      label: 'Perú' },
  { value: 'uruguay',   label: 'Uruguay' },
  { value: 'usa',       label: 'Estados Unidos' },
  { value: 'españa',    label: 'España' },
  { value: 'mundo',     label: 'Mundo' },
];

export default function UploadStep({ onUpload }) {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [file, setFile] = useState(null);
  const [region, setRegion] = useState('auto');
  const [nivelBordes, setNivelBordes] = useState('paises');
  const [paleta, setPaleta] = useState('oscuro');
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.endsWith('.csv')) {
      alert('El archivo debe ser .csv');
      return;
    }
    setFile(f);
    setFileName(f.name);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = () => {
    if (file) onUpload(file, { region, nivel_bordes: nivelBordes, paleta });
  };

  return (
    <div className="card">
      <h2>Generá tu mapa de calor</h2>
      <p className="subtitle">
        Subí un CSV con coordenadas. Las columnas deben ser en orden:{' '}
        <strong>Nombre · Latitud · Longitud · Métrica</strong> (clicks, usuarios, etc.).
        El nombre de las columnas puede ser cualquiera.
      </p>

      {/* ── Dropzone ── */}
      <div
        className={`dropzone ${dragging ? 'dragging' : ''} ${fileName ? 'has-file' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
        {fileName ? (
          <>
            <span className="drop-icon">📄</span>
            <span className="drop-filename">{fileName}</span>
            <span className="drop-hint">Hacé clic para cambiar el archivo</span>
          </>
        ) : (
          <>
            <span className="drop-icon">📂</span>
            <span className="drop-label">Arrastrá tu CSV acá</span>
            <span className="drop-hint">o hacé clic para buscar</span>
          </>
        )}
      </div>

      {/* ── Configuración ── */}
      <div className="config-grid">
        <div className="config-item">
          <label>Región</label>
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            {REGIONES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div className="config-item">
          <label>Nivel de bordes</label>
          <select value={nivelBordes} onChange={(e) => setNivelBordes(e.target.value)}>
            <option value="paises">Países</option>
            <option value="provincias">Provincias / Estados</option>
          </select>
        </div>
      </div>

      {/* ── Selector de paleta ── */}
      <div className="config-item">
        <label>Paleta de colores</label>
        <div className="paleta-selector">
          <button
            className={`paleta-btn ${paleta === 'oscuro' ? 'selected' : ''}`}
            onClick={() => setPaleta('oscuro')}
          >
            <div className="paleta-preview paleta-preview-oscuro" />
            <span className="paleta-label">🌑 Modo oscuro</span>
          </button>
          <button
            className={`paleta-btn ${paleta === 'clasico' ? 'selected' : ''}`}
            onClick={() => setPaleta('clasico')}
          >
            <div className="paleta-preview paleta-preview-clasico" />
            <span className="paleta-label">🌍 Modo clásico</span>
          </button>
        </div>
      </div>

      {/* ── Info ── */}
      <div className="info-grid">
        <div className="info-item">
          <span className="info-icon">📥</span>
          <div>
            <strong>Entrada</strong>
            <p>CSV con nombre, lat, lon y métrica en las primeras 4 columnas</p>
          </div>
        </div>
        <div className="info-item">
          <span className="info-icon">🗺️</span>
          <div>
            <strong>Salida</strong>
            <p>Mapa interactivo con tooltips y descarga en HTML</p>
          </div>
        </div>
        <div className="info-item">
          <span className="info-icon">⚡</span>
          <div>
            <strong>Velocidad</strong>
            <p>Generación en ~5–15 segundos según la región</p>
          </div>
        </div>
        <div className="info-item">
          <span className="info-icon">🎨</span>
          <div>
            <strong>Paletas</strong>
            <p>Modo oscuro con degradé violeta-rojo o clásico azul-rojo</p>
          </div>
        </div>
      </div>

      <button
        className="btn-primary"
        disabled={!file}
        onClick={handleSubmit}
      >
        Generar mapa →
      </button>
    </div>
  );
}
