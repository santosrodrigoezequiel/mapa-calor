import React, { useState, useCallback } from 'react';
import UploadStep from './components/UploadStep';
import ProcessingStep from './components/ProcessingStep';
import DoneStep from './components/DoneStep';
import { parsearCsv } from './lib/csv';
import { prepararDatos } from './lib/mapa';
import './App.css';

export default function App() {
  const [step, setStep] = useState('upload');
  const [config, setConfig] = useState({ region: 'auto', nivel_bordes: 'paises', paleta: 'oscuro' });
  const [datos, setDatos] = useState(null);
  const [resumen, setResumen] = useState({ puntos: 0, descartados: 0 });
  const [aviso, setAviso] = useState('');
  const [error, setError] = useState('');

  const handleUpload = useCallback(async (file, cfg) => {
    setError('');
    setAviso('');
    setConfig(cfg);
    setStep('processing');

    try {
      const contenido = await file.text();
      const { puntos, etiquetaMetrica, descartados } = parsearCsv(contenido);
      const preparado = await prepararDatos(puntos, etiquetaMetrica, cfg);

      setDatos(preparado.datos);
      setResumen({ puntos: puntos.length, descartados });
      setAviso(preparado.aviso);
      setStep('done');
    } catch (e) {
      setError(e.message || 'No se pudo generar el mapa.');
      setStep('upload');
    }
  }, []);

  const handleReset = useCallback(() => {
    setStep('upload');
    setDatos(null);
    setResumen({ puntos: 0, descartados: 0 });
    setAviso('');
    setError('');
  }, []);

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <span className="logo">🗺️</span>
          <div>
            <h1>Mapa de Calor | Data viewer</h1>
            <p>Generá mapas de calor interactivos a partir de coordenadas en un CSV</p>
          </div>
        </div>
      </header>

      <main className="main">
        {error && (
          <div className="error-banner">
            ⚠️ {error}
            <button onClick={() => setError('')} className="error-close">✕</button>
          </div>
        )}

        {step === 'upload' && <UploadStep onUpload={handleUpload} />}
        {step === 'processing' && <ProcessingStep />}
        {step === 'done' && datos && (
          <DoneStep
            datos={datos}
            resumen={resumen}
            config={config}
            aviso={aviso}
            onReset={handleReset}
          />
        )}
      </main>

      <footer className="footer">
        <p>
          <a
            href="https://www.linkedin.com/in/santosrodrigoezequiel/"
            target="_blank"
            rel="noreferrer"
          >
            Rodrigo Ezequiel Santos
          </a>
          {' · LinkedIn'}
        </p>
      </footer>
    </div>
  );
}
