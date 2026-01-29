<template>
  <div class="dashboard-layout-top font-body">
    <nav class="top-navbar shadow-sm">
      <div class="navbar-brand">
        <span class="brand-icon mdi mdi-speedometer"></span>
        <span class="font-heading">MyApp</span>
      </div>

      <ul class="navbar-menu">
        <li
          v-for="group in menuGroups"
          :key="group.name"
          class="dropdown"
          :class="{ 'is-active': activeMenu === group.name }"
        >
          <a class="dropdown-toggle" @click.prevent="toggleMenu(group.name)">
            {{ group.name }}
          </a>

          <ul class="dropdown-menu shadow-md">
            <template v-for="item in group.items" :key="item.name">
              <li
                v-if="item.isSubGroup"
                class="sub-dropdown"
                :class="{ 'item-disabled': item.isDisabled }"
              >
                <router-link
                  v-if="!item.isDisabled"
                  :to="item.path"
                  class="sub-dropdown-toggle"
                >
                  {{ item.name }} <span class="icon-arrow">&raquo;</span>
                </router-link>
                <span v-else class="disabled-link">
                  {{ item.name }} <span class="mdi mdi-lock-outline"></span>
                </span>

                <ul v-if="!item.isDisabled" class="dropdown-menu sub-menu">
                  <li v-for="subItem in item.items" :key="subItem.name">
                    <router-link :to="subItem.path">
                      {{ subItem.name }}
                    </router-link>
                  </li>
                </ul>
              </li>

              <li v-else :class="{ 'item-disabled': item.isDisabled }">
                <router-link v-if="!item.isDisabled" :to="item.path">
                  {{ item.name }}
                </router-link>
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
        <button @click="handleLogout" class="logout-button">Logout</button>
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
import { ref, computed, onMounted, onUnmounted } from "vue"; // PERBAIKAN: Tambah onUnmounted
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const authStore = useAuthStore();
const currentUser = authStore.user;
const router = useRouter();

// State untuk menu aktif
const activeMenu = ref(null);

const rolePermissions = {
  1: [
    "Daftar Permintaan Pembelian",
    "Permintaan Pembelian(PR)",
    "Penerimaan Bahan",
    "Permintaan Produksi",
    "Realisasi Produksi",
    "Koreksi Stok",
    "LHK",
    "LHK Mesin Cetak",
    "LHK Kain",
    "Laporan",
    "Produksi MMT",
    "LS Bahan Utama",
    "LS Bahan Penolong",
    "Lap. Mon LMKP MMT",
  ],
  2: ["File", "Ganti Password", "Customer", "Sales", "Laporan", "Penjualan"],
};

const handleLogout = () => {
  authStore.logout();
  router.push("/login");
};

// LOGIC TOGGLE MENU
const toggleMenu = (menuName) => {
  activeMenu.value = activeMenu.value === menuName ? null : menuName;
};

// LOGIC KLIK DI LUAR UNTUK MENUTUP
const closeMenu = (e) => {
  if (!e.target.closest(".dropdown")) {
    activeMenu.value = null;
  }
};

onMounted(() => {
  window.addEventListener("click", closeMenu);
});

