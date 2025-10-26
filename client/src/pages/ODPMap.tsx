import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../api';
import type { ODP, CableRoute } from '../api';

const centerJakarta: [number, number] = [-6.2000, 106.8166];

function FlyTo({ pos }: { pos: [number, number] | null }){
  const map = useMap();
  useEffect(() => { if (pos) map.flyTo(pos, 15, { duration: 0.8 }); }, [pos]);
  return null;
}

const statusColor: Record<string, string> = {
  Online: '#16a34a',
  LOS: '#ef4444',
  'Dying Gasp': '#f59e0b',
  Offline: '#64748b',
};

function makeDivIcon(color: string){
  return L.divIcon({
    html: `<span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:${color};box-shadow:0 0 0 2px #fff"></span>`,
    className: 'odp-dot',
    iconSize: [16,16],
    iconAnchor: [8,8],
  });
}

export default function ODPMap(){
  const [odps, setOdps] = useState<ODP[]>([]);
  const [routes, setRoutes] = useState<CableRoute[]>([]);
  const [focus, setFocus] = useState<[number, number] | null>(null);
  const [showBackbone, setShowBackbone] = useState(true);
  const [showDistribution, setShowDistribution] = useState(true);
  const [showDrop, setShowDrop] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    api.get('/odps').then(r => setOdps(r.data));
    api.get('/cables').then(r => setRoutes(r.data));
  }, []);

  const filtered = useMemo(() => odps.filter(o => (q ? (o.name.toLowerCase().includes(q.toLowerCase()) || (o.address||'').toLowerCase().includes(q.toLowerCase())) : true)), [odps, q]);

  const backbone = routes.filter(r => r.type === 'backbone' && showBackbone);
  const distribution = routes.filter(r => r.type === 'distribution' && showDistribution);
  const drop = routes.filter(r => r.type === 'drop' && showDrop);

  return (
    <div>
      <h2>ODP Management Map</h2>
      <div className="card" style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span style={{display:'inline-flex',alignItems:'center',gap:6}}><span style={{width:10,height:10,background:'#16a34a',borderRadius:999}}></span>Online</span>
          <span style={{display:'inline-flex',alignItems:'center',gap:6}}><span style={{width:10,height:10,background:'#f59e0b',borderRadius:999}}></span>Dying Gasp</span>
          <span style={{display:'inline-flex',alignItems:'center',gap:6}}><span style={{width:10,height:10,background:'#ef4444',borderRadius:999}}></span>LOS</span>
          <span style={{display:'inline-flex',alignItems:'center',gap:6}}><span style={{width:10,height:10,background:'#64748b',borderRadius:999}}></span>Offline</span>
        </div>
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          <label><input type="checkbox" checked={showBackbone} onChange={e=>setShowBackbone(e.target.checked)} /> Backbone</label>
          <label><input type="checkbox" checked={showDistribution} onChange={e=>setShowDistribution(e.target.checked)} /> Distribution</label>
          <label><input type="checkbox" checked={showDrop} onChange={e=>setShowDrop(e.target.checked)} /> Drop</label>
        </div>
        <input className="input" placeholder="Cari ODP atau alamat..." value={q} onChange={e=>setQ(e.target.value)} style={{minWidth:250}} />
      </div>

      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div style={{height: '60vh'}}>
          <MapContainer center={centerJakarta} zoom={12} style={{height:'100%',width:'100%'}}>
            <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <FlyTo pos={focus} />

            {filtered.map(o => (
              <Marker key={o.id} position={[o.lat,o.lng]} icon={makeDivIcon(statusColor[o.status||'Offline']||'#64748b')} eventHandlers={{ click: () => setFocus([o.lat,o.lng]) }}>
                <Popup>
                  <div style={{minWidth:200}}>
                    <div style={{fontWeight:700}}>{o.name}</div>
                    <div style={{color:'#64748b'}}>{o.address}</div>
                    <div style={{marginTop:6,display:'flex',gap:6}}>
                      <span className="badge" style={{background: statusColor[o.status||'Offline']||'#64748b', color:'#fff'}}>{o.status||'Unknown'}</span>
                      <span className="badge" style={{background:'#0ea5e9', color:'#fff'}}>{o.used||0}/{o.capacity||0} used</span>
                    </div>
                    <button className="btn" style={{marginTop:8}} onClick={()=>setFocus([o.lat,o.lng])}>Center</button>
                  </div>
                </Popup>
              </Marker>
            ))}

            {backbone.map(r => (
              <Polyline key={`bb-${r.id}`} positions={r.coords} pathOptions={{ color:'#0ea5e9', weight:6 }} />
            ))}
            {distribution.map(r => (
              <Polyline key={`ds-${r.id}`} positions={r.coords} pathOptions={{ color:'#22c55e', weight:4, dashArray:'8 4' }} />
            ))}
            {drop.map(r => (
              <Polyline key={`dr-${r.id}`} positions={r.coords} pathOptions={{ color:'#f43f5e', weight:3, dashArray:'2 8' }} />
            ))}
          </MapContainer>
        </div>
      </div>

      <div className="card" style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:12}}>
        <div>
          <strong>ODP List</strong>
          <ul style={{listStyle:'none',padding:0,marginTop:8, maxHeight: '30vh', overflow: 'auto'}}>
            {filtered.map(o => (
              <li key={`list-${o.id}`} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #e5e7eb'}}>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <span style={{width:10,height:10,borderRadius:999,background: statusColor[o.status||'Offline']||'#64748b'}} />
                  <div>
                    <div style={{fontWeight:600}}>{o.name}</div>
                    <div style={{fontSize:12,color:'#64748b'}}>{o.address}</div>
                  </div>
                </div>
                <button className="btn secondary" onClick={()=>setFocus([o.lat,o.lng])}>View</button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <strong>Legend & Tips</strong>
          <div style={{marginTop:8,color:'#64748b'}}>
            Gunakan checkbox untuk menyalakan/mematikan layer kabel. Klik marker ODP untuk melihat detail dan memusatkan peta.
          </div>
        </div>
      </div>
    </div>
  );
}