<template>
  <div class="dashboard-layout-top font-body">
    <div
      v-if="isMobileMenuOpen"
      class="menu-overlay"
      @click="isMobileMenuOpen = false"
    ></div>

    <nav class="top-navbar" :class="{ 'scrolled-navbar': isScrolled }">
      <div class="navbar-left">
        <button
          class="mobile-toggle"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
        >
          <component
            :is="isMobileMenuOpen ? IconX : IconMenu2"
            class="nav-icon"
          />
        </button>

        <router-link to="/" class="navbar-brand" @click="closeAllMenus">
          <img :src="logoSrc" alt="Logo" class="brand-logo" v-if="logoSrc" />
          <span class="font-heading">MMT App</span>
        </router-link>
      </div>

      <ul class="navbar-menu" :class="{ 'is-mobile-open': isMobileMenuOpen }">
        <li
          v-for="group in menuGroups"
          :key="group.name"
          class="dropdown"
          :class="{ 'is-active': activeMenu === group.name }"
        >
          <a class="dropdown-toggle" @click.prevent="toggleMenu(group.name)">
            <span class="menu-title-wrapper">
              <component
                :is="getGroupIcon(group.name)"
                class="menu-icon hide-mobile"
              />
              {{ group.name }}
            </span>
            <component :is="IconChevronDown" class="arrow-icon" />
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
                @mouseleave="
                  activeSubMenu = null;
                  activeSubLevel4 = null;
                "
              >
                <a
                  v-if="!item.isDisabled"
                  class="sub-dropdown-toggle"
                  @mouseenter="activeSubMenu = item.name"
                  @click.prevent.stop="toggleSubMenu(item.name)"
                >
                  <span class="menu-title-wrapper">
                    <component
                      :is="getItemIcon(item.name)"
                      class="sub-menu-icon"
                    />
                    {{ item.name }}
                  </span>
                  <span class="icon-arrow">»</span>
                </a>

                <span v-else class="disabled-link">
                  <span class="menu-title-wrapper">
                    <component
                      :is="getItemIcon(item.name)"
                      class="sub-menu-icon"
                    />
                    {{ item.name }}
                  </span>
                  <component :is="IconLock" class="lock-icon" />
                </span>

                <ul
                  v-if="!item.isDisabled && activeSubMenu === item.name"
                  class="sub-menu-popup shadow-md"
                >
                  <li
                    v-for="subItem in item.items"
                    :key="subItem.name"
                    class="card-item dynamic-sub"
                    :class="{ 'item-disabled': subItem.isDisabled }"
                  >
                    <template v-if="subItem.isSubGroup">
                      <a
                        v-if="!subItem.isDisabled"
                        class="sub-dropdown-toggle level-4-toggle"
                        @mouseenter="activeSubLevel4 = subItem.name"
                      >
                        <span class="menu-title-wrapper">
                          <component
                            :is="getItemIcon(subItem.name)"
                            class="sub-menu-icon"
                          />
                          {{ subItem.name }}
                        </span>
                        <span class="icon-arrow">»</span>
                      </a>

                      <span v-else class="disabled-link">
                        <span class="menu-title-wrapper">
                          <component
                            :is="getItemIcon(subItem.name)"
                            class="sub-menu-icon"
                          />
                          {{ subItem.name }}
                        </span>
                        <component :is="IconLock" class="lock-icon" />
                      </span>

                      <ul
                        v-if="
                          !subItem.isDisabled &&
                          activeSubLevel4 === subItem.name
                        "
                        class="sub-menu-popup level-4-popup shadow-md"
                      >
                        <li
                          v-for="deepItem in subItem.items"
                          :key="deepItem.name"
                          class="card-item"
                          :class="{ 'item-disabled': deepItem.isDisabled }"
                        >
                          <router-link
                            v-if="!deepItem.isDisabled"
                            :to="deepItem.path || '#'"
                            @click="closeAllMenus"
                          >
                            <span class="menu-title-wrapper">
                              <component
                                :is="getItemIcon(deepItem.name)"
                                class="sub-menu-icon"
                              />
                              {{ deepItem.name }}
                            </span>
                          </router-link>
                          <span v-else class="disabled-link">
                            <span class="menu-title-wrapper">
                              <component
                                :is="getItemIcon(deepItem.name)"
                                class="sub-menu-icon"
                              />
                              {{ deepItem.name }}
                            </span>
                            <component :is="IconLock" class="lock-icon" />
                          </span>
                        </li>
                      </ul>
                    </template>

                    <template v-else>
                      <router-link
                        v-if="!subItem.isDisabled"
                        :to="subItem.path || '#'"
                        @click="closeAllMenus"
                      >
                        <span class="menu-title-wrapper">
                          <component
                            :is="getItemIcon(subItem.name)"
                            class="sub-menu-icon"
                          />
                          {{ subItem.name }}
                        </span>
                      </router-link>
                      <span v-else class="disabled-link">
                        <span class="menu-title-wrapper">
                          <component
                            :is="getItemIcon(subItem.name)"
                            class="sub-menu-icon"
                          />
                          {{ subItem.name }}
                        </span>
                        <component :is="IconLock" class="lock-icon" />
                      </span>
                    </template>
                  </li>
                </ul>
              </li>

              <li v-else :class="{ 'item-disabled': item.isDisabled }">
                <router-link
                  v-if="!item.isDisabled"
                  :to="item.path || '#'"
                  @click="closeAllMenus"
                >
                  <span class="menu-title-wrapper">
                    <component
                      :is="getItemIcon(item.name)"
                      class="sub-menu-icon"
                    />
                    {{ item.name }}
                  </span>
                </router-link>
                <span v-else class="disabled-link">
                  <span class="menu-title-wrapper">
                    <component
                      :is="getItemIcon(item.name)"
                      class="sub-menu-icon"
                    />
                    {{ item.name }}
                  </span>
                  <component :is="IconLock" class="lock-icon" />
                </span>
              </li>
            </template>
          </ul>
        </li>
      </ul>

      <div class="navbar-user">
        <div
          class="user-profile-badge hide-mobile"
          :class="userRoleConfig.color"
        >
          <component :is="userRoleConfig.icon" class="role-icon" />
          <span class="user-welcome">
            Selamat datang,
            <b class="font-semibold">{{
              currentUser?.nmUser || "UserAdmin"
            }}</b>
          </span>
        </div>

        <button @click="handleLogout" class="logout-button">
          <component :is="IconLogout" class="logout-icon" />
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
// Ganti dengan path logo Anda

