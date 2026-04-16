<template>
  <div class="dashboard-layout-top font-body">
    <div
      v-if="isMobileMenuOpen"
      class="menu-overlay"
      @click="isMobileMenuOpen = false"
    ></div>

    <nav class="top-navbar shadow-sm">
      <div class="navbar-left">
        <button
          class="mobile-toggle"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
        >
          <span
            class="mdi"
            :class="isMobileMenuOpen ? 'mdi-close' : 'mdi-menu'"
          ></span>
        </button>

        <div class="navbar-brand">
          <span class="brand-icon mdi mdi-speedometer"></span>
          <span class="font-heading">MMT App</span>
        </div>
      </div>

      <ul class="navbar-menu" :class="{ 'is-mobile-open': isMobileMenuOpen }">
        <li
          v-for="group in menuGroups"
          :key="group.name"
          class="dropdown"
          :class="{ 'is-active': activeMenu === group.name }"
        >
          <a class="dropdown-toggle" @click.prevent="toggleMenu(group.name)">
            {{ group.name }}
            <span class="mdi mdi-chevron-down hide-desktop"></span>
          </a>

          <ul class="dropdown-menu shadow-md">
            <template v-for="item in group.items" :key="item.name">
              <li
                v-if="item.isSubGroup"
                class="sub-dropdown"
                :class="{
                  'item-disabled': item.isDisabled,
                  'is-sub-active': activeSubMenu === item.name,
                }"
              >
                <a
                  v-if="!item.isDisabled"
                  class="sub-dropdown-toggle"
                  @mouseenter="activeSubMenu = item.name"
                  @click.prevent.stop="toggleSubMenu(item.name)"
                >
                  {{ item.name }}
                  <span
                    class="icon-arrow"
                    :class="{ rotate: activeSubMenu === item.name }"
                    >»</span
                  >
                </a>

                <span v-else class="disabled-link">
                  {{ item.name }} <span class="mdi mdi-lock-outline"></span>
                </span>

                <ul
                  v-if="!item.isDisabled && activeSubMenu === item.name"
                  class="sub-menu-popup shadow-md is-visible"
                  @mouseleave="activeSubMenu = null"
                >
                  <li
                    v-for="subItem in item.items"
                    :key="subItem.name"
                    class="card-item"
                  >
                    <router-link :to="subItem.path" @click="closeAllMenus">
                      {{ subItem.name }}
                    </router-link>
                  </li>
                </ul>
              </li>

              <li v-else :class="{ 'item-disabled': item.isDisabled }">
                <router-link
                  v-if="!item.isDisabled"
                  :to="item.path"
                  @click="closeAllMenus"
                >
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
        <span class="user-welcome hide-mobile">
          Selamat datang,
          <b class="font-semibold">{{ currentUser?.nmUser || "UserAdmin" }}</b>
        </span>
        <button @click="handleLogout" class="logout-button">
          <span class="mdi mdi-logout hide-desktop"></span>
          <span class="hide-mobile">Logout</span>
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

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const authStore = useAuthStore();
const currentUser = authStore.user;
const router = useRouter();

// State Navigasi
const isMobileMenuOpen = ref(false);
const activeMenu = ref(null); // Level 1: File, Daftar, Transaksi, Laporan
const activeSubMenu = ref(null); // Level 2: Daftar (Sub), Finance, LHK, dll

// Fungsi Logout
const handleLogout = () => {
  authStore.logout();
  router.push("/login");
};

// --- LOGIC TOGGLE MENU ---

// Toggle Menu Utama (Level 1)
const toggleMenu = (menuName: string) => {
  if (activeMenu.value !== menuName) {
    activeSubMenu.value = null; // Reset Level 2 jika pindah menu utama
  }
  activeMenu.value = activeMenu.value === menuName ? null : menuName;
};

// Toggle Sub-Group (Level 2 ke Level 3)
// Menggunakan stop propagation agar klik tidak 'tembus' ke penutup menu
const toggleSubMenu = (subName: string) => {
  activeSubMenu.value = activeSubMenu.value === subName ? null : subName;
};

