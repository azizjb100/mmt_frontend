<script setup lang="ts">
import { ref, onMounted, computed, reactive } from "vue";
import { useRouter, useRoute } from "vue-router";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import GudangLookupModal from "@/modal/GudangLookupView.vue";
import SpkLookupModal from "@/modal/SpkLookupModal.vue"; // Modal yang bisa handle Reguler/Memo
import { format } from "date-fns";
import { useToast } from "vue-toastification";

// --- Interfaces ---
interface DetailItem {
  no_urut: number;
  kota: string;
  uraian: string;
  size: string;
  qty: number;
  koli: number;
  jamInput: string;
  jamReady: string;
  expedisi: string;
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
  koli: 0,
  jamInput: format(new Date(), "HH:mm"),
  jamReady: "",
  expedisi: "",
});

const formData = reactive<FormDataState>({
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

const handleSPKSelect = (spk: any) => {
  // Debugging: Lihat di console browser apa saja isi objek 'spk' yang dikirim modal
  console.log("Data SPK dipilih:", spk);

  // Sesuaikan mapping di bawah ini dengan nama field dari Modal Anda
  formData.spkNomor = spk.spk_nomor || spk.mspk_nomor || spk.Spk || "";
  formData.spkNama = spk.spk_nama || spk.mspk_nama || spk.Nama || "";
  formData.spkUkuran = spk.spk_ukuran || spk.mspk_ukuran || spk.Ukuran || "";
  formData.spkKain = spk.spk_kain || spk.mspk_kain || spk.Kain || "";

  // Tutup modal
  isSPKModalVisible.value = false;

  // Opsional: Jika ingin otomatis menambah baris detail pertama jika masih kosong
  if (formData.detail.length === 1 && !formData.detail[0].kota) {
    formData.detail[0].uraian = formData.spkNama;
  }
};

const loaddataall = async (nomor: string) => {
  isSaving.value = true;
  try {
    const res = await api.get(`${API_URL}/${nomor}`);
    const d = res.data; // Data dari backend Node.js (JadwalKirim2)

    // Mapping field Database ke State Vue
    formData.nomor = d.Nomor;
    formData.tanggal = format(new Date(d.Tanggal), "yyyy-MM-dd");
    formData.gudangKode = d.Gudang;
    formData.gudangNama = d.Nama_Gudang;
    formData.spkNomor = d.No_SPK; // Sesuaikan dengan Alias di Query Node.js Anda
    formData.spkNama = d.Nama_Spk;
    formData.spkUkuran = d.Ukuran;
    formData.spkKain = d.Kain;
    formData.usr_create = d.usr_create;

    // Load Detail (jika ada)
    if (d.Detail) {
      formData.detail = d.Detail.map((item: any) => ({
        no_urut: item.No_urut,
        kota: item.Kota,
        uraian: item.Uraian,
        size: item.Size,
        qty: item.Jumlah,
        koli: item.Koli,
        jamReady: item.Jam,
        expedisi: item.Expedisi,
      }));
    }
  } catch (error) {
    toast.error("Gagal memuat data transaksi.");
  } finally {
    isSaving.value = false;
  }
};
const saveForm = async (saveAndNew: boolean) => {
  if (!isFormValid.value) return;
  isSaving.value = true;
  try {
    const payload = {
      ...formData,
      totalQty: calculatedTotalQty.value,
      totalKoli: calculatedTotalKoli.value,
    };

    if (isEditMode.value) {
      await api.put(`${API_URL}/${formData.nomor}`, payload);
    } else {
      await api.post(API_URL, payload);
    }

    toast.success("Jadwal kirim berhasil disimpan!");
    if (saveAndNew) {
      router.go(0); // Refresh page untuk data baru
    } else {
      router.back();
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Gagal menyimpan.");
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
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
              <v-col cols="6">
                <v-text-field
                  label="Ukuran"
                  v-model="formData.spkUkuran"
                  readonly
                  bg-color="grey-lighten-4"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </v-col>
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
              />
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
              <div class="pa-2 border-t">
                <v-btn
                  size="x-small"
                  color="primary"
                  variant="tonal"
                  prepend-icon="mdi-plus"
                  @click="addDetail"
                  >Tambah Baris</v-btn
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
