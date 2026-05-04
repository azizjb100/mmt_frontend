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
    "Retur Produksi",
    "STBJ",
    "Jadwal Kirim",
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
          { name: "Voucher Pelunasan", path: "/mmt/voucher-pembelian" },
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
      { name: "Jadwal Kirim", path: "/mmt/jadwal-kirim" },
      {
        name: "LHK",
        isSubGroup: true,
        path: null,
        items: [
          { name: "LHK Cetak (Mesin)", path: "/mmt/lhk/cetak" },
          { name: "LHK Approval Cetak", path: "/mmt/lhk/cetak-mmt" },
          { name: "LHK Tekstil", path: "/mmt/lhk/tekstil" },
          { name: "LHK Approval Tekstil", path: "/mmt/lhk/tekstil/approve" },

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
            name: "Lap. Mon Finishing",
            path: "/laporan/mmt/lap-mon-finishing",
          },
          { name: "Lap. Mon Tekstil", path: "/laporan/mmt/lap-mon-tekstil" },
          { name: "Lap. Mon Proof", path: "/laporan/mmt/lap-mon-proof" },
          { name: "Lap. Mon Sublim", path: "/laporan/mmt/lap-mon-sublim" },
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
  --color-primary-light: #f0f7ff;
  --color-text-main: #334155;
  --color-text-muted: #94a3b8;
  --color-border: #e2e8f0;
  --color-danger: #ef4444;
  --color-danger-bg: #fef2f2;
  --radius-md: 8px;
  --transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  --navbar-height: 64px;

  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background-color: #f8fafc;
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
  font-weight: 700;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 3. NAVIGATION MENU (DESKTOP) */
.navbar-menu {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0 0 0 30px;
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
  font-size: 0.9rem;
  text-decoration: none;
  transition: var(--transition);
  cursor: pointer;
}

.dropdown-toggle:hover,
.dropdown.is-active .dropdown-toggle {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
}

/* 4. DROPDOWN CONTENT (LEVEL 2) */
.dropdown-menu {
  display: block;
  visibility: hidden;
  opacity: 0;
  position: absolute;
  top: 100%;
  left: 0;
  background-color: white !important;
  min-width: 240px;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
  transform: translateY(10px);
  transition: all 0.2s ease;
  z-index: 1200;
}

.dropdown:hover > .dropdown-menu,
.dropdown.is-active > .dropdown-menu {
  visibility: visible;
  opacity: 1;
  transform: translateY(0);
}

.dropdown-menu li a,
.sub-dropdown-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px;
  color: var(--color-text-main);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 6px;
  transition: var(--transition);
  cursor: pointer;
}

.dropdown-menu li a:hover,
.is-sub-active > .sub-dropdown-toggle {
  background-color: var(--color-primary) !important;
  color: white !important;
}

/* 5. SUB-MENU (LEVEL 3) - PERBAIKAN UTAMA */
.sub-dropdown {
  position: relative;
}

.sub-menu-popup {
  position: absolute;
  left: 100%; /* Geser ke kanan menu level 2 */
  top: -8px; /* Sedikit ke atas agar sejajar */
  min-width: 260px;
  margin-left: 6px;
  padding: 0;
  background-color: white !important; /* Latar belakang solid */
  z-index: 1300;
  list-style: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 10px 10px 30px rgba(0, 0, 0, 0.18); /* Shadow kuat agar tidak menempel tabel */
  overflow: hidden;
}

.card-item {
  background-color: white;
  border-bottom: 1px solid #f1f5f9;
}

.card-item:last-child {
  border-bottom: none;
}

.card-item a {
  display: block !important;
  padding: 5px !important;
  background-color: white !important;
  color: var(--color-text-main) !important;
  font-weight: 500;
  transition: all 0.2s;
}

.card-item a:hover {
  background-color: var(--color-primary-light) !important;
  color: var(--color-primary) !important;
  padding-left: 22px !important; /* Animasi geser */
}

/* 6. DISABLED & LOCK */
.item-disabled {
  pointer-events: none;
  opacity: 0.6;
}

.disabled-link {
  display: flex;
  justify-content: space-between;
  padding: 10px 14px;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  background-color: #f8fafc;
  border-radius: 6px;
  margin-bottom: 2px;
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
    padding: 70px 0 20px;
    transition: 0.3s ease;
    box-shadow: 4px 0 15px rgba(0, 0, 0, 0.1);
    display: block;
    overflow-y: auto;
  }

  .navbar-menu.is-mobile-open {
    left: 0;
  }

  .dropdown {
    height: auto;
    border-bottom: 1px solid #f1f5f9;
  }

  .dropdown-menu {
    position: static;
    visibility: visible;
    opacity: 1;
    display: none; /* Default tutup di mobile */
    box-shadow: none;
    border: none;
    padding: 10px 20px;
    background: #f8fafc;
    transform: none;
  }

  .dropdown.is-active > .dropdown-menu {
    display: block;
  }

  .sub-menu-popup {
    position: static;
    box-shadow: none;
    border: none;
    margin-left: 15px;
    border-left: 2px solid var(--color-primary);
    border-radius: 0;
    background-color: transparent !important;
  }
}

/* 8. USER & MISC */
.navbar-user {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logout-button {
  background-color: var(--color-danger-bg);
  color: var(--color-danger);
  border: 1px solid #fee2e2;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}

.logout-button:hover {
  background-color: var(--color-danger);
  color: white;
}

.menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  z-index: 1080;
  backdrop-filter: blur(2px);
}

.main-content-top {
  flex-grow: 1;
  overflow-y: auto;
  padding: 24px;
}

.icon-arrow {
  transition: transform 0.3s;
}
.icon-arrow.rotate {
  transform: rotate(90deg);
}
</style>
