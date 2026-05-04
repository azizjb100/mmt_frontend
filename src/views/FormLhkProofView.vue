<template>
  <PageLayout :title="formTitle" icon="mdi-printer-check">
    <template #header-actions>
      <v-btn
        size="small"
        color="orange-darken-2"
        @click="handleSave('DRAFT')"
        :loading="isSaving"
      >
        <v-icon start size="18">mdi-file-clock</v-icon> Simpan Sementara
      </v-btn>
      <v-btn
        size="small"
        color="primary"
        @click="handleSave('POSTED')"
        :loading="isSaving"
        :disabled="isSaving || !isFormValid"
        class="ml-2"
      >
        <v-icon start size="18">mdi-content-save-check</v-icon> Simpan Hasil
      </v-btn>
      <v-btn
        size="small"
        variant="outlined"
        @click="handleCancel"
        :disabled="isSaving"
        class="ml-2"
      >
        <v-icon start size="18">mdi-close</v-icon> Batal
      </v-btn>
    </template>

    <div class="form-grid-container">
      <!-- Kolom Kiri: Informasi Header -->
      <div class="left-column">
        <v-card class="mb-3" flat border>
          <v-card-title
            class="text-subtitle-2 pa-2 custom-header-blue text-white"
          >
            Informasi Header Proof
          </v-card-title>
          <v-card-text class="pa-4">
            <v-row dense>
              <v-col cols="12">
                <v-text-field
                  label="Nomor LHK"
                  v-model="formData.nomor"
                  readonly
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="mb-4 bg-grey-lighten-3 custom-label-blue"
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
                  class="mb-4 custom-label-blue"
                />
              </v-col>
              <v-col cols="12">
                <v-select
                  label="Jenis LHK"
                  v-model="formData.jenis"
                  :items="jenisOptions"
                  item-title="text"
                  item-value="value"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="mb-4 custom-label-blue"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Gudang"
                  v-model="formData.gdgKode"
                  readonly
                  append-inner-icon="mdi-magnify"
                  @click:append-inner="lookup.gudang = true"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="mb-4 custom-label-blue"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Scan Barcode Bahan (Roll)"
                  v-model="formData.barcode_input"
                  prepend-inner-icon="mdi-barcode-scan"
                  variant="outlined"
                  density="compact"
                  color="primary"
                  hide-details
                  class="mb-4 custom-label-blue"
                  @keyup.enter="handleBarcodeScan"
                  placeholder="Tekan Enter setelah scan"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  label="Keterangan"
                  v-model="formData.keterangan"
                  variant="outlined"
                  density="compact"
                  rows="3"
                  hide-details
                  class="custom-label-blue"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </div>

      <!-- Kolom Kanan: Detail Grid -->
      <div class="right-column">
        <v-card flat border class="d-flex flex-column h-100 rounded-0">
          <v-card-title
            class="text-subtitle-1 d-flex align-center pa-2 custom-header-blue text-white"
          >
            Detail Item Kerja Proofing
            <v-spacer />
            <v-btn
              size="x-small"
              color="success"
              prepend-icon="mdi-plus"
              @click="openSpkSearch"
              >Tambah SPK</v-btn
            >
          </v-card-title>

          <v-data-table
            :headers="detailHeaders"
            :items="detailData"
            density="compact"
            hide-default-footer
            class="delphi-grid custom-font"
            fixed-header
          >
            <template #[`item.no`]="{ index }">{{ index + 1 }}</template>

            <!-- Nomor Memo (Hanya Tampil / Kuning) -->
            <template #[`item.nomor_spk`]="{ item }">
              <div
                class="cell-yellow h-100 d-flex align-center px-2 font-weight-bold"
              >
                {{ item.nomor_spk }}
              </div>
            </template>

            <!-- Nama Order (Tampil dari SPK, tapi bisa diedit) -->
            <template #[`item.nama_spk`]="{ item }">
              <v-text-field
                v-model="item.nama_spk"
                variant="plain"
                density="compact"
                hide-details
                class="table-input-inline"
              />
            </template>

            <!-- Tg Memo (Isi Manual) -->
            <template #[`item.tgl_memo`]="{ item }">
              <v-text-field
                v-model="item.tgl_memo"
                placeholder="YYYY-MM-DD"
                variant="plain"
                density="compact"
                hide-details
                class="table-input-inline"
              />
            </template>

            <!-- Panjang (Isi Manual) -->
            <template #[`item.panjang`]="{ item }">
              <v-text-field
                v-model.number="item.panjang"
                type="number"
                variant="plain"
                density="compact"
                hide-details
                class="table-input-inline text-end"
              />
            </template>

            <!-- Lebar (Isi Manual) -->
            <template #[`item.lebar`]="{ item }">
              <v-text-field
                v-model.number="item.lebar"
                type="number"
                variant="plain"
                density="compact"
                hide-details
                class="table-input-inline text-end"
              />
            </template>

            <!-- Rencana Order (Isi Manual) -->
            <template #[`item.rencana_order`]="{ item }">
              <v-text-field
                v-model.number="item.rencana_order"
                type="number"
                variant="plain"
                density="compact"
                hide-details
                class="table-input-inline text-end"
              />
            </template>

            <!-- Aktual Proof (Isi Manual) -->
            <template #[`item.aktual_proof`]="{ item }">
              <v-text-field
                v-model.number="item.aktual_proof"
                type="number"
                variant="plain"
                density="compact"
                hide-details
                class="table-input-inline text-end"
              />
            </template>

            <!-- Jenis Bahan (Isi Manual) -->
            <template #[`item.jenis_bahan`]="{ item, index }">
              <div class="cell-yellow h-100 d-flex align-center px-1">
                <input
                  v-model="item.barcode_detail"
                  class="table-input"
                  placeholder="Scan Barcode..."
                  @keyup.enter="handleBarcodeDetailScan(index)"
                />
                <v-icon size="x-small" color="primary" class="ml-1"
                  >mdi-barcode-scan</v-icon
                >
              </div>
            </template>

            <!-- Tambahkan kolom Nama Bahan setelah Barcode jika ingin menampilkan deskripsinya -->
            <template #[`item.nama_bahan`]="{ item }">
              <input
                v-model="item.jenis_bahan"
                class="table-input"
                readonly
                placeholder="Nama Bahan..."
              />
            </template>

            <!-- Lokasi Proof (Kuning + Lookup) -->
            <template #[`item.lokasi`]="{ item, index }">
              <div class="cell-yellow h-100">
                <v-text-field
                  v-model="item.lokasi"
                  readonly
                  variant="plain"
                  density="compact"
                  hide-details
                  append-inner-icon="mdi-magnify"
                  @click:append-inner="openLokasiLookup(index)"
                  class="table-input-inline"
                />
              </div>
            </template>

            <template #[`item.actions`]="{ index }">
              <v-btn
                icon="mdi-delete-outline"
                size="x-small"
                color="error"
                variant="text"
                @click="removeRow(index)"
              />
            </template>
          </v-data-table>
        </v-card>
      </div>
    </div>

    <!-- Modals -->
    <SpkLookupView
      :is-visible="lookup.spk"
      @close="lookup.spk = false"
      @select="handleSpkSelect"
    />
    <MesinLookupView
      :is-visible="lookup.lokasi"
      @close="lookup.lokasi = false"
      @select="handleLokasiSelect"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { format } from "date-fns";
