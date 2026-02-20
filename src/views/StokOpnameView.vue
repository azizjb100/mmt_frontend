<template>
  <div class="opname-container">
    <div class="header-top">
      <h1>Stok Opname Gudang</h1>
      <div class="scan-wrapper">
        <input
          v-if="sessionID"
          v-model="scanInput"
          @keyup.enter="handleScan"
          ref="barcodeInput"
          placeholder="Scan Barcode di sini..."
          class="input-scan"
        />
        <div v-else class="start-actions">
          <select v-model="form.gdgKode" class="select-gdg">
            <option value="">Pilih Gudang</option>
            <option value="WH-16">WH-16</option>
            <option value="GPM">GPM</option>
          </select>
          <button @click="startOpname" class="btn-start">Mulai Sesi</button>
        </div>
      </div>
    </div>

    <div class="main-layout" v-if="sessionID">
      <div class="column col-filter">
        <div class="filter-header-area">
          <label class="label-bold-modern">Filter Barang</label>
          <p class="label-subtitle">Pilih kode barang untuk menyisir barcode</p>
        </div>

        <div class="dropdown-wrapper">
          <div
            class="custom-dropdown-trigger"
            :class="{ 'trigger-active': isDropdownOpen }"
            @click="isDropdownOpen = !isDropdownOpen"
          >
            <div class="trigger-content">
              <i class="icon-filter">🔍</i>
              <span v-if="selectedCodes.length === 0" class="placeholder"
                >Pilih Kode Barang...</span
              >
              <span
                v-else-if="selectedCodes.length === allGroups.length"
                class="selection-text"
                >Semua Kode Terpilih</span
              >
              <span v-else class="selection-text"
                >{{ selectedCodes.length }} Kode Aktif</span
              >
            </div>
            <span class="chevron" :class="{ rotate: isDropdownOpen }">▼</span>
          </div>

          <div v-if="isDropdownOpen" class="dropdown-panel animate-pop">
            <div class="panel-header">
              <button @click="selectAllCodes" class="btn-action-text">
                Pilih Semua
              </button>
              <div class="divider-v"></div>
              <button @click="selectedCodes = []" class="btn-action-text reset">
                Atur Ulang
              </button>
            </div>

            <div class="panel-list">
              <label
                v-for="group in allGroups"
                :key="group.Kode"
                class="panel-item"
              >
                <div class="checkbox-wrapper">
                  <input
                    type="checkbox"
                    :value="group.Kode"
                    v-model="selectedCodes"
                    class="real-checkbox"
                  />
                  <span class="custom-checkbox"></span>
                </div>
                <div class="item-info">
                  <span class="item-kode">{{ group.Kode }}</span>
                  <span class="item-count"
                    >{{ group.TotalBarcode }} Barcode</span
                  >
                </div>
              </label>
            </div>
          </div>
        </div>

        <div class="session-card">
          <div class="session-row">
            <span>Gudang</span>
            <span class="val">{{ form.gdgKode || "-" }}</span>
          </div>
          <div class="session-row">
            <span>ID Sesi</span>
            <span class="val-id">{{ sessionID }}</span>
          </div>
          <button @click="resetSession" class="btn-end-session">
            Selesaikan Sesi
          </button>
        </div>
      </div>

      <div class="column col-pending">
        <h3>
          Belum di scan
          <span class="badge-count" v-if="filteredPending.length > 0">
            {{ filteredPending.length }} Barcode
          </span>
        </h3>
        <div class="list-container">
          <div
            v-for="item in filteredPending"
            :key="item.Barcode"
            class="item-row pending"
          >
            <span class="barcode-text">{{ item.Barcode }}</span>
            <span class="item-name">{{ item.Nama_Bahan }}</span>
            <span class="item-kode-small">{{ item.Kode }}</span>
          </div>
          <div v-if="filteredPending.length === 0" class="empty-state">
            Tidak ada barcode pending untuk kode yang dipilih.
          </div>
        </div>
      </div>

      <div class="column col-done">
        <h3>List Barcode yang <span class="txt-green">sudah</span> di scan</h3>
        <div class="list-container">
          <div
            v-for="item in finishedItems"
            :key="item.Barcode"
            class="item-row done"
          >
            <div class="done-header">
              <span class="barcode-text">{{ item.Barcode }}</span>
              <span class="qty-badge">{{ item.opn_stok_fisik }} m</span>
            </div>
            <span class="item-name">{{ item.Nama_Bahan }}</span>
          </div>
          <div v-if="finishedItems.length === 0" class="empty-state">
            Belum ada barang di-scan
          </div>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content animate-in">
        <h2>Input Stok Fisik</h2>
        <div class="modal-item-info">
          <p class="txt-barcode">{{ scannedItem?.Barcode }}</p>
          <p class="txt-name">{{ scannedItem?.Nama_Bahan }}</p>
          <p class="txt-system">
            Stok Sistem: <strong>{{ scannedItem?.Stok_Sistem }} m</strong>
          </p>
        </div>

        <div class="modal-body">
          <label>Panjang Fisik (Meter)</label>
          <input
            type="number"
            v-model="form.fisik"
            ref="fisikInput"
            @keyup.enter="submitUpdate"
            class="input-fisik"
          />
        </div>

        <div class="modal-footer">
          <button @click="showModal = false" class="btn-cancel">Batal</button>
          <button @click="submitUpdate" class="btn-save">Simpan Data</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from "vue";
