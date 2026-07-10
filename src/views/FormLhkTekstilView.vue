<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from "vue";
import { format } from "date-fns";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { useForm } from "@/composables/useForm";
import api from "@/services/api";
import BaseForm from "@/components/BaseForm.vue";
import MesinLookupView from "@/modal/MesinLookupModal.vue";
import SpkLookupView from "@/modal/SpkMesinLookupModal.vue";
import {
  IconBuildingFactory,
  IconSearch,
  IconTrash,
  IconBarcode,
  IconRefresh,
  IconSparkles,
} from "@tabler/icons-vue";

const toast = useToast();
const route = useRoute();
const router = useRouter();

const SCALE = 60; // Skala rendering layout canvas visual
const formTitle = ref("LHK Produksi Tekstil (Combine SPK)");

// 1. Initial Data state penampung sesuai standarisasi form Anda
const initialData = {
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  shift: 1,
  gdgKode: "GPM",
  barcode_input: "",
  barcode_spk: "",
  brg_nama: "",
  brg_kode: "",
  lebar_bahan: 0,
  panjang_bahan: 0, // Dalam satuan Yard dari DB
  sisa_panjang_manual: null as number | null,
  panjang_bs: "" as any, // Ubah ke string kosong untuk mempermudah input manual desimal bertitik/berkoma
  lebar_bs: "" as any,
  mesin_kode: "",
  mesin_nama: "",
  lstatus: "DRAFT",
  details: [] as any[],
};