import api from "@/services/api";
import { useToast } from "vue-toastification";
import PageLayout from "../components/PageLayout.vue";
import SpkLookupView from "@/modal/SpkLookupModal.vue";
import MesinLookupView from "@/modal/MesinLookupModal.vue";

const route = useRoute();
const router = useRouter();
const toast = useToast();

const isSaving = ref(false);
const activeRowIdx = ref(-1);

const jenisOptions = [
  { text: "MMT", value: "M" },
  { text: "SUBLIM", value: "S" },
  { text: "TEKSTIL", value: "T" },
];

const formData = reactive({
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  shift: 1,
  jenis: "M",
  gdgKode: "GPM",
  keterangan: "",
});

const detailData = ref<any[]>([]);
const lookup = reactive({ spk: false, lokasi: false, gudang: false });

const detailHeaders = [
  { title: "No", key: "no", width: "40px", align: "center", sortable: false },
  { title: "Nomor Memo", key: "nomor_spk", width: "130px", sortable: false },
  { title: "Nama Order", key: "nama_spk", width: "200px", sortable: false },
  { title: "Tg. Memo", key: "tgl_memo", width: "90px", sortable: false },
  { title: "Tg Deadline", key: "deadline", width: "90px", sortable: false },
  {
    title: "Panjang",
    key: "panjang",
    align: "end",
    width: "70px",
    sortable: false,
  },
  {
    title: "Lebar",
    key: "lebar",
    align: "end",
    width: "70px",
    sortable: false,
  },
  {
    title: "Rencana Order",
    key: "rencana_order",
    align: "end",
    width: "100px",
    sortable: false,
  },
  {
    title: "Aktual Proof",
    key: "aktual_proof",
    align: "end",
    width: "100px",
    sortable: false,
  },
  { title: "Jenis Bahan", key: "jenis_bahan", width: "120px", sortable: false },
  { title: "Lokasi Proof", key: "lokasi", width: "120px", sortable: false },
  { title: "Keterangan", key: "keterangan", width: "200px", sortable: false },
  { title: "", key: "actions", width: "50px", sortable: false },
];

