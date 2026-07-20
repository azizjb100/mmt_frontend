<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { useToast } from "vue-toastification";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { useForm } from "@/composables/useForm";
import { mintaBahanFormService } from "@/services/mmt/FormPermintaanProduksiService";
import BaseForm from "@/components/BaseForm.vue";
import SpkSearchModal from "@/modal/SpkLookupModal.vue";
import BahanSearchModal from "@/modal/MasterBahanModal.vue";
import GudangLookupModal from "@/modal/GudangLookupView.vue"; // INTEGRASI: Modal Gudang
import {
  IconBox,
  IconSearch,
  IconTrash,
  IconPlus,
  IconCircleCheck,
  IconPrinter,
  IconX,
} from "@tabler/icons-vue";

interface DetailItem {
  kode: string;
  nama: string;
  satuan: string;
  // Field untuk SUBLIM
  babaran: number;
  pcs: number;
  // Field untuk MMT/TEKSTIL
  panjang: number;
  lebar: number;
  // Field Bersama
  butuh: number;
  jumlah: number;
  komponen: string;
  ket: string;
}

const route = useRoute();
const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();

const formatDateLocal = (value?: string | Date) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const kategoriOptions = ["MMT/TEKSTIL", "SUBLIM"];
const ketOptions = ["BARU", "GANTI BS", "GANTI HILANG", "TAMBAHAN", "LAINNYA"];
const divisiOptions = ["CUTING", "SUBLIM", "PROOF"];
const cabangOptions = ref<string[]>([]);
const komponenOptions = ref<string[]>([]);

// Modals Visibility State
const showSpkModal = ref(false);
const showBahanModal = ref(false);
const isGudangModalVisible = ref(false); // INTEGRASI: State modal gudang

const activeDetailIndex = ref(-1);
const showPrintConfirm = ref(false);
const savedNomor = ref("");

// 1. Initial State
const initialData = {
  nomor: "",
  tanggal: formatDateLocal(new Date()),
  kategori: "MMT/TEKSTIL",
  cabang: "P04",
  gudangAsalKode: "P04", // INTEGRASI: Mapping field gudang baru
  gudangAsalNama: "GUDANG UTAMA P04",
  divisi: "CUTING",
  spk: "",
  namaSpk: "NON-SPK (PERMINTAAN LANGSUNG)",
  jumlahSpk: 0,
  keterangan: "BARU",
  mkbNomor: "",
  mkbTanggal: "",
  status: "OPEN",
  pin_acc: "",
  pin_dipakai: "",
  details: [] as DetailItem[],
};

