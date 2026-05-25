<template>
  <PageLayout
    :title="formTitle"
    icon="mdi-factory"
    class="custom-font bg-grey-lighten-4"
  >
    <template #header-actions>
      <v-btn
        color="orange-darken-1"
        class="text-none rounded-lg me-2"
        size="small"
        @click="handleSave(false)"
        :loading="isSaving"
      >
        Simpan Sementara <v-icon end size="18">mdi-clock-outline</v-icon>
      </v-btn>
      <v-btn
        color="blue-lighten-1"
        class="text-none rounded-lg me-2"
        size="small"
        @click="handleSave(true)"
        :loading="isSaving"
      >
        Simpan Hasil <v-icon end size="18">mdi-content-save-check</v-icon>
      </v-btn>
      <v-btn
        variant="outlined"
        color="grey-darken-3"
        class="text-none rounded-lg bg-white me-2"
        size="small"
        @click="resetForm"
      >
        Batal <v-icon end size="18">mdi-close</v-icon>
      </v-btn>
      <v-btn
        color="red-darken-4"
        class="text-none rounded-lg"
        size="small"
        @click="handleClose"
      >
        Keluar <v-icon end size="18">mdi-logout-variant</v-icon>
      </v-btn>
    </template>

    <v-container fluid class="pa-2">
      <div class="form-grid-container">
        <div class="left-column">
          <v-card flat border class="mb-3 rounded-xl overflow-hidden bg-white">
            <div
              class="pa-2 bg-grey-lighten-5 font-weight-bold text-subtitle-2 border-bottom"
            >
              Informasi LHK Sublim
            </div>
            <v-card-text class="pa-2">
              <v-row dense>
                <v-col cols="12">
                  <v-text-field
                    label="Nomor LHK"
                    v-model="formData.lsb_nomor"
                    readonly
                    variant="outlined"
                    density="compact"
                    hide-details
                    class="mb-2"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    label="Tanggal"
                    v-model="formData.lsb_tanggal"
                    type="date"
                    variant="outlined"
                    density="compact"
                    hide-details
                    class="mb-2"
                  />
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    label="Shift"
                    v-model="formData.lsb_shift"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    label="Gudang"
                    v-model="formData.lsb_gdg_kode"
                    readonly
                    variant="outlined"
                    density="compact"
                    append-inner-icon="mdi-magnify"
                    hide-details
                    style="cursor: pointer"
                    @click:append-inner="openGudangSearch"
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <v-card flat border class="mb-3 rounded-xl overflow-hidden bg-white">
            <div
              class="pa-2 bg-blue-lighten-5 font-weight-bold text-subtitle-2 border-bottom"
            >
              Scan Material (Roll)
            </div>
            <v-card-text class="pa-2">
              <v-row dense>
                <v-col cols="12">
                  <v-text-field
                    v-model="formData.barcode_input"
                    label="Scan Barcode Roll"
                    placeholder="Scan di sini..."
                    prepend-inner-icon="mdi-barcode-scan"
                    variant="outlined"
                    density="compact"
                    color="primary"
                    class="mb-2"
                    hide-details
                    @keyup.enter="handleBarcodeScan"
                    autocomplete="off"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    label="Nama Barang"
                    v-model="formData.brg_nama"
                    readonly
                    variant="outlined"
                    density="compact"
                    bg-color="grey-lighten-4"
                    hide-details
                    class="mb-2"
                  />
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    label="P. Bahan (M)"
                    v-model="formData.Panjang_bahan"
                    readonly
                    variant="outlined"
                    density="compact"
                    suffix="M"
                    bg-color="grey-lighten-4"
                    hide-details
                    class="text-end"
                  />
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    label="L. Bahan (M)"
                    v-model="formData.Lebar_bahan"
                    readonly
                    variant="outlined"
                    density="compact"
                    suffix="M"
                    bg-color="grey-lighten-4"
                    hide-details
                    class="text-end"
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </div>

        <div class="right-column">
          <v-card
            flat
            border
            class="mb-4 bg-white rounded-xl overflow-hidden d-flex flex-column"
          >
            <div
              class="pa-2 d-flex align-center bg-blue-grey-lighten-5 border-bottom"
            >
              <span class="font-weight-bold text-subtitle-2"
                >Daftar Pekerjaan Sublim (Combine SPK)</span
              >
              <v-spacer />
              <div class="d-flex align-center ga-2">
                <v-btn
                  color="success"
                  size="small"
                  prepend-icon="mdi-plus"
                  style="height: 30px !important; text-transform: none"
                  @click="openSpkSearch"
                >
                  Tambah SPK
                </v-btn>
                <v-text-field
                  v-model="formData.barcode_spk"
                  placeholder="Scan Barcode SPK"
                  prepend-inner-icon="mdi-barcode-scan"
                  variant="outlined"
                  density="compact"
                  hide-details
                  flat
                  style="width: 200px"
                  @keyup.enter="handleSpkScan"
                  autocomplete="off"
                />
              </div>
            </div>

            <v-data-table
              :headers="headers"
              :items="detailData"
              density="compact"
              class="custom-table"
              hide-default-footer
              fixed-header
              height="300"
            >
              <template #[`item.no`]="{ index }">{{ index + 1 }}</template>

              <template #[`item.spk_nomor`]="{ item }">
                <span class="font-weight-bold text-blue-darken-2">{{
                  item.spk_nomor
                }}</span>
              </template>

              <template #[`item.spk_panjang`]="{ item }">
                <input
                  v-model.number="item.spk_panjang"
                  type="number"
                  class="table-input-cell text-right"
                  @input="calculateRow(item)"
                />
              </template>

              <template #[`item.spk_lebar`]="{ item }">
                <input
                  v-model.number="item.spk_lebar"
                  type="number"
                  class="table-input-cell text-right"
                  @input="calculateRow(item)"
                />
              </template>

              <template #[`item.jumlah_sublim`]="{ item }">
                <input
                  v-model.number="item.jumlah_sublim"
                  type="number"
                  class="table-input-cell text-center font-weight-bold"
                  @input="calculateRow(item)"
                />
              </template>

              <template #[`item.spk_jmlmeter`]="{ item }">
                <div class="text-right font-weight-bold px-2 text-deep-purple">
                  {{ (item.spk_jmlmeter || 0).toFixed(3) }}
                </div>
              </template>

              <template #[`item.actions`]="{ index }">
                <v-btn
                  icon="mdi-delete"
                  size="x-small"
                  color="error"
                  variant="text"
                  @click="removeRow(index)"
                />
              </template>

              <template #bottom>
                <div
                  class="pa-3 d-flex justify-end align-center border-top bg-grey-lighten-5"
                >
                  <span class="text-subtitle-1 me-4"
                    >Total Luas Pekerjaan:</span
                  >
                  <span class="text-h6 font-weight-black text-blue-darken-3">
                    {{ totalMeterPekerjaan.toFixed(3) }} M²
                  </span>
                </div>
              </template>
            </v-data-table>
          </v-card>

          <v-card
            flat
            border
            class="bg-white rounded-xl overflow-hidden"
            min-height="200"
          >
            <div
              class="pa-2 bg-grey-lighten-5 font-weight-bold text-subtitle-2 border-bottom"
            >
              Visualisasi Layout Produksi
            </div>
            <v-card-text
              class="pa-0 d-flex align-center justify-center bg-grey-lighten-4"
              style="height: 150px"
            >
              <div class="text-grey-lighten-1 text-center">
                <v-icon size="48">mdi-layers-outline</v-icon>
                <div class="text-caption">Pratinjau Layout Otomatis</div>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </div>
    </v-container>

    <GudangLookupView
      :isVisible="isGudangLookupVisible"
      @close="isGudangLookupVisible = false"
      @select="handleGudangSelect"
    />

    <SpkLookupView
      :isVisible="isSpkLookupVisible"
      @close="isSpkLookupVisible = false"
      @select="handleSpkSelect"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { format } from "date-fns";
