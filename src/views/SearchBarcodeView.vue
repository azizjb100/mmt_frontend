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
            <span class="th-barcode">Barcode</span>
            <span class="th-name">Nama Barang</span>
            <span class="th-qty text-right">Stok</span>
          </div>

          <transition-group name="list">
            <div
              v-for="item in filteredList"
              :key="item.Barcode"
              class="history-card"
              :class="{ 'is-active': lastScanned?.Barcode === item.Barcode }"
            >
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
import axios from "axios";

// Config
const API_URL = "/mmt/search-barcode";
const scanInput = ref("");
const listSearchQuery = ref("");
const selectedBrgKode = ref("");
const selectedGdg = ref(""); // State baru untuk Gudang
const lastScanned = ref(null);
const fullInventory = ref([]);
const barcodeInput = ref(null);

// Ambil list unik kode barang untuk dropdown filter
const uniqueBrgCodes = computed(() => {
  const codes = fullInventory.value.map((i) => i.Kode);
  return [...new Set(codes)].sort();
});

// Logic Filter Local (Search bar mini)
const filteredList = computed(() => {
  return fullInventory.value.filter((item) => {
    return (
      item.Barcode.toLowerCase().includes(
        listSearchQuery.value.toLowerCase(),
      ) ||
      item.Nama_Bahan.toLowerCase().includes(
        listSearchQuery.value.toLowerCase(),
      ) ||
      item.Kode.toLowerCase().includes(listSearchQuery.value.toLowerCase())
    );
  });
});

// Ambil data dari backend dengan parameter filter
const fetchInventoryList = async () => {
  try {
    const res = await axios.get(`${API_URL}/list`, {
      params: {
        brg_kode: selectedBrgKode.value,
        gdg_kode: selectedGdg.value, // Kirim filter gudang ke backend
      },
    });
    fullInventory.value = res.data.data;
  } catch (e) {
    console.error("Gagal memuat list", e);
  }
};

// Handle Scan Barcode
const handleCheck = async () => {
  if (!scanInput.value) return;
  const barcode = scanInput.value.trim();

  try {
    const res = await axios.get(`${API_URL}/quick-check`, {
      params: { barcode: barcode },
    });

    if (res.data.success) {
      lastScanned.value = res.data.data;

      // Jika barcode ada di gudang/kode berbeda dari filter aktif, reset filter agar item muncul di list
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
    barcodeInput.value.focus();
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
/* Tambahan Style untuk Filter Gudang */
.gdg-select {
  border-color: #10b981 !important;
  color: #047857 !important;
  background-color: #f0fdf4 !important;
}

.badge-gdg {
  background: #fbbf24;
  color: #78350f;
  padding: 4px 12px;
  border-radius: 6px;
  font-weight: bold;
}

.txt-gdg {
  color: #10b981;
  font-weight: bold;
  margin-right: 5px;
}

/* Style original yang dipertahankan */
.check-stok-container {
  padding: 25px;
  background: #f4f7fa;
  min-height: 100vh;
  font-family: "Inter", sans-serif;
}

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

.input-main {
  width: 250px;
  padding: 12px 15px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 16px;
}

.input-main:focus {
  border-color: #3b82f6;
  background: white;
}

.content-layout {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 25px;
}

.empty-detail-state {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed #cbd5e1;
  border-radius: 20px;
  color: #94a3b8;
  text-align: center;
}

.card-highlight {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  color: white;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.barcode-title {
  font-size: 28px;
  font-family: monospace;
  color: #fbbf24;
  margin: 15px 0;
}

.info-grid {
  display: grid;
  gap: 20px;
}

.info-item label {
  display: block;
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.info-item span {
  font-size: 18px;
  font-weight: 600;
  display: block;
}

.qty-focus {
  font-size: 28px !important;
  color: #fbbf24;
}

.history-panel {
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.input-mini-search {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
}

.table-header {
  display: flex;
  padding: 10px 15px;
  background: #f8fafc;
  font-size: 12px;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
}

.th-barcode {
  flex: 1.5;
}
.th-name {
  flex: 3;
}
.th-qty {
  flex: 1;
  text-align: right;
}

.list-container {
  max-height: 65vh;
  overflow-y: auto;
}

.history-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid #f1f5f9;
  transition: all 0.2s;
}

.history-card.is-active {
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
}

.history-barcode {
  font-family: monospace;
  font-weight: bold;
  color: #1e293b;
}

.history-name {
  font-size: 13px;
  color: #64748b;
}

.stok-tag {
  background: #dcfce7;
  color: #15803d;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: bold;
  font-size: 14px;
}

.count-badge {
  background: #3b82f6;
  color: white;
  padding: 2px 8px;
  border-radius: 5px;
  font-size: 12px;
  margin-left: 5px;
}

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

.btn-clear {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 10px 15px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  color: #475569;
}

.btn-clear:hover {
  background: #e2e8f0;
}
</style>
