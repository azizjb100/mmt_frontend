<script setup lang="ts">
import { ref, onMounted, computed, reactive, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import api from "@/services/api";
import { AxiosError } from "axios";
import PageLayout from "../components/PageLayout.vue";
import MasterBahanModal from "@/modal/MasterBahanModal.vue";
import GudangLookupModal from "@/modal/GudangLookupView.vue";
import SPKLookupModal from "@/modal/SpkLookupModal.vue";
import PabrikLookupModal from "@/modal/PabrikLookupModal.vue"; // Import Modal Pabrik
import { format } from "date-fns";
import { useToast } from "vue-toastification";

// --- Interfaces ---
interface DetailItem {
  sku: string;
  namaBarang: string;
  qty: number;
  satuan: string;
  Panjang: number;
  Lebar: number;
  keterangan: string;
  spk: string;
  namaSPK: string;
}

interface MasterBahan {
  Kode: string;
  Nama: string;
  Satuan: string;
  Panjang: number;
  Lebar: number;
}

interface FormDataState {
  nomor: string;
  tanggal: string;
  gudangKode: string;
  gudangNama: string;
  pabrikKode: string; // Kode Pabrik untuk backend
  pabrikNama: string; // Nama Pabrik untuk UI
  keteranganHeader: string;
  kepada: string;
  cabang: string;
  accSpv: string;    // Tambahkan ini
  accManager: string; // Tambahkan ini
  detail: DetailItem[];

}

// --- Setup & State ---
const router = useRouter();
const route = useRoute();
const toast = useToast();

const API_URL = "/mmt/permintaan-bahan";

const isEditMode = ref(!!route.params.nomor);
const isSaving = ref(false);
const isBahanModalVisible = ref(false);
const isGudangModalVisible = ref(false);
const isPabrikModalVisible = ref(false);
const isSPKModalVisible = ref(false);
const currentDetailIndex = ref<number | null>(null);
const isApproving = ref(false);

const createEmptyDetail = (): DetailItem => ({
  sku: "",
  namaBarang: "",
  qty: 0,
  satuan: "",
  Panjang: 0,
  Lebar: 0,
  keterangan: "",
  spk: "",
  namaSPK: "",
});

const formData = reactive<FormDataState>({
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  gudangKode: "WH-16",
  gudangNama: "Gudang Bahan MMT",
  pabrikKode: "",
  pabrikNama: "",
  keteranganHeader: "",
  kepada: "",
  cabang: "",
  accSpv: "",
  accManager: "",
  detail: [createEmptyDetail()],
});

// --- Computed ---
const calculatedTotal = computed(() => {
  return formData.detail.reduce((sum, d) => sum + (Number(d.qty) || 0), 0).toFixed(2);
});

const isFormValid = computed(() => {
  // Valid jika gudang ada, pabrik/cabang ada, dan ada minimal 1 detail valid
  return !!formData.gudangKode && !!formData.cabang && formData.detail.some((d) => d.sku && d.qty > 0);
});

const detailHeaders = [
  { title: "No", key: "index", width: "40px", sortable: false, align: "center" as const },
  { title: "Nomor SPK", key: "spk", width: "150px" },
  { title: "Nama SPK", key: "namaSPK", width: "200px" },
  { title: "Kode Bahan", key: "sku", width: "120px" },
  { title: "Nama Bahan", key: "namaBarang", sortable: false, width: "250px" },
  { title: "Jumlah", key: "qty", width: "100px", align: "end" as const },
  { title: "Lebar", key: "Lebar", width: "80px", align: "end" as const },
  { title: "Panjang", key: "Panjang", width: "80px", align: "end" as const },
  { title: "Satuan", key: "satuan", width: "80px" },
  { title: "Keterangan", key: "keterangan", sortable: false },
  { title: "Aksi", key: "actions", width: "50px", sortable: false, align: "center" as const },
] as const;

// --- Methods ---
const addDetail = () => formData.detail.push(createEmptyDetail());

const removeDetail = (index: number) => {
  if (formData.detail.length > 1) {
    formData.detail.splice(index, 1);
  } else {
    formData.detail[0] = createEmptyDetail();
  }
};

const approveData = async (role: 'SPV' | 'MANAGER') => {
  if (formData.nomor === "AUTO") {
    toast.warning("Simpan data terlebih dahulu.");
    return;
  }

  isApproving.value = true;
  try {
    const token = localStorage.getItem("token");
    let userIdentifier = "";
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const item = localStorage.getItem(key);
        try {
          const parsed = JSON.parse(item || "");
          // Jika di dalam object ini ada kdUser, kita ambil
          if (parsed && parsed.kdUser) {
            userIdentifier = parsed.kdUser;
            break; // Berhenti jika sudah ketemu
          }
        } catch (e) {
          // Bukan JSON, lewati saja
        }
      }
    }

    // Jika pencarian otomatis gagal, coba ambil kdUser langsung (siapa tahu tersimpan mentah)
    if (!userIdentifier) {
      userIdentifier = localStorage.getItem("kdUser") || "";
    }

    // CEK AKHIR
    if (!userIdentifier) {
      console.error("LocalStorage Content:", { ...localStorage });
      toast.error("Identitas user (kdUser) tidak ditemukan. Silakan login ulang.");
      return;
    }

    const payload = {
      nomor: formData.nomor,
      role: role,
      user: userIdentifier // Sekarang berisi "ARDAN"
    };

    console.log("Payload yang dikirim:", payload);

    const config = { headers: { Authorization: `Bearer ${token}` } };
    await api.post(`${API_URL}/approve`, payload, config);

    toast.success(`Berhasil disetujui sebagai ${role}`);
    await loaddataall(formData.nomor);
    
  } catch (error: any) {
    const message = error.response?.data?.message || `Gagal Acc ${role}.`;
    toast.error(message);
  } finally {
    isApproving.value = false;
  }
};

