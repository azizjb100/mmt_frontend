<script setup lang="ts">
import { ref, onMounted, computed, reactive } from "vue";
import { useRouter, useRoute } from "vue-router";
import api from "@/services/api";
import BaseForm from "@/components/BaseForm.vue";
import GudangLookupModal from "@/modal/GudangLookupView.vue";
import SpkLookupModal from "@/modal/SpkJadwalLookupView.vue";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { useToast } from "vue-toastification";
import {
  IconSearch,
  IconFileSearch,
  IconDeviceFloppy,
  IconPlus,
  IconX,
} from "@tabler/icons-vue";

// --- Interfaces ---
interface DetailItem {
  no_urut: number;
  kota: string;
  uraian: string;
  size: string;
  qty: number;
  maxQty: number;
  koli: number;
  jamInput: string;
  jamReady: string;
  expedisi: string;
  keterangan: string;
}

interface FormDataState {
  nomor: string;
  tanggal: string;
  gudangKode: string;
  gudangNama: string;
  spkNomor: string;
  spkNama: string;
  spkUkuran: string;
  spkKain: string;
  totalQty: number;
  totalKoli: number;
  usr_create: string;
  detail: DetailItem[];
  keterangan: string;
  spkTotalOrder: number;
  spkSudahDijadwalkan: number;
  spkSisaBelumJadwal: number;
}

// --- Setup & State ---
const router = useRouter();
const route = useRoute();
const toast = useToast();

const API_URL = "/mmt/jadwal-kirim";
const isEditMode = ref(!!route.params.nomor);
const isLoading = ref(false);
const isSaving = ref(false);
const isSearchingSpk = ref(false);

// State penentu mode simpan (Simpan & Baru vs Simpan Biasa)
const isSaveAndNew = ref(false);

// State kontrol dialog BaseForm
const showSaveDialog = ref(false);
const showCancelDialog = ref(false);
const showCloseDialog = ref(false);

// State Lookup Modal
const lookup = reactive({
  gudang: false,
  spk: false,
});

const authStore = {
  KDUSER: localStorage.getItem("kdUser") || "USER01",
};

const createEmptyDetail = (index: number): DetailItem => ({
  no_urut: index + 1,
  kota: "",
  uraian: "",
  size: "",
  qty: 0,
  maxQty: 999999,
  koli: 0,
  jamInput: format(new Date(), "HH:mm"),
  jamReady: "15:00",
  expedisi: "",
  keterangan: "",
});

const getInitialFormData = (): FormDataState => ({
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  gudangKode: "WH-010",
  gudangNama: "GUDANG JADI MMT",
  spkNomor: "",
  spkNama: "",
  spkTotalOrder: 0,
  spkSudahDijadwalkan: 0,
  spkSisaBelumJadwal: 0,
  spkUkuran: "",
  spkKain: "",
  totalQty: 0,
  totalKoli: 0,
  usr_create: authStore.KDUSER,
  detail: [createEmptyDetail(0)],
  keterangan: "",
});

const formData = reactive<FormDataState>(getInitialFormData());

const detailHeaders = [
  { title: "No", key: "no_urut", width: "50px", align: "center" as const },
  { title: "Kota Tujuan", key: "kota", width: "150px" },
  { title: "Uraian Barang", key: "uraian", width: "250px" },
  { title: "Size", key: "size", width: "80px" },
  { title: "Qty", key: "qty", width: "80px", align: "end" as const },
  { title: "Koli", key: "koli", width: "80px", align: "end" as const },
  { title: "Jam Ready", key: "jamReady", width: "100px" },
  { title: "Ekspedisi", key: "expedisi", width: "150px" },
  { title: "Keterangan", key: "keterangan", width: "150px" },
  { title: "Aksi", key: "actions", width: "50px", align: "center" as const },
] as const;

// --- Computed ---
const calculatedTotalQty = computed(() =>
  formData.detail.reduce((sum, d) => sum + (Number(d.qty) || 0), 0),
);

const calculatedTotalKoli = computed(() =>
  formData.detail.reduce((sum, d) => sum + (Number(d.koli) || 0), 0),
);

const isFormValid = computed(() => {
  return (
    !!formData.gudangKode &&
    !!formData.spkNomor &&
    formData.detail.some((d) => d.kota && d.qty > 0)
  );
});

// --- Methods ---
const addDetail = () => {
  formData.detail.push(createEmptyDetail(formData.detail.length));
};

const removeDetail = (index: number) => {
  if (formData.detail.length > 1) {
    formData.detail.splice(index, 1);
    formData.detail.forEach((d, i) => (d.no_urut = i + 1));
  }
};