import { useToast } from "vue-toastification";
import Swal from "sweetalert2";
import api from "@/services/api";

// Import Components
import PageLayout from "../components/PageLayout.vue";
import GudangLookupView from "@/modal/GudangLookupView.vue";
import SpkLookupView from "@/modal/SpkLookupModal.vue";

const router = useRouter();
const route = useRoute();
const toast = useToast();

const isSaving = ref(false);
const isEdit = ref(false); // true jika mode ubah/buka data lama

// State Visibility Modal Lookup
const isGudangLookupVisible = ref(false);
const isSpkLookupVisible = ref(false);

const formData = reactive({
  lsb_nomor: "AUTO", // Dikunci ke AUTO untuk data baru seperti LHK Mesin
  lsb_tanggal: format(new Date(), "yyyy-MM-dd"),
  lsb_gdg_kode: "GPM",
  gdg_nama: "GUDANG PRODUKSI MMT",
  lsb_shift: "1",
  barcode_input: "",
  barcode_spk: "",
  brg_kode: "",
  brg_nama: "",
  Panjang_bahan: 0,
  Lebar_bahan: 0,
});

const detailData = ref<any[]>([]);

const headers = [
  { title: "NO", key: "no", width: "50px", align: "center" as const },
  { title: "NOMOR SPK", key: "spk_nomor", width: "130px" },
  { title: "NAMA PEKERJAAN", key: "spk_nama" },
  { title: "P (M)", key: "spk_panjang", width: "80px", align: "end" as const },
  { title: "L (M)", key: "spk_lebar", width: "80px", align: "end" as const },
  {
    title: "QTY",
    key: "jumlah_sublim",
    width: "80px",
    align: "center" as const,
  },
  {
    title: "TOTAL M²",
    key: "spk_jmlmeter",
    width: "100px",
    align: "end" as const,
  },
  { title: "AKSI", key: "actions", width: "50px", sortable: false },
];

