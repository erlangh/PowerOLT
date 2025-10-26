import React from 'react';
import { useEffect, useState } from 'react';
import { api } from '../api';

type SpeedProfile = { id: number; name: string; down: number; up: number };

export default function SpeedProfiles(){
  const [profiles, setProfiles] = useState<SpeedProfile[]>([]);
  const [newItem, setNewItem] = useState<Partial<SpeedProfile>>({ name: '', down: 10000, up: 1000 });
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = async () => {
    const r = await api.get('/speed-profiles');
    setProfiles(r.data);
  };
  useEffect(()=>{ load(); },[]);

  const updateField = (id: number, key: keyof SpeedProfile, value: string) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, [key]: key==='down'||key==='up' ? Number(value) : value } as SpeedProfile : p));
  };

  const saveRow = async (p: SpeedProfile) => {
    setSavingId(p.id);
    try {
      await api.put(`/speed-profiles/${p.id}`, { name: p.name, down: p.down, up: p.up });
    } finally {
      setSavingId(null);
      load();
    }
  };

  const deleteRow = async (id: number) => {
    await api.delete(`/speed-profiles/${id}`);
    load();
  };

  const addNew = async () => {
    if (!newItem.name) return;
    await api.post('/speed-profiles', { name: newItem.name, down: Number(newItem.down||0), up: Number(newItem.up||0) });
    setNewItem({ name: '', down: 10000, up: 1000 });
    load();
  };

  return (
    <div>
      <h2>Speed Profiles</h2>
      <div className="card">
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <input placeholder="Nama profil" value={newItem.name||''} onChange={e=>setNewItem({ ...newItem, name: e.target.value })} />
          <input placeholder="Down (kbps)" type="number" value={newItem.down||0} onChange={e=>setNewItem({ ...newItem, down: Number(e.target.value) })} />
          <input placeholder="Up (kbps)" type="number" value={newItem.up||0} onChange={e=>setNewItem({ ...newItem, up: Number(e.target.value) })} />
          <button className="btn" onClick={addNew}>Tambah</button>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr><th style={{width:60}}>ID</th><th>Nama</th><th>Down (kbps)</th><th>Up (kbps)</th><th style={{width:200}}>Aksi</th></tr>
          </thead>
          <tbody>
            {profiles.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td><input value={p.name} onChange={e=>updateField(p.id,'name',e.target.value)} style={{width:'100%'}} /></td>
                <td><input type="number" value={p.down} onChange={e=>updateField(p.id,'down',e.target.value)} style={{width:'100%'}} /></td>
                <td><input type="number" value={p.up} onChange={e=>updateField(p.id,'up',e.target.value)} style={{width:'100%'}} /></td>
                <td>
                  <button className="btn" onClick={()=>saveRow(p)} disabled={savingId===p.id}>{savingId===p.id?'Menyimpan...':'Simpan'}</button>
                  <button className="btn secondary" style={{marginLeft:8}} onClick={()=>deleteRow(p.id)}>Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}