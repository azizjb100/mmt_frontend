<template>
  <PageLayout
    title="Input Kerja Finishing (Pra-LHK)"
    icon="mdi-ray-start-arrow"
  >
    <template #header-actions>
      <v-btn
        color="primary"
        @click="handleSaveDraft"
        :loading="isSaving"
        :disabled="detailData.length === 0"
      >
        <v-icon start>mdi-content-save-edit</v-icon> Simpan ke Pra-LHK
      </v-btn>
    </template>

    <v-row>
      <v-col cols="12" md="3">
        <v-card variant="outlined" class="pa-4">
          <v-select
            label="Jenis Proses"
            v-model="formData.proses"
            :items="daftarProses"
            item-title="title"
            item-value="value"
            variant="solo-filled"
            class="mb-3"
          />
          <v-text-field
            label="Tanggal Kerja"
            type="date"
            v-model="formData.tanggal"
            variant="outlined"
            density="compact"
          />
          <v-text-field
            label="Shift"
            type="number"
            v-model.number="formData.shift"
            variant="outlined"
            density="compact"
          />

          <v-divider class="my-3" />
          <div class="text-caption font-weight-bold">Informasi:</div>
          <div class="text-body-2 text-grey">
            Operator: <strong>{{ userLogin }}</strong
            ><br />
            Data akan tersimpan di tabel <strong>Pra-LHK</strong> sebelum
            dibundel admin.
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="9">
        <v-card variant="outlined">
          <v-card-title class="d-flex align-center bg-grey-lighten-4 py-2 px-4">
            <span class="text-subtitle-1 font-weight-bold"
              >Rincian - {{ formData.proses }}</span
            >
            <v-spacer />

            <v-text-field
              v-model="barcodeInput"
              label="Scan Barcode SPK"
              prepend-inner-icon="mdi-barcode-scan"
              variant="outlined"
              density="compact"
              hide-details
              class="mx-2"
              style="max-width: 250px"
              @keyup.enter="handleBarcodeScan"
              placeholder="Contoh: 10*BARCODE"
              :loading="isScanning"
            />

            <v-btn
              v-if="formData.proses !== 'POTONG'"
              color="orange-darken-2"
              size="small"
              variant="tonal"
              prepend-icon="mdi-history"
              class="mx-1"
              @click="fetchPendingPotong"
              :loading="isFetchingPotong"
            >
              Tarik Potong
            </v-btn>

            <v-btn
              color="success"
              size="small"
              prepend-icon="mdi-plus"
              class="mx-1"
              @click="openSpkSearch"
            >
              Pilih SPK
            </v-btn>
          </v-card-title>

          <v-data-table
            :headers="dynamicHeaders"
            :items="detailData"
            density="compact"
            no-data-text="Belum ada SPK yang dipilih"
          >
            <template #[`item.ukuran`]="{ item }">
              {{ item.panjang }} x {{ item.lebar }}
            </template>

            <template #[`item.qty_hasil`]="{ item }">
              <v-text-field
                v-model.number="item.qty_hasil"
                type="number"
                density="compact"
                variant="underlined"
                hide-details
                class="text-end custom-input-qty"
                @input="handleInputCalculation(item)"
              />
            </template>

            <template #[`item.pengali_mata_ayam`]="{ item }">
              <v-text-field
                v-model.number="item.pengali_mata_ayam"
                type="number"
                density="compact"
                variant="underlined"
                hide-details
                suffix="pcs"
                class="text-center"
                @input="handleInputCalculation(item)"
              />
            </template>
            <template #[`item.jml_mata_ayam`]="{ item }">
              <div class="text-end font-weight-bold text-success">
                {{ item.jml_mata_ayam }}
              </div>
            </template>

            <template #[`item.pengali_koli`]="{ item }">
              <v-text-field
                v-model.number="item.pengali_koli"
                type="number"
                density="compact"
                variant="underlined"
                hide-details
                suffix="pcs"
                @input="handleInputCalculation(item)"
              />
            </template>
            <template #[`item.jml_koli`]="{ item }">
              <div class="text-end font-weight-bold text-purple">
                {{ item.jml_koli }}
              </div>
            </template>

            <template #[`item.actions`]="{ index }">
              <v-btn
                icon="mdi-delete"
                size="x-small"
                color="error"
                variant="text"
                @click="detailData.splice(index, 1)"
              />
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <SpkLookupModal
      :isVisible="isSpkModalVisible"
      @select="addFirstTimeSpk"
      @close="isSpkModalVisible = false"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from "vue";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import SpkLookupModal from "@/modal/SpkLookupModal.vue";

