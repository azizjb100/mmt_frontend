<template>
  <div class="dashboard-layout-top font-body">
    <nav class="top-navbar shadow-sm">
      <div class="navbar-brand">
        <span class="brand-icon mdi mdi-speedometer"></span>
        <span class="font-heading">MyApp</span>
      </div>

      <ul class="navbar-menu">
        <li v-for="group in menuGroups" :key="group.name" class="dropdown">
          <a class="dropdown-toggle">{{ group.name }}</a>

          <ul class="dropdown-menu shadow-md rounded-soft">
            <template v-for="item in group.items" :key="item.name">
  <li v-if="item.isSubGroup" class="sub-dropdown" :class="{ 'item-disabled': item.isDisabled }">
    <router-link v-if="!item.isDisabled" :to="item.path" class="sub-dropdown-toggle">
      {{ item.name }} <span class="icon-arrow">&raquo;</span>
    </router-link>
    
    <span v-else class="sub-dropdown-toggle">
      {{ item.name }} <span class="mdi mdi-lock-outline"></span>
    </span>

    <ul v-if="!item.isDisabled" class="dropdown-menu sub-menu shadow-md rounded-soft">
      <li v-for="subItem in item.items" :key="subItem.name">
        <router-link :to="subItem.path">{{ subItem.name }}</router-link>
      </li>
    </ul>
  </li>

  <li v-else :class="{ 'item-disabled': item.isDisabled }">
    <router-link v-if="!item.isDisabled" :to="item.path">{{ item.name }}</router-link>
    <span v-else class="disabled-link">
        {{ item.name }} <span class="mdi mdi-lock-outline"></span>
    </span>
  </li>
</template>
          </ul>
        </li>
      </ul>

      <div class="navbar-user">
        <span class="user-welcome">
          Selamat datang,
          <b class="font-semibold">{{ currentUser?.nmUser || "UserAdmin" }}</b>
        </span>
        <button @click="handleLogout" class="logout-button rounded-soft transition-smooth hover-lift">
          Logout
        </button>
      </div>
    </nav>

    <div class="main-content-top">
      <main class="content-area">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue"; // Tambahkan computed
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const authStore = useAuthStore();
const currentUser = authStore.user; // Mengambil data user dari store

const router = useRouter();

const rolePermissions = {
  1: [ // DIVISI 1: Produksi & Laporan Tertentu
    "Permintaan Bahan", 
    "Penerimaan Bahan", 
    "Permintaan Produksi", 
    "LHK", 
    "LHK Cetak", 
    "LHK Kain",
    "Laporan", 
    "Produksi MMT", 
    "LS Bahan Utama", 
    "LS Bahan Penolong", 
    "Lap. Mon LMKP MMT"
  ],
  2: [ // DIVISI 2: Contoh Sales
    "File",
    "Ganti Password",
    "Customer",
    "Sales",
    "Laporan",
    "Penjualan"
  ]
};

const handleLogout = () => {
  authStore.logout();
  router.push("/login");
};