const calculateRow = (item: any) => {
  const p = parseFloat(item.spk_panjang) || 0;
  const l = parseFloat(item.spk_lebar) || 0;
  const q = parseFloat(item.jumlah_sublim) || 0;
  item.spk_jmlmeter = p * l * q;
};

const totalMeterPekerjaan = computed(() => {
  return detailData.value.reduce(
    (acc, curr) => acc + (Number(curr.spk_jmlmeter) || 0),
    0,
  );
});

const formTitle = computed(() =>
  isEdit.value ? "Ubah LHK Sublim Bahan" : "Input LHK Sublim Bahan",
);

// --- Handle Scan Barcode Bahan Roll ---
const handleBarcodeScan = async () => {
  const code = formData.barcode_input?.trim();
  if (!code) return;

  const regex = /^[a-zA-Z0-9-]+$/;
  if (!regex.test(code)) {
    toast.error("Format Barcode tidak valid!");
    return;
  }

  try {
    const res = await api.get(`/mmt/stok-gudang/${code}`);
    const resData = res.data.data;

    if (
      resData &&
      (resData.status === "READY" || resData.Sisa_Panjang || resData.Sisa)
    ) {
      const info = resData.data || resData;
      formData.brg_kode = info.Barcode || info.Kode || info.brg_kode;
      formData.brg_nama = info.Nama_Barang || info.Nama || info.brg_nama;
      formData.Panjang_bahan = parseFloat(info.Sisa_Panjang || info.Sisa || 0);
      formData.Lebar_bahan = parseFloat(info.Lebar || 0);
      toast.success("Material Bahan Siap");
    } else {
      toast.error("Barcode tidak tersedia/sudah terpakai");
    }
  } catch (e) {
    toast.error("Gagal scan barcode / Barcode tidak ditemukan");
  }
};

// --- Handle Scan Barcode SPK ---
const handleSpkScan = async () => {
  const code = formData.barcode_spk?.trim();
  if (!code) return;

  if (detailData.value.some((d) => d.spk_nomor === code)) {
    toast.warning(`SPK ${code} sudah ada dalam daftar!`);
    formData.barcode_spk = "";
    return;
  }

  try {
    isSaving.value = true;
    const res = await api.get(`/mmt/SPK/${code}`);
    const spk = res.data.data || res.data;

    if (spk) {
      const newEntry: any = {
        spk_nomor: spk.Spk || spk.Nomor || code,
        spk_nama: spk.Nama || spk.Nama_Produk || "",
        spk_panjang: parseFloat(spk.Panjang || 0),
        spk_lebar: parseFloat(spk.Lebar || 0),
        jumlah_sublim: 1,
        jenis_bahan: formData.brg_kode,
        nama_bahan: formData.brg_nama,
        spk_jmlmeter: 0,
      };

      calculateRow(newEntry);
      detailData.value.push(newEntry);
      toast.success(`Berhasil menambahkan SPK ${code}`);
      formData.barcode_spk = "";
    } else {
      toast.error("Nomor SPK tidak ditemukan");
      formData.barcode_spk = "";
    }
  } catch (e: any) {
    console.error("Scan SPK Error:", e);
    toast.error(e.response?.data?.message || "Gagal mengambil data SPK");
    formData.barcode_spk = "";
  } finally {
    isSaving.value = false;
  }
};

// --- Lookups ---
const openGudangSearch = () => {
  isGudangLookupVisible.value = true;
};
const handleGudangSelect = (gdg: any) => {
  formData.lsb_gdg_kode = gdg.Kode || gdg.Kode_Gudang;
  formData.gdg_nama = gdg.Nama || gdg.Nama_Gudang;
  isGudangLookupVisible.value = false;
};

