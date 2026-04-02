<template>
  <div class="check-stok-container">
    <div class="header-search">
      <div class="brand">
        <div class="icon-circle">🔍</div>
        <div>
          <h1>Cek Detail Stok</h1>
          <p class="subtitle">
            Scan barcode atau filter berdasarkan gudang dan kode barang
          </p>
        </div>
      </div>

      <div class="search-box">
        <div class="filter-group">
          <select
            v-model="selectedGdg"
            @change="fetchInventoryList"
            class="select-modern gdg-select"
          >
            <option value="">Semua Gudang</option>
            <option value="WH-16">WH-16 (Utama)</option>
            <option value="GPM">GPM (Bahan)</option>
          </select>
        </div>

        <div class="filter-group">
          <select
            v-model="selectedBrgKode"
            @change="fetchInventoryList"
            class="select-modern"
          >
            <option value="">-- Semua Kode Barang --</option>
            <option v-for="item in uniqueBrgCodes" :key="item" :value="item">
              {{ item }}
            </option>
          </select>
        </div>

        <div class="input-wrapper">
          <input
            v-model="scanInput"
            @keyup.enter="handleCheck"
            ref="barcodeInput"
            placeholder="Scan Barcode..."
            class="input-main"
            autofocus
          />
          <kbd>ENTER</kbd>
        </div>
        <button @click="clearDisplay" class="btn-clear">Refresh</button>
      </div>
    </div>

    <div class="content-layout">
      <div class="detail-panel">
        <div v-if="lastScanned" class="card-highlight animate-pop">
          <div class="badge-status">HASIL SCAN TERAKHIR</div>
          <h2 class="barcode-title">{{ lastScanned.Barcode }}</h2>
          <div class="info-grid">
            <div class="info-item">
              <label>Nama Barang</label>
              <span>{{ lastScanned.Nama_Bahan }}</span>
            </div>
            <div class="info-item">
              <label>Kode Item</label>
              <span>{{ lastScanned.Kode }}</span>
            </div>
            <div class="info-item">
              <label>Stok Sistem</label>
              <span class="qty-focus">{{ lastScanned.Stok_Sistem }} m</span>
            </div>
            <div class="info-item">
              <label>Gudang</label>
              <span class="badge-gdg">{{ lastScanned.Gudang }}</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-detail-state">
          <p>Scan barcode untuk melihat detail instan di sini</p>
        </div>

        <button
          v-if="scannedBarcodes.size > 0"
          @click="resetAllScans"
          class="btn-reset-all"
        >
          Reset Status Scan (Mulai Ulang)
        </button>
      </div>

      <div class="history-panel">
        <div class="panel-header">
          <h3>
            Daftar Inventaris
            <span class="count-badge">{{ filteredList.length }} Barcode</span>
          </h3>
          <div class="search-list-wrapper">
            <input
              v-model="listSearchQuery"
              placeholder="Cari di list..."
              class="input-mini-search"
            />
          </div>
        </div>

        <div class="list-container">
          <div class="table-header">
            <span class="th-status">Status</span>
            <span class="th-barcode">Barcode</span>
            <span class="th-name">Nama Barang</span>
            <span class="th-qty text-right">Stok</span>
          </div>

          <transition-group name="list">
            <div
              v-for="item in filteredList"
              :key="item.Barcode"
              class="history-card"
              :class="{
                'is-active': lastScanned?.Barcode === item.Barcode,
                'is-scanned': scannedBarcodes.has(item.Barcode),
              }"
            >
              <div class="card-status">
                <span
                  v-if="scannedBarcodes.has(item.Barcode)"
                  class="check-mark"
                  >✅</span
                >
                <span v-else class="pending-mark">⭕</span>
              </div>
              <div class="card-left">
                <span class="history-barcode">{{ item.Barcode }}</span>
                <span class="history-name">
                  <small class="txt-gdg">[{{ item.Gudang }}]</small>
                  {{ item.Kode }} - {{ item.Nama_Bahan }}
                </span>
              </div>
              <div class="card-right">
                <div class="stok-tag">{{ item.Stok_Sistem }} m</div>
              </div>
            </div>
          </transition-group>

          <div v-if="filteredList.length === 0" class="empty-state">
            <p>Tidak ada data ditemukan.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import api from "@/services/api";

const API_URL = "/mmt/search-barcode";
const scanInput = ref("");
const listSearchQuery = ref("");
const selectedBrgKode = ref("");
const selectedGdg = ref("");
const lastScanned = ref(null);
const fullInventory = ref([]);
const barcodeInput = ref(null);

// Simpan daftar barcode yang sudah di-scan (Set agar unik)
const scannedBarcodes = ref(new Set());

const uniqueBrgCodes = computed(() => {
  const codes = fullInventory.value.map((i) => i.Kode);
  return [...new Set(codes)].sort();
});

const filteredList = computed(() => {
  return fullInventory.value.filter((item) => {
    const query = listSearchQuery.value.toLowerCase();
    return (
      item.Barcode.toLowerCase().includes(query) ||
      item.Nama_Bahan.toLowerCase().includes(query) ||
      item.Kode.toLowerCase().includes(query)
    );
  });
});