// Data Master Menu (Semua Menu Didefinisikan di sini)
const allMenuGroups = [
  {
    name: "File",
    items: [
      { name: "User", path: "/file/user" },
      { name: "Identitas Perusahaan", path: "/file/perusahaan" },
      { name: "Ganti Password", path: "/file/ganti-password" },
    ],
  },
  {
    name: "Daftar",
    items: [
      { name: "Supplier", path: "/daftar/supplier" },
      { name: "Kode Bayar", path: "/daftar/kode-bayar" },
      { name: "Jenis Barang", path: "/daftar/jenis-barang" },
      { name: "Gudang", path: "/daftar/gudang" },
      { name: "Jasa", path: "/daftar/jasa" },
      { name: "Gudang Produksi", path: "/daftar/gudang-produksi" },
      { name: "Komponen SPK", path: "/daftar/komponen-spk" },
      { name: "Customer", path: "/daftar/customer" },
      { name: "Tanda Terima", path: "/daftar/tanda-terima" },
      { name: "Jenis Order", path: "/daftar/jenis-order" },
      { name: "Sales", path: "/daftar/sales" },
      { name: "Barang", path: "/daftar/barang" },
      { name: "Jenis Potongan", path: "/daftar/jenis-potongan" },
    ],
  },
  {
    name: "Transaksi",
    items: [
      {
        name: "Daftar",
        isSubGroup: true,
        path: "/mmt/daftar",
        items: [
          { name: "Master Bahan", path: "/mmt/daftar/bahan" },
          { name: "Mesin Produksi", path: "/mmt/daftar/mesin-produksi" },
          { name: "Operator", path: "/mmt/daftar/operator" },
          { name: "Bahan Sisa", path: "/mmt/daftar/bahan-sisa" },
        ],
      },
      { name: "Permintaan Bahan", path: "/mmt/permintaan-bahan" },
      { name: "PO Bahan MMT", path: "/mmt/po-bahan-mmt" },
      { name: "Penerimaan Bahan", path: "/mmt/penerimaan-bahan" },
      { name: "Retur Beli", path: "/mmt/retur-beli" },
      { name: "Koreksi Stok", path: "/mmt/koreksi-stok" },
      { name: "Permintaan Produksi", path: "/mmt/permintaan-produksi" },
      { name: "BS & Sisa Digital Print", path: "/mmt/bs-digital" },
      { name: "BS & Sisa Tekstil", path: "/mmt/bs-tekstil" },
      { name: "Bahan Sisa", path: "/mmt/bahan-sisa" },
      {
        name: "LHK",
        isSubGroup: true,
        path: "/mmt/lhk/browse",
        items: [
          { name: "LHK Cetak", path: "/mmt/lhk/cetak" },
          { name: "LHK Kain", path: "/mmt/lhk/kain" },
          { name: "LHK Finishing", path: "/mmt/lhk/finishing" },
          { name: "LHK Proof", path: "/mmt/lhk/proof" },
          { name: "LHK Sublim", path: "/mmt/lhk/sublim" },
          { name: "LHK RTR", path: "/mmt/lhk/rtr" },
        ],
      },
      { name: "PO Paperprint", path: "/mmt/po-paperprint" },
      { name: "Penerimaan PO External", path: "/mmt/penerimaan-po-external" },
    ],
  },
  {
    name: "Laporan",
    items: [
      {
        name: "Garmen",
        isSubGroup: true,
        path: "/laporan/garmen/browse",
        items: [
          { name: "Mutasi Bahan", path: "/laporan/garmen/mutasi-bahan" },
          { name: "Kartu Stok Bahan Baku", path: "/laporan/garmen/kartu-stok-bahan" },
          { name: "Stok Barang", path: "/laporan/garmen/stok-barang" },
          { name: "SPK vs STBJ vs SJ", path: "/laporan/garmen/spk-stbj-sj" },
          { name: "Proses Produksi", path: "/laporan/garmen/proses-produksi" },
          { name: "Lap Outstanding SPK", path: "/laporan/garmen/outstanding-spk" },
        ],
      },
      {
        name: "Penjualan",
        isSubGroup: true,
        path: "/laporan/penjualan/browse",
        items: [
          { name: "Penawaran vs SPK", path: "/laporan/penjualan/penawaran-vs-spk" },
          { name: "Realisasi Pengiriman SPK", path: "/laporan/penjualan/realisasi-kirim-spk" },
          { name: "SPK vs SJ vs Invoice", path: "/laporan/penjualan/spk-sj-invoice" },
          { name: "Rekap Penawaran", path: "/laporan/penjualan/rekap-penawaran" },
        ],
      },
      {
        name: "Hutang",
        isSubGroup: true,
        path: "/laporan/hutang/browse",
        items: [
          { name: "PPN Masukan", path: "/laporan/hutang/ppn-masukan" },
          { name: "PO vs BPB", path: "/laporan/hutang/po-vs-bpb" },
          { name: "Daftar Hutang", path: "/laporan/hutang/daftar-hutang" },
          { name: "PO Bahan vs Realisasi", path: "/laporan/hutang/po-bahan-vs-realisasi" },
        ],
      },
      {
        name: "Piutang",
        isSubGroup: true,
        path: "/laporan/piutang/browse",
        items: [
          { name: "Rekap Mutasi Piutang", path: "/laporan/piutang/rekap-mutasi" },
          { name: "Daftar Piutang", path: "/laporan/piutang/daftar-piutang" },
          { name: "Saldo Piutang", path: "/laporan/piutang/saldo-piutang" },
        ],
      },
      {
        name: "Spanduk",
        isSubGroup: true,
        path: "/laporan/spanduk/browse",
        items: [
          { name: "Laporan Persediaan", path: "/laporan/spanduk/persediaan" },
          { name: "Laporan Kartu Stok", path: "/laporan/spanduk/kartu-stok" },
          { name: "Laporan In Out Gudang", path: "/laporan/spanduk/in-out-gudang" },
          { name: "Stok Barang Jadi", path: "/laporan/spanduk/stok-jadi" },
        ],
      },
      {
        name: "Produksi MMT",
        isSubGroup: true,
        path: "/laporan/mmt/browse",
        items: [
          { name: "LS Bahan Utama", path: "/laporan/mmt/ls-bahan-utama" },
          { name: "LS Bahan Penolong", path: "/laporan/mmt/ls-bahan-penolong" },
          { name: "Lap. Mon LMKP MMT", path: "/laporan/mmt/lap-mon-lmkp-mmt" },
          { name: "LS Tinta", path: "/laporan/mmt/ls-tinta" },
          { name: "LS Bahan Kain", path: "/laporan/mmt/ls-bahan-kain" },
          { name: "Kartu Stock Bahan", path: "/laporan/mmt/mon-jadwal-kirim" },
          { name: "Lap. BS & Sisa Digital Printing", path: "/laporan/mmt/stok-jadi" },
        ],
      },
      {
        name: "Marketing",
        isSubGroup: true,
        path: "/laporan/marketing/browse",
        items: [
          { name: "Target vs Realisasi", path: "/laporan/marketing/target-vs-realisasi" },
          { name: "Proyeksi vs Realisasi", path: "/laporan/marketing/proyeksi-vs-realisasi" },
        ],
      },
    ],
  },
];