const isFormValid = computed(() => {
  return detailData.value.length > 0 && formData.gdgKode !== "";
});

const formTitle = computed(() =>
  route.params.nomor
    ? `Edit LHK Proofing: ${route.params.nomor}`
    : "Input LHK Proofing Baru",
);

const handleSpkSelect = (spk: any) => {
  // Mapping field dari JSON yang Anda berikan
  const nomor = spk.spk_nomor || spk.Spk || spk.SPK;
  if (detailData.value.some((d) => d.nomor_spk === nomor)) {
    return toast.warning("SPK sudah ada dalam daftar");
  }

  detailData.value.push({
    nomor_spk: nomor,
    nama_spk: spk.Nama || "", // Ambil field "Nama" dari JSON
    tgl_memo: spk.Tanggal ? format(new Date(spk.Tanggal), "yyyy-MM-dd") : "-",
    deadline: "-", // Bisa diisi manual nanti
    panjang: parseFloat(spk.Panjang) || 0,
    lebar: parseFloat(spk.Lebar) || 0,
    rencana_order: parseFloat(spk.Jumlah) || 0,
    aktual_proof: 1,
    jenis_bahan: spk.Bahan || "",
    lokasi: "",
    keterangan: "",
  });
  lookup.spk = false;
};

const handleBarcodeScan = async () => {
  if (!formData.barcode_input) return;
  try {
    const res = await api.get(`/mmt/stok-gudang/${formData.barcode_input}`);
    if (res.data.success) {
      const dataBahan = res.data.data;
      // Jika ingin mengisi keterangan otomatis dari barcode
      formData.keterangan = `Bahan: ${dataBahan.Nama_Barang} (${formData.barcode_input})`;
      toast.success("Bahan terdeteksi: " + dataBahan.Nama_Barang);
    }
  } catch (e) {
    toast.error("Barcode tidak ditemukan");
    formData.barcode_input = "";
  }
};

