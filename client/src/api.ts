import axios from 'axios';

export const api = axios.create({ baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:4000/api') });

export type OLT = { id: number; name: string; type: string; ip?: string; username?: string; password?: string };
export type ONU = {
  id: number; olt_id: number; card: number; port: number; sn: string;
  name: string; description?: string; rx_power: number; status: string; online_since?: number;
  vlan?: number; speed_down?: number; speed_up?: number; wan_mode?: string; pppoe_username?: string;
  pppoe_password?: string; ip_address?: string; lan_status?: string; traffic_up?: number; traffic_down?: number;
  onu_type_id?: number; onu_type_name?: string;
};

// New: ODP and cable route types
export type ODP = {
  id: number; olt_id?: number; name: string; address?: string; lat: number; lng: number;
  capacity?: number; used?: number; status?: string;
};

export type CableRoute = {
  id: number; name: string; type: 'backbone'|'distribution'|'drop'; coords: [number, number][];
  source_type?: string; source_id?: number; target_type?: string; target_id?: number;
};