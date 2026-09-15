<template>
  <div class="user-management-container font-body">
    <!-- Header Halaman -->
    <div class="page-header">
      <div>
        <h1 class="font-heading text-xl font-bold">Browse User & Hak Akses</h1>
        <p class="text-sm text-muted">
          Kelola data pengguna dan hak akses menu aplikasi
        </p>
      </div>
      <button @click="openAddModal" class="btn-primary">
        <component :is="IconUserPlus" class="w-4 h-4" />
        Tambah User Baru
      </button>
    </div>

    <!-- Loading & Error State -->
    <div v-if="loading" class="text-center py-6 text-muted">Memuat data...</div>

    <!-- Tabel Browse User -->
    <div v-else class="table-card shadow-md">
      <table class="data-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Kode</th>
            <th>Nama User</th>
            <th>Kantor / Divisi</th>
            <th>Cabang</th>
            <th>Bagian</th>
            <th>Status</th>
            <th class="text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="userList.length === 0">
            <td colspan="8" class="text-center text-muted">
              Tidak ada data user.
            </td>
          </tr>
          <tr v-for="(user, index) in userList" :key="user.user_kode">
            <td>{{ index + 1 }}</td>
            <td class="font-semibold text-primary">{{ user.user_kode }}</td>
            <td>{{ user.user_nama }}</td>
            <td>{{ user.user_divisi || "-" }}</td>
            <td>{{ user.user_cab }}</td>
            <td>{{ user.user_bagian }}</td>
            <td>
              <span
                :class="
                  user.user_aktif === 1 ? 'badge-active' : 'badge-inactive'
                "
              >
                {{ user.user_aktif === 1 ? "Aktif" : "Non-Aktif" }}
              </span>
            </td>
            <td class="text-center">
              <button
                @click="openPermissionModal(user)"
                class="btn-icon"
                title="Setting Hak Akses"
              >
                <component :is="IconShieldLock" class="w-4 h-4 text-primary" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Setting Hak Akses Menu -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content shadow-lg">
        <div class="modal-header">
          <div>
            <h3 class="font-heading font-bold text-lg">
              Konfigurasi Hak Akses User
            </h3>
            <p class="text-xs text-muted">
              User:
              <b class="text-primary">{{ selectedUser?.user_nama }}</b> ({{
                selectedUser?.user_kode
              }})
            </p>
          </div>
          <button @click="showModal = false" class="btn-close">
            <component :is="IconX" class="w-5 h-5" />
          </button>
        </div>

        <div class="modal-body">
          <div v-if="loadingModal" class="text-center py-4 text-muted">
            Memuat hak akses...
          </div>
          <table v-else class="permission-table">
            <thead>
              <tr>
                <th class="w-12">No</th>
                <th class="w-20">Id</th>
                <th>Nama Menu</th>
                <th class="text-center w-16">View</th>
                <th class="text-center w-16">Insert</th>
                <th class="text-center w-16">Update</th>
                <th class="text-center w-16">Delete</th>
                <th class="text-center w-16">Save</th>
                <th class="text-center w-20">Semua</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(menu, idx) in menuPermissions" :key="menu.id">
                <td>{{ idx + 1 }}</td>
                <td class="text-primary font-mono font-semibold">
                  {{ menu.id }}
                </td>
                <td>{{ menu.name }}</td>
                <td class="text-center">
                  <input type="checkbox" v-model="menu.view" />
                </td>
                <td class="text-center">
                  <input type="checkbox" v-model="menu.insert" />
                </td>
                <td class="text-center">
                  <input type="checkbox" v-model="menu.update" />
                </td>
                <td class="text-center">
                  <input type="checkbox" v-model="menu.delete" />
                </td>
                <td class="text-center">
                  <input type="checkbox" v-model="menu.save" />
                </td>
                <td class="text-center">
                  <input
                    type="checkbox"
                    :checked="isAllChecked(menu)"
                    @change="toggleAllMenu(menu, $event)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="modal-footer">
          <button @click="showModal = false" class="btn-secondary">
            Batal
          </button>
          <button
            @click="savePermissions"
            class="btn-primary"
            :disabled="saving"
          >
            {{ saving ? "Menyimpan..." : "Simpan Perubahan" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { IconUserPlus, IconShieldLock, IconX } from "@tabler/icons-vue";
import axios from "axios";

const userList = ref<any[]>([]);
const loading = ref(false);
const loadingModal = ref(false);
const saving = ref(false);

const showModal = ref(false);
const selectedUser = ref<any>(null);
const menuPermissions = ref<any[]>([]);

// Daftar Struktur Menu Lengkap (Group & Sub-Group)
const allMenuGroups = [
  {
    name: "File",
    items: [
      { name: "User", path: "/file/user" },
      { name: "Identitas Perusahaan", path: "/file/perusahaan" },
      { name: "Ganti Password", path: "/file/ganti-password" },
    ],
  },
  { name: "Daftar", items: [{ name: "Supplier", path: "/daftar/supplier" }] },
  {
    name: "Spanduk",
    items: [
      {
        name: "Penerimaan Bahan Penolong",
        path: "/spanduk/penerimaan-bahan-penolong",
      },
    ],
  },
  {
    name: "Transaksi",
    items: [
      {
        name: "Daftar",
        isSubGroup: true,
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
          { name: "Retur Beli", path: "/mmt/retur-beli" },
          { name: "Mutasi Bahan", path: "/mmt/mutasi-gudang" },
          { name: "Koreksi Stok", path: "/mmt/koreksi-stok" },
          { name: "Stok Opname", path: "/mmt/stok-opname" },
          { name: "Permintaan Produksi", path: "/mmt/permintaan-produksi" },
          { name: "Realisasi Produksi", path: "/mmt/realisasi-produksi" },
        ],
      },
      {
        name: "LHK",
        isSubGroup: true,
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
      { name: "Planning Produksi", path: "/mmt/planning-produksi" },
      { name: "Memo Approval Produk (MAP)", path: "/mmt/map" },
      { name: "SO TO SPK (Surat Perintah Kerja)", path: "/mmt/so-spk" },
      { name: "BS & Sisa Digital Print", path: "/mmt/bs-digital" },
      { name: "BS & Sisa Tekstil", path: "/mmt/bs-tekstil" },
      { name: "STBJ", path: "/mmt/stbj" },
      { name: "Surat Jalan", path: "/mmt/surat-jalan" },
      { name: "Surat Jalan Approve", path: "/mmt/surat-jalan/approve" },
      { name: "Jadwal Kirim", path: "/mmt/jadwal-kirim" },
      { name: "PO Internal", path: "/mmt/po-paperprint" },
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
              { name: "Lap. Mon Kiriman", path: "/laporan/mmt/lap-kiriman" },
              { name: "Lap. Mon Cetak", path: "/laporan/mmt/lap-mon-cetak" },
              {
                name: "Lap. Mon Finishing",
                path: "/laporan/mmt/lap-mon-finishing",
              },
              {
                name: "Lap. Mon Tekstil",
                path: "/laporan/mmt/lap-mon-tekstil",
              },
              {
                name: "Lap. Mon Paperprint",
                path: "/laporan/mmt/lap-mon-paperprint",
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

// Helper untuk meratakan menu bertingkat menjadi list datar dengan ID unik
const generateFlatMenuList = () => {
  let list: any[] = [];
  let idCounter = 1;

  const traverse = (items: any[]) => {
    for (const item of items) {
      if (item.isSubGroup && item.items) {
        traverse(item.items);
      } else if (item.items && !item.path) {
        traverse(item.items);
      } else if (item.path) {
        list.push({
          id: idCounter++,
          name: item.name,
          view: false,
          insert: false,
          update: false,
          delete: false,
          save: false,
        });
      }
    }
  };

  for (const group of allMenuGroups) {
    if (group.items) {
      traverse(group.items);
    }
  }

  return list;
};

// 1. Ambil Data User (Browse) dari Endpoint GET /api/mmt/manage-user
const fetchUsers = async () => {
  loading.value = true;
  try {
    const response = await axios.get("/api/mmt/manage-user");
    userList.value = response.data.data || response.data;
  } catch (error) {
    console.error("Gagal memuat data user:", error);
    alert("Gagal memuat data user dari server.");
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchUsers();
});

// 2. Buka Modal & Ambil Hak Akses Berdasarkan Kode User: GET /api/mmt/manage-user/:kode/akses
const openPermissionModal = async (user: any) => {
  selectedUser.value = user;
  showModal.value = true;
  loadingModal.value = true;

  try {
    const response = await axios.get(
      `/api/mmt/manage-user/${user.user_kode}/akses`,
    );
    // Mengambil data akses tersimpan dari struktur { user, akses } atau array langsung
    const savedAkses = response.data.akses || response.data.data || [];

    // Generate menu dasar dari struktur allMenuGroups
    const defaultMenus = generateFlatMenuList();

    // Gabungkan dengan data akses yang sudah tersimpan di database
    menuPermissions.value = defaultMenus.map((menu) => {
      const found = savedAkses.find(
        (a: any) => Number(a.hak_men_id) === Number(menu.id),
      );
      if (found) {
        return {
          ...menu,
          view: found.hak_men_view === "1" || found.hak_men_view === 1,
          insert: found.hak_men_insert === "1" || found.hak_men_insert === 1,
          update: found.hak_men_edit === "1" || found.hak_men_edit === 1,
          delete: found.hak_men_delete === "1" || found.hak_men_delete === 1,
          save: found.hak_men_save === "1" || found.hak_men_save === 1,
        };
      }
      return menu;
    });
  } catch (error) {
    console.error("Gagal memuat hak akses:", error);
    alert("Gagal memuat konfigurasi hak akses user.");
  } finally {
    loadingModal.value = false;
  }
};

const openAddModal = () => {
  // Logika tambah user baru
};

const isAllChecked = (menu: any) => {
  return menu.view && menu.insert && menu.update && menu.delete && menu.save;
};

const toggleAllMenu = (menu: any, event: Event) => {
  const checked = (event.target as HTMLInputElement).checked;
  menu.view = checked;
  menu.insert = checked;
  menu.update = checked;
  menu.delete = checked;
  menu.save = checked;
};

// 3. Simpan Hak Akses: POST /api/mmt/manage-user/:kode/akses
const savePermissions = async () => {
  if (!selectedUser.value) return;

  saving.value = true;
  try {
    await axios.post(
      `/api/mmt/manage-user/${selectedUser.value.user_kode}/akses`,
      {
        permissions: menuPermissions.value,
      },
    );

    showModal.value = false;
    alert("Hak akses berhasil disimpan!");
  } catch (error) {
    console.error("Gagal menyimpan hak akses:", error);
    alert("Terjadi kesalahan saat menyimpan hak akses.");
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.user-management-container {
  padding: 24px;
  background-color: #f8fafc;
  min-height: 100vh;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.table-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}
.data-table,
.permission-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.875rem;
}
.data-table th,
.permission-table th {
  background-color: #1e78c8;
  color: white;
  padding: 10px 14px;
  font-weight: 600;
}
.data-table td,
.permission-table td {
  padding: 10px 14px;
  border-bottom: 1px solid #f1f5f9;
}
.badge-active {
  background-color: #dcfce7;
  color: #16a34a;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}
.badge-inactive {
  background-color: #fee2e2;
  color: #dc2626;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}
.btn-primary {
  background-color: #1e78c8;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.btn-secondary {
  background-color: #e2e8f0;
  color: #334155;
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-weight: 600;
  cursor: pointer;
}
.btn-icon {
  background: #f1f5f9;
  border: none;
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1500;
  backdrop-filter: blur(4px);
}
.modal-content {
  background: white;
  width: 900px;
  max-width: 95vw;
  max-height: 90vh;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.modal-header {
  padding: 16px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-body {
  padding: 16px 20px;
  overflow-y: auto;
  max-height: 60vh;
}
.modal-footer {
  padding: 12px 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #64748b;
}
</style>
