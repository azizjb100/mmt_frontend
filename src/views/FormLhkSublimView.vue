<template>
  <PageLayout :title="formTitle" icon="mdi-printer-settings">
    <template #header-actions>
      <!-- cxButton1: Simpan & FormShow (Reset) -->
      <v-btn
        size="small"
        color="primary"
        @click="handleSave(false)"
        :loading="isSaving"
      >
        <v-icon start>mdi-content-save</v-icon> Simpan Baru
      </v-btn>

      <!-- cxButton2: Simpan & Release (Keluar) -->
      <v-btn
        size="small"
        color="success"
        @click="handleSave(true)"
        :loading="isSaving"
      >
        <v-icon start>mdi-check-all</v-icon> Simpan & Keluar
      </v-btn>

      <v-btn
        size="small"
        color="error"
        @click="handleClose"
        :disabled="isSaving"
      >
        <v-icon start>mdi-exit-to-app</v-icon> Tutup
      </v-btn>
    </template>

    <div class="form-grid-container">
      <!-- Sisi Kiri: Header (advpnl2 / advpnl4) -->
      <div class="left-column">
        <v-card class="mb-3" flat border>
          <v-card-title
            class="text-subtitle-2 pa-2 bg-blue-darken-3 text-white"
          >
            Header Transaksi
          </v-card-title>
          <v-card-text class="pa-3">
            <v-row dense>
              <v-col cols="12">
                <!-- edtnomor -->
                <v-text-field
                  label="Nomor Bukti"
                  v-model="formData.lsb_nomor"
                  readonly
                  variant="filled"
                  density="compact"
                  hide-details
                  class="mb-2"
                />
              </v-col>
              <v-col cols="12">
                <!-- edtanggal -->
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
              <v-col cols="12">
                <!-- edtgdgkode & edtgdgnama -->
                <v-text-field
                  label="Gudang"
                  v-model="formData.lsb_gdg_kode"
                  readonly
                  variant="outlined"
                  density="compact"
                  hide-details
                  append-inner-icon="mdi-magnify"
                  @click:append-inner="lookup.gudang = true"
                  :messages="[formData.gdg_nama]"
                  class="mb-4"
                />
              </v-col>
              <v-col cols="12">
                <!-- edtshift -->
                <v-text-field
                  label="Shift"
                  v-model="formData.lsb_shift"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Ringkasan Kalkulasi -->
        <v-card flat border color="grey-lighten-4">
          <v-card-text class="pa-3">
            <div class="d-flex justify-space-between mb-1">
              <span class="text-caption">Total Item:</span>
              <span class="font-weight-bold">{{ detailData.length }}</span>
            </div>
            <div class="d-flex justify-space-between">
              <span class="text-caption">Total Luas (M²):</span>
              <span class="font-weight-bold text-primary">{{
                totalMeterPekerjaan.toFixed(3)
              }}</span>
            </div>
          </v-card-text>
        </v-card>
      </div>

      <!-- Sisi Kanan: Detail Grid (cxGrid1 / CDS) -->
      <div class="right-column">
        <v-card flat border class="d-flex flex-column h-100">
          <v-card-title
            class="text-subtitle-2 pa-2 bg-grey-lighten-3 d-flex align-center"
          >
            Rincian Bahan & SPK
            <v-spacer />
            <v-btn
              size="x-small"
              color="primary"
              prepend-icon="mdi-plus"
              @click="openSpkSearch"
            >
              Tambah SPK
            </v-btn>
          </v-card-title>

          <v-data-table
            :headers="headers"
            :items="detailData"
            density="compact"
            class="flex-grow-1 custom-table"
            fixed-header
            hide-default-footer
          >
            <!-- Kolom No (clnoGetDisplayText) -->
            <template #[`item.no`]="{ index }">
              {{ index + 1 }}
            </template>

            <!-- Kolom SPK Nomor (cxspk_nomor) -->
            <template #[`item.spk_nomor`]="{ item }">
              <div class="font-weight-bold text-blue-darken-2">
                {{ item.spk_nomor }}
              </div>
            </template>

            <!-- Kolom Bahan (cljns_bahan) -->
            <template #[`item.jenis_bahan`]="{ item, index }">
              <v-text-field
                v-model="item.jenis_bahan"
                placeholder="Pilih Bahan..."
                readonly
                density="compact"
                variant="underlined"
                hide-details
                append-inner-icon="mdi-dots-horizontal"
                @click:append-inner="openBahanLookup(index)"
                :hint="item.nama_bahan"
                persistent-hint
              />
            </template>

            <!-- Kolom Qty Hasil (jumlah_sublim) -->
            <template #[`item.jumlah_sublim`]="{ item }">
              <v-text-field
                v-model.number="item.jumlah_sublim"
                type="number"
                density="compact"
                variant="underlined"
                hide-details
                class="text-right-input"
                @update:model-value="calculateRow(item)"
              />
            </template>

            <!-- Kolom Ukuran (P & L) -->
            <template #[`item.spk_panjang`]="{ item }">
              <v-text-field
                v-model.number="item.spk_panjang"
                type="number"
                density="compact"
                variant="underlined"
                hide-details
                @update:model-value="calculateRow(item)"
              />
            </template>

            <template #[`item.spk_lebar`]="{ item }">
              <v-text-field
                v-model.number="item.spk_lebar"
                type="number"
                density="compact"
                variant="underlined"
                hide-details
                @update:model-value="calculateRow(item)"
              />
            </template>

            <!-- Kolom Lokasi Mesin (cllokasi) -->
            <template #[`item.lokasi`]="{ item, index }">
              <v-text-field
                v-model="item.lokasi"
                readonly
                density="compact"
                variant="underlined"
                hide-details
                append-inner-icon="mdi-engine"
                @click:append-inner="openMesinLookup(index)"
              />
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
          </v-data-table>
        </v-card>
      </div>
    </div>

    <!-- Modals (Bantuan) -->
    <GudangLookup v-model="lookup.gudang" @select="handleGudangSelect" />
    <SpkLookup v-model="lookup.spk" @select="handleSpkSelect" />
    <BahanLookup v-model="lookup.bahan" @select="handleBahanSelect" />
    <MesinLookup v-model="lookup.mesin" @select="handleMesinSelect" />
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { format } from "date-fns";
import { useToast } from "vue-toastification";
import Swal from "sweetalert2";
import api from "@/services/api";

