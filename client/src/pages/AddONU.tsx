import { useEffect, useState } from 'react';
import { api } from '../api';
import type { OLT } from '../api';

export default function AddONU(){
  const [olts, setOlts] = useState<OLT[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ olt_id:'', onu_type_id:'', card:'', port:'', sn:'', name:'', vlan:'', speed_down:'', speed_up:'', wan_mode:'PPPoE', pppoe_username:'', pppoe_password:'' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.get('/olts').then(r => setOlts(r.data)); }, []);
  useEffect(() => { api.get('/onu-types').then(r => setTypes(r.data)); }, []);
  const update = (k: string, v: any) => setForm((f:any) => ({ ...f, [k]: v }));

  const submit = async () => {
    setSaving(true);
    const payload = { ...form, olt_id: Number(form.olt_id)||null, onu_type_id: Number(form.onu_type_id)||null, card:Number(form.card)||null, port:Number(form.port)||null, vlan:Number(form.vlan)||null, speed_down:Number(form.speed_down)||null, speed_up:Number(form.speed_up)||null };
    await api.post('/onus', payload);
    setSaving(false);
    alert('ONU berhasil ditambahkan!');
  };

  return (
    <div>
      <h2>Register ONU</h2>
      <div className="card grid" style={{gridTemplateColumns:'repeat(2,1fr)'}}>
        <label>OLT<select className="select" value={form.olt_id} onChange={(e)=>update('olt_id',e.target.value)}>{olts.map(o=> <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
        <label>Onu Type<select className="select" value={form.onu_type_id} onChange={(e)=>update('onu_type_id',e.target.value)}>
          <option value="">Pilih Type</option>
          {types.map((t:any)=> <option key={t.id} value={t.id}>{t.name}</option>)}
        </select></label>
        <label>Card<input className="input" value={form.card} onChange={e=>update('card',e.target.value)} /></label>
        <label>Port<input className="input" value={form.port} onChange={e=>update('port',e.target.value)} /></label>
        <label>Serial Number<input className="input" value={form.sn} onChange={e=>update('sn',e.target.value)} /></label>
        <label>Nama / Deskripsi<input className="input" value={form.name} onChange={e=>update('name',e.target.value)} /></label>
        <label>VLAN<input className="input" value={form.vlan} onChange={e=>update('vlan',e.target.value)} /></label>
        <label>Speed Down (kbps)<input className="input" value={form.speed_down} onChange={e=>update('speed_down',e.target.value)} /></label>
        <label>Speed Up (kbps)<input className="input" value={form.speed_up} onChange={e=>update('speed_up',e.target.value)} /></label>
        <label>Mode WAN<select className="select" value={form.wan_mode} onChange={e=>update('wan_mode',e.target.value)}>
          <option>PPPoE</option>
          <option>Bridge</option>
          <option>DHCP</option>
          <option>Static</option>
        </select></label>
        <label>PPPoE Username<input className="input" value={form.pppoe_username} onChange={e=>update('pppoe_username',e.target.value)} /></label>
        <label>PPPoE Password<input className="input" value={form.pppoe_password} onChange={e=>update('pppoe_password',e.target.value)} /></label>
      </div>
      <button className="btn" onClick={submit} disabled={saving}>{saving?'Menyimpan...':'Tambahkan ONU'}</button>
    </div>
  );
}