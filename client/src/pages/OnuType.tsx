import React, { useEffect, useState } from 'react';
import { api } from '../api';

interface OnuTypeItem {
  id?: number;
  name: string;
  vendor?: string | null;
  model?: string | null;
  description?: string | null;
}

export default function OnuType() {
  const [items, setItems] = useState<OnuTypeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<OnuTypeItem>({ name: '', vendor: '', model: '', description: '' });

  const fetchItems = async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get('/onu-types');
      setItems(res.data);
    } catch (e: any) {
      setError(e?.message || 'Gagal memuat data');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    try {
      const res = await api.post('/onu-types', newItem);
      setItems([res.data, ...items]);
      setNewItem({ name: '', vendor: '', model: '', description: '' });
    } catch (e: any) { setError(e?.response?.data?.error || 'Gagal menambah'); }
  };

  const updateItem = async (item: OnuTypeItem) => {
    try {
      const res = await api.put(`/onu-types/${item.id}`, item);
      const updated = res.data;
      setItems(items.map(i => i.id === updated.id ? updated : i));
    } catch (e: any) { setError(e?.response?.data?.error || 'Gagal menyimpan'); }
  };

  const deleteItem = async (id?: number) => {
    if (!id) return;
    try {
      await api.delete(`/onu-types/${id}`);
      setItems(items.filter(i => i.id !== id));
    } catch (e: any) { setError(e?.response?.data?.error || 'Gagal menghapus'); }
  };

  return (
    <div>
      <h2>Onu Type</h2>
      <div className="card">
        <form onSubmit={addItem} style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(4, 1fr)', alignItems: 'end' }}>
          <div>
            <label>Nama</label>
            <input value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} required />
          </div>
          <div>
            <label>Vendor</label>
            <input value={newItem.vendor || ''} onChange={e => setNewItem({ ...newItem, vendor: e.target.value })} />
          </div>
          <div>
            <label>Model</label>
            <input value={newItem.model || ''} onChange={e => setNewItem({ ...newItem, model: e.target.value })} />
          </div>
          <div>
            <label>Deskripsi</label>
            <input value={newItem.description || ''} onChange={e => setNewItem({ ...newItem, description: e.target.value })} />
          </div>
          <button type="submit">Tambah</button>
        </form>
      </div>

      {error && <div className="error">{error}</div>}
      {loading ? <div>Memuat...</div> : (
        <table className="wide-table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Vendor</th>
              <th>Model</th>
              <th>Deskripsi</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td><input value={it.name} onChange={e => setItems(items.map(i => i.id === it.id ? { ...i, name: e.target.value } : i))} /></td>
                <td><input value={it.vendor || ''} onChange={e => setItems(items.map(i => i.id === it.id ? { ...i, vendor: e.target.value } : i))} /></td>
                <td><input value={it.model || ''} onChange={e => setItems(items.map(i => i.id === it.id ? { ...i, model: e.target.value } : i))} /></td>
                <td><input value={it.description || ''} onChange={e => setItems(items.map(i => i.id === it.id ? { ...i, description: e.target.value } : i))} /></td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => updateItem(it)}>Simpan</button>
                  <button onClick={() => deleteItem(it.id)} className="danger">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}