// 2. Setup useForm
const {
  formData,
  isEditMode,
  isLoading,
  isSaving,
  showSaveDialog,
  showCancelDialog,
  showCloseDialog,
  executeSave,
  executeCancel,
  executeClose,
  fetchData,
} = useForm({
  menuId: "127",
  initialData,
  fetchApi: async () => {
    const res = await mintaBahanFormService.getDetail(
      route.params.nomor as string,
    );
    const responseData = res.data?.data || res.data;
    const h = responseData.header || responseData;
    const d =
      responseData.details || responseData.Details || responseData.Detail || [];
    return {
      nomor: h.min_nomor || h.Nomor || h.nomor || "",
      tanggal: formatDateLocal(h.min_tanggal || h.Tanggal || h.tanggal),
      kategori:
        h.min_kategori ||
        h.Kategori ||
        h.kategori ||
        (h.Nomor ? "MMT/TEKSTIL" : "SUBLIM"),
      cabang: h.min_cab || h.GudangKode || h.gudang || "P04",
      gudangAsalKode: h.gudang_asal_kode || h.GudangKode || h.min_cab || "P04",
      gudangAsalNama:
        h.gudang_asal_nama || h.NamaGudang || h.Nama || "GUDANG UTAMA",
      divisi: h.min_divisi || h.Divisi || "CUTING",
      spk: h.min_spk_nomor || h.Nomor_SPK || h.spk || "",
      namaSpk: h.min_spk_nomor ? h.namaspk : "NON-SPK (PERMINTAAN LANGSUNG)",
      jumlahSpk: h.jumlahspk || h.JumlahSpk || 0,
      keterangan: h.min_ket || h.Keterangan || h.keterangan || "BARU",
      mkbNomor: h.mkb_nomor || h.MkbNomor || "",
      mkbTanggal: formatDateLocal(h.mkb_tanggal || h.MkbTanggal),
      status: h.min_close === 0 || h.Status === "OPEN" ? "OPEN" : "CLOSED",
      pin_acc: h.pin_acc || "",
      pin_dipakai: h.pin_dipakai || "",
      details: d.map((item: any) => ({
        kode: item.kode || item.Kode || item.mind_bhn_kode || item.sku || "",
        nama:
          item.nama || item.Nama || item.Nama_Bahan || item.nama_bahan || "",
        satuan: item.satuan || item.Satuan || "ROLL",
        babaran: Number(item.babaran || item.Babaran || item.mind_babaran) || 0,
        pcs: Number(item.pcs || item.Pcs || item.mind_pcs) || 0,
        panjang: Number(item.panjang || item.Panjang) || 0,
        lebar: Number(item.lebar || item.Lebar) || 0,
        butuh: Number(item.butuh || item.Butuh) || 0,
        jumlah:
          Number(
            item.jumlah || item.Jumlah || item.qtyMinta || item.mind_jumlah,
          ) || 0,
        komponen:
          item.komponen || item.Komponen || item.mind_komponen || "BODY",
        ket: item.ket || item.Ket || item.keterangan || item.mind_ket || "",
      })),
    };
  },
  submitApi: async (data: typeof initialData): Promise<unknown> => {
    const nomor = isEditMode.value ? (route.params.nomor as string) : undefined;
    const res = await mintaBahanFormService.saveData(data, nomor);
    savedNomor.value = res.data?.data?.nomor || nomor || data.nomor;
    showPrintConfirm.value = true;
    return res;
  },
});

// INTEGRASI: Computed property mode master bahan jika diperlukan backend nanti
const bahanModalMode = computed(() => {
  const kode = formData.value.gudangAsalKode?.toUpperCase() || "";
  const nama = formData.value.gudangAsalNama?.toLowerCase() || "";

  if (kode === "WH-20" || nama.includes("tinta") || nama.includes("obat")) {
    return "obat";
  }
  return "mmt";
});

const createEmptyRow = (): DetailItem => {
  return {
    kode: "",
    nama: "",
    satuan: "",
    babaran: 0,
    pcs:
      formData.value.kategori === "SUBLIM" ? formData.value.jumlahSpk || 0 : 0,
    panjang: 0,
    lebar: 0,
    butuh: 0,
    jumlah: 0,
    komponen: "BODY",
    ket: "",
  };
};

// INTEGRASI: Handle pemilihan gudang dari modal lookup view
const handleGudangSelect = (gudang: any) => {
  const hasItems = formData.value.details.some((d) => d.kode !== "");
  if (hasItems && formData.value.gudangAsalKode !== gudang.Kode) {
    if (
      !confirm(
        "Gudang diubah, daftar barang sebelumnya akan dikosongkan. Lanjutkan?",
      )
    ) {
      isGudangModalVisible.value = false;
      return;
    }
    formData.value.details = [createEmptyRow()];
  }
  formData.value.gudangAsalKode = gudang.Kode;
  formData.value.gudangAsalNama = gudang.Nama;
  formData.value.cabang = gudang.Kode; // Sinkronkan kode cabang/gudang tujuan
  isGudangModalVisible.value = false;
};

onMounted(async () => {
  komponenOptions.value = ["BODY", "RIB", "LENGAN", "KERAH", "KANTONG"];

  const filteredCabang = ["P01", "P04", "P05"];
  const userCab = authStore.userCabang;

  if (userCab === "P01" || userCab === "P04" || userCab === "P05") {
    cabangOptions.value = [userCab];
  } else {
    cabangOptions.value = filteredCabang;
  }

  if (isEditMode.value) {
    await fetchData();
  } else {
    formData.value.details = [createEmptyRow()];

    // Set default awal saat pertama kali buka form baru (karena default kategori awal adalah MMT/TEKSTIL)
    if (formData.value.kategori === "MMT/TEKSTIL") {
      formData.value.gudangAsalKode = "WH-16"; // Sesuaikan dengan KODE gudang MMT asli Anda
      formData.value.gudangAsalNama = "GUDANG UTAMA MMT";
      formData.value.cabang = formData.value.gudangAsalKode;
    } else {
      const activeCab =
        userCab === "P01" || userCab === "P04" || userCab === "P05"
          ? userCab
          : "P04";
      formData.value.cabang = activeCab;
      formData.value.gudangAsalKode = activeCab;
    }
  }
});

