import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import type { CableRoute, ODP } from '../api';

function haversineKm(a:[number,number], b:[number,number]){
  const R=6371; const dLat=(b[0]-a[0])*Math.PI/180; const dLon=(b[1]-a[1])*Math.PI/180;
  const la1=a[0]*Math.PI/180, la2=b[0]*Math.PI/180;
  const h = Math.sin(dLat/2)**2 + Math.sin(dLon/2)**2 * Math.cos(la1)*Math.cos(la2);
  return 2*R*Math.asin(Math.sqrt(h));
}

function computeLength(coords:[number,number][]) {
  if (!coords || coords.length < 2) return 0;
  let km = 0; for(let i=1;i<coords.length;i++){ km += haversineKm(coords[i-1], coords[i]); }
  return km;
}

export default function CableRoutes(){
  const [routes, setRoutes] = useState<CableRoute[]>([]);
  const [odps, setOdps] = useState<ODP[]>([]);
  const [filters, setFilters] = useState<any>({ type:'', q:'' });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CableRoute | null>(null);
  const [form, setForm] = useState<any>({ name:'', type:'distribution', coordsText:'', source_type:'', source_id:'', target_type:'', target_id:'' });

  useEffect(()=>{ load(); }, [filters]);
  useEffect(()=>{ api.get('/odps').then(r=>setOdps(r.data)); }, []);

  const load = async () => {
    const params:any = {}; if (filters.type) params.type = filters.type;
    const res = await api.get('/cables', { params });
    setRoutes(res.data);
  };

  const openNew = () => { setEditing(null); setForm({ name:'', type:'distribution', coordsText:'', source_type:'', source_id:'', target_type:'', target_id:'' }); setShowModal(true); };
  const openEdit = (r:CableRoute) => {
    setEditing(r);
    setForm({ name:r.name, type:r.type, coordsText: (r.coords||[]).map(c=>`${c[0]},${c[1]}`).join('\n'), source_type:r.source_type||'', source_id:r.source_id||'', target_type:r.target_type||'', target_id:r.target_id||'' });
    setShowModal(true);
  };
  const parseCoords = (txt:string):[number,number][] => txt.split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{ const [a,b]=l.split(',').map(s=>parseFloat(s.trim())); return [a,b]; });

  const save = async () => {
    const payload:any = {
      name: form.name,
      type: form.type,
      coords: parseCoords(form.coordsText),
      source_type: form.source_type || null,
      source_id: form.source_id ? Number(form.source_id) : null,
      target_type: form.target_type || null,
      target_id: form.target_id ? Number(form.target_id) : null,
    };
    if (!payload.name || !payload.type || !payload.coords || payload.coords.length < 2) {
      alert('Nama, tipe, dan minimal 2 koordinat wajib diisi'); return;
    }
    if (editing) {
      await api.put(`/cables/${editing.id}`, payload);
    } else {
      await api.post('/cables', payload);
    }
    setShowModal(false); await load();
  };
  const remove = async (id:number) => { if (!confirm('Hapus kabel ini?')) return; await api.delete(`/cables/${id}`); await load(); };

  const summary = useMemo(()=>{
    const total = routes.length;
    const connected = routes.filter(r => !!r.source_id && !!r.target_id).length;
    const disconnected = total - connected;
    const totalKm = routes.reduce((a,b)=> a + computeLength(b.coords||[]), 0);
    return { total, connected, disconnected, totalKm: Number(totalKm.toFixed(2)) };
  }, [routes]);

  return (
    <div>
      <h2>Cable Route Management</h2>
      <div className="card" style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
        <div className="stat-card" style={{background:'#2563eb', color:'#fff', padding:'12px 16px', borderRadius:8}}>
          <div style={{fontSize:12}}>Total Cables</div><div style={{fontSize:20,fontWeight:700}}>{summary.total}</div>
        </div>
        <div className="stat-card" style={{background:'#16a34a', color:'#fff', padding:'12px 16px', borderRadius:8}}>
          <div style={{fontSize:12}}>Connected</div><div style={{fontSize:20,fontWeight:700}}>{summary.connected}</div>
        </div>
        <div className="stat-card" style={{background:'#ef4444', color:'#fff', padding:'12px 16px', borderRadius:8}}>
          <div style={{fontSize:12}}>Disconnected</div><div style={{fontSize:20,fontWeight:700}}>{summary.disconnected}</div>
        </div>
        <div className="stat-card" style={{background:'#06b6d4', color:'#fff', padding:'12px 16px', borderRadius:8}}>
          <div style={{fontSize:12}}>Total Length</div><div style={{fontSize:20,fontWeight:700}}>{summary.totalKm} km</div>
        </div>
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          <label>Tipe<select className="select" value={filters.type} onChange={e=>setFilters((f:any)=>({...f,type:e.target.value}))}>
            <option value="">All Types</option>
            <option value="backbone">Backbone</option>
            <option value="distribution">Distribution</option>
            <option value="drop">Drop</option>
          </select></label>
          <input className="input" placeholder="Cari nama..." value={filters.q} onChange={e=>setFilters((f:any)=>({...f,q:e.target.value}))} />
          <button className="btn" onClick={openNew}>+ Tambah Cable Route</button>
        </div>
      </div>

      <div className="card" style={{overflow:'auto'}}>
        <table className="table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Tipe</th>
              <th>Panjang</th>
              <th>Endpoints</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {routes.filter(r=> filters.q ? r.name.toLowerCase().includes(filters.q.toLowerCase()) : true).map(r=> (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td><span className="badge">{r.type}</span></td>
                <td>{computeLength(r.coords||[]).toFixed(2)} km</td>
                <td>{r.source_type||'-'}:{r.source_id||'-'} → {r.target_type||'-'}:{r.target_id||'-'}</td>
                <td>
                  <button className="btn secondary" onClick={()=>openEdit(r)}>Edit</button>
                  <button className="btn danger" onClick={()=>remove(r.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content" style={{maxWidth:900}}>
            <div className="modal-header">
              <div style={{fontWeight:700}}>{editing?'Edit Cable Route':'Tambah Cable Route'}</div>
              <button className="btn secondary" onClick={()=>setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div>
                <label>Nama<input className="input" value={form.name} onChange={e=>setForm((f:any)=>({...f,name:e.target.value}))} /></label>
                <label>Tipe<select className="select" value={form.type} onChange={e=>setForm((f:any)=>({...f,type:e.target.value}))}>
                  <option value="backbone">Backbone</option>
                  <option value="distribution">Distribution</option>
                  <option value="drop">Drop</option>
                </select></label>
                <label>Source Type<select className="select" value={form.source_type} onChange={e=>setForm((f:any)=>({...f,source_type:e.target.value, source_id:''}))}>
                  <option value="">(none)</option>
                  <option value="OLT">OLT</option>
                  <option value="ODP">ODP</option>
                  <option value="ONU">ONU</option>
                </select></label>
                {form.source_type === 'ODP' ? (
                  <label>Source ODP<select className="select" value={form.source_id} onChange={e=>setForm((f:any)=>({...f,source_id:e.target.value}))}>
                    <option value="">Pilih ODP</option>
                    {odps.map(o=> <option key={`s${o.id}`} value={o.id}>{o.name}</option>)}
                  </select></label>
                ) : (
                  <label>Source ID<input className="input" type="number" value={form.source_id} onChange={e=>setForm((f:any)=>({...f,source_id:e.target.value}))} /></label>
                )}
                <label>Target Type<select className="select" value={form.target_type} onChange={e=>setForm((f:any)=>({...f,target_type:e.target.value, target_id:''}))}>
                  <option value="">(none)</option>
                  <option value="ODP">ODP</option>
                  <option value="ONU">ONU</option>
                </select></label>
                {form.target_type === 'ODP' ? (
                  <label>Target ODP<select className="select" value={form.target_id} onChange={e=>setForm((f:any)=>({...f,target_id:e.target.value}))}>
                    <option value="">Pilih ODP</option>
                    {odps.map(o=> <option key={`t${o.id}`} value={o.id}>{o.name}</option>)}
                  </select></label>
                ) : (
                  <label>Target ID<input className="input" type="number" value={form.target_id} onChange={e=>setForm((f:any)=>({...f,target_id:e.target.value}))} /></label>
                )}
              </div>
              <div>
                <label>Koordinat (tiap baris: lat,lng)
                  <textarea className="input" rows={12} value={form.coordsText} onChange={e=>setForm((f:any)=>({...f,coordsText:e.target.value}))} />
                </label>
                <div style={{marginTop:8, color:'#64748b'}}>
                  Contoh:
                  <pre style={{background:'#f1f5f9',padding:8,borderRadius:6}}>{`-6.2000,106.8166\n-6.2050,106.8300\n-6.2100,106.8400`}</pre>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={save}>{editing?'Simpan':'Tambah'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}