const handleGudangAsalSelect = (gudang: { Kode: string; Nama: string }) => {
  formData.gudangKode = gudang.Kode;
  formData.gudangNama = gudang.Nama;
  isGudangModalVisible.value = false;
};

// --- LOGIKA PABRIK -> CABANG ---
const handlePabrikSelect = (pabrik: { Kode: string; Nama: string }) => {
  formData.pabrikKode = pabrik.Kode;
  formData.pabrikNama = pabrik.Nama;
  formData.cabang = pabrik.Nama; // Cabang otomatis terisi dari Nama Pabrik
  isPabrikModalVisible.value = false;
};

const openSPKSearch = (index: number) => {
  currentDetailIndex.value = index;
  isSPKModalVisible.value = true;
};

const handleSPKSelect = (spk: { Spk: string; Nama: string }) => {
  if (currentDetailIndex.value !== null) {
    const item = formData.detail[currentDetailIndex.value];
    item.spk = spk.Spk;
    item.namaSPK = spk.Nama;
  }
  isSPKModalVisible.value = false;
};

const openBahanSearch = (index: number) => {
  currentDetailIndex.value = index;
  isBahanModalVisible.value = true;
};

const handleBahanSelect = (bahan: MasterBahan) => {
  if (currentDetailIndex.value === null) return;
  
  const isDuplicate = formData.detail.some((d, i) => d.sku === bahan.Kode && i !== currentDetailIndex.value);
  if (isDuplicate) {
    toast.warning(`Bahan ${bahan.Kode} sudah ada di baris lain.`);
    return;
  }

  const target = formData.detail[currentDetailIndex.value];
  target.sku = bahan.Kode;
  target.namaBarang = bahan.Nama;
  target.satuan = bahan.Satuan;
  target.Panjang = bahan.Panjang || 0;
  target.Lebar = bahan.Lebar || 0;
  target.qty = 1;

  if (currentDetailIndex.value === formData.detail.length - 1) addDetail();
  isBahanModalVisible.value = false;
};