// DATA COMMENTED (TETAP DIPERTAHANKAN SESUAI REQUEST)
/*
  // {
  // name: 'Pembelian',
  // items: [
  // { name: 'MKB', path: '/pembelian/mkb' },
  // { name: 'PO Bahan', path: '/pembelian/po-bahan' },
  // { name: 'Input PPN', path: '/pembelian/input-ppn' },
  // { name: 'Retur PPN', path: '/pembelian/retur-ppn' },
  // { name: 'Retur Pembelian', path: '/pembelian/retur-beli' },
  // ]
  // },
  // {
  // name: 'Garmen',
  // items: [
  // { name: 'BPB Bahan', path: '/garmen/bpb-bahan' },
  // { name: 'PO Jasa', path: '/garmen/po-jasa' },
  // { name: 'PO Paper Print', path: '/garmen/po-paper-print' },
  // { name: 'BPB Jasa', path: '/garmen/bpb-jasa' },
  // { name: 'STBJ', path: '/garmen/stbj' },
  // { name: 'Permintaan Material', path: '/garmen/permintaan-material' },
  // { name: 'Mutasi Produksi', path: '/garmen/mutasi-produksi' },
  // { name: 'Retur Material', path: '/garmen/retur-material' },
  // { name: 'Koreksi Stok Barang Jadi', path: '/garmen/koreksi-stok-jadi' },
  // { name: 'Koreksi Stok Bahan Baku', path: '/garmen/koreksi-stok-bahan' },
  // { name: 'BPB Non PO', path: '/garmen/bpb-non-po' },
  // { name: 'Jadwal Kirim Produksi', path: '/garmen/jadwal-kirim-produksi' },
  // ]
  // },
  // {
  // name: 'Spanduk',
  // items: [
  // { name: 'Terima Supplier', path: '/spanduk/terima-supplier' },
  // { name: 'Retur Beli', path: '/spanduk/retur-beli' },
  // { name: 'Mutasi Gudang', path: '/spanduk/mutasi-gudang' },
  // { name: 'Permintaan Produksi', path: '/spanduk/permintaan-produksi' },
  // { name: 'Realisasi Produksi', path: '/spanduk/realisasi-produksi' },
  // { name: 'Anval', path: '/spanduk/anval' },
  // { name: 'Penjualan', path: '/spanduk/penjualan' },
  // { name: 'Koreksi Stok v2', path: '/spanduk/koreksi-stok' },
  // { name: 'SPK Tambahan', path: '/spanduk/spk-tambahan' },
  // { name: 'Monitoring Proof', path: '/spanduk/monitoring-proof' },
  // { name: 'LHK Cetak', path: '/spanduk/lhk-cetak' },
  // { name: 'LHK Jahit', path: '/spanduk/lhk-jahit' },
  // { name: 'LHK Lipat', path: '/spanduk/lhk-lipat' },
  // { name: 'LHK Quiring', path: '/spanduk/lhk-quiring' },
  // ]
  // },
  // {
  // name: 'Penjualan',
  // items: [
  // { name: 'Penawaran', path: '/penjualan/penawaran' },
  // { name: 'SPK', path: '/penjualan/spk' },
  // { name: 'Pra Surat Jalan', path: '/penjualan/pra-sj' },
  // { name: 'Surat Jalan', path: '/penjualan/surat-jalan' },
  // { name: 'Invoice', path: '/penjualan/invoice' },
  // { name: 'Retur Jual', path: '/penjualan/retur-jual' },
  // { name: 'MAP', path: '/penjualan/map' },
  // { name: 'Surat Jalan MAP', path: '/penjualan/surat-jalan-map' },
  // ]
  // },
  // {
  // name: 'Hutang',
  // items: [
  // { name: 'Voucher Pembayaran', path: '/hutang/voucher-pembayaran' },
  // { name: 'Pelunasan', path: '/hutang/pelunasan' },
  // ]
  // },
  // {
  // name: 'Piutang',
  // items: [
  // { name: 'Penerimaan Giro', path: '/piutang/penerimaan-giro' },
  // { name: 'Penerimaan Cash', path: '/piutang/penerimaan-cash' },
  // { name: 'Penerimaan Transfer', path: '/piutang/penerimaan-transfer' },
  // { name: 'Potongan', path: '/piutang/potongan' },
  // { name: 'Pelunasan', path: '/piutang/pelunasan' },
  // ]
  // },
*/