import axios from "axios";

// Config & State
const API_BASE = "http://localhost:8003/api/mmt/stok-opname";
const sessionID = ref(localStorage.getItem("opn_session"));
const filterSearch = ref("");
const scanInput = ref("");
const showModal = ref(false);
const scannedItem = ref(null);

const pendingItems = ref([]);
const finishedItems = ref([]);
const selectedCodes = ref([]);
const isDropdownOpen = ref(false);

const barcodeInput = ref(null);
const fisikInput = ref(null);

const form = reactive({
  gdgKode: "",
  user: "Karyawan_Gudang",
  fisik: 0,
});

const allGroups = computed(() => {
  const groups = {};
  pendingItems.value.forEach((item) => {
    if (!groups[item.Kode]) {
      groups[item.Kode] = {
        Kode: item.Kode,
        TotalBarcode: 0,
      };
    }
    groups[item.Kode].TotalBarcode++;
  });
  return Object.values(groups).sort((a, b) => a.Kode.localeCompare(b.Kode));
});

// 2. Fungsi Pilih Semua
const selectAllCodes = () => {
  selectedCodes.value = allGroups.value.map((g) => g.Kode);
};

// 3. Logika Filter Kolom Tengah (Hanya tampilkan yang dicentang)
const filteredPending = computed(() => {
  // Jika tidak ada yang dipilih, tampilkan semua (atau kosongkan, sesuai selera)
  if (selectedCodes.value.length === 0) return [];

  return pendingItems.value.filter((item) =>
    selectedCodes.value.includes(item.Kode),
  );
});

// LOGIC: Memulai Sesi
const startOpname = async () => {
  if (!form.gdgKode) return alert("Pilih gudang dulu!");
  try {
    const res = await axios.post(`${API_BASE}/start`, {
      gdgKode: form.gdgKode,
      user: form.user,
    });
    sessionID.value = res.data.sessionID;
    localStorage.setItem("opn_session", sessionID.value);
    localStorage.setItem("opn_gdg", form.gdgKode);
    loadData();
  } catch (e) {
    alert("Gagal memulai sesi. Periksa koneksi backend.");
  }
};

