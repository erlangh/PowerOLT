import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import type { OLT, ONU } from '../api';
import { socket } from '../socket';

export default function AllONUs(){
  const [olts, setOlts] = useState<OLT[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [rows, setRows] = useState<ONU[]>([]);
  const [filters, setFilters] = useState<any>({ olt_id:'', card:'', port:'', onu_type_id:'', status:'', rx_min:'', rx_max:'' });

  useEffect(() => { api.get('/olts').then(r => setOlts(r.data)); }, []);
  useEffect(() => { api.get('/onu-types').then(r => setTypes(r.data)); }, []);
  useEffect(() => { load(); }, [filters]);

  const load = async () => {
    const params:any = {}; Object.entries(filters).forEach(([k,v]) => { if (v !== '') params[k] = v; });
    const r = await api.get('/onus', { params }); setRows(r.data.rows);
  };

  useEffect(() => {
    const handler = (u: Partial<ONU> & {id:number}) => {
      setRows(prev => prev.map(p => p.id === u.id ? { ...p, ...u } : p));
    };
    socket.on('onu_update', handler);
    return () => { socket.off('onu_update', handler); };
  }, []);

  const exportCsv = () => { window.location.href = 'http://localhost:4000/api/export/onus.csv'; };

  const stats = useMemo(() => ({
    total: rows.length,
    online: rows.filter(r => r.status==='Online').length,
    los: rows.filter(r => r.status==='LOS').length,
    dg: rows.filter(r => r.status==='Dying Gasp').length,
  }), [rows]);

  const update = (k:string,v:any) => setFilters((f:any) => ({...f,[k]:v}));

  return (
    <div>
      <h2>All ONUs</h2>
      <div className="card filters">
        <label>OLT<select className="select" value={filters.olt_id} onChange={e=>update('olt_id',e.target.value)}>
          <option value="">Semua</option>
          {olts.map(o=> <option key={o.id} value={o.id}>{o.name}</option>)}
        </select></label>
        <label>Onu Type<select className="select" value={filters.onu_type_id} onChange={e=>update('onu_type_id',e.target.value)}>
          <option value="">Semua</option>
          {types.map((t:any)=> <option key={t.id} value={t.id}>{t.name}</option>)}
        </select></label>
        <label>Card<input className="input" value={filters.card} onChange={e=>update('card',e.target.value)} /></label>
        <label>Port<input className="input" value={filters.port} onChange={e=>update('port',e.target.value)} /></label>
        <label>Status<select className="select" value={filters.status} onChange={e=>update('status',e.target.value)}>
          <option value="">Semua</option>
          <option>Online</option>
          <option>LOS</option>
          <option>Dying Gasp</option>
          <option>Offline</option>
        </select></label>
        <label>RX Min<input className="input" value={filters.rx_min} onChange={e=>update('rx_min',e.target.value)} /></label>
        <label>RX Max<input className="input" value={filters.rx_max} onChange={e=>update('rx_max',e.target.value)} /></label>
        <button className="btn secondary" onClick={exportCsv}>Export Excel (CSV)</button>
      </div>

      <div className="card">
        <div style={{marginBottom:8}}>Total: {stats.total} | Online: {stats.online} | LOS: {stats.los} | Dying Gasp: {stats.dg}</div>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th><th>OLT</th><th>Card</th><th>Port</th><th>SN</th>
              <th>Name</th><th>Status</th><th>RX Power</th><th>VLAN</th><th>Speed</th><th>WAN</th><th>PPPoE</th><th>IP</th><th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(o => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{olts.find(ol=>ol.id===o.olt_id)?.name||o.olt_id}</td>
                <td>{o.card}</td>
                <td>{o.port}</td>
                <td>{o.sn}</td>
                <td>{o.name}</td>
                <td>
                  {(() => {
                    const s = o.status;
                    const cls = s==='Online' ? 'status-online' : s==='LOS' ? 'status-los' : s==='Dying Gasp' ? 'status-dg' : 'status-offline';
                    return <span className={`badge ${cls}`}>{s}</span>;
                  })()}
                </td>
                <td>{o.rx_power?.toFixed(2)} dBm</td>
                <td>{o.vlan}</td>
                <td>{o.speed_down||0}↓/{o.speed_up||0}↑</td>
                <td>{o.wan_mode}</td>
                <td>{o.pppoe_username||'-'}</td>
                <td>{o.ip_address||'-'}</td>
                <td>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    <button className="btn secondary" title="Reboot" onClick={async()=>{await api.post(`/onus/${o.id}/action`,{type:'reboot'});}}>🔄 Reboot</button>
                    <button className="btn secondary" title="Disable" onClick={async()=>{await api.post(`/onus/${o.id}/action`,{type:'disable'});}}>⛔ Disable</button>
                    <button className="btn secondary" title="Clear Config" onClick={async()=>{await api.post(`/onus/${o.id}/action`,{type:'clear'});}}>🧹 Clear Config</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}