onUnmounted(() => {
  window.removeEventListener("click", closeMenu);
});

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
        path: "/mmt/",
        items: [
          { name: "Master Bahan", path: "/mmt/daftar/bahan" },
          { name: "Mesin Produksi", path: "/mmt/daftar/mesin-produksi" },
          { name: "Operator", path: "/mmt/daftar/operator" },
          { name: "Bahan Sisa", path: "/mmt/daftar/bahan-sisa" },
        ],
      },
      {
        name: "Daftar Permintaan Pembelian",
        path: "/mmt/pengajuan-permintaan",
      },
      { name: "Permintaan Pembelian(PR)", path: "/mmt/permintaan-bahan" },
      { name: "PO Bahan MMT", path: "/mmt/po-bahan-mmt" },
      { name: "Penerimaan Bahan", path: "/mmt/penerimaan-bahan" },
      { name: "Invoice", path: "/mmt/invoice" },
      { name: "Retur Beli", path: "/mmt/retur-beli" },
      { name: "Koreksi Stok", path: "/mmt/koreksi-stok" },
      { name: "Permintaan Produksi", path: "/mmt/permintaan-produksi" },
      { name: "Realisasi Produksi", path: "/mmt/realisasi-produksi" },
      { name: "BS & Sisa Digital Print", path: "/mmt/bs-digital" },
      { name: "BS & Sisa Tekstil", path: "/mmt/bs-tekstil" },
      { name: "Bahan Sisa", path: "/mmt/bahan-sisa" },
      {
        name: "LHK",
        isSubGroup: true,
        path: "/mmt/lhk/browse",
        items: [
          { name: "LHK Mesin Cetak", path: "/mmt/lhk/cetak" },
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
          {
            name: "Kartu Stok Bahan Baku",
            path: "/laporan/garmen/kartu-stok-bahan",
          },
          { name: "Stok Barang", path: "/laporan/garmen/stok-barang" },
          { name: "SPK vs STBJ vs SJ", path: "/laporan/garmen/spk-stbj-sj" },
          { name: "Proses Produksi", path: "/laporan/garmen/proses-produksi" },
          {
            name: "Lap Outstanding SPK",
            path: "/laporan/garmen/outstanding-spk",
          },
        ],
      },
      {
        name: "Penjualan",
        isSubGroup: true,
        path: "/laporan/penjualan/browse",
        items: [
          {
            name: "Penawaran vs SPK",
            path: "/laporan/penjualan/penawaran-vs-spk",
          },
          {
            name: "Realisasi Pengiriman SPK",
            path: "/laporan/penjualan/realisasi-kirim-spk",
          },
          {
            name: "SPK vs SJ vs Invoice",
            path: "/laporan/penjualan/spk-sj-invoice",
          },
          {
            name: "Rekap Penawaran",
            path: "/laporan/penjualan/rekap-penawaran",
          },
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
          {
            name: "PO Bahan vs Realisasi",
            path: "/laporan/hutang/po-bahan-vs-realisasi",
          },
        ],
      },
      {
        name: "Piutang",
        isSubGroup: true,
        path: "/laporan/piutang/browse",
        items: [
          {
            name: "Rekap Mutasi Piutang",
            path: "/laporan/piutang/rekap-mutasi",
          },
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
          {
            name: "Laporan In Out Gudang",
            path: "/laporan/spanduk/in-out-gudang",
          },
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
          {
            name: "Kartu Stok Produksi",
            path: "/laporan/mmt/kartu-stok-produksi",
          },
          { name: "Laporan SPK MMT", path: "/laporan/mmt/lap-spk-mmt" },
          { name: "Lap. Mon LMKP MMT", path: "/laporan/mmt/lap-mon-lmkp-mmt" },
          {
            name: "Lap. Plan Produksi",
            path: "/laporan/mmt/lap-plan-produksi",
          },
          { name: "Lap. Barang Jadi", path: "/laporan/mmt/lap-barang-jadi" },
          { name: "LS Tinta", path: "/laporan/mmt/lap-stok-tinta" },
          { name: "Lap. Bahan Kain", path: "/laporan/mmt/lap-bahan-kain" },
          { name: "LS Bahan Kain", path: "/laporan/mmt/ls-bahan-kain" },
          { name: "Kartu Stock Bahan", path: "/laporan/mmt/mon-jadwal-kirim" },
          {
            name: "Lap. BS & Sisa Digital Printing",
            path: "/laporan/mmt/stok-jadi",
          },
        ],
      },
      {
        name: "Marketing",
        isSubGroup: true,
        path: "/laporan/marketing/browse",
        items: [
          {
            name: "Target vs Realisasi",
            path: "/laporan/marketing/target-vs-realisasi",
          },
          {
            name: "Proyeksi vs Realisasi",
            path: "/laporan/marketing/proyeksi-vs-realisasi",
          },
        ],
      },
    ],
  },
];

const menuGroups = computed(() => {
  const zdivisi = authStore.user?.divisi;
  const menus = JSON.parse(JSON.stringify(allMenuGroups));
  const allowedTitles = rolePermissions[zdivisi];

  if (!allowedTitles) return menus;

  return menus.map((group) => {
    return {
      ...group,
      items: group.items.map((item) => {
        let canAccess = allowedTitles.includes(item.name);

        if (item.isSubGroup && item.items) {
          item.items = item.items.map((subItem) => ({
            ...subItem,
            isDisabled: !allowedTitles.includes(subItem.name),
          }));
          const anySubAllowed = item.items.some((sub) => !sub.isDisabled);
          if (anySubAllowed) canAccess = true;
        }

        return {
          ...item,
          isDisabled: !canAccess,
        };
      }),
    };
  });
});
</script>

