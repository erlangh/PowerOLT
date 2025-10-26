import type { OLT, ONU } from '../api';

type Props = {
  olt: OLT;
  onus: ONU[];
  tempC: number;
};

const iconByType = (type: string) => {
  const t = (type || '').toLowerCase();
  if (t.includes('c300mini')) return '📦';
  if (t.includes('c300')) return '🏢';
  if (t.includes('c320')) return '📡';
  return '🧭';
};

export default function OLTPanel({ olt, onus, tempC }: Props){
  const online = onus.filter(o=>o.status==='Online').length;
  const los = onus.filter(o=>o.status==='LOS').length;
  const dg = onus.filter(o=>o.status==='DyingGasp' || o.status==='Dying Gasp').length;
  const offline = onus.filter(o=>o.status==='Offline' || o.status==='Disabled').length;
  return (
    <div className="card olt-panel">
      <div className="olt-left">
        <div className="stat-icon">{iconByType(olt.type)}</div>
        <div>
          <div style={{fontWeight:700}}>{olt.name} <span className="badge online">Online</span></div>
          <div style={{color:'#64748b'}}>ZTE-{olt.type}</div>
          <div style={{marginTop:8,display:'flex',gap:6,flexWrap:'wrap'}}>
            <span className="badge status-online">{online} Online</span>
            <span className="badge status-dg">{dg} DyingGasp</span>
            <span className="badge status-los">{los} LOS</span>
            <span className="badge status-offline">{offline} Offline</span>
          </div>
        </div>
      </div>
      <div className="olt-right">{tempC}°C</div>
    </div>
  );
}

export function FanRow({ fans }: { fans: number[] }){
  return (
    <div className="fan-row">
      {fans.map((rpm, idx)=> (
        <div key={idx} className="card fan-card">
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span className="stat-icon">🌀</span>
              <div><strong>Fan {idx+1}</strong><div style={{color:'#64748b',fontSize:12}}>Online</div></div>
            </div>
            <span className="badge online">Online</span>
          </div>
          <div style={{marginTop:8,fontSize:22}}>{rpm} RPM</div>
          <div className="progress" style={{marginTop:8}}><span style={{width:'60%'}} /></div>
          <div style={{color:'#94a3b8',fontSize:12,marginTop:6}}>Speed Level Standard (2)</div>
        </div>
      ))}
    </div>
  );
}