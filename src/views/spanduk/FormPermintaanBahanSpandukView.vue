<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { useToast } from "vue-toastification";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { useForm } from "@/composables/useForm";
// import { mintaGarmenFormService } from "@/services/garmen/FormPermintaanGarmenService";
import BaseForm from "@/components/BaseForm.vue";
import SpkSearchModal from "@/modal/SpkLookupModal.vue";
import BahanSearchModal from "@/modal/MasterBahanModal.vue";
import GudangLookupModal from "@/modal/GudangLookupView.vue";
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
  butuh: number;
  pemakaian: number;
  pcs: number;
  jumlah: number;
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

// Menyesuaikan JENIS yang ada di coding Delphi (ACCESORIES, OBAT, SPAREPART, DLL)
const kategoriOptions = ["ACCESORIES", "OBAT", "SPAREPART", "LAINNYA"];
const ketOptions = ["BARU", "TAMBAHAN", "LAINNYA"];
const cabangOptions = ref<string[]>([]);

// Modals Visibility State
const showSpkModal = ref(false);
const showBahanModal = ref(false);
const isGudangModalVisible = ref(false);

const activeDetailIndex = ref(-1);
const showPrintConfirm = ref(false);
const savedNomor = ref("");

// 1. Initial State sesuai dengan variabel struct tgarmenminta_hdr & dtl
const initialData = {
  nomor: "",
  tanggal: formatDateLocal(new Date()),
  kategori: "ACCESORIES", // Meniru default JENIS
  cabang: "P01",
  gudangProdKode: "", // min_gp
  gudangProdNama: "", // gdgp_nama
  divisi: "",
  spk: "", // min_spk_nomor
  namaSpk: "",
  jumlahSpk: 0,
  keterangan: "BARU", // min_ket
  mkbNomor: "", // mkb_nomor
  mkbTanggal: "",
  status: "OPEN", // lblclose
  userCreate: "",
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
    const res = await mintaGarmenFormService.getDetail(
      route.params.nomor as string,
    );
    const responseData = res.data?.data || res.data;
    const h = responseData.header || responseData;
    const d = responseData.details || responseData.Details || [];

    return {
      nomor: h.min_nomor || "",
      tanggal: formatDateLocal(h.min_tanggal),
      kategori: h.min_jenis || "ACCESORIES",
      cabang: h.min_cab || "P01",
      gudangProdKode: h.min_gp || "",
      gudangProdNama: h.GdgProduksi || "",
      divisi: h.Divisi || "",
      spk: h.min_spk_nomor || "",
      namaSpk: h.namaspk || "",
      jumlahSpk: Number(h.jumlahspk) || 0,
      keterangan: h.min_ket || "BARU",
      mkbNomor: h.mkb_nomor || "",
      mkbTanggal: formatDateLocal(h.mkb_tanggal),
      status: h.min_close === 0 ? "OPEN" : "CLOSE",
      userCreate: h.user_create || "",
      details: d.map((item: any) => ({
        kode: item.mind_brg_kode || item.kode || "",
        nama: item.Nama || item.nama || "",
        satuan: item.brg_satuan || item.satuan || "",
        butuh: Number(item.butuh) || 0,
        pemakaian: Number(item.mind_pemakaian) || 0,
        pcs: Number(item.mind_pcs) || 0,
        jumlah: Number(item.mind_jumlah) || 0,
        ket: item.mind_ket || "",
      })),
    };
  },
  submitApi: async (data: typeof initialData): Promise<unknown> => {
    const nomor = isEditMode.value ? (route.params.nomor as string) : undefined;
    const res = await mintaGarmenFormService.saveData(data, nomor);
    savedNomor.value = res.data?.data?.nomor || nomor || data.nomor;
    showPrintConfirm.value = true;
    return res;
  },
});

const createEmptyRow = (): DetailItem => {
  return {
    kode: "",
    nama: "",
    satuan: "",
    butuh: 0,
    pemakaian: 0,
    pcs: 0,
    jumlah: 0,
    ket: "",
  };
};

// Handle pemilihan gudang produksi (meniru FormKeyDown bagian edtGdgProduksi)
const handleGudangSelect = (gudang: any) => {
  formData.value.gudangProdKode = gudang.Kode || gudang.gdgp_kode;
  formData.value.gudangProdNama = gudang.Nama || gudang.gdgp_nama;
  isGudangModalVisible.value = false;
};

onMounted(async () => {
  // Logika Cabang Hak Akses meniru FormCreate di Delphi
  const userCab = authStore.userCabang || "";
  if (userCab !== "") {
    cabangOptions.value = [userCab];
    formData.value.cabang = userCab;
  } else {
    cabangOptions.value = ["P01", "P02", "P03", "P04", "P05"];
    formData.value.cabang = "P01";
  }

  if (isEditMode.value) {
    await fetchData();
  } else {
    formData.value.details = [createEmptyRow()];
    formData.value.userCreate = authStore.userId || "USER";
    triggerCabangDefault();
  }
});

