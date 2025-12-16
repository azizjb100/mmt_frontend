<template>
  <PageLayout :title="formTitle" icon="mdi-printer-3d-nozzle-alert-outline">
    <template #header-actions>
      <v-btn
        size="small"
        color="primary"
        @click="simpandata(false)"
        :loading="isSaving"
        :disabled="isSaving || !isFormValid"
      >
        <v-icon start>mdi-content-save</v-icon> Simpan (F10)
      </v-btn>
      <v-btn size="small" @click="handleCancel" :disabled="isSaving">
        <v-icon start>mdi-close</v-icon> Batal (F7)
      </v-btn>
      <v-btn
        v-if="isEditMode"
        size="small"
        color="teal"
        @click="handlePrint"
        :disabled="isSaving"
      >
        <v-icon start>mdi-printer</v-icon> Cetak (F3)
      </v-btn>
      <v-btn size="small" color="error" @click="handleClose">
        <v-icon start>mdi-exit-to-app</v-icon> Keluar (F8)
      </v-btn>
    </template>

    <div class="form-grid-container">
      <div class="left-column">
        <v-card class="desktop-form-section mb-3" flat>
          <v-card-title class="text-subtitle-1 d-flex align-center pa-2">
            Data LHK
            <v-spacer />
            <v-chip size="small" :color="isEditMode ? 'orange' : 'blue'" label>
              {{ isEditMode ? "EDIT" : "BARU" }}
            </v-chip>
          </v-card-title>
          <v-card-text>
            <v-row dense>
              <v-col cols="12">
                <v-text-field
                  label="Nomor LHK"
                  v-model="formData.nomor"
                  readonly
                  filled
                  density="compact"
                  variant="outlined"
                  hint="AUTO dihasilkan saat form dibuka."
                  persistent-hint
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Tanggal"
                  v-model="formData.tanggal"
                  type="date"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Gudang Prod."
                  v-model="formData.gdg_kode"
                  @click:append-inner="openGudangSearch"
                  @blur="handleGdgKodeExit"
                  append-inner-icon="mdi-magnify"
                  density="compact"
                  variant="outlined"
                  hide-details
                  style="cursor: pointer"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Nama Gudang"
                  v-model="formData.gdg_nama"
                  readonly
                  filled
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Shift"
                  v-model.number="formData.shift"
                  type="number"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Operator"
                  v-model="formData.operator"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </div>

      <div class="right-column">
        <v-card
          flat
          class="desktop-form-section flex-grow-1 d-flex flex-column mb-3"
        >
          <v-card-title class="text-subtitle-1"
            >Detail Ambil LHK Mesin</v-card-title
          >
          <v-card-text class="pa-0 flex-grow-1">
            <div class="detail-table-wrapper">
              <v-data-table
                :headers="detailHeaders"
                :items="detailData"
                :items-per-page="-1"
                class="elevation-0 detail-entry-table"
                hide-default-footer
              >
                <template #[`item.no`]="{ index }">{{ index + 1 }}</template>

                <template #[`item.lhkmesin`]="{ item, index }">
                  <v-text-field
                    label="LHK Mesin Nomor"
                    v-model="formData.LhkMesinNomor"
                    @click:append-inner="openLhkMesinSearch"
                    @blur="handleLhkMesinExit"
                    append-inner-icon="mdi-magnify"
                    density="compact"
                    variant="outlined"
                    hide-details
                    style="cursor: pointer"
                  />
                </template>

                <template #[`item.mesin`]="{ item }">
                  <v-text-field
                    :model-value="item.mesin"
                    readonly
                    filled
                    density="compact"
                    hide-details
                  />
                </template>

                <template #[`item.spk_nomor`]="{ item }">
                  <v-text-field
                    :model-value="item.spk_nomor"
                    readonly
                    filled
                    density="compact"
                    hide-details
                  />
                </template>

                <template #[`item.spk_nama`]="{ item }">
                  <v-text-field
                    :model-value="item.spk_nama"
                    readonly
                    filled
                    density="compact"
                    hide-details
                  />
                </template>

                <template #[`item.jumlah_cetak`]="{ item }">
                  <v-text-field
                    :model-value="item.jumlah_cetak"
                    readonly
                    filled
                    density="compact"
                    hide-details
                    class="text-end font-weight-bold"
                  />
                </template>

                <template #[`item.actions`]="{ index }">
                  <v-btn
                    icon="mdi-delete"
                    size="x-small"
                    variant="text"
                    color="red"
                    @click="removeDetail(index)"
                    :disabled="detailData.length === 1"
                  ></v-btn>
                </template>

                <template #bottom>
                  <v-container class="py-2">
                    <v-row justify="space-between" class="px-4">
                      <v-col cols="auto">
                        <v-btn
                          size="small"
                          color="primary"
                          @click="addDetail"
                          prepend-icon="mdi-plus"
                          >Tambah Baris</v-btn
                        >
                      </v-col>
                      <v-col cols="auto">
                        <v-label class="font-weight-bold"
                          >Baris Aktif: {{ detailData.length }}</v-label
                        >
                      </v-col>
                    </v-row>
                  </v-container>
                </template>
              </v-data-table>
            </div>
          </v-card-text>
        </v-card>

        <v-card flat class="desktop-form-section">
          <v-card-text class="pa-2 text-caption">
            Status:
            {{ isEditMode ? "Mengubah LHK yang sudah ada" : "Input LHK baru" }}
          </v-card-text>
        </v-card>
      </div>
    </div>

    <GudangLookupView
      :isVisible="isGudangLookupVisible"
      @close="isGudangLookupVisible = false"
      @select="handleGudangSelect"
    />

    <MesinLookupView
      :isVisible="isMesinLookupVisible"
      @close="isMesinLookupVisible = false"
      @select="handleMesinSelect"
    />

    <SpkLookupView
      :isVisible="isSpkLookupVisible"
      @close="isSpkLookupVisible = false"
      @select="handleSpkSelect"
    />
    <LhkMesinLookup
      :isVisible="isLhkMesinLookupVisible"
      @close="isLhkMesinLookupVisible = false"
      @select="handleLHKMesinSelect"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount, type Ref } from "vue";