const handleGudangSelect = (gudang: any) => {
  if (!gudang) return;
  formData.gudangKode = gudang.Kode || gudang.kode || gudang.kd_gudang || "";
  formData.gudangNama = gudang.Nama || gudang.nama || gudang.nm_gudang || "";
  lookup.gudang = false;
};

const validateQty = (item: DetailItem) => {
  if (item.qty > item.maxQty) {
    toast.warning(
      `Peringatan: Qty untuk ${item.kota || "Baris " + item.no_urut} (${item.qty}) melebihi batas order SPK (${item.maxQty})!`,
      { timeout: 3000 },
    );
  }
};

const handleSPKSelect = (spk: any) => {
  if (!spk) return;

  formData.spkNomor = spk.SPK || spk.spk || spk.No_SPK || spk.nomor_spk || "";
  formData.spkNama = spk.Nama || spk.nama || spk.nama_spk || "";
  formData.spkUkuran = spk.Ukuran || spk.ukuran || "";
  formData.spkKain = spk.Bahan || spk.kain || spk.bahan || "";

  formData.spkTotalOrder = Number(
    spk.Total_Order || spk.total_order || spk.Jumlah || 0,
  );
  formData.spkSudahDijadwalkan = Number(
    spk.Sudah_Kirim || spk.sudah_kirim || spk.Sudah_Cetak || 0,
  );
  formData.spkSisaBelumJadwal = Number(
    spk.Belum_Kirim || spk.belum_kirim || spk.Kurang_Cetak || 0,
  );

  const sisa = formData.spkSisaBelumJadwal;
  if (formData.detail.length > 0) {
    formData.detail.forEach((d) => {
      d.size = formData.spkUkuran;
      d.maxQty = sisa;
      if (!d.uraian) d.uraian = formData.spkNama;
    });
  }

  if (formData.detail.length === 1 && !formData.detail[0].kota) {
    formData.detail[0].qty = sisa > 0 ? sisa : 0;
  }

  lookup.spk = false;
  toast.info(`SPK ${formData.spkNomor} terpilih. Sisa saldo: ${sisa}`);
};

// Scan / Ketik manual SPK via Enter
const handleSpkScanOrInput = async () => {
  const keyword = formData.spkNomor?.trim();
  if (!keyword) return;

  isSearchingSpk.value = true;
  try {
    const response = await api.get("/mmt/spk/lookup-jadwal", {
      params: { keyword },
    });

    const list = response.data.data || response.data || [];
    if (list.length === 0) {
      toast.error(`SPK dengan nomor/keyword "${keyword}" tidak ditemukan.`);
      return;
    }

    const exactMatch =
      list.find(
        (item: any) =>
          (item.SPK || item.No_SPK || "").toLowerCase() ===
          keyword.toLowerCase(),
      ) || list[0];

    handleSPKSelect(exactMatch);
  } catch (error) {
    toast.error("Gagal memproses pencarian SPK.");
  } finally {
    isSearchingSpk.value = false;
  }
};

const loaddataall = async (nomor: string) => {
  isLoading.value = true;
  try {
    const res = await api.get(`${API_URL}/${nomor}`);
    const d = res.data;

    formData.nomor = d.Nomor;
    formData.tanggal = d.Tanggal;
    formData.gudangKode = d.Gudang;
    formData.gudangNama = d.Nama_Gudang;
    formData.spkNomor = d.No_SPK;
    formData.spkNama = d.Nama_Spk;
    formData.spkUkuran = d.Ukuran;
    formData.spkKain = d.Kain;

    if (d.Detail) {
      formData.detail = d.Detail.map((item: any) => ({
        no_urut: item.No_urut,
        kota: item.kota,
        uraian: item.uraian,
        size: item.size,
        qty: item.Jumlah,
        koli: item.Koli,
        jamReady: item.Jam,
        expedisi: item.expedisi,
      }));
    }
  } catch (error) {
    toast.error("Gagal memuat data transaksi.");
  } finally {
    isLoading.value = false;
  }
};

