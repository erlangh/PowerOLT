import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import OLTs from './pages/OLTs';
import AddONU from './pages/AddONU';
import AllONUs from './pages/AllONUs';
import ODPMap from './pages/ODPMap';
import IPOLT from './pages/IPOLT';
import VLAN from './pages/VLAN';
import OnuType from './pages/OnuType';
import SpeedProfiles from './pages/SpeedProfiles';
import ODPManagement from './pages/ODPManagement';
import CableRoutes from './pages/CableRoutes';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/olts" element={<OLTs />} />
          <Route path="/add-onu" element={<AddONU />} />
          <Route path="/all-onus" element={<AllONUs />} />
          <Route path="/odp-map" element={<ODPMap />} />
          <Route path="/ip-olt" element={<IPOLT />} />
          <Route path="/vlan" element={<VLAN />} />
          <Route path="/onu-type" element={<OnuType />} />
          <Route path="/speed-profiles" element={<SpeedProfiles />} />
          <Route path="/odp-management" element={<ODPManagement />} />
          <Route path="/cable-routes" element={<CableRoutes />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