const toast = useToast();
const isSaving = ref(false);
const isScanning = ref(false);
const isSpkModalVisible = ref(false);
const barcodeInput = ref("");
const isFetchingPotong = ref(false);
const userLogin = ref("system");

// --- 1. USER AUTH LOGIC ---
const getCurrentUser = () => {
  const savedUser =
    localStorage.getItem("kdUser") ||
    localStorage.getItem("user_kode") ||
    localStorage.getItem("username");
  if (savedUser) userLogin.value = savedUser;
};

// --- 2. CONFIG DATA ---
const daftarProses = [
  { title: "POTONG", value: "POTONG" },
  { title: "SEAMING", value: "SEAMING" },
  { title: "MATA AYAM", value: "MATA_AYAM" },
  { title: "KOLI", value: "KOLI" },
  { title: "X-BANNER", value: "X_BANNER" },
  { title: "ROLL UP BANNER", value: "ROLLUP_BANNER" },
];

const formData = reactive({
  proses: "POTONG",
  tanggal: new Date().toISOString().substr(0, 10),
  shift: 1,
});

const detailData = ref<any[]>([]);

// --- 3. CALCULATION LOGIC ---
const handleInputCalculation = (item: any) => {
  // Hitung Mata Ayam
  item.jml_mata_ayam =
    formData.proses === "MATA_AYAM"
      ? (item.qty_hasil || 0) * (item.pengali_mata_ayam || 0)
      : 0;

  // Hitung Koli
  if (formData.proses === "KOLI" && item.pengali_koli > 0) {
    item.jml_koli = Math.ceil((item.qty_hasil || 0) / item.pengali_koli);
  } else {
    item.jml_koli = 0;
  }
};

// --- 4. TABLE HEADERS ---
const dynamicHeaders = computed(() => {
  const baseHeaders = [
    { title: "No SPK", key: "spk_nomor", width: "150px" },
    { title: "Nama Produk", key: "spk_nama" },
    { title: "Ukuran", key: "ukuran", width: "120px" },
    { title: "Order", key: "qty_order", width: "80px", align: "end" },
    {
      title: `Hasil ${formData.proses}`,
      key: "qty_hasil",
      width: "120px",
      align: "end",
    },
  ];

  if (formData.proses === "MATA_AYAM") {
    baseHeaders.push(
      {
        title: "Mata/Pcs",
        key: "pengali_mata_ayam",
        width: "100px",
        align: "center",
      },
      { title: "Total MA", key: "jml_mata_ayam", width: "100px", align: "end" },
    );
  }
  if (formData.proses === "KOLI") {
    baseHeaders.push(
      {
        title: "Isi/Koli",
        key: "pengali_koli",
        width: "100px",
        align: "center",
      },
      { title: "Jml Koli", key: "jml_koli", width: "100px", align: "end" },
    );
  }

  baseHeaders.push({
    title: "",
    key: "actions",
    width: "50px",
    sortable: false,
  });
  return baseHeaders;
});

// --- 5. BARCODE & SPK LOGIC ---
const addFirstTimeSpk = (spk: any) => addSpkWithQty(spk, 0);