// 2. Integrasi useForm Composable
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
  menuId: "128", // Sesuaikan dengan id menu LHK Tekstil Anda
  initialData,
  fetchApi: async () => {
    const nomorLhk = route.params.nomor as string;
    const res = await api.get(`/mmt/lhk-tekstil-mmt/${nomorLhk}`);
    const h = res.data.data.header;

    // Pemetaan balik dari format DB lama ke objek form reaktif
    return {
      nomor: h.Nomor || h.lth_nomor,
      tanggal: format(new Date(h.Tanggal || h.lth_tanggal), "yyyy-MM-dd"),
      shift: h.Shift || h.lth_shift || 1,
      gdgKode: h.Gudang || h.lth_gdg_prod || "GPM",
      brg_kode: h.Kode_Bahan || h.lth_brg_kode,
      barcode_input: h.Barcode_Roll || h.lth_barcode,
      panjang_bs:
        h.Panjang_BS !== undefined && h.Panjang_BS !== null
          ? h.Panjang_BS.toString()
          : h.lth_panjang_bs !== undefined && h.lth_panjang_bs !== null
            ? h.lth_panjang_bs.toString()
            : "",
      lebar_bs:
        h.Lebar_BS !== undefined && h.Lebar_BS !== null
          ? h.Lebar_BS.toString()
          : h.lth_lebar_bs !== undefined && h.lth_lebar_bs !== null
            ? h.lth_lebar_bs.toString()
            : "",
      mesin_kode: h.Mesin || h.Kode_Mesin || h.lth_mesin_kode || "",
      mesin_nama:
        h.Mesin || h.Nama_Mesin || h.mesin_nama || h.lth_mesin_nama || "",
      sisa_panjang_manual:
        h.sisa_panjang_manual !== undefined
          ? parseFloat(h.sisa_panjang_manual)
          : null,
      panjang_bahan: 0, // Nanti diisi otomatis saat trigger handleBarcodeScan berjalan
      lstatus: h.lth_status || "DRAFT",
      details: res.data.data.details.map((d: any) => {
        const qtyOrder = parseInt(
          d.Jumlah_SPK || d.Jumlah || d.spk_qty || d.ltd_qty_order || 0,
        );
        const sdhCetak = parseInt(
          d.sudah_cetak_sebelumnya || d.Sudah_Cetak || d.spk_sudah_cetak || 0,
        );
        return {
          nomor_spk: d.Nomor_SPK || d.ltd_spk_nomor,
          nama_spk: d.Nama_SPK || d.spk_nama,
          panjang_spk: parseFloat(d.Panjang || d.spk_panjang || 0),
          lebar_spk: parseFloat(d.Lebar || d.spk_lebar || 0),
          jumlah: qtyOrder,
          sudahcetak: sdhCetak,
          total_pernah_cetak: parseInt(d.total_pernah_cetak || 0),
          kurangcetak_asli: parseInt(
            d.Kurang_Cetak || d.ltd_kurang_cetak || qtyOrder - sdhCetak,
          ),
          padding:
            d.ltd_pad !== undefined
              ? parseFloat(d.ltd_pad)
              : parseFloat(d.Padding || d.ltd_padding || 0.03),
          orientasi: d.Orientasi || d.ltd_orientasi || "lebar",
          cetak1: parseInt(d.ltd_cetak1 ?? d.Cetak_1 ?? d.cetak1 ?? 0),
          cetak2: parseInt(d.ltd_cetak2 ?? d.Cetak_2 ?? d.cetak2 ?? 0),
          cetak3: parseInt(d.ltd_cetak3 ?? d.Cetak_3 ?? d.cetak3 ?? 0),
          cetak4: parseInt(d.ltd_cetak4 ?? d.Cetak_4 ?? d.cetak4 ?? 0),
          cetak5: parseInt(d.ltd_cetak5 ?? d.Cetak_5 ?? d.cetak5 ?? 0),
          cetak6: parseInt(d.ltd_cetak6 ?? d.Cetak_6 ?? d.cetak6 ?? 0),
          cetak7: parseInt(d.ltd_cetak7 ?? d.Cetak_7 ?? d.cetak7 ?? 0),
          totalcetak: parseInt(d.Jml_Cetak || d.totalcetak || 0),
          kurangcetak: 0,
        };
      }),
    };
  },
  submitApi: async (data: typeof initialData): Promise<unknown> => {
    const sisaOtomatisYard = sisaStokOtomatisYrd.value;
    const sisaFinalYard =
      formData.value.sisa_panjang_manual !== null &&
      formData.value.sisa_panjang_manual !== ""
        ? parseFloat(Number(formData.value.sisa_panjang_manual).toFixed(2))
        : parseFloat(Number(sisaOtomatisYard).toFixed(2));

    const formattedDetails = formData.value.details.map((d) => ({
      ...d,
      mesin: formData.value.mesin_kode,
      panjang_per_pcs: parseFloat(d.panjang_spk || 0),
      jumlah_cetak: parseInt(d.totalcetak || 0),
      ltd_ambil_bahan: parseFloat(formData.value.panjang_bahan || 0),
      sisabahan: sisaFinalYard,
      padding: parseFloat(d.padding || 0),
      cetak_1: parseInt(d.cetak1 || 0),
      cetak_2: parseInt(d.cetak2 || 0),
      cetak_3: parseInt(d.cetak3 || 0),
      cetak_4: parseInt(d.cetak4 || 0),
      cetak_5: parseInt(d.cetak5 || 0),
      cetak_6: parseInt(d.cetak6 || 0),
      cetak_7: parseInt(d.cetak7 || 0),
    }));

    const payload = {
      header: {
        ...formData.value,
        panjang_bs:
          formData.value.panjang_bs !== ""
            ? parseFloat(formData.value.panjang_bs)
            : 0,
        lebar_bs:
          formData.value.lebar_bs !== ""
            ? parseFloat(formData.value.lebar_bs)
            : 0,
        panjang_awal: formData.value.panjang_bahan,
        sisa_panjang_manual: sisaFinalYard,
      },
      details: formattedDetails,
    };
    return await api.post("/mmt/lhk-tekstil-mmt", payload);
  },
});

const lookup = reactive({ mesin: false, spk: false });
const manualOffsets = reactive<
  Record<number, { x: number; y: number; rotation: number }>
>({});
const totalPanjangTerpakai = ref(0);
const totalLebarGabungan = ref(0);

// Perhitungan Konversi Satuan Yard ke Meter (1 Yard = 0.9 Meter)
const panjangBhanDalamMeter = computed(
  () => (formData.value.panjang_bahan || 0) * 0.9,
);

const sisaStokOtomatisM = computed(() => {
  const rawBs = formData.value.panjang_bs;
  const bsPanjang =
    rawBs && !isNaN(parseFloat(rawBs as string))
      ? parseFloat(rawBs as string)
      : 0;
  return panjangBhanDalamMeter.value - totalPanjangTerpakai.value - bsPanjang;
});
const sisaStokOtomatisYrd = computed(() => sisaStokOtomatisM.value / 0.9);

const isFormValid = computed(() => {
  return (
    formData.value.details.length > 0 &&
    formData.value.brg_kode !== "" &&
    formData.value.details.every((d) => d.totalcetak > 0)
  );
});

const handleMesinSelect = (mesin: any) => {
  formData.value.mesin_kode = mesin.Kode || mesin.id || mesin.kode_mesin || "";
  formData.value.mesin_nama =
    mesin.Nama || mesin.nama || mesin.nama_mesin || "";
  lookup.mesin = false;
  toast.success(`Mesin ${formData.value.mesin_nama} dipilih`);
};

