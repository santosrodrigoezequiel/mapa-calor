import React, { useState, useRef, useCallback } from 'react';
import UploadStep from './components/UploadStep';
import ProcessingStep from './components/ProcessingStep';
import DoneStep from './components/DoneStep';
import './App.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function App() {
  const [step, setStep] = useState('upload');
  const [jobId, setJobId] = useState(null);
  const [jobInfo, setJobInfo] = useState({ status: 'pending', puntos: 0 });
  const [config, setConfig] = useState({ region: 'auto', nivel_bordes: 'paises', paleta: 'oscuro' });
  const [mapHtml, setMapHtml] = useState('');
  const [error, setError] = useState('');
  const pollRef = useRef(null);

  const startPolling = useCallback((id) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/status/${id}`);
        const data = await res.json();
        setJobInfo(data);

        if (data.status === 'done') {
          clearInterval(pollRef.current);
          // Cargar el HTML del mapa
          const mapRes = await fetch(`${API_BASE}/result/${id}`);
          const html = await mapRes.text();
          setMapHtml(html);
          setStep('done');
        } else if (data.status === 'error') {
          clearInterval(pollRef.current);
          setError(data.error || 'Error generando el mapa');
          setStep('upload');
        }
      } catch (e) {
        // Ignorar errores transitorios
      }
    }, 1500);
  }, []);

  const handleUpload = useCallback(async (file, cfg) => {
    setError('');
    setConfig(cfg);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('region', cfg.region);
    formData.append('nivel_bordes', cfg.nivel_bordes);
    formData.append('paleta', cfg.paleta);

    try {
      const res = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || 'Error al procesar el archivo');
        return;
      }

      setJobId(data.job_id);
      setStep('processing');
      startPolling(data.job_id);
    } catch (e) {
      setError('No se pudo conectar con el servidor. Verificá que el backend esté activo.');
    }
  }, [startPolling]);

  const handleDownload = useCallback(() => {
    window.open(`${API_BASE}/download/${jobId}`, '_blank');
  }, [jobId]);

  const handleReset = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (jobId) fetch(`${API_BASE}/job/${jobId}`, { method: 'DELETE' }).catch(() => {});
    setStep('upload');
    setJobId(null);
    setJobInfo({ status: 'pending', puntos: 0 });
    setMapHtml('');
    setError('');
  }, [jobId]);

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <span className="logo">🗺️</span>
          <div>
            <h1>Mapa de Calor | CSV</h1>
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

        {step === 'upload' && (
          <UploadStep onUpload={handleUpload} />
        )}
        {step === 'processing' && (
          <ProcessingStep jobInfo={jobInfo} onCancel={handleReset} />
        )}
        {step === 'done' && (
          <DoneStep
            jobInfo={jobInfo}
            config={config}
            mapHtml={mapHtml}
            onDownload={handleDownload}
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