<style scoped>
/* Gunakan scoped agar tidak merusak style halaman lain */

/* 1. VARIABLES */
:root {
  --font-family-primary: "Inter", sans-serif;
  --font-family-heading: "Poppins", sans-serif;
  --color-primary: #1e78c8;
  --color-primary-dark: #155a9b;
  --color-text-dark: #333333;
  --color-text-secondary: #6c757d;
  --color-bg-main: #ffffff;
  --color-bg-page: #f8f9fa;
  --color-bg-menu-hover: #e3f2fd;
  --color-border: #e0e0e0;
  --color-disabled: #999999;
  --border-radius-sm: 8px;
  --border-radius-md: 12px;
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  --transition-fast: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 2. LAYOUT */
.dashboard-layout-top {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background-color: #f8f9fa;
}

.top-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: white;
  padding: 0 24px;
  height: 64px;
  border-bottom: 1px solid #e0e0e0;
  z-index: 1000;
}

.navbar-brand {
  font-family: "Poppins", sans-serif;
  font-size: 1.25rem;
  font-weight: 800;
  color: #155a9b;
  display: flex;
  align-items: center;
  gap: 10px;
}

.navbar-menu {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  height: 100%;
  gap: 4px;
}

/* 3. DROPDOWN CORE */
.dropdown {
  position: relative;
  height: 100%;
}

.dropdown-toggle {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 16px;
  cursor: pointer;
  color: #333;
  font-weight: 600;
  font-size: 0.95rem;
  transition: 0.2s;
  text-decoration: none;
}

.dropdown.is-active .dropdown-toggle,
.dropdown-toggle:hover {
  background-color: #e3f2fd;
  color: #1e78c8;
}

.dropdown-menu {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  background-color: white;
  border: 1px solid #e0e0e0;
  min-width: 240px;
  list-style: none;
  padding: 8px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 1100;
}

.dropdown.is-active > .dropdown-menu {
  display: block;
  animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-menu a {
  display: block;
  padding: 5px;
  color: #333;
  text-decoration: none;
  font-size: 0.9rem;
  border-radius: 8px;
}

.dropdown-menu li:not(.item-disabled) > a:hover {
  background-color: #1e78c8;
  color: white !important;
}
.sub-dropdown {
  position: relative;
}

.sub-menu {
  display: none;
  position: absolute;
  left: 100%; /* Tetap di kanan */
  top: 0;
  /* PERBAIKAN: Tambahkan padding/margin negatif agar tidak ada celah antara L2 dan L3 */
  margin-left: 0;
  padding-left: 10px; /* Area pancingan: Jarak visual tapi tetap dianggap satu area */
  min-width: 220px;
  z-index: 1200;
}

/* Memastikan area hover tetap aktif saat kursor di area padding */
.sub-dropdown:hover > .sub-menu {
  display: block;
}

/* Styling tambahan untuk link di Level 3 agar lebih rapat dan mudah dijangkau */
.sub-menu li {
  background-color: white; /* Beri background agar area klik jelas */
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  margin-bottom: 2px;
  box-shadow: var(--shadow-md);
}

.sub-menu li:first-child {
  border-top-left-radius: var(--border-radius-md);
  border-top-right-radius: var(--border-radius-md);
}

.sub-menu li:last-child {
  border-bottom-left-radius: var(--border-radius-md);
  border-bottom-right-radius: var(--border-radius-md);
}
/* 5. DISABLED */
.item-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.disabled-link {
  display: flex;
  justify-content: space-between;
  padding: 10px 14px;
  color: #999;
  font-size: 0.9rem;
}

.navbar-user {
  display: flex;
  align-items: center;
  gap: 15px;
}

.logout-button {
  background-color: #1e78c8;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.logout-button:hover {
  background-color: #155a9b;
}

.main-content-top {
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px;
}
</style>