import LhkMesinLookup from "@/modal/LhkMesinLookup.vue";
import GudangLookupView from "@/modal/GudangLookupView.vue";
import SpkLookupView from "@/modal/SpkLookupModal.vue";
import { format } from "date-fns";

// Definisikan Interface Detail Row
interface DetailRow {
  lhkmesin: string;
  mesin: string;
  spk_nomor: string;
  spk_nama: string;
  spk_panjang: number;
  spk_lebar: number;
  jumlah_cetak: number;
  shift: number;
  operator: string;
}

const initialDetailRow = (): DetailRow => ({
  lhkmesin: "",
  mesin: "",
  spk_nomor: "",
  spk_nama: "",
  spk_panjang: 0,
  spk_lebar: 0,
  jumlah_cetak: 0,
  shift: 1,
  operator: "",
});

// --- DUMMY STATE/METHODS YANG HILANG ---
const formTitle: Ref<string> = ref("Laporan Harian Kerja (LHK) Cetak");
const isSaving: Ref<boolean> = ref(false);
const isEditMode = computed(() => !!formData.value.ID);

// DUMMY METHODS
const handleCancel = () => {
  console.log("Batal");
  closeForm();
};
const handlePrint = () => {
  alert("Simulasi: Mencetak dokumen.");
};
const handleClose = () => {
  closeForm();
};

const handleMesinSelect = (item: any) => {
  /* Logic */
};
const handleSpkSelect = (item: any) => {
  /* Logic */
};

// DUMMY/MISSING Detail Logic
const isTileValid = (item: DetailRow) => true;
const calculateTotals = (item: DetailRow) => {
  /* Logic kalkulasi */
};

// --- STATE FORM ---
const formData = ref({
  tanggal: new Date().toISOString().substring(0, 10),
  gdg_kode: "GPM",
  gdg_nama: "Gudang Produksi MMT",
  nomor: "",
  shift: 1,
  operator: "",
  FLAGEDIT: false,
  ID: "",
  Lebar_spk: 0.5,
});

const detailData: Ref<DetailRow[]> = ref([initialDetailRow()]);
const statusMessage: Ref<string> = ref("Ready");

// --- STATE LOOKUP ---
const isGudangLookupVisible: Ref<boolean> = ref(false);
const isMesinLookupVisible: Ref<boolean> = ref(false);
const isSpkLookupVisible: Ref<boolean> = ref(false);
const isLhkMesinLookupVisible: Ref<boolean> = ref(false); // KUNCI: Default harus FALSE
const currentLookupIndex: Ref<number | null> = ref(null);

// Metode Gudang
const openGudangSearch = () => {
  isGudangLookupVisible.value = true;
};
const handleGdgKodeExit = () => {
  console.log("Exit Gudang Code.");
};
const handleGudangSelect = (item: any) => {
  formData.value.gdg_kode = item.kode;
  formData.value.gdg_nama = item.nama;
  isGudangLookupVisible.value = false;
};