// SOLUSI MATEMATIS AKURAT: Pengamanan casting ketat desimal menggunakan parseFloat agar sinkron presisi
const recalculateCombine = () => {
  let subtotalSistemSemuaBaris = 0;

  formData.value.details.forEach((d) => {
    const newTotalCetak =
      (parseInt(d.cetak1) || 0) +
      (parseInt(d.cetak2) || 0) +
      (parseInt(d.cetak3) || 0) +
      (parseInt(d.cetak4) || 0) +
      (parseInt(d.cetak5) || 0) +
      (parseInt(d.cetak6) || 0) +
      (parseInt(d.cetak7) || 0);

    if (newTotalCetak > Number(d.kurangcetak_asli || 0)) {
      toast.warning(
        `SPK ${d.nomor_spk} (Input: ${newTotalCetak} melebihi sisa order: ${d.kurangcetak_asli})`,
      );
    }

    d.totalcetak = newTotalCetak;
    d.total_pernah_cetak = (d.sudahcetak || 0) + d.totalcetak;
    d.kurangcetak = Math.max(0, (d.jumlah || 0) - d.total_pernah_cetak);

    const pSpk = parseFloat(d.panjang_spk as any) || 0;
    const padM = parseFloat(d.padding as any) || 0; // Proteksi casting string-to-float

    subtotalSistemSemuaBaris += (pSpk + padM) * d.totalcetak;
  });

  totalPanjangTerpakai.value = Number(subtotalSistemSemuaBaris.toFixed(2));

  nextTick(() => {
    autoFillLayout(true);
  });
};

const autoFillLayout = (isSilent = false) => {
  if (formData.value.details.length === 0 || formData.value.lebar_bahan <= 0) {
    totalLebarGabungan.value = 0;
    return;
  }

  Object.keys(manualOffsets).forEach((key) => delete manualOffsets[key]);

  let unitGlobalIdx = 0;
  let currentStartX = 0;
  let currentY = 0;
  let maxOverallX = 0;
  let tempTotalLebar = 0;

  formData.value.details.forEach((spk) => {
    const totalCetak = spk.totalcetak || 0;
    if (totalCetak <= 0) return;

    const padM = parseFloat(spk.padding as any) || 0;
    const w =
      spk.orientasi === "lebar" ? spk.panjang_spk + padM : spk.lebar_spk;
    const h =
      spk.orientasi === "lebar" ? spk.lebar_spk : spk.panjang_spk + padM;

    for (let col = 0; col < totalCetak; col++) {
      if (currentY > 0 && currentY + h > formData.value.lebar_bahan + 0.01) {
        currentStartX = maxOverallX;
        currentY = 0;
      }

      if (!manualOffsets[unitGlobalIdx]) {
        manualOffsets[unitGlobalIdx] = {
          x: currentStartX,
          y: currentY,
          rotation: spk.orientasi === "panjang" ? 90 : 0,
        };
      }

      const edgeRight = manualOffsets[unitGlobalIdx].x + w;
      const edgeBottom = manualOffsets[unitGlobalIdx].y + h;

      if (edgeRight > maxOverallX) maxOverallX = edgeRight;
      if (edgeBottom > tempTotalLebar) tempTotalLebar = edgeBottom;

      currentY += h;
      unitGlobalIdx++;
    }
  });

  totalLebarGabungan.value = tempTotalLebar;
  if (!isSilent) toast.success("Layout otomatis berhasil dioptimasi.");
};

const startDrag = (event: MouseEvent, idx: number) => {
  const startX = event.clientX;
  const startY = event.clientY;
  const initialX = manualOffsets[idx]?.x ?? 0;
  const initialY = manualOffsets[idx]?.y ?? 0;

  const onMouseMove = (e: MouseEvent) => {
    const dx = (e.clientX - startX) / SCALE;
    const dy = (e.clientY - startY) / SCALE;
    manualOffsets[idx] = {
      x: initialX + dx,
      y: initialY + dy,
      rotation: manualOffsets[idx]?.rotation ?? 0,
    };
    updateLimitsFromLayout();
  };

  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
};

const updateLimitsFromLayout = () => {
  let maxY = 0;
  layoutRows.value.forEach((block, idx) => {
    const posY = manualOffsets[idx]?.y ?? block.y;
    if (posY + block.h > maxY) maxY = posY + block.h;
  });
  totalLebarGabungan.value = maxY;
};

