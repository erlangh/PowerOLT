import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { api } from '../api';
import type { ODP, OLT } from '../api';

function ClickSetter({ onSet }: { onSet: (lat:number,lng:number)=>void }){
  useMapEvents({ click(e){ onSet(e.latlng.lat, e.latlng.lng); } });
  return null;
}

export default function ODPManagement(){
  const [summary, setSummary] = useState<any>({ total:0, online:0, los:0, dg:0, offline:0 });
  const [odps, setOdps] = useState<ODP[]>([]);
  const [olts, setOlts] = useState<OLT[]>([]);
  const [filters, setFilters] = useState<any>({ olt_id:'', status:'', q:'' });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ODP | null>(null);
  const [form, setForm] = useState<any>({ olt_id:'', name:'', address:'', lat:-6.2000, lng:106.8166, capacity:8, used:0, status:'Online' });
  const [loading, setLoading] = useState(false);

  const updateForm = (k:string,v:any) => setForm((f:any)=>({...f,[k]:v}));
  const updateFilter = (k:string,v:any) => setFilters((f:any)=>({...f,[k]:v}));

  const load = async () => {
    setLoading(true);
    const params:any = {}; Object.entries(filters).forEach(([k,v])=>{ if(v!=='') params[k]=v; });
    const [sum, list, oltsRes] = await Promise.all([
      api.get('/odps/summary'),
      api.get('/odps', { params }),
      api.get('/olts'),
    ]);
    setSummary(sum.data); setOdps(list.data); setOlts(oltsRes.data);
    setLoading(false);
  };

  useEffect(()=>{ load(); }, [filters]);

  const openNew = () => { setEditing(null); setForm({ olt_id:'', name:'', address:'', lat:-6.2000, lng:106.8166, capacity:8, used:0, status:'Online' }); setShowModal(true); };
  const openEdit = (o:ODP) => { setEditing(o); setForm({ ...o, olt_id: (o as any).olt_id||'' }); setShowModal(true); };

  const save = async () => {
    const payload = {
      ...form,
      olt_id: form.olt_id ? Number(form.olt_id) : null,
      lat: Number(form.lat), lng: Number(form.lng),
      capacity: form.capacity ? Number(form.capacity) : null,
      used: form.used ? Number(form.used) : 0,
    };
    if (editing) {
      await api.put(`/odps/${editing.id}`, payload);
    } else {
      await api.post('/odps', payload);
    }
    setShowModal(false); await load();
  };

  const remove = async (id:number) => { if (!confirm('Hapus ODP ini?')) return; await api.delete(`/odps/${id}`); await load(); };

  const cards = useMemo(()=>[
    { label:'Total ODP', value: summary.total, color:'#2563eb'},
    { label:'Active ODP', value: summary.online, color:'#16a34a'},
    { label:'Maintenance', value: summary.dg, color:'#f59e0b'},
    { label:'Used Ports', value: (odps.reduce((a,b)=> a + ((b as any).used||0), 0)), color:'#06b6d4'}
  ], [summary, odps]);

  return (
    <div>
      <h2>ODP Management</h2>
      <div className="card" style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'center'}}>
        {cards.map((c,i)=> (
          <div key={i} className="stat-card" style={{background:c.color, color:'#fff', padding:'12px 16px', borderRadius:8, minWidth:180}}>
            <div style={{fontSize:12, opacity:0.9}}>{c.label}</div>
            <div style={{fontSize:24, fontWeight:700}}>{c.value}</div>
          </div>
        ))}
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          <label>Filter OLT<select className="select" value={filters.olt_id} onChange={e=>updateFilter('olt_id',e.target.value)}>
            <option value="">All OLT</option>
            {olts.map(o=> <option key={o.id} value={o.id}>{o.name}</option>)}
          </select></label>
          <label>Status<select className="select" value={filters.status} onChange={e=>updateFilter('status',e.target.value)}>
            <option value="">All Status</option>
            <option>Online</option>
            <option>LOS</option>
            <option>Dying Gasp</option>
            <option>Offline</option>
          </select></label>
          <input className="input" placeholder="Search name or address" value={filters.q} onChange={e=>updateFilter('q',e.target.value)} />
          <button className="btn" onClick={openNew}>+ Tambah ODP</button>
        </div>
      </div>

      <div className="card" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
        {loading && <div>Loading...</div>}
        {!loading && odps.map(o => (
          <div key={o.id} className="odp-card" style={{border:'1px solid #e5e7eb', borderRadius:8, padding:12}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontWeight:700}}>{o.name}</div>
              <span className="badge" style={{background:'#eee'}}>{(o as any).status||'Unknown'}</span>
            </div>
            <div style={{fontSize:12,color:'#64748b'}}>{(o as any).address}</div>
            <div style={{marginTop:8,display:'flex',gap:8}}>
              <span className="badge">{(o as any).used||0}/{(o as any).capacity||0} used</span>
            </div>
            <div style={{marginTop:12, display:'flex', gap:8}}>
              <button className="btn secondary" onClick={()=>openEdit(o as any)}>Edit</button>
-              <button className="btn secondary" onClick={()=>alert(`ODP ${o.name} @ (${(o as any).lat}, ${(o as any).lng})`)}>Details</button>
+              <button className="btn secondary" onClick={()=>alert('ODP ' + o.name + ' @ (' + (o as any).lat + ', ' + (o as any).lng + ')')}>Details</button>
               <button className="btn danger" onClick={()=>remove(o.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content" style={{maxWidth:800}}>
            <div className="modal-header">
              <div style={{fontWeight:700}}>{editing?'Edit ODP':'Tambah ODP'}</div>
              <button className="btn secondary" onClick={()=>setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div>
                <label>Nama ODP<input className="input" value={form.name} onChange={e=>updateForm('name',e.target.value)} /></label>
                <label>OLT<select className="select" value={form.olt_id} onChange={e=>updateForm('olt_id',e.target.value)}>
                  <option value="">Pilih OLT</option>
                  {olts.map(o=> <option key={o.id} value={o.id}>{o.name}</option>)}
                </select></label>
                <label>Alamat<input className="input" value={form.address} onChange={e=>updateForm('address',e.target.value)} /></label>
                <label>Kapasitas<input className="input" type="number" value={form.capacity} onChange={e=>updateForm('capacity',e.target.value)} /></label>
                <label>Terpakai<input className="input" type="number" value={form.used} onChange={e=>updateForm('used',e.target.value)} /></label>
                <label>Status<select className="select" value={form.status} onChange={e=>updateForm('status',e.target.value)}>
                  <option>Online</option>
                  <option>LOS</option>
                  <option>Dying Gasp</option>
                  <option>Offline</option>
                </select></label>
              </div>
              <div>
                <label>Koordinat<input className="input" value={`${form.lat}, ${form.lng}`} onChange={e=>{
                  const [latS,lngS] = e.target.value.split(',').map(s=>s.trim());
                  updateForm('lat', parseFloat(latS)); updateForm('lng', parseFloat(lngS));
                }} /></label>
                <div style={{height:240, border:'1px solid #e5e7eb', borderRadius:8, overflow:'hidden'}}>
                  <MapContainer center={[form.lat, form.lng]} zoom={15} style={{height:'100%',width:'100%'}}>
                    <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[form.lat, form.lng]} />
                    <ClickSetter onSet={(lat,lng)=>{ updateForm('lat',lat); updateForm('lng',lng); }} />
                  </MapContainer>
                </div>
                <div style={{marginTop:12}}>
                  <small>Klik peta untuk set koordinat ODP.</small>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={save}>{editing?'Simpan':'Tambah ODP'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}