const menuGroups = computed(() => {
  const user = authStore.user;
  const zdivisi = user?.divisi;
  
  // Clone master menu agar tidak merusak data asli
  const menus = JSON.parse(JSON.stringify(allMenuGroups));

  // Ambil daftar izin berdasarkan divisi. 
  // Jika divisi tidak terdaftar di mapping, anggap dia ADMIN (bisa semua/tidak ada isDisabled)
  const allowedTitles = rolePermissions[zdivisi];

  // Jika divisi tidak ada di mapping (ADMIN), return menu apa adanya
  if (!allowedTitles) return menus;

  return menus.map(group => {
    return {
      ...group,
      // Jika nama Group-nya saja tidak ada di izin, kita tandai (Opsional)
      // Namun biasanya kita cek per item di dalamnya
      items: group.items.map(item => {
        
        // Cek Level 2
        let canAccess = allowedTitles.includes(item.name);

        // Cek Level 3 (Sub-items) jika ada
        if (item.isSubGroup && item.items) {
          // Tandai sub-item level 3
          item.items = item.items.map(subItem => ({
            ...subItem,
            isDisabled: !allowedTitles.includes(subItem.name)
          }));
          
          // Jika ada salah satu anak yang boleh diakses, maka bapaknya (Level 2) harus terbuka
          const anySubAllowed = item.items.some(sub => !sub.isDisabled);
          if (anySubAllowed) canAccess = true;
        }

        return { 
          ...item, 
          isDisabled: !canAccess 
        };
      })
    };
  });
});
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@300;400;500;600;700;800&display=swap");

:root {
  --font-family-primary: "Inter", sans-serif;
  --font-family-heading: "Poppins", sans-serif;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --border-radius-sm: 8px;
  --border-radius-md: 12px;
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
  --transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);

  /* WARNA DASHBOARD */
  --color-primary: #1e78c8;
  --color-primary-dark: #155a9b;
  --color-text-dark: #333333;
  --color-text-secondary: #6c757d;
  --color-bg-main: #ffffff; /* Putih */
  --color-bg-page: #f8f9fa; /* Latar Belakang Luar Konten */
  --color-bg-menu-hover: #e3f2fd; /* Hover Biru Muda */
  --color-border: #e0e0e0;
}
/* Style untuk menu yang tidak bisa diklik */
.item-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  position: relative;
}

.disabled-link {
  display: block;
  padding: 4px 15px;
  color: #999 !important;
  font-size: 0.9rem;
  text-decoration: none;
  pointer-events: none; /* Mematikan semua interaksi mouse */
}

.item-disabled:hover .sub-menu {
  display: none !important; /* Mencegah submenu muncul jika parent disabled */
}

/* Opsional: Tambahkan icon gembok kecil */
.mdi-lock-outline {
  font-size: 12px;
  margin-left: 5px;
  float: right;
}

/* KELAS UTILITY */
.font-body { font-family: var(--font-family-primary); }
.font-heading { font-family: var(--font-family-heading); }
.font-semibold { font-weight: var(--font-weight-semibold); }
.shadow-sm { box-shadow: var(--shadow-sm); }
.shadow-md { box-shadow: var(--shadow-md); }
.rounded-soft { border-radius: var(--border-radius-md); }
.transition-fast { transition: all var(--transition-fast); }