const fetchInventoryList = async () => {
  try {
    const res = await api.get(`${API_URL}/list`, {
      params: {
        brg_kode: selectedBrgKode.value,
        gdg_kode: selectedGdg.value,
      },
    });
    fullInventory.value = res.data.data;
  } catch (e) {
    console.error("Gagal memuat list", e);
  }
};

const handleCheck = async () => {
  if (!scanInput.value) return;
  const barcode = scanInput.value.trim();

  try {
    const res = await api.get(`${API_URL}/quick-check`, {
      params: { barcode: barcode },
    });

    if (res.data.success) {
      lastScanned.value = res.data.data;

      // TAMBAHKAN: Masukkan ke daftar barcode yang sudah di-scan
      scannedBarcodes.value.add(barcode);

      const itemExists = fullInventory.value.find((i) => i.Barcode === barcode);
      if (!itemExists) {
        selectedBrgKode.value = "";
        selectedGdg.value = "";
        await fetchInventoryList();
      }
    }
  } catch (e) {
    alert(e.response?.data?.message || "Barcode tidak ditemukan");
  } finally {
    scanInput.value = "";
    if (barcodeInput.value) barcodeInput.value.focus();
  }
};

// Tombol Reset Status (BARU)
const resetAllScans = () => {
  if (confirm("Reset semua tanda scan? Riwayat centang akan hilang.")) {
    scannedBarcodes.value.clear();
    lastScanned.value = null;
  }
};

const clearDisplay = () => {
  selectedBrgKode.value = "";
  selectedGdg.value = "";
  listSearchQuery.value = "";
  lastScanned.value = null;
  fetchInventoryList();
};

onMounted(() => {
  fetchInventoryList();
});
</script>

<style scoped>
/* ==========================================================================
   1. Container & Layout Utama
   ========================================================================== */
.check-stok-container {
  padding: 25px;
  background: #f4f7fa;
  min-height: 100vh;
  font-family: "Inter", sans-serif;
}

.content-layout {
  display: grid;
  grid-template-columns: 1fr 1.7fr; /* Panel kanan diperlebar sedikit */
  gap: 25px;
}

/* ==========================================================================
   2. Header & Search Area
   ========================================================================== */
.header-search {
  background: white;
  padding: 20px 30px;
  border-radius: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-bottom: 25px;
}

.search-box {
  display: flex;
  gap: 12px;
  align-items: center;
}

.select-modern {
  padding: 10px 15px;
  border-radius: 8px;
  border: 2px solid #e2e8f0;
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  outline: none;
  min-width: 140px;
}

.gdg-select {
  border-color: #10b981 !important;
  color: #047857 !important;
  background-color: #f0fdf4 !important;
}

.input-main {
  width: 250px;
  padding: 12px 15px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 16px;
}

/* ==========================================================================
   3. Table / List Styling (PENYEBAB TIDAK RAPI)
   ========================================================================== */
.history-panel {
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Base struktur untuk Header dan Row agar sejajar lurus */
.table-header,
.history-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 15px;
}

.table-header {
  background: #f8fafc;
  font-size: 11px;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  border-radius: 8px;
  margin-bottom: 5px;
}

/* Kolom Status (Icon Bulat) - Dibuat Fixed Width */
.th-status,
.card-status {
  width: 40px;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
}

/* Kolom Barcode & Name - Dibuat Flexible */
.th-barcode,
.card-left {
  flex: 1; /* Mengambil sisa ruang */
  display: flex;
  flex-direction: column;
  min-width: 0; /* Mencegah overflow */
}

/* Kolom Qty / Stok - Dibuat Fixed Width */
.th-qty,
.card-right {
  width: 80px;
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
}

/* Row Styling */
.history-card {
  border-bottom: 1px solid #f1f5f9;
  transition: all 0.2s;
}

.history-card.is-active {
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
}

.history-card.is-scanned {
  background-color: #f0fdf4;
  border-left: 4px solid #10b981;
}

/* Text Styling di dalam list */
.history-barcode {
  font-family: monospace;
  font-weight: bold;
  color: #1e293b;
  font-size: 14px;
}

.history-name {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.txt-gdg {
  color: #10b981;
  font-weight: bold;
  font-size: 10px;
  margin-left: 4px;
}

.stok-tag {
  background: #dcfce7;
  color: #15803d;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: bold;
  font-size: 13px;
  min-width: 65px;
  text-align: center;
}

/* ==========================================================================
   4. Detail Panel (Highlight)
   ========================================================================== */
.card-highlight {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  color: white;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 20px;
}

.badge-gdg {
  background: #fbbf24;
  color: #78350f;
  padding: 4px 12px;
  border-radius: 6px;
  font-weight: bold;
  font-size: 12px;
}

/* ==========================================================================
   5. Buttons & Utilities
   ========================================================================== */
.btn-reset-all {
  width: 100%;
  margin-top: 15px;
  padding: 12px;
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-reset-all:hover {
  opacity: 0.9;
}

.btn-clear {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 10px 15px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  color: #475569;
}

.count-badge {
  background: #3b82f6;
  color: white;
  padding: 2px 8px;
  border-radius: 5px;
  font-size: 11px;
}

/* Animations */
.animate-pop {
  animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes pop {
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
