<script setup lang="ts">
import { ref, onMounted, computed, reactive } from "vue";
import { useRouter, useRoute } from "vue-router";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import GudangLookupModal from "@/modal/GudangLookupView.vue";
import SpkLookupModal from "@/modal/SpkJadwalLookupView.vue"; // Modal yang bisa handle Reguler/Memo
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { useToast } from "vue-toastification";

// --- Interfaces ---
interface DetailItem {
  no_urut: number;
  kota: string;
  uraian: string;
  size: string;
  qty: number;
  maxQty: number; // <-- Tambahkan ini untuk validasi
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
  spkSudahDijadwalkan: number; // Ubah dari spkSudahKirim
  spkSisaBelumJadwal: number;
}

// --- Setup & State ---
const router = useRouter();
const route = useRoute();
const toast = useToast();

const API_URL = "/mmt/jadwal-kirim";
const isEditMode = ref(!!route.params.nomor);
const isSaving = ref(false);
const isGudangModalVisible = ref(false);
const isSPKModalVisible = ref(false);

const authStore = {
  KDUSER: localStorage.getItem("kdUser") || "USER01",
};

const createEmptyDetail = (index: number): DetailItem => ({
  no_urut: index + 1,
  kota: "",
  uraian: "",
  size: "",
  qty: 0,
  maxQty: 999999, // Default besar jika bukan dari SPK
  koli: 0,
  jamInput: format(new Date(), "HH:mm"),
  jamReady: "15:00",
  expedisi: "",
  keterangan: "",
});

const formData = reactive<FormDataState>({
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  gudangKode: "",
  gudangNama: "",
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
});

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

const isLocked = computed(() => {
  // Logic lock jika sudah ada realisasi kirim (Optional sesuai kebutuhan business logic)
  return false;
});

// --- Methods ---
const addDetail = () => {
  formData.detail.push(createEmptyDetail(formData.detail.length));
};

const removeDetail = (index: number) => {
  if (formData.detail.length > 1) {
    formData.detail.splice(index, 1);
    // Re-index no_urut
    formData.detail.forEach((d, i) => (d.no_urut = i + 1));
  }
};

const handleGudangSelect = (gudang: { Kode: string; Nama: string }) => {
  formData.gudangKode = gudang.Kode;
  formData.gudangNama = gudang.Nama;
  isGudangModalVisible.value = false;
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
  console.log("Data SPK terpilih dari modal:", spk);

  // 1. Mapping Header SPK (Sesuaikan dengan KEY dari backend)
  formData.spkNomor = spk.SPK || ""; // Backend pakai "SPK" (huruf besar semua)
  formData.spkNama = spk.Nama || "";
  formData.spkUkuran = spk.Ukuran || "";
  formData.spkKain = spk.Bahan || "";

  // 2. Kalkulasi Saldo Order (Gunakan alias dari Query SQL Backend)
  formData.spkTotalOrder = Number(spk.Total_Order) || 0;
  formData.spkSudahDijadwalkan = Number(spk.Sudah_Kirim) || 0;
  formData.spkSisaBelumJadwal = Number(spk.Belum_Kirim) || 0;

  // 3. Update Detail yang sudah ada di tabel
  const sisa = formData.spkSisaBelumJadwal;
  if (formData.detail.length > 0) {
    formData.detail.forEach((d) => {
      d.uraian = formData.spkNama;
      d.size = formData.spkUkuran;
      d.maxQty = sisa; // Kunci batas maksimal input
    });
  }

  // 4. Otomatis isi Qty jika baris pertama masih kosong
  if (formData.detail.length === 1 && !formData.detail[0].kota) {
    formData.detail[0].qty = sisa > 0 ? sisa : 0;
  }

  isSPKModalVisible.value = false;
  toast.info(`SPK terpilih. Sisa saldo: ${sisa}`);
};