const importExcel = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target?.result as ArrayBuffer);
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      toast.warning("File Excel kosong atau format salah.");
      return;
    }

    const isFirstRowEmpty =
      formData.detail.length === 1 && !formData.detail[0].kota;

    if (isFirstRowEmpty) {
      formData.detail = [];
    }

    const startIdx = formData.detail.length;

    const excelSerialToTime = (serial: any) => {
      if (typeof serial !== "number") return serial || "15:00";
      const totalSeconds = Math.round(serial * 24 * 3600);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    };

    const importedDetails: DetailItem[] = jsonData.map(
      (row: any, index: number) => ({
        no_urut: startIdx + index + 1,
        kota: row.ALOKASI || "",
        uraian: row.URAIAN || formData.spkNama,
        size: row.SIZE || formData.spkUkuran,
        qty: Number(row.jumlah) || 0,
        koli: Number(row.koli) || 0,
        jamInput: format(new Date(), "HH:mm"),
        jamReady: row.jam ? excelSerialToTime(row.jam) : "15:00",
        expedisi: row.EXPEDISI || "",
        keterangan: row.KETERANGAN || "",
      }),
    );

    formData.detail.push(...importedDetails);
    toast.success(`${importedDetails.length} baris berhasil diimpor.`);
    target.value = "";
  };
  reader.readAsArrayBuffer(file);
};

// --- Action Handlers BaseForm ---
const handleValidateSave = (andNew = false) => {
  isSaveAndNew.value = andNew;

  if (!isFormValid.value) {
    toast.warning(
      "Lengkapi Gudang, SPK, dan minimal 1 baris detail yang valid.",
    );
    return;
  }

  const overLimitItems = formData.detail.filter(
    (item) => item.qty > item.maxQty,
  );
  if (overLimitItems.length > 0) {
    const listKota = overLimitItems
      .map((i) => i.kota || "Baris " + i.no_urut)
      .join(", ");
    toast.error(
      `Gagal Simpan! Qty pada tujuan [${listKota}] melebihi jumlah order SPK.`,
    );
    return;
  }

  showSaveDialog.value = true;
};