// Watcher transisi antar kategori produksi
watch(
  () => formData.value.kategori,
  (newKategori) => {
    if (!isEditMode.value) {
      clearSpkSelection();

      if (newKategori === "MMT/TEKSTIL") {
        // SET DEFAULT UNTUK MMT/TEKSTIL
        formData.value.gudangAsalKode = "WH-16"; // Sesuaikan dengan KODE gudang MMT asli di database Anda (misal: 'GDG-MMT' atau 'P04')
        formData.value.gudangAsalNama = "GUDANG UTAMA MMT";
        formData.value.cabang = formData.value.gudangAsalKode;
      } else if (newKategori === "SUBLIM") {
        // Jika balik ke sublim, kembalikan gudang default user cabang
        const userCab = authStore.userCabang || "P04";
        formData.value.gudangAsalKode = userCab;
        formData.value.gudangAsalNama =
          userCab === "P04" ? "GUDANG UTAMA P04" : `CABANG ${userCab}`;
        formData.value.cabang = userCab;
      }
    }
  },
);

const onSpkSelected = async (spk: any) => {
  const nomorSpk = spk.Spk || spk.spk || spk.Nomor;
  if (!nomorSpk) {
    toast.error("Nomor SPK tidak ditemukan!");
    return;
  }

  formData.value.spk = nomorSpk;
  showSpkModal.value = false;

  try {
    const res = await mintaBahanFormService.getSpkInfo(
      nomorSpk,
      formData.value.cabang,
      formData.value.keterangan,
    );
    const resData = res.data?.data;

    if (resData) {
      formData.value.namaSpk = resData.spkInfo
        ? resData.spkInfo.Nama || resData.spkInfo.nama
        : resData.Nama || resData.nama || "";

      formData.value.jumlahSpk = resData.spkInfo
        ? resData.spkInfo.Jumlah || resData.spkInfo.jumlah
        : resData.Jumlah || resData.jumlah || 0;

      if (resData.mkbHeader) {
        formData.value.mkbNomor =
          resData.mkbHeader.nomor || resData.mkbHeader.Nomor;
        formData.value.mkbTanggal =
          resData.mkbHeader.tanggal || resData.mkbHeader.Tanggal;
        formData.value.details = resData.mkbDetails || [];
      } else {
        formData.value.details = [createEmptyRow()];
      }
    }
  } catch (e: any) {
    console.error(e);
    toast.warning("Gagal mengambil info SPK.");
  }
};

const clearSpkSelection = () => {
  formData.value.spk = "";
  formData.value.namaSpk = "NON-SPK (PERMINTAAN LANGSUNG)";
  formData.value.jumlahSpk = 0;
  formData.value.mkbNomor = "";
  formData.value.mkbTanggal = "";
  formData.value.details = [createEmptyRow()];
};

const openBahanLookup = (index: number) => {
  activeDetailIndex.value = index;
  showBahanModal.value = true;
};

