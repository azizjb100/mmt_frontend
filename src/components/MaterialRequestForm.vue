<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import api from "@/services/api";
import { useAuthStore } from "@/stores/authStore";

const authStore = useAuthStore();
const currentUser = authStore.currentUser;

// [PENTING] Sesuaikan dengan port backend Anda
// Rute /api/requests ini BELUM kita buat di backend
const API_URL = "/requests";

// Ini adalah data "state" pengganti field di Tfrmmintabahan_mmt
const header = ref({
  nomor: "",
  tanggal: new Date().toISOString().split("T")[0],
  gudang: "WH-16",
  keterangan: "",
  accReq: "N",
  acc: "N",
});

// Ini adalah pengganti FCDS (TClientDataSet)
const details = ref([]);

const addNewRow = () => {
  details.value.push({
    spk: "",
    sku: "",
    namaBarang: "",
    qty: 0,
    satuan: "",
    keterangan: "",
  });
};

const deleteRow = (index) => {
  details.value.splice(index, 1);
  if (details.value.length === 0) {
    addNewRow();
  }
};

const fetchNewNumber = async () => {
  try {
    // API ini akan error sampai kita membuatnya di backend
    const res = await api.get(
      `${API_URL}/new-number?tanggal=${header.value.tanggal}`
    );
    header.value.nomor = res.data.newNumber;
  } catch (error) {
    console.error("Gagal mendapatkan nomor baru:", error);
    alert(
      "Gagal mendapatkan nomor baru. Backend /api/requests mungkin belum siap."
    );
    // Kita set nomor manual agar tidak error
    header.value.nomor = "MMT.WEB.2511.0001";
  }
};

const saveData = async () => {
  if (
    details.value.length === 0 ||
    details.value.every((d) => !d.sku || d.qty === 0)
  ) {
    alert("Data detail barang masih kosong atau QTY 0");
    return;
  }

  // [PERBAIKAN] Ambil user dari 'currentUser' yang diimpor
  const kdUser = currentUser.value?.kdUser || "USER_WEB";

  const payload = {
    header: header.value,
    details: details.value,
    user: kdUser, // Kirim user yang sedang login
  };

  try {
    // API ini juga akan error sampai kita membuatnya
    const res = await api.post(API_URL, payload);
    alert(res.data.message);
    refreshData();
  } catch (error) {
    console.error("Gagal menyimpan data:", error);
    alert("Gagal menyimpan data: " + error.response?.data?.message);
  }
};

const refreshData = () => {
  header.value = {
    nomor: "",
    tanggal: new Date().toISOString().split("T")[0],
    gudang: "WH-16",
    keterangan: "",
    accReq: "N",
    acc: "N",
  };
  details.value = [];
  fetchNewNumber();
  addNewRow();
};

// Pengganti FormShow
onMounted(() => {
  refreshData();
});

// --- TODO: Implementasi Form Bantuan ---
const openGudangHelp = () => {
  alert("TODO: Buka Modal Bantuan Gudang");
};

const openSpkHelp = (index) => {
  alert("TODO: Buka Modal Bantuan SPK untuk baris " + (index + 1));
};

const openSkuHelp = (index) => {
  alert("TODO: Buka Modal Bantuan SKU (barang) untuk baris " + (index + 1));
};
</script>

<template>
  <div class="form-container">
    <h2>Form Permintaan Bahan MMT</h2>
    <p>Ini adalah halaman yang meniru form Delphi ufrmmintabahan_mmt Anda.</p>

    <div class="header-panel">
      <div>
        <label>Nomor:</label>
        <input type="text" v-model="header.nomor" readonly />
      </div>
      <div>
        <label>Tanggal:</label>
        <input type="date" v-model="header.tanggal" @change="fetchNewNumber" />
      </div>
      <div>
        <label>Gudang:</label>
        <input type="text" v-model="header.gudang" />
        <button @click="openGudangHelp">...</button>
      </div>
      <div>
        <label>Keterangan:</label>
        <textarea v-model="header.keterangan"></textarea>
      </div>
    </div>

    <div class="grid-panel">
      <h3>Detail Barang</h3>
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>SPK</th>
            <th>SKU</th>
            <th>Nama Barang</th>
            <th>QTY</th>
            <th>Satuan</th>
            <th>Keterangan</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in details" :key="index">
            <td>{{ index + 1 }}</td>
            <td>
              <input type="text" v-model="item.spk" />
              <button @click="openSpkHelp(index)">...</button>
            </td>
            <td>
              <input type="text" v-model="item.sku" />
              <button @click="openSkuHelp(index)">...</button>
            </td>
            <td><input type="text" v-model="item.namaBarang" readonly /></td>
            <td><input type="number" v-model.number="item.qty" /></td>
            <td><input type="text" v-model="item.satuan" /></td>
            <td><input type="text" v-model="item.keterangan" /></td>
            <td>
              <button @click="deleteRow(index)" class="btn-hapus">Hapus</button>
            </td>
          </tr>
        </tbody>
      </table>
      <button @click="addNewRow" class="btn-tambah">Tambah Baris</button>
    </div>

    <div class="approval-panel">
      <div>
        <label>Request:</label>
        <select v-model="header.accReq">
          <option value="N">N</option>
          <option value="Y">Y</option>
        </select>
      </div>
      <div>
        <label>ACC:</label>
        <select v-model="header.acc">
          <option value="N">N</option>
          <option value="Y">Y</option>
        </select>
      </div>
    </div>

    <div class="action-panel">
      <button @click="saveData" class="btn-simpan">Simpan</button>
      <button @click="refreshData" class="btn-batal">Batal</button>
    </div>
  </div>
</template>

<style scoped>
/* Ini adalah CSS sederhana, bisa diganti dengan framework seperti Vuetify/Quasar */
.form-container {
  font-family: Arial, sans-serif;
  max-width: 1200px;
  margin: auto;
}
.header-panel,
.grid-panel,
.approval-panel,
.action-panel {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
.header-panel div,
.approval-panel div {
  margin-bottom: 10px;
}
label {
  font-weight: bold;
  width: 100px;
  display: inline-block;
}
input[type="text"],
input[type="date"],
input[type="number"],
textarea,
select {
  width: 250px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
textarea {
  width: 400px;
  height: 60px;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}
th,
td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}
th {
  background-color: #f4f4f4;
}
td input {
  width: 95%;
  box-sizing: border-box;
}
.action-panel {
  text-align: right;
}
button {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 5px;
  font-weight: bold;
}
.btn-simpan {
  background-color: #007bff;
  color: white;
}
.btn-batal {
  background-color: #6c757d;
  color: white;
}
.btn-tambah {
  background-color: #28a745;
  color: white;
}
.btn-hapus {
  background-color: #dc3545;
  color: white;
  padding: 5px 8px;
}
</style>