const openSpkSearch = () => {
  isSpkLookupVisible.value = true;
};
const handleSpkSelect = (spk: any) => {
  const targetNomor = spk.Spk || spk.spk_nomor || spk.Nomor_SPK;
  if (detailData.value.some((d) => d.spk_nomor === targetNomor)) {
    toast.warning(`SPK ${targetNomor} sudah ada dalam daftar!`);
    isSpkLookupVisible.value = false;
    return;
  }

  const newRow = {
    spk_nomor: targetNomor,
    spk_nama: spk.Nama || spk.spk_nama || spk.Nama_SPK,
    spk_panjang: parseFloat(spk.Panjang || spk.spk_panjang || 0),
    spk_lebar: parseFloat(spk.Lebar || spk.spk_lebar || 0),
    jumlah_sublim: 1,
    jenis_bahan: formData.brg_kode,
    nama_bahan: formData.brg_nama,
    spk_jmlmeter: 0,
  };
  calculateRow(newRow);
  detailData.value.push(newRow);
  isSpkLookupVisible.value = false;
};

const removeRow = (index: number) => {
  detailData.value.splice(index, 1);
};

// --- Simpan Data (Gaya LHK Mesin Cetak) ---
const handleSave = async (shouldExit: boolean) => {
  if (detailData.value.length === 0)
    return toast.error("Detail pekerjaan kosong");

  const result = await Swal.fire({
    title: "Konfirmasi Simpan",
    text: "Simpan data hasil kerja ini?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, Simpan",
    confirmButtonColor: "#1E88E5",
  });

  if (result.isConfirmed) {
    isSaving.value = true;
    try {
      const payload = {
        header: {
          ...formData,
          lstatus: shouldExit ? "POSTED" : "DRAFT",
          user: "OPERATOR",
        },
        details: detailData.value,
      };

      // 🔥 PERUBAHAN DI SINI: Sesuaikan dengan route baru backend Anda
      const response = await api.post("/mmt/lhk-sublim", payload);

      if (response.data.success) {
        toast.success("Data berhasil disimpan");

        if (shouldExit) {
          handleClose();
        } else if (!isEdit.value) {
          formData.lsb_nomor = response.data.nomor;
          isEdit.value = true;
          router.replace({ params: { nomor: response.data.nomor } });
        }
      } else {
        // Jika backend mengirim success: false beserta log internalnya
        toast.error(response.data.message || "Gagal menyimpan data.");
      }
    } catch (e: any) {
      // Menangkap pesan error detail dari sistem logging baru yang kita pasang di backend
      const serverErrorMessage = e.response?.data?.message || e.message;
      toast.error("Gagal menyimpan: " + serverErrorMessage);
    } finally {
      isSaving.value = false;
    }
  }
};

const resetForm = () => {
  formData.lsb_nomor = "AUTO"; // Kembalikan ke kode AUTO aman
  formData.barcode_input = "";
  formData.barcode_spk = "";
  formData.brg_nama = "";
  formData.Panjang_bahan = 0;
  formData.Lebar_bahan = 0;
  detailData.value = [];
  isEdit.value = false;
};

const handleClose = () => router.push({ name: "LHKSublimMMT" });

onMounted(() => {
  const editNomor = route.params.nomor;
  if (editNomor && editNomor !== "new" && editNomor !== "create") {
    isEdit.value = true;
    // Logic load data existing di sini jika diperlukan
  } else {
    formData.lsb_nomor = "AUTO"; // Pastikan default data baru adalah AUTO
  }
});
</script>

<style scoped>
.custom-font {
  font-family: "Inter", sans-serif !important;
  font-size: 11px !important;
}

/* Layout Grid Sistem Kolom Kiri & Kanan Berdampingan */
.form-grid-container {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.left-column {
  width: 300px;
  position: sticky;
  top: 0;
  flex-shrink: 0;
}

.right-column {
  flex: 1;
  min-width: 0;
}

/* Header Tabel Biru (Sesuai LHK Tekstil) */
:deep(.custom-table .v-data-table-header) {
  background-color: #1565c0 !important;
}

:deep(.custom-table .v-data-table-header th) {
  color: white !important;
  font-weight: bold !important;
  text-transform: uppercase;
  font-size: 10px !important;
  height: 36px !important;
}

/* Input Cell dalam tabel */
.table-input-cell {
  width: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 4px;
  font-size: 11px;
  background-color: #fff;
}

.table-input-cell:focus {
  border-color: #1976d2;
  outline: none;
}

.rounded-xl {
  border-radius: 12px !important;
}

.border-bottom {
  border-bottom: 1px solid #e0e0e0;
}

:deep(.v-field__input) {
  font-size: 11px !important;
}

:deep(.v-label) {
  font-size: 11px !important;
  font-weight: 600;
  color: #555;
}
</style>