const loaddataall = async (nomor: string) => {
  isSaving.value = true;
  try {
    const res = await api.get(`${API_URL}/${nomor}`);
    const d = res.data;

    formData.nomor = d.Nomor;
    formData.tanggal = d.Tanggal; // Sudah format YYYY-MM-DD dari DB
    formData.gudangKode = d.Gudang;
    formData.gudangNama = d.Nama_Gudang;
    formData.spkNomor = d.No_SPK;
    formData.spkNama = d.Nama_Spk;
    formData.spkUkuran = d.Ukuran;
    formData.spkKain = d.Kain;

    // Pastikan property "Detail" (D besar) sesuai dengan return di Service
    if (d.Detail) {
      formData.detail = d.Detail.map((item: any) => ({
        no_urut: item.No_urut,
        kota: item.kota,
        uraian: item.uraian,
        size: item.size,
        qty: item.Jumlah, // Sesuai alias "Jumlah" di service
        koli: item.Koli, // Sesuai alias "Koli" di service
        jamReady: item.Jam,
        expedisi: item.expedisi,
      }));
    }
  } catch (error) {
    toast.error("Gagal memuat data transaksi.");
  } finally {
    isSaving.value = false;
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

    // Ambil data dalam format JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    console.log("Data Excel Terbaca:", jsonData);

    if (jsonData.length === 0) {
      toast.warning("File Excel kosong atau format salah.");
      return;
    }

    // --- LOGIKA PERBAIKAN PENOMORAN ---
    // Cek apakah baris pertama di tabel masih "kosong" (belum diisi kota)
    const isFirstRowEmpty =
      formData.detail.length === 1 && !formData.detail[0].kota;

    if (isFirstRowEmpty) {
      // Jika kosong, kita reset array agar index dimulai dari 0
      formData.detail = [];
    }

    const startIdx = formData.detail.length;

    // Fungsi pembantu untuk konversi jam desimal Excel (0.625 -> "15:00")
    const excelSerialToTime = (serial: any) => {
      if (typeof serial !== "number") return serial || "15:00";
      const totalSeconds = Math.round(serial * 24 * 3600);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    };

    // Mapping data Excel ke DetailItem
    const importedDetails: DetailItem[] = jsonData.map(
      (row: any, index: number) => {
        return {
          no_urut: startIdx + index + 1,
          // Gunakan key sesuai log console (ALOKASI, URAIAN, jumlah, koli, jam)
          kota: row.ALOKASI || "",
          uraian: row.URAIAN || formData.spkNama,
          size: row.SIZE || formData.spkUkuran,
          qty: Number(row.jumlah) || 0,
          koli: Number(row.koli) || 0,
          jamInput: format(new Date(), "HH:mm"),
          // Konversi jam desimal excel ke string "HH:mm"
          jamReady: row.jam ? excelSerialToTime(row.jam) : "15:00",
          expedisi: row.EXPEDISI || "",
          keterangan: row.KETERANGAN || "",
        };
      },
    );

    // Masukkan data ke dalam state
    formData.detail.push(...importedDetails);

    toast.success(`${importedDetails.length} baris berhasil diimpor.`);

    // Reset input file agar bisa pilih file yang sama lagi jika perlu
    target.value = "";
  };
  reader.readAsArrayBuffer(file);
};

const saveForm = async (saveAndNew: boolean) => {
  if (!isFormValid.value) return;

  const currentUser = localStorage.getItem("kdUser") || "USER01";

  // --- VALIDASI QTY (Tetap sama) ---
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
      usr_create: currentUser,
      Detail: formData.detail,
    };

    await api.post(`${API_URL}/save`, payload);
    toast.success("Jadwal kirim berhasil disimpan!");

    if (saveAndNew) {
      // Reset form tapi pertahankan user yang login
      Object.assign(formData, {
        nomor: "AUTO",
        tanggal: format(new Date(), "yyyy-MM-dd"),
        gudangKode: "",
        gudangNama: "",
        spkNomor: "",
        spkNama: "",
        spkUkuran: "",
        spkKain: "",
        totalQty: 0,
        totalKoli: 0,
        usr_create: currentUser, // <-- Tetap pertahankan user ini
        detail: [createEmptyDetail(0)],
      });
    } else {
      router.back();
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Gagal menyimpan data.");
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
  // Update state user_create dengan user yang sedang login
  const loggedInUser = localStorage.getItem("kdUser");
  if (loggedInUser) {
    formData.usr_create = loggedInUser;
  }

  if (isEditMode.value) loaddataall(route.params.nomor as string);
});
</script>