// Layout & Modals
import PageLayout from "../components/PageLayout.vue";
import GudangLookup from "@/modal/GudangLookupView.vue";
import SpkLookup from "@/modal/SpkLookupModal.vue";
// import BahanLookup from "@/modal/BahanMMTLookup.vue";
import MesinLookup from "@/modal/MesinLookupModal.vue";

const router = useRouter();
const route = useRoute();
const toast = useToast();

const isSaving = ref(false);
const activeIndex = ref(-1);
const isEdit = ref(false);

const formData = reactive({
  lsb_nomor: "AUTO",
  lsb_tanggal: format(new Date(), "yyyy-MM-dd"),
  lsb_gdg_kode: "GPM",
  gdg_nama: "GUDANG PRODUKSI MMT",
  lsb_shift: "1",
});

const detailData = ref<any[]>([]);

const lookup = reactive({
  gudang: false,
  spk: false,
  bahan: false,
  mesin: false,
});

const headers = [
  { title: "No", key: "no", width: "50px", sortable: false },
  { title: "SPK Nomor", key: "spk_nomor", width: "150px" },
  { title: "Pekerjaan", key: "spk_nama", width: "200px" },
  { title: "Bahan", key: "jenis_bahan", width: "180px" },
  { title: "P (m)", key: "spk_panjang", width: "80px" },
  { title: "L (m)", key: "spk_lebar", width: "80px" },
  { title: "Qty", key: "jumlah_sublim", width: "80px" },
  { title: "Luas (M²)", key: "spk_jmlmeter", width: "100px", align: "end" },
  { title: "Lokasi", key: "lokasi", width: "120px" },
  { title: "", key: "actions", width: "50px", sortable: false },
];

// --- Logika Kalkulasi (cxspk_panjangPropertiesEditValueChanged) ---
const calculateRow = (item: any) => {
  item.spk_jmlmeter =
    (item.spk_panjang || 0) * (item.spk_lebar || 0) * (item.jumlah_sublim || 0);
};

const totalMeterPekerjaan = computed(() => {
  return detailData.value.reduce(
    (acc, curr) => acc + (curr.spk_jmlmeter || 0),
    0,
  );
});

const formTitle = computed(() =>
  isEdit.value ? "Edit LHK Sublim Bahan" : "Input LHK Sublim Bahan",
);