const handleDoubleClick = (idx: number) => {
  if (manualOffsets[idx]) {
    manualOffsets[idx].rotation = (manualOffsets[idx].rotation + 90) % 360;
    updateLimitsFromLayout();
  }
};

const resetManualLayout = () => {
  Object.keys(manualOffsets).forEach((key) => delete manualOffsets[key]);
  recalculateCombine();
};

const layoutRows = computed(() => {
  const blocks: any[] = [];
  formData.value.details.forEach((spk) => {
    const padM = parseFloat(spk.padding as any) || 0;
    const visualW =
      spk.orientasi === "lebar" ? spk.panjang_spk + padM : spk.lebar_spk;
    const visualH =
      spk.orientasi === "lebar" ? spk.lebar_spk : spk.panjang_spk + padM;

    for (let i = 0; i < (spk.totalcetak || 0); i++) {
      blocks.push({
        label: `${spk.nomor_spk}`,
        w: visualW,
        h: visualH,
        x: 0,
        y: 0,
        rotated: spk.orientasi === "panjang",
      });
    }
  });
  return blocks;
});

const rollStyle = computed(() => ({
  height: `${formData.value.lebar_bahan * SCALE}px`,
  width: `${Math.max(totalPanjangTerpakai.value, panjangBhanDalamMeter.value) * SCALE}px`,
  position: "relative" as const,
  backgroundColor: "#ffffff",
  border: "2px solid #2c3e50",
  backgroundImage: "linear-gradient(90deg, #f1f1f1 1px, transparent 1px)",
  backgroundSize: `${SCALE}px 100%`,
}));

// Mengamankan pengetikan koma / titik desimal manual real-time pada data BS
const handleBsInput = (event: any) => {
  let val = event.target.value;
  if (val.includes(",")) {
    val = val.replace(",", ".");
  }
  formData.value.panjang_bs = val;
  recalculateCombine();
};

const handleBsLebarInput = (event: any) => {
  let val = event.target.value;
  if (val.includes(",")) {
    val = val.replace(",", ".");
  }
  formData.value.lebar_bs = val;
};

// Mengamankan pengetikan desimal per baris padding di dalam tabel manksi-table
const handlePaddingTableInput = (event: any, item: any) => {
  let val = event.target.value;
  if (val.includes(",")) {
    val = val.replace(",", ".");
  }
  item.padding = val;
  recalculateCombine();
};

const handleBarcodeScan = async () => {
  const code = formData.value.barcode_input;

  if (!code) return;

  // 1. Pengecekan Regex Anti-Spasi
  const regex = /^[a-zA-Z0-9-]+$/;
  if (!regex.test(code)) {
    toast.error("Format Barcode tidak valid! (Ada spasi atau karakter ilegal)");
    clearBahan();
    return;
  }

  try {
    const res = await api.get(`/mmt/stok-gudang/${code}`);

    // PEMBONGKARAN DOUBLE NESTING SESUAI RESPON API ANDA:
    const responsePayload = res.data; // Mengambil object utama { success, message, data }

    if (!responsePayload || !responsePayload.success || !responsePayload.data) {
      toast.error("Barcode tidak terdaftar atau tidak ditemukan!");
      clearBahan();
      return;
    }

    const wrapperData = responsePayload.data; // Mengambil objek { data, status }
    const info = wrapperData.data; // Mengambil objek inti roll { Barcode, Kode, dll }
    const statusGudang = wrapperData.status; // Mengambil status "NEED_MUTATION" atau "READY"

    if (!info) {
      toast.error("Detail data material kosong atau stok habis!");
      clearBahan();
      return;
    }

    // KONDISI A: Bahan Siap Cetak di Gudang Produksi (GPM)
    if (statusGudang === "READY") {
      formData.value.brg_nama = info.Nama_Bahan || "";
      formData.value.brg_kode = info.Kode || "";
      formData.value.lebar_bahan = parseFloat(info.Lebar) || 0;
      formData.value.panjang_bahan = parseFloat(info.Sisa_Panjang) || 0;
      formData.value.gdgKode = info.Kode_Gudang || "GPM";

      recalculateCombine();
      toast.success("Material Ready di Gudang Produksi (GPM)");
    }

    // KONDISI B: Bahan Masih di Gudang Utama (WH-16) -> Memunculkan Error / Warning
    else if (statusGudang === "NEED_MUTATION") {
      // Opsi 1: Jika Anda tetap ingin menampilkan data bahannya ke layar tetapi memberi peringatan keras
      formData.value.brg_nama = info.Nama_Bahan || "";
      formData.value.brg_kode = info.Kode || "";
      formData.value.lebar_bahan = parseFloat(info.Lebar) || 0;
      formData.value.panjang_bahan = parseFloat(info.Sisa_Panjang) || 0;
      formData.value.gdgKode = info.Kode_Gudang || "WH-16";

      recalculateCombine();

      // Memunculkan Toast Warning/Error yang tidak otomatis tertutup dengan cepat (8 detik)
      toast.error(
        `⛔ BARANG MASIH DI GUDANG UTAMA (${info.Kode_Gudang})! Silakan lakukan proses MUTASI MASUK ke GPM terlebih dahulu agar bisa diproduksi.`,
        {
          timeout: 8000,
          closeOnClick: true,
          pauseOnHover: true,
        },
      );
    }

    // KONDISI C: Status tidak dikenal / NOT_FOUND
    else {
      toast.error("Barcode tidak tersedia atau sudah terpakai di LHK lain.");
      clearBahan();
    }
  } catch (e) {
    toast.error("Gagal memuat atau membaca data barcode");
    clearBahan();
    console.error("Error Scan:", e);
  }
};

