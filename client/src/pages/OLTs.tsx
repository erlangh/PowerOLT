import { useEffect, useState } from 'react';
import { api } from '../api';
import type { OLT } from '../api';

export default function OLTs(){
  const [olts, setOlts] = useState<OLT[]>([]);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => { api.get('/olts').then(r => setOlts(r.data)); }, []);

  const startSync = async () => {
    const r = await api.post('/olts/sync');
    setRunning(r.data.running); setProgress(r.data.progress);
    const timer = setInterval(async () => {
      const s = await api.get('/olts/sync/status');
      setRunning(s.data.running); setProgress(s.data.progress);
      if (!s.data.running) clearInterval(timer);
    }, 800);
  };

  return (
    <div>
      <h2>OLTs</h2>
      <div className="card" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <strong>Sinkronisasi Database OLT</strong>
          <div style={{marginTop:8}}>Status: {running ? 'Berjalan...' : 'Selesai'}</div>
        </div>
        <button className="btn" onClick={startSync}>Mulai Sinkron</button>
      </div>
      <div className="card">
        <div style={{background:'#0b1220',border:'1px solid #1f2937',height:16,borderRadius:8}}>
          <div style={{width:`${progress}%`,height: '100%',background:'#22c55e',borderRadius:8}} />
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr><th>ID</th><th>Name</th><th>Type</th><th>IP</th></tr>
          </thead>
          <tbody>
            {olts.map(o => <tr key={o.id}><td>{o.id}</td><td>{o.name}</td><td>{o.type}</td><td>{o.ip}</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}