const addSpkWithQty = (spk: any, initialQty: number) => {
  const nomorSpk =
    spk.SPK || spk.Spk || spk.spk_nomor || spk.NoSpk || spk.No_Pesanan;
  const namaSpk = spk.Nama || spk.spk_nama || spk.NamaBarang || spk.Nama_Barang;
  const qtyOrder =
    spk.Jumlah || spk.Qty || spk.qty_order || spk.Jumlah_Order || 0;
  const p = spk.Panjang || spk.panjang || 0;
  const l = spk.Lebar || spk.lebar || 0;

  if (!nomorSpk) return toast.error("Data SPK tidak valid");

  const newItem = {
    spk_nomor: nomorSpk,
    spk_nama: namaSpk,
    panjang: p,
    lebar: l,
    qty_order: qtyOrder,
    qty_hasil: initialQty,
    qty_bs: 0,
    pengali_mata_ayam: 4,
    jml_mata_ayam: 0,
    pengali_koli: 50,
    jml_koli: 0,
  };

  handleInputCalculation(newItem);
  detailData.value.push(newItem);
  isSpkModalVisible.value = false;
};

const handleBarcodeScan = async () => {
  if (!barcodeInput.value) return;
  isScanning.value = true;

  try {
    let quantityToAdd = 1;
    let finalBarcode = barcodeInput.value.trim();

    // Support format: 10*BARCODE
    if (finalBarcode.includes("*")) {
      const parts = finalBarcode.split("*");
      if (parts.length === 2) {
        quantityToAdd = parseFloat(parts[0]) || 1;
        finalBarcode = parts[1].trim();
      }
    }

    const existingIndex = detailData.value.findIndex(
      (d) => d.spk_nomor === finalBarcode,
    );

    if (existingIndex !== -1) {
      detailData.value[existingIndex].qty_hasil += quantityToAdd;
      handleInputCalculation(detailData.value[existingIndex]);
      toast.info(`SPK ${finalBarcode} bertambah ${quantityToAdd}`);
    } else {
      const response = await api.get(`/mmt/spk/${finalBarcode}`);
      if (response.data.success && response.data.data) {
        addSpkWithQty(response.data.data, quantityToAdd);
      } else {
        toast.error("SPK tidak ditemukan");
      }
    }
  } catch (e) {
    toast.error("Gagal memproses barcode");
  } finally {
    isScanning.value = false;
    barcodeInput.value = "";
  }
};

// --- 6. ACTIONS ---
const fetchPendingPotong = async () => {
  isFetchingPotong.value = true;
  try {
    const res = await api.get("/mmt/lhk-finishing/pra/pending-potong", {
      params: { targetProses: formData.proses },
    });
    if (res.data.success && res.data.data.length > 0) {
      res.data.data.forEach((item: any) => {
        if (!detailData.value.some((d) => d.spk_nomor === item.spk_nomor)) {
          const newItem = {
            spk_nomor: item.spk_nomor,
            spk_nama: item.spk_nama,
            panjang: item.panjang || 0,
            lebar: item.lebar || 0,
            qty_order: item.qty_order || 0,
            qty_hasil: item.qty_hasil || 0,
            qty_bs: 0,
            pengali_mata_ayam: 4,
            jml_mata_ayam: 0,
            pengali_koli: 50,
            jml_koli: 0,
          };
          handleInputCalculation(newItem);
          detailData.value.push(newItem);
        }
      });
      toast.success(`${res.data.data.length} data ditarik.`);
    }
  } finally {
    isFetchingPotong.value = false;
  }
};

const handleSaveDraft = async () => {
  if (detailData.value.length === 0) return;
  isSaving.value = true;
  try {
    const payload = {
      details: detailData.value.map((item) => ({
        ...item,
        proses_kategori: formData.proses,
        tgl_input: formData.tanggal,
        shift_input: formData.shift,
        input_by: userLogin.value,
        is_bundled: false,
      })),
    };
    await api.post("/mmt/lhk-finishing/pra", payload);
    toast.success("Berhasil simpan Pra-LHK");
    detailData.value = [];
  } catch (e: any) {
    toast.error(e.response?.data?.message || "Gagal simpan");
  } finally {
    isSaving.value = false;
  }
};

const openSpkSearch = () => (isSpkModalVisible.value = true);

// Update kalkulasi jika proses berubah
watch(
  () => formData.proses,
  () => {
    detailData.value.forEach((d) => handleInputCalculation(d));
  },
);

onMounted(getCurrentUser);
</script>

<style scoped>
.custom-input-qty :deep(input) {
  font-weight: bold;
  color: #1976d2 !important;
}
</style>
