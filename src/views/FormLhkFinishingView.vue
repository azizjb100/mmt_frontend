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
            Data ini akan tersimpan di tabel <strong>Pra-LHK (tpra)</strong>.
            Admin akan melakukan bundling data ini untuk menerbitkan nomor LHK
            resmi.
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="9">
        <v-card variant="outlined">
          <v-card-title class="d-flex align-center bg-grey-lighten-4 py-2 px-4">
            <span class="text-subtitle-1 font-weight-bold"
              >Rincian Pekerjaan - {{ formData.proses }}</span
            >
            <v-spacer />

            <!-- INPUT SCAN BARCODE -->
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
              placeholder="Tekan Enter setelah scan"
              :loading="isScanning"
            />

            <v-btn
              color="success"
              size="small"
              prepend-icon="mdi-plus"
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
            <!-- Kolom Ukuran -->
            <template #[`item.ukuran`]="{ item }">
              {{ item.panjang }} x {{ item.lebar }}
            </template>

            <!-- Kolom Input Qty Hasil -->
            <template #[`item.qty_hasil`]="{ item }">
              <v-text-field
                v-model.number="item.qty_hasil"
                type="number"
                density="compact"
                variant="underlined"
                hide-details
                class="text-end custom-input-qty"
              />
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
      @select="addSpk"
      @close="isSpkModalVisible = false"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import SpkLookupModal from "@/modal/SpkLookupModal.vue";

const toast = useToast();
const isSaving = ref(false);
const isScanning = ref(false);
const isSpkModalVisible = ref(false);
const barcodeInput = ref("");

const daftarProses = [
  { title: "POTONG", value: "POTONG" },
  { title: "SEAMING", value: "SEAMING" },
  { title: "MATA AYAM", value: "MATA_AYAM" },
  { title: "KOLI", value: "KOLI" },
];

const formData = reactive({
  proses: "POTONG",
  tanggal: new Date().toISOString().substr(0, 10),
  shift: 1,
});

const detailData = ref<any[]>([]);

// Headers diperbarui dengan Ukuran dan Qty Order
const dynamicHeaders = computed(() => [
  { title: "No SPK", key: "spk_nomor", width: "150px" },
  { title: "Nama Produk", key: "spk_nama" },
  { title: "Ukuran (PxL)", key: "ukuran", width: "120px" },
  { title: "Order", key: "qty_order", width: "100px", align: "end" },
  {
    title: `Hasil ${formData.proses}`,
    key: "qty_hasil",
    width: "130px",
    align: "end",
  },
  { title: "", key: "actions", width: "50px", sortable: false },
]);

const openSpkSearch = () => (isSpkModalVisible.value = true);

const addSpk = (spk: any) => {
  // Debug untuk memastikan data yang masuk
  console.log("Data SPK Masuk:", spk);

  // 1. Ambil Nomor SPK (Menangani: SPK, Spk, spk_nomor, NoSpk)
  const nomorSpk =
    spk.SPK || spk.Spk || spk.spk_nomor || spk.NoSpk || spk.No_Pesanan;

  // 2. Ambil Nama Produk (Menangani: Nama, spk_nama, NamaBarang)
  const namaSpk = spk.Nama || spk.spk_nama || spk.NamaBarang || spk.Nama_Barang;

  // 3. Ambil Qty Order (Menangani: Jumlah, Qty, qty_order)
  const qtyOrder =
    spk.Jumlah || spk.Qty || spk.qty_order || spk.Jumlah_Order || 0;

  // 4. Ambil Ukuran
  const p = spk.Panjang || spk.panjang || 0;
  const l = spk.Lebar || spk.lebar || 0;

  // VALIDASI: Jika nomorSpk tetap tidak ditemukan setelah pengecekan di atas
  if (!nomorSpk) {
    console.error("Gagal mendapatkan Nomor SPK dari data:", spk);
    toast.error("Format data SPK tidak dikenali oleh sistem");
    return;
  }

  // Cek duplikasi di tabel agar tidak ada baris ganda
  const isExist = detailData.value.some((d) => d.spk_nomor === nomorSpk);
  if (isExist) {
    toast.warning(`SPK ${nomorSpk} sudah ada dalam daftar`);
    barcodeInput.value = "";
    return;
  }

  // Masukkan ke dalam tabel rincian
  detailData.value.push({
    spk_nomor: nomorSpk,
    spk_nama: namaSpk,
    panjang: p,
    lebar: l,
    qty_order: qtyOrder,
    qty_hasil: 0,
    qty_bs: 0,
  });

  // Reset input scan dan tutup modal jika sedang terbuka
  barcodeInput.value = "";
  isSpkModalVisible.value = false;
};

// Fungsi Handle Scan Barcode
const handleBarcodeScan = async () => {
  if (!barcodeInput.value) return;

  isScanning.value = true;
  try {
    const response = await api.get(`/mmt/spk/${barcodeInput.value}`);
    const res = response.data;

    if (res.success && res.data) {
      // Kirim isinya saja ke fungsi addSpk
      addSpk(res.data);
    } else {
      toast.error(res.message || "Data SPK tidak ditemukan");
    }
  } catch (e: any) {
    console.error("Scan Error:", e);
    toast.error(e.response?.data?.message || "Gagal memproses barcode");
  } finally {
    isScanning.value = false;
    barcodeInput.value = "";
    // Fokuskan kembali ke input barcode jika perlu (opsional)
  }
};

const handleSaveDraft = async () => {
  if (detailData.value.length === 0) {
    toast.error("Rincian pekerjaan masih kosong");
    return;
  }

  isSaving.value = true;
  try {
    const payload = {
      details: detailData.value.map((item) => ({
        spk_nomor: item.spk_nomor,
        spk_nama: item.spk_nama,
        proses_kategori: formData.proses,
        qty_hasil: item.qty_hasil,
        qty_bs: item.qty_bs || 0,
        tgl_input: formData.tanggal,
        shift_input: formData.shift,
        is_bundled: false,
      })),
    };

    await api.post("/mmt/lhk-finishing/pra", payload);

    toast.success("Berhasil menyimpan ke Pra-LHK");
    detailData.value = [];
  } catch (e: any) {
    toast.error(e.response?.data?.message || "Gagal menyimpan");
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
.v-card-title {
  font-size: 0.95rem !important;
}
.custom-input-qty :deep(input) {
  font-weight: bold;
  color: #1976d2;
}
</style>
