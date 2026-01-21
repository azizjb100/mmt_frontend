<template>
  <div class="lookup-modal-overlay" @click.self="$emit('close')">
    <div class="lookup-modal">
      <h3>Pilih Nomor LHK Mesin</h3>

      <div class="filter-controls">
        <label for="startDate">Dari Tanggal:</label>
        <input type="date" id="startDate" v-model="startDate" />
        <label for="endDate">Sampai Tanggal:</label>
        <input type="date" id="endDate" v-model="endDate" />
        <button @click="fetchHeaders" class="btn-search" :disabled="isLoading">
          {{ isLoading ? "Mencari..." : "Cari Data" }}
        </button>
      </div>

      <div class="table-container header-table">
        <table>
          <thead>
            <tr>
              <th>Nomor LHK</th>
              <th>Tanggal</th>
              <th>Mesin</th>
              <th>No. SPK</th>
              <th>Nama Order</th>
              <th>Total Cetak</th>
              <th>Shift</th>
              <th>Operator</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="headers.length === 0 && !isLoading">
              <td colspan="9" style="text-align: center">
                Tidak ada data LHK Mesin ditemukan dalam rentang tanggal ini.
              </td>
            </tr>
            <tr
              v-for="header in headers"
              :key="header.Nomor"
              :class="{
                'selected-row': selectedHeader?.Nomor === header.Nomor,
              }"
              @click="selectHeader(header)"
              @dblclick="confirmSelection(header)"
            >
              <td>{{ header.Nomor }}</td>
              <td>{{ formatDate(header.Tanggal) }}</td>
              <td>{{ header.Mesin }}</td>
              <td>{{ header.NomorSPK }}</td>
              <td>{{ header.NamaOrder }}</td>
              <td>{{ header.TotalCetak }}</td>
              <td>{{ header.Shift }}</td>
              <td>{{ header.Operator }}</td>
              <td>
                <button
                  @click.stop="confirmSelection(header)"
                  class="btn-select"
                >
                  Pilih
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="selectedHeader" class="details-section">
        <h4>Detail LHK: {{ selectedHeader.Nomor }}</h4>
        <div class="table-container detail-table">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Ambil Bahan (Panjang)</th>
                <th>Total Cetak (Qty)</th>
                <th>Total Cetak (Meter)</th>
                <th>Sisa Panjang</th>
                <th>Sisa Lebar BS</th>
                <th>Roll</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="detail in details" :key="detail.NoUrut">
                <td>{{ detail.NoUrut }}</td>
                <td>{{ detail.AmbilBahanPanjang }}</td>
                <td>{{ detail.TotalCetak }}</td>
                <td>{{ detail.Total_Cetak_Meter }}</td>
                <td>{{ detail.Sisa_Panjang }}</td>
                <td>{{ detail.Sisa_Lebar_BS }}</td>
                <td>{{ detail.Roll }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="$emit('close')" class="btn-cancel">Batal</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { format } from "date-fns";
import api from "@/services/api"; // Asumsi Anda memiliki instance Axios di sini

// --- Props & Emits ---
const emit = defineEmits(["select", "close"]);

// --- State Data ---
const startDate = ref(format(new Date(), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));
const headers = ref([]);
const details = ref([]);
const selectedHeader = ref(null);
const isLoading = ref(false);

// --- Functions ---

const formatDate = (dateString) => {
  if (!dateString) return "-";
  // Asumsi dateString adalah format yang dapat di-parse (YYYY-MM-DD atau sejenisnya)
  try {
    return format(new Date(dateString), "dd-MM-yyyy");
  } catch {
    return dateString;
  }
};

const fetchHeaders = async () => {
  isLoading.value = true;
  selectedHeader.value = null;
  details.value = [];
  try {
    // Panggil fungsi backend getAllHeaders
    const response = await api.get("mmt/lhk-cetak/lookup", {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
      },
    });
    headers.value = response.data;
  } catch (error) {
    console.error("Gagal mengambil data header LHK Mesin:", error);
    alert("Gagal mengambil data. Cek koneksi API.");
    headers.value = [];
  } finally {
    isLoading.value = false;
  }
};

const fetchDetails = async (nomor) => {
  details.value = [];
  try {
    // Panggil fungsi backend getDetailsByNomor
    const response = await api.get(`mmt//lhk-cetak/lookup/${nomor}`);
    details.value = response.data;
  } catch (error) {
    console.error("Gagal mengambil data detail LHK Mesin:", error);
    alert("Gagal mengambil data detail.");
  }
};

const selectHeader = (header) => {
  selectedHeader.value = header;
  fetchDetails(header.Nomor);
};

const confirmSelection = async (header) => {
  // Opsional: Pastikan detail sudah terambil jika diperlukan oleh parent
  if (!details.value.length || selectedHeader.value?.Nomor !== header.Nomor) {
    await fetchDetails(header.Nomor);
  }

  // Mengirim seluruh data header terpilih kembali ke komponen induk
  emit("select", header);
  emit("close");
};

// --- Lifecycle Hook ---
onMounted(() => {
  fetchHeaders();
});
</script>

<style scoped>
/* Styling Modal */
.lookup-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.lookup-modal {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 1200px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.lookup-modal h3 {
  margin-top: 0;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

/* Filter Controls */
.filter-controls {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 15px;
}

.filter-controls input {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.btn-search {
  padding: 8px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-search:disabled {
  background-color: #a0c9e6;
  cursor: not-allowed;
}

/* Table Styling */
.table-container {
  overflow-y: auto;
  margin-bottom: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.header-table {
  max-height: 300px; /* Batasi tinggi tabel header */
}

.detail-table {
  max-height: 200px; /* Batasi tinggi tabel detail */
}

table {
  width: 100%;
  border-collapse: collapse;
}

table th,
table td {
  padding: 10px;
  border-bottom: 1px solid #eee;
  text-align: left;
  font-size: 0.9em;
}

table th {
  background-color: #f1f1f1;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-table tbody tr:hover {
  background-color: #f0f8ff;
  cursor: pointer;
}

.selected-row {
  background-color: #e0f0ff !important;
  font-weight: bold;
}

.btn-select {
  padding: 5px 10px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* Details Section */
.details-section {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #007bff;
  border-radius: 4px;
  background-color: #f7fcff;
}

/* Footer */
.modal-footer {
  margin-top: 15px;
  text-align: right;
}

.btn-cancel {
  padding: 10px 20px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
