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

    <!-- Tabel Browse User -->
    <div class="table-card shadow-md">
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
          <tr v-for="(user, index) in userList" :key="user.kode">
            <td>{{ index + 1 }}</td>
            <td class="font-semibold text-primary">{{ user.kode }}</td>
            <td>{{ user.nama }}</td>
            <td>{{ user.kantor }}</td>
            <td>{{ user.cabang }}</td>
            <td>{{ user.bagian }}</td>
            <td>
              <span :class="user.aktif ? 'badge-active' : 'badge-inactive'">
                {{ user.aktif ? "Aktif" : "Non-Aktif" }}
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

    <!-- Modal Setting Hak Akses Menu (Sesuai Referensi Gambar) -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content shadow-lg">
        <div class="modal-header">
          <div>
            <h3 class="font-heading font-bold text-lg">
              Konfigurasi Hak Akses User
            </h3>
            <p class="text-xs text-muted">
              User: <b class="text-primary">{{ selectedUser?.nama }}</b> ({{
                selectedUser?.kode
              }})
            </p>
          </div>
          <button @click="showModal = false" class="btn-close">
            <component :is="IconX" class="w-5 h-5" />
          </button>
        </div>

        <div class="modal-body">
          <table class="permission-table">
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
          <button @click="savePermissions" class="btn-primary">
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { IconUserPlus, IconShieldLock, IconX } from "@tabler/icons-vue";

// Mock Data User (Browse User)
const userList = ref([
  {
    kode: "ADI",
    nama: "ADI",
    kantor: "Garment",
    cabang: "P04",
    bagian: "CETAK",
    aktif: true,
  },
  {
    kode: "BDI",
    nama: "BUDI SANTOSO",
    kantor: "Pusat",
    cabang: "P01",
    bagian: "EDP",
    aktif: true,
  },
  {
    kode: "SIT",
    nama: "SITI AMINAH",
    kantor: "Spanduk",
    cabang: "P02",
    bagian: "MARKETING",
    aktif: false,
  },
]);

const showModal = ref(false);
const selectedUser = ref<any>(null);

// Daftar Menu Hak Akses (Meniru Tabel pada Gambar Referensi)
const menuPermissions = ref([
  {
    id: 1,
    name: "MENU DAFTAR",
    view: false,
    insert: false,
    update: false,
    delete: false,
    save: false,
  },
  {
    id: 2,
    name: "MENU PEMBELIAN",
    view: false,
    insert: false,
    update: false,
    delete: false,
    save: false,
  },
  {
    id: 3,
    name: "MENU GARMEN",
    view: false,
    insert: false,
    update: false,
    delete: false,
    save: false,
  },
  {
    id: 9000,
    name: "MENU PPIC",
    view: false,
    insert: false,
    update: false,
    delete: false,
    save: false,
  },
  {
    id: 4,
    name: "MENU SPANDUK",
    view: false,
    insert: false,
    update: false,
    delete: false,
    save: false,
  },
  {
    id: 5,
    name: "MENU MMT",
    view: false,
    insert: false,
    update: false,
    delete: false,
    save: false,
  },
  {
    id: 6,
    name: "MENU PENJUALAN",
    view: false,
    insert: false,
    update: false,
    delete: false,
    save: false,
  },
  {
    id: 7,
    name: "MENU HUTANG",
    view: false,
    insert: false,
    update: false,
    delete: false,
    save: false,
  },
  {
    id: 8,
    name: "MENU PIUTANG",
    view: false,
    insert: false,
    update: false,
    delete: false,
    save: false,
  },
  {
    id: 9,
    name: "MENU LAPORAN",
    view: false,
    insert: false,
    update: false,
    delete: false,
    save: false,
  },
  {
    id: 210,
    name: "Setting Harga Bahan Garmen",
    view: false,
    insert: false,
    update: false,
    delete: false,
    save: false,
  },
  {
    id: 211,
    name: "Setting Harga Bahan MMT",
    view: false,
    insert: false,
    update: false,
    delete: false,
    save: false,
  },
]);

const openPermissionModal = (user: any) => {
  selectedUser.value = user;
  // Di sini Anda bisa memuat data akses user dari backend berdasarkan user.kode
  showModal.value = true;
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

const savePermissions = () => {
  // Kirim data menuPermissions ke backend API menggunakan prefix kolom brg_ atau payload terkait
  showModal.value = false;
  alert("Hak akses berhasil disimpan!");
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