// LOGIC: Menangani Scan Barcode
const handleScan = async () => {
  if (!scanInput.value) return;
  try {
    const res = await axios.get(`${API_BASE}/scan`, {
      params: { barcode: scanInput.value, sessionID: sessionID.value },
    });

    const item = res.data.data;

    // Pastikan property name 'opn_status' sesuai dengan yang dikirim backend
    if (item.opn_status !== "PENDING") {
      alert(`⚠️ Barcode ${scanInput.value} SUDAH PERNAH DI-SCAN sebelumnya!`);
      scanInput.value = "";
      return;
    }

    scannedItem.value = item;
    form.fisik = item.Stok_Sistem;
    showModal.value = true;
    scanInput.value = "";

    await nextTick();
    document.querySelector(".input-fisik").focus();
  } catch (e) {
    alert("❌ Barcode tidak terdaftar dalam sesi ini!");
    scanInput.value = "";
  }
};

// LOGIC: Simpan Hasil Opname ke DB
const submitUpdate = async () => {
  if (form.fisik === null) return alert("Input fisik tidak boleh kosong");
  try {
    await axios.put(`${API_BASE}/update`, {
      sessionID: sessionID.value,
      barcode: scannedItem.value.Barcode,
      fisik: form.fisik,
    });
    showModal.value = false;
    await loadData();
    // Auto focus kembali ke input scan utama
    await nextTick();
    if (barcodeInput.value) barcodeInput.value.focus();
  } catch (e) {
    alert("Gagal simpan data");
  }
};

// LOGIC: Ambil Data dari Backend
const loadData = async () => {
  if (!sessionID.value) return;
  try {
    // Ambil SEMUA data barcode untuk sesi ini
    const res = await axios.get(`${API_BASE}/pending/${sessionID.value}`);
    const allItems = res.data.data;

    // LOGIKA PEMISAHAN KOLOM
    // 1. Barcode yang BELUM di scan (Status masih PENDING)
    pendingItems.value = allItems.filter((i) => i.opn_status === "PENDING");

    // 2. Barcode yang SUDAH di scan (Status sudah MATCHED atau DISCREPANCY)
    finishedItems.value = allItems.filter((i) => i.opn_status !== "PENDING");
  } catch (e) {
    console.error("Gagal memuat data awal:", e);
  }
};

// COMPUTED: Grouping data per Kode Barang untuk kolom Filter
const groupedPending = computed(() => {
  const groups = {};
  const filtered = pendingItems.value.filter(
    (i) =>
      i.Kode.toLowerCase().includes(filterSearch.value.toLowerCase()) ||
      i.Nama_Bahan.toLowerCase().includes(filterSearch.value.toLowerCase()),
  );

  filtered.forEach((item) => {
    if (!groups[item.Kode]) {
      groups[item.Kode] = {
        Kode: item.Kode,
        Nama: item.Nama_Bahan,
        TotalStok: 0,
        Barcodes: [],
      };
    }
    groups[item.Kode].TotalStok += parseFloat(item.opn_stok_sistem || 0);
    groups[item.Kode].Barcodes.push(item.Barcode);
  });
  return Object.values(groups);
});

const resetSession = () => {
  if (
    confirm(
      "Hapus sesi ini dan tutup aplikasi? Data yang belum tersimpan akan hilang.",
    )
  ) {
    localStorage.clear();
    location.reload();
  }
};

onMounted(async () => {
  // Ambil data gudang dari localStorage jika ada
  const savedGdg = localStorage.getItem("opn_gdg");

  if (sessionID.value) {
    // 1. Kembalikan nilai gudang ke reactive form agar UI sinkron
    if (savedGdg) {
      form.gdgKode = savedGdg;
    }

    // 2. Jalankan loadData untuk mengambil semua barcode (Pending & Done)
    await loadData();

    // 3. (Opsi Tambahan) Focus otomatis ke input scan jika sesi sudah aktif
    await nextTick();
    if (barcodeInput.value) {
      barcodeInput.value.focus();
    }
  }
});
</script>