// Meniru prosedur refreshdata bagian inisialisasi gudang berdasarkan cabang
const triggerCabangDefault = () => {
  if (formData.value.cabang === "P03") {
    formData.value.gudangProdKode = "K0001";
    formData.value.gudangProdNama = "KAOSAN";
  } else if (formData.value.cabang === "P05") {
    formData.value.gudangProdKode = "MMT01";
    formData.value.gudangProdNama = "MMT";
  } else {
    formData.value.gudangProdKode = "";
    formData.value.gudangProdNama = "";
  }
};

watch(
  () => formData.value.cabang,
  () => {
    if (!isEditMode.value) {
      triggerCabangDefault();
    }
  },
);

// Meniru edtNomorSPKExit untuk fetch MKA & SPK info
const onSpkSelected = async (spk: any) => {
  const nomorSpk = spk.Nomor || spk.spk_nomor;
  if (!nomorSpk) return;

  formData.value.spk = nomorSpk;
  showSpkModal.value = false;

  try {
    const res = await mintaGarmenFormService.getSpkInfo(nomorSpk);
    const resData = res.data?.data;

    if (resData) {
      formData.value.namaSpk = resData.spk_nama || "";
      formData.value.jumlahSpk = Number(resData.spk_jumlah) || 0;
      formData.value.divisi = resData.Divisi || "";
      formData.value.mkbNomor = resData.mkb_nomor || "";
      formData.value.mkbTanggal = formatDateLocal(resData.mkb_tanggal);

      if (resData.details && resData.details.length > 0) {
        formData.value.details = resData.details.map((d: any) => ({
          kode: d.mkbd_brg_kode || "",
          nama: d.nama || "",
          satuan: d.sat || "",
          butuh: Number(d.butuh) || 0,
          pemakaian: Number(d.pemakaian) || 0,
          pcs: 0,
          jumlah: 0,
          ket: "",
        }));
      } else {
        formData.value.details = [createEmptyRow()];
      }
    }
  } catch (e) {
    toast.warning("Gagal memuat detail SPK atau data MKA belum ada.");
  }
};

const clearSpkSelection = () => {
  formData.value.spk = "";
  formData.value.namaSpk = "";
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

  const targetKode = item.Kode || item.brg_kode;
  const isDuplicate = formData.value.details.some(
    (d: DetailItem, idx: number) =>
      d.kode === targetKode && idx !== activeDetailIndex.value,
  );

  if (isDuplicate) {
    toast.error(`Kode ${targetKode} sudah diinput di baris lain.`);
    return;
  }

  const row = formData.value.details[activeDetailIndex.value];
  row.kode = targetKode;
  row.nama = item.Nama || item.brg_nama;
  row.satuan = item.Satuan || item.brg_satuan || "PCS";

  showBahanModal.value = false;
  activeDetailIndex.value = -1;
};

// Meniru clpcsPropertiesEditValueChanged pada Delphi
const calculateJumlah = (item: DetailItem) => {
  const pcs = Number(item.pcs) || 0;
  const pemakaian = Number(item.pemakaian) || 0;
  if (pcs > 0 && pemakaian > 0) {
    item.jumlah = Number((pcs * pemakaian).toFixed(2));
  }
};

const validateBeforeSave = () => {
  if (
    formData.value.kategori === "ACCESORIES" &&
    !formData.value.spk &&
    formData.value.cabang !== "P03" &&
    formData.value.cabang !== "P05"
  ) {
    return toast.warning("Nomor SPK harus diisi untuk kategori Accessories.");
  }
  if (
    !formData.value.gudangProdKode &&
    formData.value.cabang !== "P03" &&
    formData.value.cabang !== "P05"
  ) {
    return toast.warning("Gudang Produksi wajib diisi.");
  }
  if (formData.value.details.some((d) => !d.kode || d.jumlah <= 0)) {
    return toast.warning(
      "Pastikan kode barang terisi dan jumlah lebih dari 0.",
    );
  }
  showSaveDialog.value = true;
};

const doPrint = () => {
  showPrintConfirm.value = false;
  window.open(
    `/garmen/permintaan/print/${encodeURIComponent(savedNomor.value)}`,
    "_blank",
  );
  router.push("/garmen/permintaan");
};

const doNotPrint = () => {
  showPrintConfirm.value = false;
  router.push("/garmen/permintaan");
};
</script>