const handleConfirmSave = async () => {
  isSaving.value = true;
  try {
    const payload = {
      Nomor: formData.nomor,
      Gudang: formData.gudangKode,
      Tanggal: formData.tanggal,
      No_SPK: formData.spkNomor,
      Jumlah: calculatedTotalQty.value,
      Koli: calculatedTotalKoli.value,
      Realisasi: 0,
      Koli_Realisasi: 0,
      usr_create: formData.usr_create,
      Detail: formData.detail,
    };

    await api.post(`${API_URL}/save`, payload);
    toast.success("Jadwal kirim berhasil disimpan!");
    showSaveDialog.value = false;

    // 🔥 LOGIKA KONTROL NAVIGASI SETELAH SIMPAN
    if (isSaveAndNew.value) {
      Object.assign(formData, getInitialFormData());
      toast.info("Form disiapkan untuk input baru.");
    } else {
      router.back();
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Gagal menyimpan data.");
  } finally {
    isSaving.value = false;
  }
};

const handleConfirmCancel = () => {
  showCancelDialog.value = false;
  if (isEditMode.value) {
    loaddataall(route.params.nomor as string);
  } else {
    Object.assign(formData, getInitialFormData());
  }
  toast.info("Form berhasil direset.");
};

const handleConfirmClose = () => {
  showCloseDialog.value = false;
  router.back();
};

onMounted(() => {
  const loggedInUser = localStorage.getItem("kdUser");
  if (loggedInUser) {
    formData.usr_create = loggedInUser;
  }

  if (isEditMode.value) loaddataall(route.params.nomor as string);
});
</script>

<template>
  <div>
    <BaseForm
      :title="isEditMode ? 'Ubah Jadwal Kirim' : 'Input Jadwal Kirim Baru'"
      menu-id="JADWAL_KIRIM"
      icon="mdi-truck-fast"
      :is-loading="isLoading"
      :is-saving="isSaving"
      item-name="Jadwal Kirim"
      v-model:show-save-dialog="showSaveDialog"
      v-model:show-cancel-dialog="showCancelDialog"
      v-model:show-close-dialog="showCloseDialog"
      @validate-save="handleValidateSave(false)"
      @confirm-save="handleConfirmSave"
      @confirm-cancel="handleConfirmCancel"
      @confirm-close="handleConfirmClose"
    >
      <!-- 🔥 MENYEDIAKAN CUSTOM ACTION HEADER: SIMPAN & BROWSE + SIMPAN & BARU -->
      <template #header-actions>
        <!-- 1. Tombol Simpan & Ke Browse (router.back) -->
        <v-btn
          size="small"
          color="primary"
          @click="handleValidateSave(false)"
          :loading="isSaving"
        >
          <template #prepend>
            <span class="d-flex align-center">
              <IconDeviceFloppy :size="15" :stroke-width="1.7" />
            </span>
          </template>
          Simpan
        </v-btn>

        <!-- 2. Tombol Simpan & Baru (Reset Form di Halaman Ini) -->
        <v-btn
          v-if="!isEditMode"
          size="small"
          color="teal-darken-1"
          class="ml-2"
          :loading="isSaving"
          @click="handleValidateSave(true)"
        >
          <template #prepend>
            <span class="d-flex align-center">
              <IconPlus :size="15" :stroke-width="2" />
            </span>
          </template>
          Simpan & Baru
        </v-btn>

        <!-- 3. Tombol Batal & Tutup -->
        <v-btn
          size="small"
          variant="outlined"
          class="mx-2"
          @click="showCancelDialog = true"
        >
          Batal
        </v-btn>
        <v-btn
          size="small"
          variant="tonal"
          color="error"
          @click="showCloseDialog = true"
        >
          <template #prepend>
            <span class="d-flex align-center">
              <IconX :size="15" :stroke-width="2" />
            </span>
          </template>
          Tutup
        </v-btn>
      </template>

      <!-- KOLOM KIRI (HEADER & RINGKASAN SPK) -->
      <template #left-column>
        <v-card flat class="desktop-form-section header-section pa-0">
          <v-card-title class="text-subtitle-2 py-2 bg-grey-lighten-4">
            Header Pengiriman
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-3">
            <v-row dense>
              <v-col cols="12">
                <v-text-field
                  label="Nomor Kirim"
                  v-model="formData.nomor"
                  readonly
                  variant="filled"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Tanggal Kirim"
                  v-model="formData.tanggal"
                  type="date"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>

              <!-- LOOKUP GUDANG -->
              <v-col cols="12">
                <v-text-field
                  label="Gudang"
                  v-model="formData.gudangKode"
                  readonly
                  density="compact"
                  variant="outlined"
                  class="cursor-pointer"
                  hide-details
                  @click="lookup.gudang = true"
                >
                  <template #append-inner>
                    <IconSearch
                      :size="16"
                      style="cursor: pointer"
                      @click.stop="lookup.gudang = true"
                    />
                  </template>
                </v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Nama Gudang"
                  v-model="formData.gudangNama"
                  readonly
                  bg-color="grey-lighten-4"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </v-col>

              <v-divider class="my-3" />

              <!-- INPUT / SCAN SPK (BISA DIKETIK / SCAN BARCODE + ENTER) -->
              <v-col cols="12">
                <v-text-field
                  label="Ketik / Scan SPK (Tekan Enter)"
                  v-model="formData.spkNomor"
                  density="compact"
                  variant="outlined"
                  hide-details
                  color="primary"
                  placeholder="Ketik SPK lalu Enter..."
                  :loading="isSearchingSpk"
                  @keyup.enter="handleSpkScanOrInput"
                >
                  <template #append-inner>
                    <IconFileSearch
                      :size="16"
                      style="cursor: pointer"
                      title="Klik untuk membuka Lookup Modal"
                      @click.stop="lookup.spk = true"
                    />
                  </template>
                </v-text-field>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  label="Nama SPK / Barang"
                  v-model="formData.spkNama"
                  readonly
                  rows="2"
                  bg-color="grey-lighten-4"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  label="Jenis Kain"
                  v-model="formData.spkKain"
                  readonly
                  bg-color="grey-lighten-4"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </v-col>

              <!-- Ringkasan Saldo SPK -->
              <v-col cols="12" class="mt-2">
                <v-card color="blue-lighten-5" flat class="pa-2 border">
                  <div class="d-flex justify-space-between">
                    <span class="text-caption font-weight-bold"
                      >TOTAL ORDER</span
                    >
                    <span class="font-weight-black">{{
                      formData.spkTotalOrder
                    }}</span>
                  </div>
                  <div class="d-flex justify-space-between">
                    <span class="text-caption font-weight-bold text-primary">
                      SUDAH DIJADWALKAN
                    </span>
                    <span class="font-weight-black text-primary">
                      {{ formData.spkSudahDijadwalkan }}
                    </span>
                  </div>
                  <v-divider class="my-1" />
                  <div class="d-flex justify-space-between">
                    <span class="text-caption font-weight-bold text-error">
                      SISA BELUM JADWAL
                    </span>
                    <span class="font-weight-black text-error">
                      {{ formData.spkSisaBelumJadwal }}
                    </span>
                  </div>
                </v-card>
              </v-col>

              <!-- Ringkasan Total Qty & Koli -->
              <v-col cols="12" class="mt-2">
                <v-card color="orange-lighten-5" flat class="pa-2 border">
                  <div class="d-flex justify-space-between">
                    <span class="text-caption font-weight-bold">TOTAL QTY</span>
                    <span class="font-weight-black">{{
                      calculatedTotalQty
                    }}</span>
                  </div>
                  <div class="d-flex justify-space-between">
                    <span class="text-caption font-weight-bold"
                      >TOTAL KOLI</span
                    >
                    <span class="font-weight-black">{{
                      calculatedTotalKoli
                    }}</span>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </template>

      <!-- KOLOM KANAN (TABEL DETAIL) -->
      <template #right-column>
        <v-card border flat class="h-100 d-flex flex-column">
          <v-data-table
            :headers="detailHeaders"
            :items="formData.detail"
            :items-per-page="-1"
            density="compact"
            hide-default-footer
            fixed-header
            class="flex-grow-1"
          >
            <template #[`item.no_urut`]="{ item }">
              <span class="text-grey text-caption">{{ item.no_urut }}</span>
            </template>

            <template #[`item.kota`]="{ item }">
              <v-text-field
                v-model="item.kota"
                density="compact"
                variant="plain"
                hide-details
                placeholder="Input Kota..."
              />
            </template>

            <template #[`item.uraian`]="{ item }">
              <v-text-field
                v-model="item.uraian"
                density="compact"
                variant="plain"
                hide-details
                placeholder="Nama Item/Uraian..."
              />
            </template>

            <template #[`item.size`]="{ item }">
              <v-text-field
                v-model="item.size"
                density="compact"
                variant="plain"
                hide-details
                placeholder="Size..."
              />
            </template>

            <template #[`item.qty`]="{ item }">
              <v-text-field
                v-model.number="item.qty"
                type="number"
                density="compact"
                variant="plain"
                hide-details
                class="text-right-input"
                @update:model-value="validateQty(item)"
                :class="{
                  'text-error font-weight-bold': item.qty > item.maxQty,
                }"
              />
              <div
                v-if="item.qty > item.maxQty"
                class="text-caption text-error"
                style="font-size: 9px !important"
              >
                Max: {{ item.maxQty }}
              </div>
            </template>

            <template #[`item.koli`]="{ item }">
              <v-text-field
                v-model.number="item.koli"
                type="number"
                density="compact"
                variant="plain"
                hide-details
                class="text-right-input"
              />
            </template>

            <template #[`item.jamReady`]="{ item }">
              <v-text-field
                v-model="item.jamReady"
                type="time"
                density="compact"
                variant="plain"
                hide-details
              />
            </template>

            <template #[`item.expedisi`]="{ item }">
              <v-text-field
                v-model="item.expedisi"
                density="compact"
                variant="plain"
                hide-details
                placeholder="Nama Travel/Exp..."
              />
            </template>

            <template #[`item.keterangan`]="{ item }">
              <v-text-field
                v-model="item.keterangan"
                density="compact"
                variant="plain"
                hide-details
                placeholder="Catatan..."
              />
            </template>

            <template #[`item.actions`]="{ index }">
              <v-btn
                icon="mdi-delete"
                size="x-small"
                color="error"
                variant="text"
                @click="removeDetail(index)"
              />
            </template>

            <template #bottom>
              <div class="pa-2 border-t d-flex align-center bg-white">
                <v-btn
                  size="x-small"
                  color="primary"
                  variant="tonal"
                  prepend-icon="mdi-plus"
                  @click="addDetail"
                >
                  Tambah Baris
                </v-btn>

                <v-divider vertical class="mx-3" />

                <input
                  type="file"
                  ref="fileInput"
                  accept=".xlsx, .xls"
                  style="display: none"
                  @change="importExcel"
                />
                <v-btn
                  size="x-small"
                  color="success"
                  variant="tonal"
                  prepend-icon="mdi-microsoft-excel"
                  @click="($refs.fileInput as any).click()"
                >
                  Import Excel
                </v-btn>

                <v-spacer />
                <span class="text-caption text-grey">
                  Format Header: Kota, Uraian, Size, Qty, Koli, Jam, Expedisi,
                  Catatan
                </span>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </template>
    </BaseForm>

    <!-- MODAL LOOKUP GUDANG & SPK (TERPISAH DI LUAR BASEFORM) -->
    <GudangLookupModal
      v-if="lookup.gudang"
      :is-visible="lookup.gudang"
      @close="lookup.gudang = false"
      @select="handleGudangSelect"
    />

    <SpkLookupModal
      v-if="lookup.spk"
      :is-visible="lookup.spk"
      @close="lookup.spk = false"
      @select="handleSPKSelect"
    />
  </div>
</template>

<style scoped>
.text-right-input :deep(input) {
  text-align: right !important;
}

:deep(.v-data-table__td) {
  height: 35px !important;
}

.cursor-pointer {
  cursor: pointer !important;
}
</style>