// Import Paket Tabler Icons
import {
  IconMenu2,
  IconX,
  IconChevronDown,
  IconLogout,
  IconLock,
  IconShield,
  IconSpeakerphone,
  IconBuildingWarehouse,
  IconTie,
  IconFolder,
  IconLayoutList,
  IconSettings,
  IconReport,
  IconShoppingCart,
  IconTexture,
  IconDeviceDesktopAnalytics,
  IconShirt,
  IconReceipt,
  IconFileText,
  IconTool,
  IconFlask,
  IconUsers,
} from "@tabler/icons-vue";

const authStore = useAuthStore();
const currentUser = authStore.user;
const router = useRouter();

// State Navigasi UI
const isMobileMenuOpen = ref(false);
const activeMenu = ref<string | null>(null);
const activeSubMenu = ref<string | null>(null);
const activeSubLevel4 = ref<string | null>(null);
const scrolled = ref(false);

const isScrolled = computed(() => scrolled.value);

const handleScroll = () => {
  scrolled.value = window.scrollY > 10;
};

// Fungsi Logout
const handleLogout = () => {
  authStore.logout();
  router.push("/login");
};

// --- LOGIC TOGGLE MENU ---
const toggleMenu = (menuName: string) => {
  if (activeMenu.value !== menuName) {
    activeSubMenu.value = null;
    activeSubLevel4.value = null;
  }
  activeMenu.value = activeMenu.value === menuName ? null : menuName;
};

const toggleSubMenu = (subName: string) => {
  if (activeSubMenu.value !== subName) {
    activeSubLevel4.value = null;
  }
  activeSubMenu.value = activeSubMenu.value === subName ? null : subName;
};

const closeAllMenus = () => {
  activeMenu.value = null;
  activeSubMenu.value = null;
  activeSubLevel4.value = null;
  isMobileMenuOpen.value = false;
};

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest(".dropdown")) {
    activeMenu.value = null;
    activeSubMenu.value = null;
    activeSubLevel4.value = null;
  }
};

onMounted(() => {
  window.addEventListener("scroll", handleScroll);
  window.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
  window.removeEventListener("click", handleClickOutside);
});

// --- ICON RESOLVER MAPPING ---
const getGroupIcon = (name: string) => {
  switch (name) {
    case "File":
      return IconFolder;
    case "Daftar":
      return IconLayoutList;
    case "Transaksi":
      return IconShoppingCart;
    case "Laporan":
      return IconReport;
    default:
      return IconSettings;
  }
};