// --- Logika SPK Select (cxspk_nomorPropertiesButtonClick) ---
const handleSpkSelect = (spk: any) => {
  const newRow = {
    spk_nomor: spk.spk_nomor || spk.Spk,
    spk_nama: spk.spk_nama || spk.Nama,
    spk_tanggal: spk.spk_tanggal || spk.Tanggal,
    spk_deadline: spk.spk_dateline || spk.Deadline,
    spk_panjang: parseFloat(spk.spk_panjang || spk.Panjang) || 0,
    spk_lebar: parseFloat(spk.spk_lebar || spk.Lebar) || 0,
    spk_jmlorder: parseFloat(spk.spk_jumlah || spk.Qty) || 0,
    jumlah_sublim: 1,
    jenis_bahan: "",
    nama_bahan: "",
    lokasi: "",
    toleransi: 0,
    waste: 0,
    spk_jmlmeter: 0,
  };
  calculateRow(newRow);
  detailData.value.push(newRow);
};

const openSpkSearch = () => {
  lookup.spk = true;
};

const openBahanLookup = (index: number) => {
  activeIndex.value = index;
  lookup.bahan = true;
};

const handleBahanSelect = (brg: any) => {
  if (activeIndex.value > -1) {
    detailData.value[activeIndex.value].jenis_bahan = brg.brg_kode || brg.Sku;
    detailData.value[activeIndex.value].nama_bahan =
      brg.brg_nama || brg.NamaBarang;
  }
};

const openMesinLookup = (index: number) => {
  activeIndex.value = index;
  lookup.mesin = true;
};

const handleMesinSelect = (msn: any) => {
  if (activeIndex.value > -1) {
    detailData.value[activeIndex.value].lokasi = msn.msn_kode || msn.Kode;
  }
};

const handleGudangSelect = (gdg: any) => {
  formData.lsb_gdg_kode = gdg.Kode;
  formData.gdg_nama = gdg.Nama;
};

const removeRow = (index: number) => {
  detailData.value.splice(index, 1);
};

// --- Logika Simpan (simpandata) ---
const handleSave = async (shouldExit: boolean) => {
  if (detailData.value.length === 0) {
    return toast.error("Detail pekerjaan masih kosong!");
  }

  const result = await Swal.fire({
    title: "Konfirmasi",
    text: "Lanjutkan simpan data?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, Simpan",
  });

  if (result.isConfirmed) {
    isSaving.value = true;
    try {
      const payload = {
        header: formData,
        details: detailData.value,
      };

      await api.post("/mmt/lhk-sublim-bahan", payload);
      toast.success("Simpan data berhasil");

      if (shouldExit) {
        handleClose();
      } else {
        resetForm();
      }
    } catch (e: any) {
      toast.error("Gagal simpan: " + e.message);
    } finally {
      isSaving.value = false;
    }
  }
};

const resetForm = () => {
  formData.lsb_nomor = "AUTO";
  detailData.value = [];
  isEdit.value = false;
  fetchMaxKode();
};

const fetchMaxKode = async () => {
  try {
    const res = await api.get("/mmt/lhk-sublim-bahan/next-number", {
      params: { date: formData.lsb_tanggal },
    });
    formData.lsb_nomor = res.data.nomor;
  } catch (e) {
    console.error("Gagal ambil nomor urut");
  }
};

const handleClose = () => {
  router.push("/mmt/browse-lhk-sublim");
};

// --- Load Data (loaddata) ---
const loadDataLHK = async (nomor: string) => {
  try {
    const res = await api.get(`/mmt/lhk-sublim-bahan/${nomor}`);
    const { header, details } = res.data;

    Object.assign(formData, header);
    detailData.value = details.map((d: any) => ({
      ...d,
      spk_jmlmeter: d.lsbd_panjang * d.lsbd_lebar * d.lsbd_jumlah,
    }));
    isEdit.value = true;
  } catch (e) {
    toast.error("Gagal memuat data");
  }
};

onMounted(() => {
  const editNomor = route.params.nomor;
  if (editNomor && editNomor !== "new") {
    loadDataLHK(editNomor as string);
  } else {
    fetchMaxKode();
  }
});
</script>

<style scoped>
.form-grid-container {
  display: flex;
  gap: 16px;
  height: calc(100vh - 150px);
}

.left-column {
  width: 300px;
  flex-shrink: 0;
}

.right-column {
  flex-grow: 1;
  min-width: 0;
}

.custom-table {
  font-size: 11px !important;
}

:deep(.text-right-input input) {
  text-align: right;
}

:deep(.v-data-table-header th) {
  background-color: #eceff1 !important;
  font-weight: bold !important;
  font-size: 11px !important;
}
</style>
