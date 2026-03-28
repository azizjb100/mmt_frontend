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

            <template #[`item.qty_hasil`]="{ item }">
              <v-text-field
                v-model.number="item.qty_hasil"
                type="number"
                density="compact"
                variant="underlined"
                hide-details
                class="text-end custom-input-qty"
                @input="calculateMataAyam(item)"
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
                class="text-center custom-input-pengali"
                @input="calculateMataAyam(item)"
                style="min-width: 80px"
              />
            </template>

            <template #[`item.jml_mata_ayam`]="{ item }">
              <v-text-field
                v-model.number="item.jml_mata_ayam"
                type="number"
                density="compact"
                variant="underlined"
                hide-details
                class="text-end font-weight-bold"
                color="success"
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

            <template #[`item.pengali_koli`]="{ item }">
              <v-text-field
                v-model.number="item.pengali_koli"
                type="number"
                variant="underlined"
                suffix="pcs"
                @input="calculateKoli(item)"
              />
            </template>

            <template #[`item.jml_koli`]="{ item }">
              <v-text-field
                v-model.number="item.jml_koli"
                readonly
                class="font-weight-bold"
                color="purple"
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
  { title: "X-BANNER", value: "X_BANNER" },
  { title: "ROLL UP BANNER", value: "ROLLUP_BANNER" },
];

const formData = reactive({
  proses: "POTONG",
  tanggal: new Date().toISOString().substr(0, 10),
  shift: 1,
});

const detailData = ref<any[]>([]);

// Headers diperbarui dengan Ukuran dan Qty Order
const dynamicHeaders = computed(() => {
  const baseHeaders = [
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
  ];

  if (formData.proses === "MATA_AYAM") {
    // 1. DAFTARKAN KEY PENGALI (Wajib agar slot bisa muncul/diinput)
    baseHeaders.push({
      title: "MA per Pcs",
      key: "pengali_mata_ayam",
      width: "110px",
      align: "center",
      sortable: false,
    });

    // 2. DAFTARKAN KEY TOTAL
    baseHeaders.push({
      title: "Total Mata Ayam",
      key: "jml_mata_ayam",
      width: "130px",
      align: "end",
    });
  }

  if (formData.proses === "KOLI") {
    baseHeaders.push(
      {
        title: "Isi/Koli",
        key: "pengali_koli",
        width: "110px",
        align: "center",
      },
      { title: "Total Koli", key: "jml_koli", width: "130px", align: "end" },
    );
  }
  if (formData.proses === "X_BANNER" || formData.proses === "ROLLUP_BANNER") {
    baseHeaders.push({
      title: "Status Tiang",
      key: "status_tiang",
      width: "120px",
    });
  }

  baseHeaders.push({
    title: "",
    key: "actions",
    width: "50px",
    sortable: false,
  });
  return baseHeaders;
});

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
    pengali_mata_ayam: 4,
    jml_mata_ayam: 0,
    pengali_koli: 8, // Tambahkan default isi koli (misal 8)
    jml_koli: 0,
  });

  // Reset input scan dan tutup modal jika sedang terbuka
  barcodeInput.value = "";
  isSpkModalVisible.value = false;
};

const calculateMataAyam = (item: any) => {
  if (formData.proses === "MATA_AYAM") {
    // Mengambil nilai pengali dari baris tersebut
    const pengali = item.pengali_mata_ayam || 0;
    const hasil = item.qty_hasil || 0;

    item.jml_mata_ayam = hasil * pengali;
  } else {
    item.jml_mata_ayam = 0;
  }
};

const calculateKoli = (item: any) => {
  if (formData.proses === "KOLI") {
    const isiPerKoli = item.pengali_koli || 1; // Default 1 agar tidak error division by zero
    const hasilPcs = item.qty_hasil || 0;

    // Rumus: Hasil / Isi per Koli, dibulatkan ke atas
    item.jml_koli = Math.ceil(hasilPcs / isiPerKoli);
  } else {
    item.jml_koli = 0;
  }
};

const handleBarcodeScan = async () => {
  if (!barcodeInput.value) return;

  isScanning.value = true;
  try {
    const response = await api.get(`/mmt/spk/${barcodeInput.value}`);
    const res = response.data;

    if (res.success && res.data) {
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
        jml_mata_ayam: item.jml_mata_ayam,
        jml_koli: item.jml_koli || 0,
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
