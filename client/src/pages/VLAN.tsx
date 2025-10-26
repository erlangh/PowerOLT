import { useEffect, useState } from 'react';
import { api } from '../api';

type VlanItem = { id: number; name: string; vlan: number };

export default function VLAN(){
  const [vlans, setVlans] = useState<VlanItem[]>([]);
  const [newItem, setNewItem] = useState<Partial<VlanItem>>({ name: '', vlan: 100 });
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = async () => {
    const r = await api.get('/vlans');
    setVlans(r.data);
  };
  useEffect(()=>{ load(); },[]);

  const updateField = (id: number, key: keyof VlanItem, value: string) => {
    setVlans(prev => prev.map(v => v.id === id ? { ...v, [key]: key==='vlan' ? Number(value) : value } as VlanItem : v));
  };

  const saveRow = async (v: VlanItem) => {
    setSavingId(v.id);
    try {
      await api.put(`/vlans/${v.id}`, { name: v.name, vlan: v.vlan });
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Gagal menyimpan VLAN');
    } finally {
      setSavingId(null);
      load();
    }
  };

  const deleteRow = async (id: number) => {
    await api.delete(`/vlans/${id}`);
    load();
  };

  const addNew = async () => {
    if (!newItem.name || newItem.vlan == null) return;
    try {
      await api.post('/vlans', { name: newItem.name, vlan: Number(newItem.vlan||0) });
      setNewItem({ name: '', vlan: 100 });
      load();
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Gagal menambah VLAN');
    }
  };

  return (
    <div>
      <h2>VLAN</h2>
      <div className="card">
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <input placeholder="Nama VLAN" value={newItem.name||''} onChange={e=>setNewItem({ ...newItem, name: e.target.value })} />
          <input placeholder="VLAN ID" type="number" value={newItem.vlan||0} onChange={e=>setNewItem({ ...newItem, vlan: Number(e.target.value) })} />
          <button className="btn" onClick={addNew}>Tambah</button>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr><th style={{width:60}}>ID</th><th>Nama</th><th>VLAN ID</th><th style={{width:200}}>Aksi</th></tr>
          </thead>
          <tbody>
            {vlans.map(v => (
              <tr key={v.id}>
                <td>{v.id}</td>
                <td><input value={v.name} onChange={e=>updateField(v.id,'name',e.target.value)} style={{width:'100%'}} /></td>
                <td><input type="number" value={v.vlan} onChange={e=>updateField(v.id,'vlan',e.target.value)} style={{width:'100%'}} /></td>
                <td>
                  <button className="btn" onClick={()=>saveRow(v)} disabled={savingId===v.id}>{savingId===v.id?'Menyimpan...':'Simpan'}</button>
                  <button className="btn secondary" style={{marginLeft:8}} onClick={()=>deleteRow(v.id)}>Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}