const clearBahan = () => {
  formData.value.brg_nama = "";
  formData.value.brg_kode = "";
  formData.value.lebar_bahan = 0;
  formData.value.panjang_bahan = 0;
};

const handleSpkScan = async () => {
  const code = formData.value.barcode_spk?.trim();
  if (!code) return;
  if (formData.value.details.some((d) => d.nomor_spk === code)) {
    toast.warning("SPK sudah ada di list.");
    formData.value.barcode_spk = "";
    return;
  }
  try {
    const res = await api.get(`/mmt/SPK/${code}`);
    const spk = res.data.data || res.data;
    if (spk) {
      injectSpkObject(spk);
      formData.value.barcode_spk = "";
    }
  } catch (e) {
    toast.error("Gagal memuat barcode SPK");
  }
};

const injectSpkObject = (spk: any) => {
  formData.value.details.push({
    nomor_spk: spk.Spk || spk.nomor_spk || spk.Id,
    nama_spk: spk.Nama || spk.nama || "No Name",
    panjang_spk: parseFloat(spk.Panjang || 0),
    lebar_spk: parseFloat(spk.Lebar || 0),
    jumlah: parseInt(spk.Jumlah || 0),
    sudahcetak: parseInt(spk.Sudah_Cetak || 0),
    kurangcetak_asli: parseInt(spk.Kurang_Cetak || spk.Jumlah || 0),
    padding: "0.03", // Default string untuk kenyamanan edit desimal
    orientasi: "lebar",
    cetak1: 0,
    cetak2: 0,
    cetak3: 0,
    cetak4: 0,
    cetak5: 0,
    cetak6: 0,
    cetak7: 0,
    totalcetak: 0,
    kurangcetak: parseInt(spk.Kurang_Cetak || 0),
  });
  recalculateCombine();
};

const validateBeforeSave = (status: string) => {
  if (!formData.value.mesin_kode) {
    return toast.error("Silakan pilih mesin terlebih dahulu pada kolom kiri!");
  }

  if (
    formData.value.panjang_bs === null ||
    formData.value.panjang_bs === "" ||
    formData.value.lebar_bs === null ||
    formData.value.lebar_bs === ""
  ) {
    return toast.error(
      "Gagal Simpan: Ukuran BS (Panjang & Lebar) tidak boleh kosong! Wajib diisi manual (Isi 0 jika tidak ada BS).",
    );
  }

  if (status === "POSTED" && !isFormValid.value) {
    return toast.error("Cek kelengkapan data & pastikan sisa stok memadai.");
  }

  formData.value.lstatus = status;
  showSaveDialog.value = true;
};

onMounted(async () => {
  if (isEditMode.value) {
    await fetchData();
    if (formData.value.barcode_input) await handleBarcodeScan();
  }
});
</script>