<style scoped>
.filter-actions {
  display: flex;
  gap: 5px;
  margin-bottom: 10px;
}
.btn-mini {
  font-size: 11px;
  padding: 4px 8px;
  cursor: pointer;
  background: #e2e8f0;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
}
.group-checkbox-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px;
  border-bottom: 1px solid #f1f5f9;
}
.group-checkbox-item:hover {
  background: #f8fafc;
}
.group-label {
  display: flex;
  justify-content: space-between;
  width: 100%;
  cursor: pointer;
}
.group-count {
  font-size: 11px;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 10px;
}
.badge-count {
  background: #ff4d4f;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 14px;
  margin-left: 10px;
}
.opname-container {
  padding: 20px;
  font-family: "Segoe UI", Tahoma, sans-serif;
  background: #f0f2f5;
  min-height: 100vh;
  color: #1c1e21;
}

/* Header Area */
.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  background: white;
  padding: 15px 25px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
.header-top h1 {
  font-size: 22px;
  margin: 0;
  color: #2563eb;
}
.input-scan {
  padding: 12px 20px;
  width: 350px;
  border: 2px solid #2563eb;
  border-radius: 6px;
  font-size: 16px;
  outline: none;
  transition: box-shadow 0.2s;
}
.input-scan:focus {
  box-shadow: 0 0 8px rgba(37, 99, 235, 0.3);
}

/* Layout 3 Kolom */
.main-layout {
  display: flex;
  gap: 20px;
  height: 78vh;
}
.column {
  background: white;
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
}

.col-filter {
  flex: 1;
}
.col-pending {
  flex: 1.5;
  border-top: 4px solid #ff4d4f;
}
.col-done {
  flex: 1.5;
  border-top: 4px solid #52c41a;
}

/* Filter & Grouping Card */
.title-list {
  font-weight: bold;
  font-size: 13px;
  color: #8c8c8c;
  margin: 15px 0 10px 0;
  text-transform: uppercase;
}
.search-results-container {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 10px;
}
.group-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 10px;
}
.group-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}
.group-kode {
  font-weight: bold;
  color: #1e293b;
  font-size: 14px;
}
.group-stok {
  background: #2563eb;
  color: white;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 11px;
}
.group-nama {
  font-size: 12px;
  color: #64748b;
  line-height: 1.4;
}
.group-barcode-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}
.mini-barcode {
  font-size: 9px;
  background: white;
  border: 1px solid #cbd5e1;
  padding: 1px 4px;
  border-radius: 3px;
  font-family: monospace;
}

/* Items List */
.list-container {
  flex: 1;
  overflow-y: auto;
}
.item-row {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}
.item-row:hover {
  background: #fafafa;
}
.barcode-text {
  font-weight: bold;
  font-size: 15px;
  display: block;
  color: #262626;
}
.item-name {
  font-size: 13px;
  color: #595959;
}
.item-kode-small {
  font-size: 11px;
  color: #bfbfbf;
  display: block;
}

.done-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.qty-badge {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  color: #52c41a;
  padding: 2px 10px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 14px;
}

/* Modal & UI Elements */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}
.modal-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  width: 450px;
  text-align: center;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