// --- Definisikan Detail Headers (Sesuai Skema LHK Mesin) ---
const detailHeaders = ref([
  { title: "No", key: "no", sortable: false, width: "50px" },
  { title: "No. LHK Mesin", key: "lhkmesin", sortable: false, width: "150px" },
  { title: "Mesin", key: "mesin", sortable: false, width: "100px" },
  { title: "No. SPK", key: "spk_nomor", sortable: false, width: "120px" },
  { title: "Nama Order", key: "spk_nama", sortable: false, width: "200px" },
  {
    title: "Qty Cetak",
    key: "jumlah_cetak",
    sortable: false,
    width: "100px",
    align: "end",
  },
  { title: "Aksi", key: "actions", sortable: false, width: "70px" },
]);

// --- Computed Properties ---
const isFormValid = computed(() => {
  return (
    formData.value.gdg_kode &&
    formData.value.nomor &&
    formData.value.shift &&
    formData.value.operator &&
    detailData.value.some((item) => item.lhkmesin || item.spk_nomor)
  );
});

// --- Methods ---

const isDetailValid = (item: DetailRow) => {
  // Hanya valid jika LHK Mesin diisi
  return item.lhkmesin?.length > 0;
};

const getmaxkode = () => {
  const NOMERATOR = "MMT-LHK-C";
  const today = new Date();
  const yy = today.getFullYear().toString().substring(2);
  const mm = (today.getMonth() + 1).toString().padStart(2, "0");
  const runningNumber = Math.floor(Math.random() * 9999) + 1;
  const formattedRunningNumber = String(runningNumber).padStart(4, "0");
  return `${NOMERATOR}.${yy}${mm}.${formattedRunningNumber}`;
};

const refreshdata = () => {
  formData.value.tanggal = new Date().toISOString().substring(0, 10);
  formData.value.gdg_kode = "GPM";
  formData.value.gdg_nama = "Gudang Produksi MMT";
  formData.value.shift = 1;
  formData.value.operator = "";
  formData.value.FLAGEDIT = false;
  formData.value.ID = "";
  formData.value.nomor = getmaxkode();
  detailData.value = [initialDetailRow()]; // Reset grid
  statusMessage.value = "Formulir siap.";
};

const addDetail = () => {
  detailData.value.push(initialDetailRow());
};

const removeDetail = (index: number) => {
  if (detailData.value.length > 1) {
    detailData.value.splice(index, 1);
  } else {
    detailData.value = [initialDetailRow()]; // Reset isinya jika hanya 1 baris
  }
};

// --- LOGIKA LOOKUP LHK MESIN (Pemicu Modal) ---
const showLHKMesinLookup = (index: number) => {
  // Ini adalah fungsi yang dipanggil saat user mengklik kolom di tabel detail.
  currentLookupIndex.value = index;
  isLhkMesinLookupVisible.value = true; // Setel ke TRUE untuk MEMBUKA MODAL
};

const closeLhkMesinLookup = () => {
  // Ini dipanggil saat user menutup modal
  isLhkMesinLookupVisible.value = false; // Setel ke FALSE untuk MENUTUP MODAL
  currentLookupIndex.value = null;
};

const handleLHKMesinSelect = (selectedHeader: any) => {
  const index = currentLookupIndex.value;

  if (index !== null) {
    const item = detailData.value[index];

    const isDuplicate = detailData.value.some(
      (d, i) => i !== index && d.lhkmesin === selectedHeader.Nomor
    );

    if (isDuplicate) {
      alert(`LHK Mesin ${selectedHeader.Nomor} sudah digunakan di baris lain.`);
      closeLhkMesinLookup();
      return;
    }

    // Mengisi detailData
    item.lhkmesin = selectedHeader.Nomor;
    item.mesin = selectedHeader.Mesin;
    item.spk_nomor = selectedHeader.NomorSPK;
    item.spk_nama = selectedHeader.NamaOrder;
    item.spk_panjang = selectedHeader.spk_panjang;
    item.spk_lebar = selectedHeader.spk_lebar;
    item.jumlah_cetak = selectedHeader.TotalCetak;
    item.shift = selectedHeader.Shift;
    item.operator = selectedHeader.Operator;

    // Tambahkan baris baru jika baris saat ini sudah terisi dan bukan baris terakhir
    if (index === detailData.value.length - 1 && item.lhkmesin) {
      addDetail();
    }
  }
  closeLhkMesinLookup();
};
// --- AKHIR LOGIKA LOOKUP LHK MESIN ---