<template>
  <BaseForm
    :title="(isEditMode ? 'Ubah' : 'Baru') + ' Permintaan Garmen / Barang Baku'"
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
          HEADER PERMINTAAN GARMEN
        </div>

        <v-select
          v-model="formData.kategori"
          :items="kategoriOptions"
          label="Jenis Permintaan (JENIS)"
          density="compact"
          variant="outlined"
          hide-details
          class="mb-2"
          color="primary"
          :disabled="isEditMode"
        />

        <v-text-field
          v-model="formData.nomor"
          label="No. Permintaan"
          density="compact"
          variant="outlined"
          readonly
          placeholder="Otomatis (Berdasarkan Jenis)"
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

        <v-select
          v-model="formData.cabang"
          :items="cabangOptions"
          label="Cabang Peminta"
          density="compact"
          variant="outlined"
          hide-details
          class="mb-2"
          :readonly="isEditMode"
        />

        <!-- Bagian Input SPK & Gudang Prod (Meniru gbAcc pada Delphi) -->
        <div
          v-if="
            formData.kategori === 'ACCESORIES' &&
            formData.cabang !== 'P03' &&
            formData.cabang !== 'P05'
          "
        >
          <v-text-field
            v-model="formData.spk"
            label="Nomor SPK"
            density="compact"
            variant="outlined"
            hide-details
            class="mb-2"
            readonly
            placeholder="Cari SPK (F1)..."
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

          <div v-if="formData.mkbNomor" class="d-flex gap-2 mb-2">
            <v-text-field
              v-model="formData.mkbNomor"
              label="No. MKA / MKB"
              density="compact"
              variant="outlined"
              readonly
              hide-details
              class="flex-grow-1 bg-grey-lighten-4"
            />
            <v-text-field
              v-model="formData.mkbTanggal"
              label="Tgl MKA"
              density="compact"
              variant="outlined"
              readonly
              hide-details
              style="max-width: 130px"
              class="bg-grey-lighten-4"
            />
          </div>

          <v-text-field
            v-model="formData.namaSpk"
            label="Nama SPK"
            density="compact"
            variant="outlined"
            readonly
            hide-details
            class="mb-2 bg-grey-lighten-4"
          />

          <div class="d-flex gap-2 mb-2">
            <v-text-field
              v-model="formData.divisi"
              label="Divisi"
              density="compact"
              variant="outlined"
              readonly
              hide-details
              class="bg-grey-lighten-4"
            />
            <v-text-field
              v-model="formData.jumlahSpk"
              label="Qty SPK"
              density="compact"
              variant="outlined"
              readonly
              hide-details
              style="max-width: 120px"
              class="bg-grey-lighten-4"
            />
          </div>
        </div>

        <v-text-field
          v-model="formData.gudangProdNama"
          label="Gudang Produksi"
          density="compact"
          variant="outlined"
          hide-details
          class="mb-2 text-primary"
          readonly
          placeholder="Pilih Gudang Produksi..."
          :disabled="formData.cabang === 'P03' || formData.cabang === 'P05'"
          @click="isGudangModalVisible = true"
        >
          <template #append-inner>
            <IconSearch
              v-if="formData.cabang !== 'P03' && formData.cabang !== 'P05'"
              :size="16"
              style="cursor: pointer"
              @click="isGudangModalVisible = true"
            />
          </template>
        </v-text-field>

        <v-select
          v-model="formData.keterangan"
          :items="ketOptions"
          label="Keterangan (cbKet)"
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
              <tr>
                <th width="40">No</th>
                <th width="120">Kode Barang</th>
                <th>Nama Barang Baku</th>
                <th width="70">Satuan</th>
                <th width="90" v-if="formData.kategori === 'ACCESORIES'">
                  Keb. MKA
                </th>
                <th width="85">Pemakaian</th>
                <th width="85">Pcs</th>
                <th width="95">Jml Minta</th>
                <th>Keterangan Detail</th>
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
                      placeholder="F1/F2..."
                      @click="openBahanLookup(index)"
                    />
                    <v-btn
                      size="x-small"
                      variant="text"
                      density="comfortable"
                      color="primary"
                      @click="openBahanLookup(index)"
                    >
                      <IconSearch :size="14" />
                    </v-btn>
                  </div>
                </td>
                <td>
                  <input v-model="item.nama" class="cell-input" readonly />
                </td>
                <td class="text-center">{{ item.satuan }}</td>

                <td v-if="formData.kategori === 'ACCESORIES'">
                  <input
                    type="number"
                    v-model.number="item.butuh"
                    class="cell-input tr bg-grey-lighten-4"
                    readonly
                  />
                </td>

                <td>
                  <input
                    type="number"
                    v-model.number="item.pemakaian"
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
                  <input
                    v-model="item.ket"
                    class="cell-input"
                    placeholder="Catatan..."
                  />
                </td>

                <td class="text-center">
                  <v-btn
                    size="x-small"
                    variant="text"
                    color="error"
                    @click="formData.details.splice(index, 1)"
                  >
                    <IconTrash :size="14" />
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
            Total Qty Diminta (Kolom 5):
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

  <!-- Modals Modul -->
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

  <!-- Dialog Konfirmasi Cetak setelah Berhasil Simpan -->
  <v-dialog v-model="showPrintConfirm" max-width="400px" persistent>
    <v-card class="rounded-lg">
      <v-card-title
        class="bg-primary text-white text-subtitle-1 font-weight-bold pa-3"
      >
        Simpan Berhasil
      </v-card-title>
      <v-card-text class="pa-4 text-center mt-2">
        <IconCircleCheck :size="48" color="green" class="mb-3" />
        <div class="text-body-1 font-weight-medium">
          Permintaan Garmen berhasil disimpan!
        </div>
      </v-card-text>
      <v-card-actions class="bg-grey-lighten-4 pa-3">
        <v-btn color="grey-darken-2" variant="outlined" @click="doNotPrint"
          >Tutup</v-btn
        >
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="elevated" @click="doPrint">
          <template #prepend><IconPrinter :size="15" /></template>
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