const loadData = async () => {
  const nomor = route.params.nomor;

  // Jika tidak ada nomor di URL, berarti ini mode TAMBAH BARU
  if (!nomor || nomor === "new") {
    formData.nomor = "AUTO"; // Label untuk nomor otomatis
    formData.tanggal = format(new Date(), "yyyy-MM-dd");
    detailData.value = []; // Pastikan detail kosong
    addBlankRow(); // Tambahkan satu baris kosong jika ingin langsung input
    return;
  }

  // Jika ada nomor, maka jalankan mode EDIT (ambil data dari API)
  try {
    const res = await api.get(`/mmt/lhk-proof/${nomor}`);
    // ... sisa logika mapping data header dan detail ...
  } catch (e) {
    toast.error("Gagal memuat data lama.");
  }
};

const openSpkSearch = () => {
  lookup.spk = true;
};
const openLokasiLookup = (idx: number) => {
  activeRowIdx.value = idx;
  lookup.lokasi = true;
};

const handleLokasiSelect = (msn: any) => {
  if (activeRowIdx.value !== -1) {
    detailData.value[activeRowIdx.value].lokasi = msn.Kode || msn.kode;
  }
  lookup.lokasi = false;
};

const removeRow = (idx: number) => detailData.value.splice(idx, 1);
const handleCancel = () => router.back();

const handleSave = async (status: string) => {
  isSaving.value = true;
  try {
    const payload = {
      header: { ...formData, lstatus: status },
      details: detailData.value,
    };
    await api.post("/mmt/lhk-proof", payload);
    toast.success("Tersimpan sebagai " + status);
    router.push({ name: "lhkProofBrowse" });
  } catch (e) {
    toast.error("Gagal mengirim data");
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
  /* Tambahkan pemuatan data jika mode edit */
});
</script>

<style scoped>
/* Area Form Container */
.form-grid-container {
  display: flex;
  gap: 16px;
  height: calc(100vh - 120px);
}

.left-column {
  width: 320px;
  flex-shrink: 0;
}

.right-column {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* Header Card: Biru Muda dengan Teks HITAM */
.custom-header-blue {
  background-color: #afb1b3 !important; /* Warna Biru Muda */
  color: #000000 !important; /* Warna Teks HITAM pekat */
  font-weight: bold !important; /* Tetap Bold agar terbaca jelas */
}

/* Label Input di Kolom Kiri */
.custom-label-blue :deep(.v-label) {
  font-size: 11px;
  font-weight: 600;
  color: #000000 !important; /* Warna Label juga HITAM */
}

/* GAYA GRID DELPHI (Tabel Detail) */
.delphi-grid :deep(thead th) {
  background-color: #1565c0 !important; /* Biru Pekat sesuai contoh LHK Tekstil */
  border: 1px solid #0d47a1 !important;
  color: white !important; /* Header kolom tabel tetap putih agar kontras */
  font-weight: bold !important;
  font-size: 0.7rem !important;
  text-transform: uppercase !important;
  height: 32px !important;
}

.delphi-grid :deep(td) {
  border: 0.5px solid #ccc !important;
  padding: 0 !important;
  height: 30px !important;
  color: #000000 !important; /* Teks di dalam sel tabel HITAM */
}

/* Kolom Kuning (Lookup/Wajib) */
.cell-yellow {
  background-color: #ffffcc !important;
}

/* Input tabel agar rapat */
.table-input-inline :deep(.v-field__input) {
  padding: 4px 8px !important;
  min-height: 28px !important;
  font-size: 11px !important;
  color: #000000 !important; /* Teks input HITAM */
}

.custom-font {
  font-size: 11px !important;
}

/* Scroll area untuk visualisasi jika diperlukan */
.scroll-wrapper {
  overflow-x: auto;
  background-color: #f8f9fa;
  min-height: 180px;
  border: 1px inset #ddd;
}
/* Input murni untuk grid agar enteng dan bisa diedit langsung */
.table-input {
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  outline: none;
  padding: 0 8px;
  font-size: 11px;
  color: black;
}

.table-input:focus {
  background-color: #e3f2fd; /* Warna biru muda saat diklik */
}

.text-end {
  text-align: right;
}
</style>