.hover-lift:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* ======================================= */
/* GLOBAL LAYOUT */
/* ======================================= */

.dashboard-layout-top {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background-color: var(--color-bg-page);
}

/* ======================================= */
/* 1. TOP NAVBAR (Modern & Soft) */
/* ======================================= */

.top-navbar {
  display: flex;
  align-items: center;
  background-color: var(--color-bg-main);
  color: var(--color-text-dark);
  padding: 0 20px;
  height: 55px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--color-border);
  font-size: 0.95rem;
}

.navbar-brand {
  font-size: 1.2rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-primary-dark);
  display: flex;
  align-items: center;
  margin-right: 20px;
}

.brand-icon {
  font-size: 1.4rem;
  margin-right: 8px;
}

.navbar-menu {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  height: 100%;
  flex-grow: 1;
}

.dropdown {
  position: relative;
  height: 100%;
  transition: all var(--transition-fast);
}

.dropdown-toggle {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 15px;
  cursor: pointer;
  color: var(--color-text-dark);
  text-decoration: none;
  font-weight: var(--font-weight-semibold);
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.dropdown-toggle:hover,
.dropdown:hover .dropdown-toggle {
  background-color: var(--color-bg-menu-hover);
  color: var(--color-primary-dark);
}

.navbar-user {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-left: auto;
}

.user-welcome {
  color: var(--color-text-secondary);
  font-size: 0.85rem;
}

.logout-button {
  border: none;
  padding: 6px 12px;
  font-size: 0.85rem;
  font-weight: var(--font-weight-medium);
  color: white;
  background-color: var(--color-primary);
  cursor: pointer;
  border-radius: var(--border-radius-sm);
}
.logout-button:hover {
  background-color: var(--color-primary-dark);
}

/* ======================================= */
/* 2. DROPDOWN MENU (Level 2 & 3) */
/* ======================================= */

.dropdown-menu {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  background-color: var(--color-bg-main);
  border: 1px solid var(--color-border);
  min-width: 260px;
  list-style: none;
  padding: 0px;
  z-index: 100;
  border-radius: var(--border-radius-sm);
}

.dropdown:hover > .dropdown-menu {
  display: block;
}

.dropdown-menu a {
  display: block;
  padding: 4px 8px;
  color: var(--color-text-dark);
  text-decoration: none;
  white-space: nowrap;
  font-size: 0.9rem;
  font-weight: var(--font-weight-normal);
  border-radius: var(--border-radius-sm);
  margin: 0 5px;
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.dropdown-menu li:hover > a,
.dropdown-menu a.router-link-exact-active {
  background-color: var(--color-primary);
  color: white;
  font-weight: var(--font-weight-medium);
}

.sub-dropdown { position: relative; }
.sub-menu {
  display: none;
  position: absolute;
  left: 100%;
  top: 0;
  border-left: none;
  padding: 5px 0;
}

.sub-dropdown:hover > .sub-menu {
  display: block;
}

.sub-dropdown-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 15px;
  cursor: pointer;
  color: var(--color-text-dark);
  text-decoration: none;
  white-space: nowrap;
  font-size: 0.9rem;
  font-weight: var(--font-weight-normal);
  margin: 0 5px;
  border-radius: var(--border-radius-sm);
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.sub-dropdown:hover > .sub-dropdown-toggle {
  background-color: var(--color-primary);
  color: white;
}

.icon-arrow {
  margin-left: 10px;
  font-size: 0.8rem;
  color: inherit;
}

/* ======================================= */
/* 4. KONTEN UTAMA AREA */
/* ======================================= */
.main-content-top {
  flex-grow: 1;
  background-color: var(--color-bg-page);
  overflow-y: auto;
}

.content-area {
  padding: 2px;
  min-height: 100%;
  box-sizing: border-box;
}

.dashboard-layout-top.print-mode {
  display: block !important;
  height: auto !important;
  overflow: visible !important;
  padding: 0 !important;
  margin: 0 !important;
  background-color: white !important;
}

@media print {
  .top-navbar, .navbar-brand, .navbar-menu, .navbar-user {
    display: none !important;
    visibility: hidden !important;
    height: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .dashboard-layout-top {
    display: block !important;
    height: auto !important;
    overflow: visible !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .main-content-top, .content-area {
    margin: 0 !important;
    padding: 0 !important;
    min-height: unset !important;
    overflow: visible !important;
    background-color: white !important;
  }

  body, html {
    margin: 0 !important;
    padding: 0 !important;
  }
}
</style>