.modal-item-info {
  background: #f8fafc;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}
.txt-barcode {
  font-weight: bold;
  font-size: 18px;
  margin: 0;
  color: #2563eb;
}
.txt-name {
  font-size: 14px;
  color: #64748b;
  margin: 5px 0;
}
/* Header Label */
.filter-header-area {
  margin-bottom: 20px;
}
.label-bold-modern {
  font-size: 18px;
  font-weight: 800;
  color: #1e293b;
  display: block;
}
.label-subtitle {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

/* Dropdown Main */
.dropdown-wrapper {
  position: relative;
  width: 100%;
}

.custom-dropdown-trigger {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background: #ffffff;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.custom-dropdown-trigger:hover {
  border-color: #3b82f6;
  background: #f8faff;
}

.trigger-active {
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.trigger-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.selection-text {
  font-weight: 600;
  color: #2563eb;
}

.placeholder {
  color: #94a3b8;
}

/* Panel Content */
.dropdown-panel {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  right: 0;
  background: white;
  border-radius: 16px;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid #e2e8f0;
  z-index: 50;
  overflow: hidden;
}

.panel-header {
  display: flex;
  padding: 12px;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
}

.btn-action-text {
  flex: 1;
  background: none;
  border: none;
  font-size: 12px;
  font-weight: 700;
  color: #3b82f6;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background 0.2s;
}

.btn-action-text:hover {
  background: #eff6ff;
}
.btn-action-text.reset {
  color: #ef4444;
}
.btn-action-text.reset:hover {
  background: #fef2f2;
}

.divider-v {
  width: 1px;
  background: #e2e8f0;
  margin: 5px 0;
}

.panel-list {
  max-height: 280px;
  overflow-y: auto;
  padding: 8px;
}

/* Item Style */
.panel-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
}

.panel-item:hover {
  background: #f1f5f9;
}

.item-info {
  display: flex;
  justify-content: space-between;
  flex: 1;
  align-items: center;
}

.item-kode {
  font-weight: 700;
  color: #334155;
  font-size: 14px;
}

.item-count {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 20px;
}

/* Custom Checkbox Design */
.checkbox-wrapper {
  position: relative;
  width: 20px;
  height: 20px;
}

.real-checkbox {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.custom-checkbox {
  position: absolute;
  top: 0;
  left: 0;
  height: 20px;
  width: 20px;
  background-color: #fff;
  border: 2px solid #cbd5e1;
  border-radius: 6px;
  transition: all 0.2s;
}

.real-checkbox:checked ~ .custom-checkbox {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

.custom-checkbox:after {
  content: "";
  position: absolute;
  display: none;
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.real-checkbox:checked ~ .custom-checkbox:after {
  display: block;
}

/* Session Card */
.session-card {
  margin-top: auto;
  background: #1e293b;
  border-radius: 16px;
  padding: 20px;
  color: white;
}

.session-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 8px;
  color: #94a3b8;
}

.val {
  color: #3b82f6;
  font-weight: 700;
}
.val-id {
  color: white;
  font-family: monospace;
  font-size: 11px;
}

.btn-end-session {
  width: 100%;
  margin-top: 15px;
  background: #ef4444;
  border: none;
  color: white;
  padding: 10px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-end-session:hover {
  opacity: 0.9;
}

/* Utility */
.rotate {
  transform: rotate(180deg);
}
.chevron {
  font-size: 10px;
  color: #94a3b8;
  transition: transform 0.3s;
}

@keyframes pop {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
.animate-pop {
  animation: pop 0.2s ease-out;
}
.input-fisik {
  width: 80%;
  font-size: 40px;
  text-align: center;
  margin: 15px 0;
  padding: 10px;
  border: 3px solid #e2e8f0;
  border-radius: 8px;
  color: #1e293b;
  outline: none;
}
.input-fisik:focus {
  border-color: #2563eb;
}

.btn-save {
  background: #2563eb;
  color: white;
  border: none;
  padding: 12px 30px;
  cursor: pointer;
  border-radius: 6px;
  font-weight: bold;
  font-size: 16px;
}
.btn-cancel {
  background: #f1f5f9;
  color: #475569;
  border: none;
  padding: 12px 30px;
  margin-right: 10px;
  cursor: pointer;
  border-radius: 6px;
  font-weight: bold;
}
.btn-reset {
  margin-top: 10px;
  background: none;
  border: 1px solid #ff4d4f;
  color: #ff4d4f;
  padding: 5px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  width: 100%;
}

.input-full {
  width: 100%;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  box-sizing: border-box;
}
.label-bold {
  font-weight: bold;
  font-size: 14px;
  color: #434343;
  display: block;
  margin-bottom: 8px;
}
.txt-red {
  color: #f5222d;
}
.txt-green {
  color: #52c41a;
}
.empty-state {
  text-align: center;
  color: #bfbfbf;
  padding: 30px;
  font-size: 13px;
}

/* Animation */
.animate-in {
  animation: modalShow 0.3s ease-out;
}
@keyframes modalShow {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