<template>
  <PageLayout
    :title="isEditMode ? 'Ubah Jadwal Kirim' : 'Input Jadwal Kirim Baru'"
    icon="mdi-truck-fast"
  >
    <template #header-actions>
      <v-btn
        size="x-small"
        color="primary"
        @click="saveForm(false)"
        :loading="isSaving"
        :disabled="!isFormValid || isLocked"
      >
        <v-icon start>mdi-check-circle</v-icon> Simpan
      </v-btn>
      <v-btn
        size="x-small"
        color="success"
        class="ml-1"
        @click="saveForm(true)"
        :disabled="isSaving || !isFormValid || isLocked"
      >
        <v-icon start>mdi-content-save-all</v-icon> Simpan & Baru
      </v-btn>
      <v-btn size="x-small" class="ml-1" @click="router.back()">
        <v-icon start>mdi-close</v-icon> Tutup
      </v-btn>
    </template>

    <div class="form-grid-container">
      <div class="left-column">
        <v-card flat border>
          <v-card-title class="text-subtitle-2 py-2 bg-grey-lighten-4"
            >Header Pengiriman</v-card-title
          >
          <v-divider />
          <v-card-text>
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
              <v-col cols="12">
                <v-text-field
                  label="Gudang"
                  v-model="formData.gudangKode"
                  readonly
                  density="compact"
                  variant="outlined"
                  append-inner-icon="mdi-magnify"
                  @click="isGudangModalVisible = true"
                  hide-details
                />
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
              <v-col cols="12">
                <v-text-field
                  label="Pilih SPK (Reguler/Memo)"
                  v-model="formData.spkNomor"
                  readonly
                  density="compact"
                  variant="outlined"
                  append-inner-icon="mdi-file-find"
                  @click="isSPKModalVisible = true"
                  hide-details
                  color="primary"
                />
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
              <template #[`item.size`]="{ item }">
                <v-text-field
                  v-model="item.size"
                  density="compact"
                  variant="plain"
                  hide-details
                  placeholder="Size..."
                />
              </template>
              <v-col cols="6">
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

              <v-col cols="12" class="mt-4">
                <v-card color="blue-lighten-5" flat class="pa-2">
                  <!-- Warna ganti biru agar beda dengan 'kirim' -->
                  <div class="d-flex justify-space-between">
                    <span class="text-caption font-weight-bold"
                      >TOTAL ORDER</span
                    >
                    <span class="font-weight-black">{{
                      formData.spkTotalOrder
                    }}</span>
                  </div>
                  <div class="d-flex justify-space-between">
                    <span class="text-caption font-weight-bold text-primary"
                      >SUDAH DIJADWALKAN</span
                    >
                    <span class="font-weight-black text-primary">{{
                      formData.spkSudahDijadwalkan
                    }}</span>
                  </div>
                  <v-divider class="my-1" />
                  <div class="d-flex justify-space-between">
                    <span class="text-caption font-weight-bold text-error"
                      >SISA BELUM JADWAL</span
                    >
                    <span class="font-weight-black text-error">{{
                      formData.spkSisaBelumJadwal
                    }}</span>
                  </div>
                </v-card>
              </v-col>

              <v-col cols="12" class="mt-4">
                <v-card color="orange-lighten-5" flat class="pa-2">
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
      </div>

      <div class="right-column">
        <v-card border flat>
          <v-data-table
            :headers="detailHeaders"
            :items="formData.detail"
            :items-per-page="-1"
            density="compact"
            hide-default-footer
            fixed-header
            height="calc(100vh - 220px)"
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
              <!-- Opsional: Tampilkan pesan kecil di bawah input -->
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
              <div class="pa-2 border-t d-flex align-center">
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
                <span class="text-caption text-grey"
                  >Format Header: Kota, Uraian, Size, Qty, Koli, Jam, Expedisi,
                  Keterangan</span
                >
              </div>
            </template>
          </v-data-table>
        </v-card>
      </div>
    </div>

    <GudangLookupModal
      :isVisible="isGudangModalVisible"
      @close="isGudangModalVisible = false"
      @select="handleGudangSelect"
    />
    <SpkLookupModal
      :isVisible="isSPKModalVisible"
      @close="isSPKModalVisible = false"
      @select="handleSPKSelect"
    />
  </PageLayout>
</template>

<style scoped>
.form-grid-container {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 15px;
  padding: 10px;
}
.right-column :deep(*) {
  font-size: 11px !important;
}
.text-right-input :deep(input) {
  text-align: right !important;
}
:deep(.v-data-table__td) {
  height: 35px !important;
}
</style>