// Logika Simpan
const simpandata = async (closeAfterSave: boolean) => {
  isSaving.value = true;

  if (!isFormValid.value) {
    statusMessage.value = "Gagal: Data Header atau Detail belum lengkap.";
    alert(
      "Mohon lengkapi data header dan minimal satu baris detail yang valid."
    );
    isSaving.value = false;
    return;
  }

  const finalDetails = detailData.value.filter((item) => item.lhkmesin);

  if (finalDetails.length === 0) {
    statusMessage.value =
      "Gagal: Minimal harus ada satu LHK Mesin yang dimasukkan.";
    alert("Minimal harus ada satu LHK Mesin yang dimasukkan.");
    isSaving.value = false;
    return;
  }

  // --- LOGIKA PEMBUATAN PAYLOAD DAN PANGGILAN API (SIMULASI) ---
  const payload = {
    // ... data payload
  };

  console.log("Payload ke Backend:", payload);
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const result = {
      success: true,
      nomor: formData.value.nomor,
      message: "Data berhasil disimpan.",
    };

    statusMessage.value = `Simpan data berhasil. Nomor: ${result.nomor}`;
    alert(result.message);

    if (closeAfterSave) {
      closeForm();
    } else {
      refreshdata();
    }
  } catch (error) {
    const err = error as Error;
    statusMessage.value = `Gagal Simpan. Error: ${err.message}`;
    alert(`Gagal Simpan. Error: ${err.message}`);
  } finally {
    isSaving.value = false;
  }
};

const closeForm = () => {
  // Logika untuk menutup formulir
  console.log("Formulir ditutup.");
};

const handleSave = simpandata;

// --- Lifecycle Hook & Keypress ---
onMounted(() => {
  refreshdata();
  window.addEventListener("keydown", handleKeyPress);
});

const handleKeyPress = (event: KeyboardEvent) => {
  // Mengatur shortcut keyboard
  if (event.key === "F10") {
    event.preventDefault();
    simpandata(false);
  } else if (event.key === "F7") {
    event.preventDefault();
    handleCancel();
  } else if (event.key === "F3" && isEditMode.value) {
    event.preventDefault();
    handlePrint();
  } else if (event.key === "F8") {
    event.preventDefault();
    handleClose();
  }
};

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeyPress);
});
</script>

<style scoped>
/* Struktur dasar formulir */
.form-lhk-cetak {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header h2 {
  color: #333;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

/* Panel Header */
.advpnl-header {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: #f9f9f9;
}

.form-group-row {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.form-field {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-basis: 33%; /* Membagi ruang menjadi 3 kolom */
}

.form-field label {
  font-weight: bold;
  min-width: 80px;
}

.form-field input:not(.readonly-input),
.form-field select {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  flex-grow: 1;
}

.readonly-input {
  background-color: #eee;
  color: #555;
  cursor: not-allowed;
}

.input-with-btn {
  display: flex;
  flex-grow: 1;
}

.input-with-btn input {
  border-right: none;
  border-radius: 4px 0 0 4px;
}

.input-with-btn button {
  padding: 8px 12px;
  border: 1px solid #ccc;
  background-color: #e9e9e9;
  cursor: pointer;
  border-radius: 0 4px 4px 0;
  transition: background-color 0.2s;
}

.input-with-btn button:hover {
  background-color: #ddd;
}

/* Detail Grid */
.advpnl-detail {
  margin-bottom: 20px;
}

.grid-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 15px;
}

table th,
table td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: left;
  white-space: nowrap;
}

table th {
  background-color: #007bff;
  color: white;
  cursor: pointer;
}

table td input {
  width: 100%;
  box-sizing: border-box;
  border: none;
  padding: 4px;
}

table td .input-with-btn {
  width: 100%;
  display: flex;
}

.qty-cetak {
  font-weight: bold; /* Mirip CustomDrawCell dengan fsBold */
}

.error-cell input {
  border: 1px solid red;
  background-color: #ffebeb;
}

.btn-remove {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-add-row {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
}

/* Footer & Buttons */
.advpnl-footer {
  border-top: 1px solid #ddd;
  padding-top: 15px;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.cxButton {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.cxButton.primary {
  background-color: #007bff;
  color: white;
}

.cxButton.secondary {
  background-color: #6c757d;
  color: white;
}

.status-bar {
  background-color: #f1f1f1;
  padding: 8px;
  border-radius: 4px;
  font-size: 0.9em;
}
</style>