const getItemIcon = (name: string) => {
  if (name.includes("Bahan")) return IconTexture;
  if (name.includes("LHK") || name.includes("SPK")) return IconFileText;
  if (name.includes("Lap.") || name.includes("Laporan"))
    return IconDeviceDesktopAnalytics;
  if (name.includes("Garmen") || name.includes("Tekstil")) return IconShirt;
  if (name.includes("Finance") || name.includes("Invoice")) return IconReceipt;
  if (name.includes("Spare Part")) return IconTool;
  if (name.includes("Obat")) return IconFlask;
  if (
    name.includes("User") ||
    name.includes("Operator") ||
    name.includes("Supplier")
  )
    return IconUsers;
  return IconSettings;
};

// --- ROLE VISUAL THEME VARIATIONS ---
const userRoleConfig = computed(() => {
  const name = currentUser?.nmUser?.toUpperCase() || "";
  const bagian = currentUser?.bagian?.toUpperCase() || "";
  if (name.includes("ADMIN") || name === "DEVELOPER")
    return { icon: IconShield, color: "role-admin" };
  if (bagian === "MARKETING")
    return { icon: IconSpeakerphone, color: "role-marketing" };
  if (bagian.includes("GUDANG"))
    return { icon: IconBuildingWarehouse, color: "role-warehouse" };
  return { icon: IconTie, color: "role-default" };
});

// --- DATA LOGIC & PERMISSIONS (ASLI ANDA) ---
const rolePermissions = {
  1: [
    "Daftar",
    "Daftar Permintaan Pembelian",
    "Purchase Request (PR)",
    "Penerimaan Bahan",
    "Permintaan Produksi",
    "Realisasi Produksi",
    "Surat Perintah Kerja (SPK)",
    "Planning Produksi",
    "Mutasi Bahan",
    "Stok Opname",
    "Retur Produksi",
    "STBJ",
    "Jadwal Kirim",
    "LHK",
    "LHK Cetak (Mesin)",
    "LHK Approval Cetak",
    "LHK Tekstil",
    "LHK Approval Tekstil",
    "LHK Finishing",
    "LHK Proof",
    "LHK Paperprint",
    "LHK Sublim",
    "Laporan",
    "Produksi MMT",
    "Stok & Bahan MMT",
    "Monitoring & Dokumen",
    "Lap. Monitoring Divisi",
    "LS Bahan Utama",
    "LS Bahan Penolong",
    "Kartu Stok Produksi",
    "Laporan SPK MMT",
    "Laporan LHK",
    "Lap. Monitoring Kurang Produksi MMT",
    "Lap. Pemakaian Bahan",
    "Lap. Mon Cetak",
    "Lap. Mon Finishing",
    "Lap. Mon Tekstil",
    "Lap. Mon Proof",
    "Lap. Mon Sublim",
    "Lap. BS & Sisa Digital Printing",
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
    "LHK Cetak (Mesin)",
    "LHK Approval Cetak",
    "LHK Tekstil",
    "LHK Approval Tekstil",
    "LHK Finishing",
    "LHK Proof",
    "LHK Sublim",
    "LHK RTR",
    "Laporan",
    "Produksi MMT",
    "Stok & Bahan MMT",
    "Monitoring & Dokumen",
    "Lap. Monitoring Divisi",
    "LS Bahan Utama",
    "LS Bahan Penolong",
    "Kartu Stok Produksi",
    "Laporan SPK MMT",
    "Laporan LHK",
    "Lap. Monitoring Kurang Produksi MMT",
    "Lap. Pemakaian Bahan",
    "Lap. Mon Cetak",
    "Lap. Mon Finishing",
    "Lap. Mon Tekstil",
    "Lap. Mon Proof",
    "Lap. Mon Sublim",
    "Lap. BS & Sisa Digital Printing",
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
    items: [{ name: "Supplier", path: "/daftar/supplier" }],
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
          { name: "PO External MMT", path: "/mmt/po-external-mmt" },
          { name: "Invoice", path: "/mmt/invoice" },
          { name: "Retur Beli", path: "/mmt/retur-beli" },
          { name: "Voucher Pelunasan", path: "/mmt/voucher-pembelian" },
          { name: "Laporan Outstanding", path: "/laporan/mmt/lap-hutang" },
        ],
      },
      {
        name: "Bahan Baku & Produksi",
        isSubGroup: true,
        items: [
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
        ],
      },

      { name: "Planning Produksi", path: "/mmt/planning-produksi" },
      { name: "Surat Perintah Kerja (SPK)", path: "/mmt/spk" },
      { name: "BS & Sisa Digital Print", path: "/mmt/bs-digital" },
      { name: "BS & Sisa Tekstil", path: "/mmt/bs-tekstil" },
      { name: "STBJ", path: "/mmt/stbj" },
      { name: "Surat Jalan Approve", path: "/mmt/surat-jalan/approve" },
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
          { name: "LHK Paperprint", path: "/mmt/lhk/paperprint" },
          { name: "LHK Sublim", path: "/mmt/lhk/sublim" },
          { name: "LHK Layout", path: "/mmt/lhk/layout" },
        ],
      },
      { name: "Mutasi Internal", path: "/mmt/mutasi-internal" },
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
          {
            name: "Monitoring & Dokumen",
            isSubGroup: true,
            items: [
              {
                name: "Lap. Monitoring Kurang Produksi MMT",
                path: "/laporan/mmt/lap-mon-lmkp-mmt",
              },
              { name: "Lap. Mon BS", path: "/laporan/mmt/lap-mon-bs" },
              { name: "Lap. Mon Cetak", path: "/laporan/mmt/lap-mon-cetak" },
              {
                name: "Lap. Mon Finishing",
                path: "/laporan/mmt/lap-mon-finishing",
              },
              {
                name: "Lap. Mon Tekstil",
                path: "/laporan/mmt/lap-mon-tekstil",
              },
              { name: "Lap. Mon Proof", path: "/laporan/mmt/lap-mon-proof" },
              { name: "Lap. Mon Sublim", path: "/laporan/mmt/lap-mon-sublim" },
            ],
          },
          { name: "LS Bahan Utama", path: "/laporan/mmt/ls-bahan-utama" },
          { name: "LS Bahan Penolong", path: "/laporan/mmt/ls-bahan-penolong" },
          {
            name: "Lap. Pemakaian Bahan",
            path: "/laporan/mmt/lap-pemakaian-bahan",
          },
          { name: "Laporan SPK MMT", path: "/laporan/mmt/lap-spk-mmt" },
          { name: "Laporan LHK", path: "/laporan/mmt/lap-lhk" },
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
          item.items = item.items.map((subItem: any) => {
            if (subItem.isSubGroup && subItem.items) {
              subItem.items = subItem.items.map((deepItem: any) => ({
                ...deepItem,
                isDisabled: !allowedTitles.includes(deepItem.name),
              }));
              const anyDeepAllowed = subItem.items.some(
                (deep: any) => !deep.isDisabled,
              );
              return {
                ...subItem,
                isDisabled:
                  !anyDeepAllowed && !allowedTitles.includes(subItem.name),
              };
            }
            return {
              ...subItem,
              isDisabled: !allowedTitles.includes(subItem.name),
            };
          });
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
/* Style tetap persis seperti sebelumnya (Desain navbar modern kode kedua) */
.dashboard-layout-top {
  --color-primary: #1e78c8;
  --color-primary-dark: #155a9b;
  --color-primary-light: #f0f7ff;
  --color-text-main: #334155;
  --color-text-muted: #64748b;
  --color-border: #e2e8f0;
  --color-danger: #ef4444;
  --color-danger-bg: #fef2f2;
  --radius-md: 10px;
  --transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  --navbar-height: 68px;

  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background-color: #f8fafc;
}

