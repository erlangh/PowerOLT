import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import type { ONU, OLT } from '../api';
import { socket } from '../socket';
import StatCard from '../components/StatCard';
import OLTPanel, { FanRow } from '../components/OLTPanel';

export default function Dashboard(){
  const [data, setData] = useState<ONU[]>([]);
  const [olts, setOlts] = useState<OLT[]>([]);
  const [fanRpms, setFanRpms] = useState<Record<number, number[]>>({});

  useEffect(() => {
    api.get('/onus').then(r => setData(r.data.rows));
    api.get('/olts').then(r => {
      setOlts(r.data);
      // seed fans per OLT: two fans each
      const init: Record<number, number[]> = {};
      r.data.forEach((o:OLT) => { init[o.id] = [2688 + Math.floor(Math.random()*60), 2694 + Math.floor(Math.random()*60)]; });
      setFanRpms(init);
    });
    const tid = setInterval(() => setFanRpms(prev => Object.fromEntries(Object.entries(prev).map(([k,v])=>[Number(k), v.map(x=>x + Math.floor(Math.random()*20-10))]))), 2000);
    socket.on('onu_update', (u: Partial<ONU> & {id:number}) => {
      setData(prev => prev.map(p => p.id === u.id ? { ...p, ...u } : p));
    });
    return () => { clearInterval(tid); socket.off('onu_update'); };
  }, []);

  const counters = useMemo(() => {
    const online = data.filter(d => d.status === 'Online').length;
    const los = data.filter(d => d.status === 'LOS').length;
    const dg = data.filter(d => d.status === 'Dying Gasp' || d.status === 'DyingGasp').length;
    const offline = data.filter(d => d.status === 'Offline' || d.status === 'Disabled').length;
    return { online, los, dg, offline };
  }, [data]);

  return (
    <div>
      <h2 style={{marginBottom:12}}>Dashboard</h2>
      <div className="stats">
        <StatCard icon="📡" title="OLTs" value={olts.length} sub={`${data.length} ONUs`} />
        <StatCard icon="✅" title="Online" value={counters.online} sub={`${((counters.online/(data.length||1))*100).toFixed(2)}%`} />
        <StatCard icon="✋" title="DyingGasp" value={counters.dg} sub={`${((counters.dg/(data.length||1))*100).toFixed(2)}%`} />
        <StatCard icon="⚠️" title="LOS" value={counters.los} sub={`${((counters.los/(data.length||1))*100).toFixed(2)}%`} />
        <StatCard icon="⛔" title="Offline" value={counters.offline} sub={`${((counters.offline/(data.length||1))*100).toFixed(2)}%`} />
      </div>

      {olts.map(olt => {
        const byOlt = data.filter(d => d.olt_id === olt.id);
        const temp = 36 + Math.floor(Math.random()*6); // mock temp per render
        return (
          <div key={olt.id}>
            <OLTPanel olt={olt} onus={byOlt} tempC={temp} />
            <FanRow fans={fanRpms[olt.id]||[2688,2694]} />
          </div>
        );
      })}

      <div className="card">
        <strong>Quick View</strong>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th><th>Name</th><th>SN</th><th>Status</th><th>RX Power</th><th>Traffic</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0,10).map(o => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{o.name}</td>
                <td>{o.sn}</td>
                <td>
                  <span className={`badge ${o.status==='Online'?'online':o.status==='LOS'?'los':o.status==='Dying Gasp'?'dg':''}`}>{o.status}</span>
                </td>
                <td>{o.rx_power?.toFixed(2)} dBm</td>
                <td>{(o.traffic_down||0).toFixed(2)}↓ / {(o.traffic_up||0).toFixed(2)}↑ Mbps</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}