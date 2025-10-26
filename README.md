# PowerOLT - FTTH Management System

PowerOLT adalah sistem manajemen FTTH (Fiber to the Home) yang komprehensif untuk mengelola OLT, ONU, ODP, dan infrastruktur jaringan fiber optik.

## Fitur Utama

### 🏢 Manajemen OLT
- Daftar dan monitoring OLT
- Konfigurasi IP OLT
- Manajemen VLAN
- Speed Profiles
- ONU Types

### 📡 Manajemen ONU
- Registrasi ONU baru
- Daftar semua ONU
- Filter berdasarkan OLT, status, dan tipe
- Monitoring status real-time

### 🗺️ Network Mapping
- Peta interaktif ODP dan Cable Routes
- Visualisasi topologi jaringan
- Informasi lokasi dan kapasitas

### 🧩 Manajemen ODP
- CRUD operations untuk ODP
- Filter berdasarkan OLT dan status
- Statistik kapasitas dan utilisasi
- Integrasi dengan peta untuk koordinat

### 🧵 Manajemen Cable Routes
- CRUD operations untuk rute kabel
- Kalkulasi panjang kabel otomatis
- Filter berdasarkan tipe kabel
- Manajemen endpoint (ODP ke ODP)

## Teknologi

### Frontend
- **React 18** dengan TypeScript
- **Vite** untuk build tool
- **React Router** untuk routing
- **Leaflet** untuk peta interaktif
- **Socket.IO** untuk real-time updates

### Backend
- **Node.js** dengan Express
- **SQLite** database
- **Socket.IO** untuk real-time communication
- RESTful API architecture

## Instalasi

### Prerequisites
- Node.js 18+ 
- npm atau yarn

### Development Setup

1. Clone repository:
```bash
git clone https://github.com/erlangh/PowerOLT.git
cd PowerOLT
```

2. Install dependencies:
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Start development servers:
```bash
# Terminal 1: Start backend server
cd server
npm run dev

# Terminal 2: Start frontend development server
cd client
npm run dev
```

4. Akses aplikasi di `http://localhost:5173`

## Deployment ke VPS Ubuntu 22

Gunakan script auto-install yang disediakan:

```bash
# Download dan jalankan script install (tanpa SSL)
curl -fsSL https://raw.githubusercontent.com/erlangh/PowerOLT/main/install-ubuntu.sh | bash

# Opsi: jalankan dengan domain + email untuk SSL otomatis
DOMAIN=example.com EMAIL=admin@example.com \
curl -fsSL https://raw.githubusercontent.com/erlangh/PowerOLT/main/install-ubuntu.sh | bash
```

- Script akan:
  - Install Node.js 18, PM2, Nginx, UFW
  - Clone repo, install dependencies, build frontend
  - Konfigurasi Nginx (proxy `/api` dan `/socket.io` ke backend)
  - Menyiapkan PM2 dan systemd agar API auto-start
  - Opsi SSL otomatis jika `DOMAIN` dan `EMAIL` diberikan

### Update di VPS dengan update.sh

Setelah instalasi awal, gunakan `update.sh` untuk pembaruan aman:

```bash
cd ~/PowerOLT
bash update.sh
```

Apa yang dilakukan:
- Backup SQLite `server/powerolt.db` ke folder `backups/`
- `git pull` terbaru dari `main`
- Update dependencies backend (`server`) dan rebuild frontend (`client`)
- Reload PM2 (`ecosystem.config.js`) dan reload Nginx

Jika perlu rollback, Anda bisa restore file backup DB dari `backups/`.

Konfigurasi environment (frontend):
- Production: `.env.production` otomatis dibuat oleh script dengan:
  - `VITE_API_URL=/api`
  - `VITE_SOCKET_URL=` (kosong, gunakan origin saat ini)
- Development: tambahkan `.env` jika diperlukan, contoh:
  - `VITE_API_URL=http://localhost:4000/api`
  - `VITE_SOCKET_URL=http://localhost:4000`

Atau manual:

1. Update sistem:
```bash
sudo apt update && sudo apt upgrade -y
```

2. Install Node.js 18:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. Install PM2:
```bash
sudo npm install -g pm2
```

4. Clone dan setup:
```bash
git clone https://github.com/erlangh/PowerOLT.git
cd PowerOLT
```

5. Install dependencies dan build:
```bash
cd server && npm install
cd ../client && npm install && npm run build
```

6. Start dengan PM2:
```bash
cd ../server
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Struktur Project

```
PowerOLT/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── api.ts         # API client
│   │   └── ...
│   └── ...
├── server/                # Backend Node.js application
│   ├── routes/           # API routes
│   ├── lib/              # Database and utilities
│   └── ...
├── install-ubuntu.sh     # Auto-install script for Ubuntu
└── README.md
```

## API Endpoints

### OLTs
- `GET /api/olts` - List all OLTs
- `POST /api/olts` - Create new OLT
- `PUT /api/olts/:id` - Update OLT
- `DELETE /api/olts/:id` - Delete OLT

### ONUs
- `GET /api/onus` - List ONUs with filters
- `POST /api/onus` - Register new ONU
- `PUT /api/onus/:id` - Update ONU
- `DELETE /api/onus/:id` - Delete ONU

### ODPs
- `GET /api/odps` - List ODPs with filters
- `POST /api/odps` - Create new ODP
- `PUT /api/odps/:id` - Update ODP
- `DELETE /api/odps/:id` - Delete ODP

### Cable Routes
- `GET /api/cables` - List cable routes
- `POST /api/cables` - Create new cable route
- `PUT /api/cables/:id` - Update cable route
- `DELETE /api/cables/:id` - Delete cable route

## Kontribusi

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## Lisensi

Distributed under the MIT License. See `LICENSE` for more information.

## Kontak

Erlang - [@erlangh](https://github.com/erlangh)

Project Link: [https://github.com/erlangh/PowerOLT](https://github.com/erlangh/PowerOLT)