<template>
  <BaseForm
    :title="(isEditMode ? 'Ubah' : 'Baru') + ' LHK Produksi Tekstil'"
    menu-id="128"
    :icon="IconBuildingFactory"
    :is-loading="isLoading"
    :is-saving="isSaving"
    v-model:showSaveDialog="showSaveDialog"
    v-model:showCancelDialog="showCancelDialog"
    v-model:showCloseDialog="showCloseDialog"
    @validate-save="validateBeforeSave(formData.lstatus)"
    @confirm-save="executeSave"
    @confirm-cancel="executeCancel"
    @confirm-close="executeClose"
  >
    <template #left-column>
      <div class="desktop-form-section header-section">
        <div class="text-caption font-weight-bold mb-3 text-primary">
          INFORMASI UTAMA LHK
        </div>

        <v-text-field
          label="Nomor LHK"
          v-model="formData.nomor"
          readonly
          density="compact"
          variant="outlined"
          class="mb-2"
          hide-details
        />
        <v-text-field
          label="Tanggal"
          v-model="formData.tanggal"
          type="date"
          density="compact"
          variant="outlined"
          class="mb-2"
          hide-details
        />
        <v-row dense class="mb-2">
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
              label="Gudang"
              v-model="formData.gdgKode"
              readonly
              density="compact"
              variant="filled"
              hide-details
            />
          </v-col>
        </v-row>
        <v-text-field
          label="Pilih Mesin"
          v-model="formData.mesin_nama"
          readonly
          density="compact"
          variant="outlined"
          class="mb-4 cursor-pointer"
          hide-details
          color="primary"
          @click="lookup.mesin = true"
        >
          <template #append-inner>
            <IconSearch
              :size="16"
              style="cursor: pointer"
              @click="lookup.mesin = true"
            />
          </template>
        </v-text-field>

        <div class="text-caption font-weight-bold mb-2 text-success">
          INFORMASI MEDIA / ROLL
        </div>
        <v-text-field
          label="Scan Barcode Roll"
          v-model="formData.barcode_input"
          @keyup.enter="handleBarcodeScan"
          density="compact"
          variant="outlined"
          class="mb-2"
          hide-details
        >
          <template #prepend-inner>
            <IconBarcode :size="16" class="text-grey" />
          </template>
        </v-text-field>
        <v-text-field
          label="Nama Barang"
          v-model="formData.brg_nama"
          readonly
          density="compact"
          variant="filled"
          class="mb-2"
          hide-details
        />
        <v-row dense class="mb-2">
          <v-col cols="6">
            <v-text-field
              label="Stok (Yard)"
              :model-value="formData.panjang_bahan"
              readonly
              density="compact"
              variant="filled"
              hide-details
              suffix="Yrd"
            />
          </v-col>
          <v-col cols="6">
            <v-text-field
              label="Konversi (M)"
              :model-value="(formData.panjang_bahan * 0.9).toFixed(2)"
              readonly
              density="compact"
              variant="filled"
              hide-details
              suffix="M"
              color="green"
            />
          </v-col>
        </v-row>
        <v-text-field
          label="Lebar Bahan (M)"
          :model-value="formData.lebar_bahan"
          readonly
          density="compact"
          variant="filled"
          hide-details
          suffix="M"
        />

        <v-row dense class="mt-4">
          <v-col cols="6">
            <v-btn
              block
              size="small"
              color="orange-darken-3"
              variant="tonal"
              @click="validateBeforeSave('DRAFT')"
            >
              Set Draft
            </v-btn>
          </v-col>
          <v-col cols="6">
            <v-btn
              block
              size="small"
              color="primary"
              variant="elevated"
              @click="validateBeforeSave('POSTED')"
            >
              Set Posted
            </v-btn>
          </v-col>
        </v-row>
      </div>
    </template>

    <template #right-column>
      <div class="d-flex flex-column fill-height">
        <v-card border flat class="d-flex flex-column table-card mb-4">
          <div class="pa-2 bg-blue-grey-lighten-5 d-flex align-center">
            <span
              class="text-subtitle-2 font-weight-bold text-blue-grey-darken-4"
              >Daftar Pekerjaan Tekstil (Combine SPK)</span
            >
            <v-spacer />
            <v-text-field
              v-model="formData.barcode_spk"
              placeholder="Scan Barcode SPK..."
              density="compact"
              variant="outlined"
              hide-details
              style="max-width: 220px"
              @keyup.enter="handleSpkScan"
              :disabled="!formData.brg_kode"
            >
              <template #append-inner>
                <IconSearch
                  :size="16"
                  style="cursor: pointer"
                  @click="lookup.spk = true"
                />
              </template>
            </v-text-field>
          </div>

          <div class="table-container flex-grow-1">
            <table class="manksi-table">
              <thead>
                <tr>
                  <th width="35">No</th>
                  <th width="110">Nomor SPK</th>
                  <th>Nama Pekerjaan</th>
                  <th width="65">P (M)</th>
                  <th width="65">L (M)</th>
                  <th width="120">Orientasi</th>
                  <th width="65">Pad(M)</th>
                  <th width="55">Order</th>
                  <th width="60">Sdh Ctk</th>
                  <th width="60">Kurang</th>
                  <th v-for="n in 7" :key="n" width="40">C{{ n }}</th>
                  <th width="65">Tot Ctk</th>
                  <th width="60">Sisa</th>
                  <th width="35"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in formData.details" :key="index">
                  <td class="text-center">{{ index + 1 }}</td>
                  <td class="fw-bold text-blue-darken-4 px-2">
                    {{ item.nomor_spk }}
                  </td>
                  <td
                    class="px-2 text-truncate"
                    style="max-width: 120px"
                    :title="item.nama_spk"
                  >
                    {{ item.nama_spk }}
                  </td>
                  <td class="text-right px-2">
                    {{ Number(item.panjang_spk || 0).toFixed(2) }}
                  </td>
                  <td class="text-right px-2">
                    {{ Number(item.lebar_spk || 0).toFixed(2) }}
                  </td>
                  <td>
                    <select
                      v-model="item.orientasi"
                      class="cell-input"
                      @change="recalculateCombine"
                    >
                      <option value="lebar">L. SPK (Normal)</option>
                      <option value="panjang">P. SPK (Diputar)</option>
                    </select>
                  </td>
                  <td class="bg-blue-lighten-5">
                    <input
                      type="text"
                      :value="item.padding"
                      class="cell-input tr font-weight-bold"
                      @input="handlePaddingTableInput($event, item)"
                    />
                  </td>
                  <td class="text-right px-2 text-grey-darken-1">
                    {{ item.jumlah }}
                  </td>
                  <td
                    class="text-right px-2 text-blue-darken-1 font-weight-bold"
                  >
                    {{ item.sudahcetak }}
                  </td>
                  <td class="text-right px-2">{{ item.kurangcetak_asli }}</td>

                  <td v-for="n in 7" :key="n">
                    <input
                      type="number"
                      v-model.number="item['cetak' + n]"
                      class="cell-input tr font-weight-bold"
                      @input="recalculateCombine"
                      @wheel="$event.target.blur()"
                    />
                  </td>

                  <td
                    class="text-center bg-yellow-lighten-5 font-weight-bold text-primary"
                  >
                    {{ item.totalcetak }}
                  </td>
                  <td
                    class="text-right px-2 font-weight-bold"
                    :class="item.kurangcetak < 0 ? 'text-red' : ''"
                  >
                    {{ item.kurangcetak }}
                  </td>
                  <td class="text-center">
                    <v-btn
                      size="x-small"
                      variant="text"
                      color="error"
                      @click="
                        formData.details.splice(index, 1);
                        recalculateCombine();
                      "
                    >
                      <IconTrash :size="14" />
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="pa-3 bg-grey-lighten-4 border-t footer-container">
            <v-row dense align="center">
              <v-col cols="12" sm="5" class="border-e pr-4">
                <v-row no-gutters>
                  <v-col cols="6" class="border-e pr-2">
                    <span
                      class="text-caption text-grey-darken-1 font-weight-bold"
                      >Sisa Otomatis:</span
                    >
                    <div
                      class="text-h6 font-weight-black lh-1"
                      :class="
                        sisaStokOtomatisM < 0 ? 'text-red' : 'text-success'
                      "
                    >
                      {{ sisaStokOtomatisM.toFixed(2) }} M
                    </div>
                    <div
                      class="text-caption font-weight-bold mb-1"
                      :class="
                        sisaStokOtomatisM < 0
                          ? 'text-red-darken-3'
                          : 'text-orange-darken-3'
                      "
                    >
                      (= {{ sisaStokOtomatisYrd.toFixed(2) }} Yrd)
                    </div>
                    <span class="text-xxs text-grey d-block"
                      >P. Pakai Sistem:
                      {{ totalPanjangTerpakai.toFixed(2) }} M</span
                    >
                    <span class="text-xxs text-red d-block"
                      >P. BS Terpotong:
                      {{
                        (parseFloat(formData.panjang_bs as any) || 0).toFixed(2)
                      }}
                      M</span
                    >
                  </v-col>
                  <v-col cols="6" class="pl-2">
                    <span
                      class="text-caption font-weight-bold text-blue-darken-3"
                      >Sisa Manual (Fisik):</span
                    >
                    <v-text-field
                      v-model.number="formData.sisa_panjang_manual"
                      placeholder="Isi sisa meter..."
                      density="compact"
                      variant="outlined"
                      hide-details
                      type="number"
                      class="mt-1 bg-white"
                      suffix="M"
                    />
                  </v-col>
                </v-row>
              </v-col>
              <v-col cols="12" sm="3" class="border-e px-4">
                <span class="text-caption text-grey-darken-1 font-weight-bold"
                  >Sisa Samping Lebar:</span
                >
                <div class="text-h6 text-teal-darken-2 font-weight-black">
                  {{ (formData.lebar_bahan - totalLebarGabungan).toFixed(2) }} M
                </div>
              </v-col>
              <v-col cols="12" sm="4" class="pl-4">
                <span class="text-caption font-weight-bold text-red"
                  >BS / Rusak (Mengurangi Bahan):</span
                >
                <v-row dense class="mt-1">
                  <v-col cols="6">
                    <v-text-field
                      :model-value="formData.panjang_bs"
                      label="P. BS (M)"
                      density="compact"
                      variant="outlined"
                      hide-details="auto"
                      placeholder="Contoh: 0.9"
                      class="bg-white"
                      @input="handleBsInput"
                    />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                      :model-value="formData.lebar_bs"
                      label="L. BS (M)"
                      density="compact"
                      variant="outlined"
                      hide-details="auto"
                      placeholder="Contoh: 0.5"
                      class="bg-white"
                      @input="handleBsLebarInput"
                    />
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </div>
        </v-card>

        <v-card flat border class="flex-shrink-0">
          <v-card-title
            class="text-subtitle-2 bg-grey-lighten-3 pa-2 d-flex align-center"
          >
            Visualisasi Layout Produksi Tekstil (Meter Base)
            <v-spacer />
            <v-btn
              size="x-small"
              color="indigo"
              class="mr-2"
              @click="autoFillLayout(false)"
            >
              <template #prepend><IconSparkles :size="12" /></template> Auto
              Optimize
            </v-btn>
            <v-btn
              size="x-small"
              color="grey-darken-1"
              variant="outlined"
              @click="resetManualLayout"
            >
              <template #prepend><IconRefresh :size="12" /></template> Reset
              Position
            </v-btn>
          </v-card-title>
          <v-card-text class="pa-2 scroll-wrapper">
            <div class="roll-horizontal-wrapper">
              <div class="roll-material" :style="rollStyle">
                <div
                  v-for="(block, bIdx) in layoutRows"
                  :key="bIdx"
                  class="product-unit"
                  :style="{
                    width: `${block.w * SCALE}px`,
                    height: `${block.h * SCALE}px`,
                    position: 'absolute',
                    left: `${(manualOffsets[bIdx]?.x !== undefined ? manualOffsets[bIdx].x : block.x) * SCALE}px`,
                    top: `${(manualOffsets[bIdx]?.y !== undefined ? manualOffsets[bIdx].y : block.y) * SCALE}px`,
                    transform: `rotate(${manualOffsets[bIdx]?.rotation ?? 0}deg)`,
                    backgroundColor: '#e3f2fd',
                    border: '1px solid #2196f3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'move',
                    zIndex: 10,
                  }"
                  @mousedown="startDrag($event, bIdx)"
                  @dblclick="handleDoubleClick(bIdx)"
                >
                  <span
                    class="box-label"
                    :class="{ 'label-rotated': block.rotated }"
                  >
                    {{ block.label }}
                  </span>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </template>
  </BaseForm>

  <MesinLookupView
    :is-visible="lookup.mesin"
    @close="lookup.mesin = false"
    @select="handleMesinSelect"
  />
  <SpkLookupView
    :is-visible="lookup.spk"
    @close="lookup.spk = false"
    @select="injectSpkObject"
  />
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
  padding: 0 4px;
  outline: none;
  background: transparent;
}
.cell-input:focus {
  background: #e3f2fd;
}
.table-container {
  overflow: auto;
  max-height: 240px;
}
.tr {
  text-align: right;
}
.fw-bold {
  font-weight: bold;
}
.footer-container {
  border-top: 2px solid #bbb !important;
}
.scroll-wrapper {
  overflow-x: auto;
  background-color: #f8f9fa;
  min-height: 140px;
  max-height: 200px;
  border: 1px inset #ddd;
}
.product-unit {
  user-select: none;
  touch-action: none;
  transform-origin: center center;
}
.box-label {
  font-size: 9px;
  font-weight: bold;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  padding: 2px;
}
.label-rotated {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
}
</style>