// Menutup semua menu saat link diklik (Navigasi Berhasil)
const closeAllMenus = () => {
  activeMenu.value = null;
  activeSubMenu.value = null;
  isMobileMenuOpen.value = false;
};

// Menutup menu jika klik di luar area navbar
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest(".dropdown")) {
    activeMenu.value = null;
    activeSubMenu.value = null;
  }
};

onMounted(() => {
  window.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener("click", handleClickOutside);
});

// --- DATA & PERMISSIONS ---

const rolePermissions = {
  1: [
    "Daftar",
    "Daftar Permintaan Pembelian",
    "Purchase Request (PR)",
    "Penerimaan Bahan",
    "Permintaan Produksi",
    "Realisasi Produksi",
    "Planning Produksi",
    "Stok Opname",
    // "Koreksi Stok",
    "STBJ",
    "LHK",
    "LHK Mesin Cetak",
    "LHK Tekstil",
    "Laporan",
    "Produksi MMT",
    "LS Bahan Utama",
    "LS Bahan Penolong",
    "Lap. Mon LMKP MMT",
  ],
  2: ["File", "Ganti Password", "Customer", "Sales", "Laporan", "Penjualan"],
  4: [
    "Daftar",
    "Daftar Permintaan Pembelian",
    "Purchase Request (PR)",
    "Penerimaan Bahan",
    "Permintaan Produksi",
    "Realisasi Produksi",
    "Stok Opname",
    "Koreksi Stok",
    "LHK",
    "LHK Mesin Cetak",
    "LHK Tekstil",
    "Laporan",
    "Produksi MMT",
    "LS Bahan Utama",
    "LS Bahan Penolong",
    "Lap. Mon LMKP MMT",
  ],
};

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
      // { name: "Kode Bayar", path: "/daftar/kode-bayar" },
      // { name: "Jenis Barang", path: "/daftar/jenis-barang" },
      // { name: "Gudang", path: "/daftar/gudang" },
      // { name: "Jasa", path: "/daftar/jasa" },
      // { name: "Gudang Produksi", path: "/daftar/gudang-produksi" },
      // { name: "Komponen SPK", path: "/daftar/komponen-spk" },
      // { name: "Customer", path: "/daftar/customer" },
      // { name: "Tanda Terima", path: "/daftar/tanda-terima" },
      // { name: "Jenis Order", path: "/daftar/jenis-order" },
      // { name: "Sales", path: "/daftar/sales" },
      // { name: "Barang", path: "/daftar/barang" },
      // { name: "Jenis Potongan", path: "/daftar/jenis-potongan" },
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
        name: "Finance",
        isSubGroup: true,
        path: "/mmt/Finance/browse",
        items: [
          { name: "PO Bahan MMT", path: "/mmt/po-bahan-mmt" },
          { name: "Invoice", path: "/mmt/invoice" },
          { name: "Retur Beli", path: "/mmt/retur-beli" },
          { name: "Pelunasan Pembelian", path: "/mmt/pelunasan-pembelian" },
          { name: "Laporan Outstanding", path: "/laporan/mmt/lap-hutang" },
        ],
      },

      {
        name: "Daftar Permintaan Pembelian",
        path: "/mmt/pengajuan-permintaan",
      },
      { name: "Purchase Request (PR)", path: "/mmt/permintaan-bahan" },

      { name: "Penerimaan Bahan", path: "/mmt/penerimaan-bahan" },

      { name: "Retur Produksi", path: "/mmt/retur-produksi" },
      { name: "Mutasi Bahan", path: "/mmt/mutasi-gudang" },
      { name: "Koreksi Stok", path: "/mmt/koreksi-stok" },
      { name: "Stok Opname", path: "/mmt/stok-opname" },
      { name: "Permintaan Produksi", path: "/mmt/permintaan-produksi" },
      { name: "Realisasi Produksi", path: "/mmt/realisasi-produksi" },
      { name: "Planning Produksi", path: "/mmt/planning-produksi" },
      { name: "BS & Sisa Digital Print", path: "/mmt/bs-digital" },
      { name: "BS & Sisa Tekstil", path: "/mmt/bs-tekstil" },
      { name: "STBJ", path: "/mmt/stbj" },
      {
        name: "LHK",
        isSubGroup: true,
        path: null,
        items: [
          { name: "LHK Cetak (Mesin)", path: "/mmt/lhk/cetak" },
          { name: "LHK Approval Cetak", path: "/mmt/lhk/cetak-mmt" },
          { name: "LHK Tekstil", path: "/mmt/lhk/tekstil" },
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
          { name: "Laporan LHK", path: "/laporan/mmt/lap-lhk" },
          {
            name: "Lap. Monitoring Kurang Produksi MMT",
            path: "/laporan/mmt/lap-mon-lmkp-mmt",
          },
          {
            name: "Lap. Pemakaian Bahan",
            path: "/laporan/mmt/lap-pemakaian-bahan",
          },
          { name: "Lap. Mon Cetak", path: "/laporan/mmt/lap-mon-cetak" },
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
  const zdivisi = authStore.user?.divisi as keyof typeof rolePermissions;
  const menus = JSON.parse(JSON.stringify(allMenuGroups));
  const allowedTitles = rolePermissions[zdivisi];

  if (!allowedTitles) return menus;

  return menus.map((group: any) => {
    return {
      ...group,
      items: group.items.map((item: any) => {
        let canAccess = allowedTitles.includes(item.name);

        if (item.isSubGroup && item.items) {
          item.items = item.items.map((subItem: any) => ({
            ...subItem,
            isDisabled: !allowedTitles.includes(subItem.name),
          }));
          const anySubAllowed = item.items.some((sub: any) => !sub.isDisabled);
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
/* 1. THEME VARIABLES */
.dashboard-layout-top {
  --color-primary: #1e78c8;
  --color-primary-dark: #155a9b;
  --color-primary-light: #e3f2fd;
  --color-text-main: #333333;
  --color-border: #e0e0e0;
  --radius-md: 12px;
  --transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background-color: #f7fafc;
}

/* 2. TOP NAVBAR */
.top-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: white;
  padding: 0 24px;
  height: var(--navbar-height);
  border-bottom: 1px solid var(--color-border);
  z-index: 1100;
  flex-shrink: 0;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.navbar-brand {
  color: var(--color-primary-dark);
  font-family: "Poppins", sans-serif;
  font-weight: 800;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 3. NAVIGATION MENU (DESKTOP) */
.navbar-menu {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0 0 0 20px;
  height: 100%;
  flex-grow: 1;
  gap: 4px;
}

.dropdown {
  position: relative;
  height: 100%;
}

.dropdown-toggle {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 16px;
  color: var(--color-text-main);
  font-weight: 600;
  font-size: 0.92rem;
  text-decoration: none;
  transition: var(--transition);
  cursor: pointer;
}

.dropdown.is-active > .dropdown-menu {
  visibility: visible;
  opacity: 1;
  transform: translateY(0);
}

.dropdown-toggle:hover,
.dropdown.is-active .dropdown-toggle {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
}

/* 4. DROPDOWN CONTENT (LEVEL 2) */
.dropdown-menu {
  /* Hilangkan display: none, gunakan opacity & pointer-events agar transisi halus */
  display: block;
  visibility: hidden;
  opacity: 0;
  position: absolute;
  top: 100%;
  left: 0;
  background-color: white;
  min-width: 240px;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  transform: translateY(10px);
  transition: all 0.2s ease;
  z-index: 1100;
}

.disabled-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  color: #94a3b8; /* Abu-abu lebih lembut */
  font-size: 0.88rem; /* Samakan dengan link aktif */
  font-weight: 500; /* Jangan gunakan bold yang terlalu tebal */
  cursor: not-allowed;
  background-color: #f8fafc; /* Beri sedikit background beda agar terlihat 'off' */
  border-radius: 6px;
  margin-bottom: 2px;
}

.disabled-link .mdi-lock-outline {
  font-size: 0.9rem;
  opacity: 0.7;
  margin-left: 8px;
}

/* Pastikan item disabled tidak berubah warna saat di-hover */
.item-disabled:hover {
  background-color: transparent !important;
}

/* Menyesuaikan jarak agar teks tidak terlalu mepet ke ikon gembok */
.item-disabled {
  pointer-events: none; /* Mencegah interaksi */
  user-select: none;
}

/* Desktop Hover Logic */
@media (min-width: 1025px) {
  .dropdown:hover > .dropdown-menu {
    display: block;
    animation: fadeInQuick 0.15s ease-out;
  }
}

.dropdown-menu li a,
.sub-dropdown-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px;
  color: var(--color-text-main);
  text-decoration: none;
  font-size: 0.88rem;
  border-radius: 6px;
  transition: var(--transition);
  cursor: pointer;
}

.dropdown-menu li a:hover,
.is-sub-active > .sub-dropdown-toggle {
  background-color: var(--color-primary);
  color: white !important;
}

/* 5. SUB-MENU (LEVEL 3) - Card Style & Pancingan */
.sub-dropdown {
  position: relative;
}

.sub-menu-popup {
  position: absolute;
  left: 100%;
  top: 0;
  min-width: 240px;
  padding-left: 12px; /* Area jembatan mouse */
  background: transparent;
  z-index: 1300;
  list-style: none;
}

.card-item {
  background-color: white;
  margin-bottom: 6px;
  border: 1px solid #edf2f7;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: transform 0.2s;
}

.card-item:hover {
  transform: translateX(4px);
}

.card-item a {
  background-color: white !important;
  color: var(--color-text-main) !important;
}

.card-item a:hover {
  background-color: var(--color-primary) !important;
  color: white !important;
}

/* 6. ICONS & ANIMATIONS */
.icon-arrow {
  display: inline-block;
  transition: transform 0.3s ease;
  font-size: 1rem;
  margin-left: 8px;
}

.icon-arrow.rotate {
  transform: rotate(90deg);
}

@keyframes fadeInQuick {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 7. MOBILE RESPONSIVE */
.mobile-toggle {
  display: none;
  background: none;
  border: none;
  font-size: 24px;
  color: var(--color-primary);
  cursor: pointer;
}

@media (max-width: 1024px) {
  .mobile-toggle {
    display: block;
  }
  .hide-mobile {
    display: none;
  }

  .navbar-menu {
    position: fixed;
    top: 0;
    left: -100%;
    width: 280px;
    height: 100vh;
    background: white;
    flex-direction: column;
    padding: 70px 20px 20px;
    transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 4px 0 10px rgba(0, 0, 0, 0.1);
    display: block;
    overflow-y: auto;
  }

  .navbar-menu.is-mobile-open {
    left: 0;
  }

  .dropdown {
    height: auto;
    display: block;
    border-bottom: 1px solid #f1f5f9;
  }

  .dropdown-menu {
    position: static;
    display: none;
    box-shadow: none;
    border: none;
    padding: 0 0 10px 15px;
    background: #f8fafc;
  }

  .dropdown.is-active > .dropdown-menu {
    display: block;
  }

  .sub-menu-popup {
    position: static;
    padding-left: 15px;
    background: white;
  }

  .card-item {
    box-shadow: none;
    border: none;
    border-left: 2px solid var(--color-primary);
    border-radius: 0;
    margin-bottom: 0;
  }
}

/* 8. USER SECTION */
.navbar-user {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 180px;
  justify-content: flex-end;
}

.logout-button {
  background-color: var(--color-danger-bg);
  color: var(--color-danger);
  border: 1px solid #fed7d7;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  gap: 8px;
}

.logout-button:hover {
  background-color: var(--color-danger);
  color: white;
}

.menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1080;
}

.main-content-top {
  flex-grow: 1;
  overflow-y: auto;
  padding: 24px;
}
</style>