.top-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: white;
  padding: 0 28px;
  height: var(--navbar-height);
  border-bottom: 1px solid var(--color-border);
  z-index: 1100;
  flex-shrink: 0;
  transition: var(--transition);
}

.top-navbar.scrolled-navbar {
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.08);
  border-bottom-color: transparent;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.brand-logo {
  height: 32px;
  width: auto;
  object-fit: contain;
}

.navbar-brand {
  color: var(--color-primary-dark);
  font-family: "Poppins", sans-serif;
  font-weight: 700;
  font-size: 1.35rem;
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.navbar-menu {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0 0 0 40px;
  height: 100%;
  flex-grow: 1;
  gap: 6px;
}

.dropdown {
  position: relative;
  height: 100%;
}

.dropdown-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 16px;
  color: var(--color-text-main);
  font-weight: 600;
  font-size: 0.875rem;
  text-decoration: none;
  transition: var(--transition);
  cursor: pointer;
  gap: 8px;
}

.menu-title-wrapper {
  display: flex;
  font-size: 12px;
  align-items: center;
  gap: 8px;
}

.dropdown-toggle:hover,
.dropdown.is-active .dropdown-toggle {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
}

.nav-icon,
.menu-icon,
.sub-menu-icon {
  width: 18px;
  height: 18px;
  stroke-width: 2;
}

.arrow-icon {
  width: 16px;
  height: 16px;
  transition: transform 0.2s ease;
}