const onBahanSelected = (item: any) => {
  if (activeDetailIndex.value === -1) return;

  const targetKode = item.Kode || item.kode;
  const isDuplicate = formData.value.details.some(
    (d: DetailItem, idx: number) =>
      d.kode === targetKode && idx !== activeDetailIndex.value,
  );

  if (isDuplicate) {
    toast.error(`Kode ${targetKode} sudah di input di baris lain.`);
    return;
  }

  const row = formData.value.details[activeDetailIndex.value];

  // Mapping properti dari API
  row.kode = targetKode;
  row.nama = item.Nama || item.nama;
  row.satuan = item.Satuan || item.satuan || "ROLL";

  if (formData.value.kategori === "MMT/TEKSTIL") {
    // Panjang dan Lebar diambil dari API, dijadikan bahan bacaan/pelengkap
    row.panjang = Number(item.Panjang || item.panjang) || 0;
    row.lebar = Number(item.Lebar || item.lebar) || 0;
    // Jumlah di-default ke 1 atau 0 agar bisa diisi manual oleh user
    row.jumlah = row.jumlah > 0 ? row.jumlah : 1;
  } else {
    // Jika Sublim, jalankan kalkulasi bawaannya
    calculateJumlah(row);
  }

  showBahanModal.value = false;
  activeDetailIndex.value = -1;
};

const calculateJumlah = (item: DetailItem) => {
  // Mode MMT/TEKSTIL tidak memakai kalkulasi otomatis (User input manual di kolom jumlah)
  if (formData.value.kategori === "MMT/TEKSTIL") return;

  // Logika kalkulasi khusus SUBLIM
  const pcs = Number(item.pcs) || 0;
  const babaran = Number(item.babaran) || 0;
  if (babaran === 0) return;

  item.jumlah =
    item.satuan?.toUpperCase() === "KG"
      ? Number((pcs / babaran).toFixed(2))
      : Number((pcs * babaran).toFixed(2));
};

const validateBeforeSave = () => {
  if (formData.value.gudangAsalKode === "") {
    return toast.warning("Gudang tujuan/asal permintaan wajib dipilih.");
  }
  if (formData.value.details.length === 0) {
    return toast.warning("Detail barang permintaan tidak boleh kosong.");
  }
  if (formData.value.details.some((d: DetailItem) => !d.kode || d.jumlah < 0)) {
    return toast.warning("Lengkapi data barang dan pastikan jumlah valid.");
  }
  showSaveDialog.value = true;
};

const doPrint = () => {
  showPrintConfirm.value = false;
  window.open(
    `/mmt/permintaan-produksi/print/${encodeURIComponent(savedNomor.value)}`,
    "_blank",
  );
  router.push("/mmt/permintaan-produksi");
};

const doNotPrint = () => {
  showPrintConfirm.value = false;
  router.push("/mmt/permintaan-produksi");
};
</script>

