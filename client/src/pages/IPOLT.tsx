import { useEffect, useState } from 'react';
import { api } from '../api';
import type { OLT } from '../api';

export default function IPOLT() {
  const [olts, setOlts] = useState<OLT[]>([]);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);

  useEffect(() => {
    api.get('/olts').then(r => setOlts(r.data));
  }, []);

  const updateField = (id: number, key: keyof OLT, value: string) => {
    setOlts(prev => prev.map(o => o.id === id ? { ...o, [key]: value } : o));
  };

  const saveRow = async (o: OLT) => {
    setSavingId(o.id);
    setSavedId(null);
    try {
      const payload: Partial<OLT> = { ip: o.ip || '', username: o.username || '', password: o.password || '' };
      await api.put(`/olts/${o.id}`, payload);
      setSavedId(o.id);
      setTimeout(() => setSavedId(null), 1500);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      <h2>IP OLT</h2>
      <div className="card">
        <p>Konfigurasi alamat IP dan kredensial OLT. Edit kolom lalu klik Simpan.</p>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th style={{width:60}}>ID</th>
              <th>Nama</th>
              <th>Jenis</th>
              <th style={{width:220}}>IP Address</th>
              <th style={{width:200}}>Username</th>
              <th style={{width:200}}>Password</th>
              <th style={{width:140}}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {olts.map(o => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{o.name}</td>
                <td>{o.type}</td>
                <td>
                  <input
                    value={o.ip || ''}
                    onChange={e => updateField(o.id, 'ip', e.target.value)}
                    placeholder="10.10.x.x"
                    style={{width:'100%'}}
                  />
                </td>
                <td>
                  <input
                    value={o.username || ''}
                    onChange={e => updateField(o.id, 'username', e.target.value)}
                    placeholder="admin"
                    style={{width:'100%'}}
                  />
                </td>
                <td>
                  <input
                    type="password"
                    value={o.password || ''}
                    onChange={e => updateField(o.id, 'password', e.target.value)}
                    placeholder="••••••"
                    style={{width:'100%'}}
                  />
                </td>
                <td>
                  <button className="btn" onClick={() => saveRow(o)} disabled={savingId === o.id}>
                    {savingId === o.id ? 'Menyimpan...' : 'Simpan'}
                  </button>
                  {savedId === o.id && (
                    <span style={{marginLeft:8,color:'#22c55e'}}>Tersimpan</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}