.dropdown.is-active .arrow-icon {
  transform: rotate(180deg);
}

.dropdown-menu {
  visibility: hidden;
  opacity: 0;
  position: absolute;
  top: 100%;
  left: 0;
  background-color: white;
  min-width: 250px;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
  transform: translateY(8px);
  transition: var(--transition);
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
  padding: 8px 12px;
  color: var(--color-text-main);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 8px;
  transition: var(--transition);
  cursor: pointer;
}

.dropdown-menu li a:hover,
.is-sub-active > .sub-dropdown-toggle {
  background-color: var(--color-primary) !important;
  color: white !important;
}

.sub-dropdown {
  position: relative;
}

/* PERBAIKAN LEVEL 3: Tumpang tindih sedikit ke kiri untuk menutup celah hover */
.sub-menu-popup {
  position: absolute;
  left: 99%; /* Diubah dari 100% agar menumpuk sedikit di atas menu induk */
  top: -6px;
  min-width: 260px;
  margin-left: -2px; /* Dibuat minus agar menempel rapat tanpa celah piksel kosong */
  padding: 6px;
  background-color: white;
  z-index: 1300;
  list-style: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 6px 6px 25px rgba(15, 23, 42, 0.12);
}

.card-item a {
  display: flex !important;
  align-items: center;
  padding: 8px 14px !important;
  color: var(--color-text-main) !important;
  background-color: transparent !important;
  font-weight: 500;
  border-radius: 6px;
  transition: var(--transition);
}

.card-item a:hover {
  background-color: var(--color-primary-light) !important;
  color: var(--color-primary) !important;
}

.level-4-toggle {
  display: flex !important;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/* PERBAIKAN LEVEL 4: Tumpang tindih sedikit ke kiri untuk menutup celah hover */
.level-4-popup {
  position: absolute;
  left: 99%; /* Diubah dari 100% agar tidak ada gap */
  top: -6px;
  margin-left: -2px; /* Dibuat minus agar menempel rapat */
  z-index: 1400;
}

.item-disabled {
  pointer-events: none;
  opacity: 0.6;
}

.disabled-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  background-color: #f8fafc;
  border-radius: 6px;
  margin-bottom: 2px;
  cursor: not-allowed;
}

.lock-icon {
  width: 14px;
  height: 14px;
  color: var(--color-text-muted);
}

.navbar-user {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-profile-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px;
  border-radius: 30px;
  font-size: 0.85rem;
}

.role-icon {
  width: 16px;
  height: 16px;
}

.role-admin {
  background-color: #fee2e2;
  color: #dc2626;
}
.role-marketing {
  background-color: #ffedd5;
  color: #ea580c;
}
.role-warehouse {
  background-color: #ccfbf1;
  color: #0d9488;
}
.role-default {
  background-color: #e0e7ff;
  color: #4f46e5;
}

.logout-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--color-danger-bg);
  color: var(--color-danger);
  border: 1px solid #fee2e2;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: var(--transition);
}

.logout-button:hover {
  background-color: var(--color-danger);
  color: white;
}

.logout-icon {
  width: 16px;
  height: 16px;
}

.menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.3);
  z-index: 1080;
  backdrop-filter: blur(4px);
}

.main-content-top {
  flex-grow: 1;
  overflow-y: auto;
  padding: 24px;
}

@media (max-width: 1024px) {
  .mobile-toggle {
    display: flex;
    align-items: center;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-text-main);
  }
  .hide-mobile {
    display: none !important;
  }

  .navbar-menu {
    position: fixed;
    top: 0;
    left: -100%;
    width: 290px;
    height: 100vh;
    background: white;
    flex-direction: column;
    padding: 80px 16px 20px;
    transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 4px 0 25px rgba(15, 23, 42, 0.15);
    display: block;
    overflow-y: auto;
  }

  .navbar-menu.is-mobile-open {
    left: 0;
  }
  .dropdown {
    height: auto;
  }

  .dropdown-menu {
    position: static;
    visibility: visible;
    opacity: 1;
    display: none;
    box-shadow: none;
    border: none;
    padding: 4px 0 4px 12px;
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
    margin-left: 12px;
    border-left: 2px solid var(--color-primary);
    border-radius: 0;
    background-color: transparent !important;
    padding: 0;
  }

  .level-4-popup {
    position: static;
    box-shadow: none;
    border: none;
    margin-left: 12px;
    border-left: 2px dashed var(--color-primary);
    background-color: transparent !important;
  }
}

.icon-arrow {
  transition: transform 0.3s;
}
.icon-arrow.rotate {
  transform: rotate(90deg);
}
</style>