<template>
  <BaseForm
    :title="(isEditMode ? 'Ubah' : 'Baru') + ' Permintaan Bahan Baku'"
    menu-id="127"
    :icon="IconBox"
    :is-loading="isLoading"
    :is-saving="isSaving"
    v-model:showSaveDialog="showSaveDialog"
    v-model:showCancelDialog="showCancelDialog"
    v-model:showCloseDialog="showCloseDialog"
    @validate-save="validateBeforeSave"
    @confirm-save="executeSave"
    @confirm-cancel="executeCancel"
    @confirm-close="executeClose"
  >
    <template #left-column>
      <div class="desktop-form-section header-section">
        <div class="text-caption font-weight-bold mb-3 text-primary">
          HEADER PERMINTAAN
        </div>

        <v-select
          v-model="formData.kategori"
          :items="kategoriOptions"
          label="Kategori Produksi"
          density="compact"
          variant="outlined"
          hide-details
          class="mb-2"
          color="success"
          :disabled="isEditMode"
        />

        <v-text-field
          v-model="formData.nomor"
          label="No. Permintaan"
          density="compact"
          variant="outlined"
          readonly
          placeholder="Otomatis"
          hide-details
          class="mb-2"
        />
        <v-text-field
          v-model="formData.tanggal"
          type="date"
          label="Tanggal"
          density="compact"
          variant="outlined"
          hide-details
          class="mb-2"
        />

        <v-text-field
          v-if="formData.kategori === 'MMT/TEKSTIL'"
          v-model="formData.gudangAsalNama"
          label="Gudang Tujuan"
          density="compact"
          variant="outlined"
          hide-details
          class="mb-2 text-primary"
          readonly
          @click="isGudangModalVisible = true"
        >
          <template #append-inner>
            <IconSearch
              :size="16"
              style="cursor: pointer"
              @click="isGudangModalVisible = true"
            />
          </template>
        </v-text-field>

        <v-select
          v-else
          v-model="formData.cabang"
          :items="cabangOptions"
          label="Gudang Tujuan"
          density="compact"
          variant="outlined"
          hide-details
          class="mb-2"
          :readonly="
            authStore.userCabang === 'P01' || authStore.userCabang === 'P04'
          "
        />

        <v-text-field
          v-if="formData.kategori === 'SUBLIM'"
          v-model="formData.spk"
          label="Nomor SPK"
          density="compact"
          variant="outlined"
          hide-details
          class="mb-2"
          readonly
          placeholder="Klik ikon cari untuk pilih SPK..."
        >
          <template #append-inner>
            <IconX
              v-if="formData.spk"
              :size="16"
              class="mr-1 text-error"
              style="cursor: pointer"
              @click="clearSpkSelection"
            />
            <IconSearch
              :size="16"
              style="cursor: pointer"
              @click="showSpkModal = true"
            />
          </template>
        </v-text-field>

        <div
          v-if="formData.kategori === 'SUBLIM' && formData.mkbNomor"
          class="d-flex gap-2 mb-2"
        >
          <v-text-field
            v-model="formData.mkbNomor"
            label="No. MKB"
            density="compact"
            variant="outlined"
            readonly
            hide-details
            class="flex-grow-1 bg-grey-lighten-4"
          />
          <v-text-field
            v-model="formData.mkbTanggal"
            label="Tgl MKB"
            density="compact"
            variant="outlined"
            readonly
            hide-details
            style="max-width: 140px"
            class="bg-grey-lighten-4"
          />
        </div>

        <v-textarea
          v-if="formData.kategori === 'SUBLIM'"
          v-model="formData.namaSpk"
          label="Nama SPK / Jenis Permintaan"
          density="compact"
          variant="outlined"
          rows="2"
          readonly
          hide-details
          class="mb-2 bg-grey-lighten-5"
        />

        <v-select
          v-model="formData.keterangan"
          :items="ketOptions"
          label="Keterangan"
          density="compact"
          variant="outlined"
          hide-details
          class="mb-2"
        />
      </div>
    </template>

    <template #right-column>
      <v-card border flat class="d-flex flex-column fill-height">
        <div class="table-container flex-grow-1">
          <table class="manksi-table">
            <thead>
              <tr v-if="formData.kategori === 'MMT/TEKSTIL'">
                <th width="40">No</th>
                <th width="110">Kode Bahan</th>
                <th>Nama Bahan Baku</th>
                <th width="60">Satuan</th>
                <th width="80">Panjang</th>
                <th width="80">Lebar</th>
                <th width="100">Jumlah Order</th>
                <th>Keterangan Detail</th>
                <th width="40"></th>
              </tr>
              <tr v-else>
                <th width="40">No</th>
                <th width="110">Kode</th>
                <th>Nama Bahan</th>
                <th width="60">Sat</th>
                <th width="80">Babaran</th>
                <th width="80">Pcs</th>
                <th width="90">Jumlah</th>
                <th width="120">Komponen</th>
                <th>Ket</th>
                <th width="40"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in formData.details" :key="index">
                <td class="text-center">{{ index + 1 }}</td>
                <td class="pa-0">
                  <div class="d-flex align-center fill-height px-1">
                    <input
                      v-model="item.kode"
                      class="cell-input fw-bold text-primary flex-grow-1"
                      readonly
                      placeholder="Cari..."
                      @click="openBahanLookup(index)"
                    />
                    <v-btn
                      size="x-small"
                      variant="text"
                      density="comfortable"
                      color="primary"
                      @click="openBahanLookup(index)"
                    >
                      <IconSearch :size="14" :stroke-width="1.7" />
                    </v-btn>
                  </div>
                </td>
                <td>
                  <input v-model="item.nama" class="cell-input" readonly />
                </td>
                <td class="text-center">{{ item.satuan }}</td>

                <template v-if="formData.kategori === 'MMT/TEKSTIL'">
                  <td>
                    <input
                      type="number"
                      v-model.number="item.panjang"
                      class="cell-input tr"
                      @input="calculateJumlah(item)"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      v-model.number="item.lebar"
                      class="cell-input tr"
                      @input="calculateJumlah(item)"
                    />
                  </td>
                  <td class="bg-yellow-lighten-5">
                    <input
                      type="number"
                      v-model.number="item.jumlah"
                      class="cell-input tr fw-bold"
                    />
                  </td>
                  <td><input v-model="item.ket" class="cell-input" /></td>
                </template>

                <template v-else>
                  <td>
                    <input
                      type="number"
                      v-model.number="item.babaran"
                      class="cell-input tr"
                      @input="calculateJumlah(item)"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      v-model.number="item.pcs"
                      class="cell-input tr"
                      @input="calculateJumlah(item)"
                    />
                  </td>
                  <td class="bg-yellow-lighten-5">
                    <input
                      type="number"
                      v-model.number="item.jumlah"
                      class="cell-input tr fw-bold"
                    />
                  </td>
                  <td>
                    <select v-model="item.komponen" class="cell-input">
                      <option
                        v-for="opt in komponenOptions"
                        :key="opt"
                        :value="opt"
                      >
                        {{ opt }}
                      </option>
                    </select>
                  </td>
                  <td><input v-model="item.ket" class="cell-input" /></td>
                </template>

                <td class="text-center">
                  <v-btn
                    size="x-small"
                    variant="text"
                    color="error"
                    @click="formData.details.splice(index, 1)"
                  >
                    <IconTrash :size="14" :stroke-width="1.7" />
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <v-divider />
        <div class="pa-2 d-flex bg-grey-lighten-4 align-center">
          <v-btn
            size="x-small"
            color="primary"
            variant="flat"
            @click="formData.details.push(createEmptyRow())"
          >
            <template #prepend
              ><IconPlus :size="14" :stroke-width="2"
            /></template>
            Tambah Baris
          </v-btn>
          <v-spacer />
          <div class="text-caption font-weight-bold">
            Total Qty Diminta:
            {{
              formData.details
                .reduce((a, b) => a + (Number(b.jumlah) || 0), 0)
                .toFixed(2)
            }}
          </div>
        </div>
      </v-card>
    </template>
  </BaseForm>

  <GudangLookupModal
    :isVisible="isGudangModalVisible"
    @close="isGudangModalVisible = false"
    @select="handleGudangSelect"
  />

  <SpkSearchModal
    :isVisible="showSpkModal"
    @close="showSpkModal = false"
    @select="onSpkSelected"
  />
  <BahanSearchModal
    :isVisible="showBahanModal"
    @close="showBahanModal = false"
    @select="onBahanSelected"
  />

  <v-dialog v-model="showPrintConfirm" max-width="400px" persistent>
    <v-card class="rounded-lg">
      <v-card-title
        class="bg-primary text-white text-subtitle-1 font-weight-bold pa-3"
        >Simpan Berhasil</v-card-title
      >
      <v-card-text class="pa-4 text-center mt-2">
        <IconCircleCheck :size="48" color="green" class="mb-3" />
        <div class="text-body-1 font-weight-medium">
          Permintaan Bahan berhasil disimpan!
        </div>
      </v-card-text>
      <v-card-actions class="bg-grey-lighten-4 pa-3">
        <v-btn color="grey-darken-2" variant="outlined" @click="doNotPrint"
          >Tutup</v-btn
        >
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="elevated" @click="doPrint">
          <template #prepend
            ><IconPrinter :size="15" :stroke-width="1.7"
          /></template>
          Ya, Cetak
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.manksi-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}
.manksi-table th {
  background: #1565c0;
  color: white;
  padding: 6px;
  position: sticky;
  top: 0;
  z-index: 1;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.manksi-table td {
  border: 1px solid #e0e0e0;
  padding: 0;
  height: 28px;
}
.cell-input {
  width: 100%;
  height: 100%;
  border: none;
  padding: 0 6px;
  outline: none;
  background: transparent;
}
.cell-input:focus {
  background: #e3f2fd;
}
.table-container {
  overflow: auto;
  height: 100%;
}
.tr {
  text-align: right;
}
.fw-bold {
  font-weight: bold;
}
</style>