const loaddataall = async (nomor: string) => {
  isSaving.value = true;
  try {
    const response = await api.get(`${API_URL}/${nomor}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    const d = response.data;

    formData.nomor = d.Nomor;
    formData.tanggal = format(new Date(d.Tanggal), "yyyy-MM-dd");
    formData.gudangKode = d.Gudang_Asal_Kode;
    formData.gudangNama = d.Gudang_Asal_Nama;
    formData.keteranganHeader = d.Keterangan;
    formData.kepada = d.Kepada || "";
    formData.cabang = d.To_Cabang || d.Cabang || ""; // Sesuaikan mapping backend
    formData.pabrikNama = formData.cabang; 
    formData.accSpv = d.Req_ACC_User || "-";      // Mapping dari backend
    formData.accManager = d.Acc_User || "-";
    
    formData.detail = d.Detail.map((item: any) => ({
      sku: item.Kode,
      namaBarang: item.Nama_Bahan,
      qty: item.Jumlah,
      satuan: item.Satuan,
      Panjang: item.Panjang || 0,
      Lebar: item.Lebar || 0,
      keterangan: item.KeteranganItem || "",
      spk: item.Nomor_SPK || "",
      namaSPK: item.spk_nama || "",
    }));
    
    if (formData.detail.length === 0 || formData.detail[formData.detail.length-1].sku) addDetail();
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
      NomorToEdit: isEditMode.value ? formData.nomor : null,
      Tanggal: formData.tanggal,
      GudangKode: formData.gudangKode,
      PabrikKode: formData.pabrikKode,
      Keterangan: formData.keteranganHeader,
      Kepada: formData.kepada,
      Cabang: formData.cabang, // Mengirim nama pabrik ke kolom Cabang
      Detail: formData.detail
        .filter((d) => d.sku && d.qty > 0)
        .map((d) => ({
          SPK: d.spk,
          SKU: d.sku,
          QTY: d.qty,
          Satuan: d.satuan,
          KeteranganItem: d.keterangan,
        })),
    };

    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    if (isEditMode.value) {
      await api.put(`${API_URL}/${formData.nomor}`, payload, config);
    } else {
      await api.post(API_URL, payload, config);
    }

    toast.success("Data berhasil disimpan!");

    if (saveAndNew) {
      Object.assign(formData, {
        nomor: "AUTO",
        detail: [createEmptyDetail()],
        keteranganHeader: "",
        cabang: "",
        pabrikNama: "",
        pabrikKode: ""
      });
      isEditMode.value = false;
    } else {
      router.push({ name: "PermintaanBahanBrowse" });
    }
  } catch (error: any) {
    const message = error.response?.data?.message || "Gagal menyimpan data.";
    toast.error(message);
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
  if (isEditMode.value && route.params.nomor) {
    loaddataall(route.params.nomor as string);
  }
});
</script>

<template>
  <PageLayout title="Form Permintaan Bahan MMT" icon="mdi-basket-fill">
    <template #header-actions>
      <v-btn v-if="isEditMode" size="x-small" color="orange-darken-2" @click="approveData('SPV')" :loading="isApproving" class="mr-1">
        <v-icon start>mdi-account-check</v-icon> Acc SPV
      </v-btn>
      <v-btn v-if="isEditMode" size="x-small" color="purple-darken-2" @click="approveData('MANAGER')" :loading="isApproving" class="mr-1">
        <v-icon start>mdi-shield-check</v-icon> Acc Manager
      </v-btn>
      <v-divider vertical class="mx-2" v-if="isEditMode"></v-divider>
      <v-btn size="x-small" color="primary" @click="saveForm(false)" :loading="isSaving" :disabled="!isFormValid">
        <v-icon start>mdi-check-circle</v-icon> Simpan
      </v-btn>
      <v-btn size="x-small" color="success" class="ml-1" @click="saveForm(true)" :disabled="isSaving || !isFormValid">
        <v-icon start>mdi-content-save-all</v-icon> Simpan & Baru
      </v-btn>
      <v-btn size="x-small" class="ml-1" @click="router.push({ name: 'PermintaanBahanBrowse' })">
        <v-icon start>mdi-close</v-icon> Tutup
      </v-btn>
    </template>

    <div class="form-grid-container">
      <div class="left-column">
        <v-card flat border>
          <v-card-title class="text-subtitle-1 py-2 bg-grey-lighten-4">Data Header</v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-row dense>
              <v-col cols="12">
                <v-text-field label="Nomor Transaksi" v-model="formData.nomor" readonly variant="filled" density="compact" hide-details />
              </v-col>
              <v-col cols="6">
                <v-text-field label="Tanggal" v-model="formData.tanggal" type="date" variant="outlined" density="compact" hide-details />
              </v-col>
              <v-col cols="6">
                <v-text-field label="Gudang Asal" v-model="formData.gudangKode" @click="isGudangModalVisible = true" append-inner-icon="mdi-magnify" readonly density="compact" variant="outlined" hide-details />
              </v-col>
              <v-col cols="12">
                <v-text-field label="Nama Gudang" v-model="formData.gudangNama" readonly bg-color="grey-lighten-4" density="compact" variant="outlined" hide-details />
              </v-col>
              <v-col cols="12">
                <v-text-field label="Kepada" v-model="formData.kepada" variant="outlined" density="compact" hide-details />
              </v-col>
              <v-col cols="12">
                <v-text-field label="Pilih Tujuan (Pabrik)" v-model="formData.pabrikNama" @click="isPabrikModalVisible = true" append-inner-icon="mdi-magnify" readonly variant="outlined" density="compact" hide-details color="primary" />
              </v-col>
              <v-col cols="12">
                <v-textarea label="Keterangan Header" v-model="formData.keteranganHeader" rows="2" variant="outlined" density="compact" hide-details />
              </v-col>

              <v-col cols="12" class="mt-4 pt-4 border-t">
                <div class="text-caption font-weight-bold text-grey mb-2">STATUS APPROVAL</div>
                <v-row dense>
                  <v-col cols="6">
                    <v-text-field label="Acc SPV" v-model="formData.accSpv" readonly density="compact" variant="filled" hide-details class="text-caption" />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field label="Acc Manager" v-model="formData.accManager" readonly density="compact" variant="filled" hide-details class="text-caption" />
                  </v-col>
                </v-row>
              </v-col>

              <v-col cols="12" class="mt-4">
                <v-card color="blue-lighten-5" flat class="pa-2">
                  <div class="text-caption font-weight-bold text-blue-darken-3">TOTAL QTY MINTA</div>
                  <div class="text-h5 font-weight-black text-right text-blue-darken-4">{{ calculatedTotal }}</div>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </div>

      <div class="right-column">
        <v-card border flat>
          <v-data-table :headers="detailHeaders" :items="formData.detail" :items-per-page="-1" density="compact" hide-default-footer fixed-header height="calc(100vh - 220px)">
            <template #[`item.index`]="{ index }">
              <span class="text-grey text-caption">{{ index + 1 }}</span>
            </template>
            <template #[`item.spk`]="{ item, index }">
              <v-text-field v-model="item.spk" @click="currentDetailIndex = index; isSPKModalVisible = true" append-inner-icon="mdi-magnify" readonly density="compact" variant="plain" hide-details />
            </template>
            <template #[`item.sku`]="{ item, index }">
              <v-text-field v-model="item.sku" @click="currentDetailIndex = index; isBahanModalVisible = true" append-inner-icon="mdi-magnify" readonly density="compact" variant="plain" hide-details />
            </template>
            <template #[`item.qty`]="{ item }">
              <v-text-field v-model.number="item.qty" type="number" density="compact" variant="plain" hide-details class="text-right-input" />
            </template>
            <template #[`item.actions`]="{ index }">
              <v-btn icon="mdi-delete" size="x-small" color="error" variant="text" @click="removeDetail(index)" :disabled="formData.detail.length === 1 && !formData.detail[0].sku" />
            </template>
            <template #bottom>
              <div class="pa-2 border-t">
                <v-btn size="x-small" color="primary" variant="tonal" prepend-icon="mdi-plus" @click="addDetail">Tambah Baris</v-btn>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </div>
    </div>

    <GudangLookupModal :isVisible="isGudangModalVisible" @close="isGudangModalVisible = false" @select="handleGudangAsalSelect" />
    <PabrikLookupModal :isVisible="isPabrikModalVisible" @close="isPabrikModalVisible = false" @select="handlePabrikSelect" />
    <MasterBahanModal :isVisible="isBahanModalVisible" mode="mmt" @close="isBahanModalVisible = false" @select="handleBahanSelect" />
    <SPKLookupModal :isVisible="isSPKModalVisible" @close="isSPKModalVisible = false" @select="handleSPKSelect" />
  </PageLayout>
</template>

<style scoped>
.form-grid-container { 
  display: grid; 
  grid-template-columns: 350px 1fr; 
  gap: 15px; 
  padding: 10px; 
}

/* Menargetkan seluruh area kolom kanan */
.right-column :deep(*) {
  font-size: 11px !important;
}

/* Pengaturan spesifik untuk header tabel */
.detail-entry-table :deep(.v-data-table-header__content) {
  font-weight: bold;
}

/* Custom styling untuk input dalam tabel agar sangat rapat */
.detail-entry-table :deep(.v-field__input) {
  padding: 2px 6px !important; /* Dipersempit lagi */
  min-height: 28px !important;
  height: 28px !important;
}

/* Mengatur tinggi baris tabel agar tidak terlalu renggang */
.detail-entry-table :deep(.v-data-table__td) {
  height: 32px !important;
}

.text-right-input :deep(input) {
  text-align: right !important;
}

/* Menghilangkan spinner pada input number */
.no-spinner :deep(input::-webkit-outer-spin-button),
.no-spinner :deep(input::-webkit-inner-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}

.bg-grey-lighten-5 {
  background-color: #f9f9f9 !important;
}
</style>