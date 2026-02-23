<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import { format } from "date-fns";
import PageLayout from "../components/PageLayout.vue";
import SupplierLookupModal from "../modal/SupplierLookupModal.vue";

/* --- Interfaces --- */
interface LookupItem {
  Kode: string;
  Nama?: string;
  Alamat?: string;
  Kota?: string;
}

const router = useRouter();
const toast = useToast();

// --- State ---
const loading = ref(false);
const isSupplierModalVisible = ref(false);
const outstandingInvoices = ref([]);
const selectedInvoices = ref([]);

const accounts = ref([
  { kode: "1101", nama: "Kas Besar" },
  { kode: "1102", nama: "Bank Mandiri" },
]);

const form = reactive({
  pelh_tanggal: format(new Date(), "yyyy-MM-dd"),
  pelh_sup_kode: "",
  supNama: "", // Untuk display nama supplier
  pelh_akun_kas: "",
  pelh_keterangan: "",
  pelh_perush_kode: "KP",
  pelh_total_bayar: 0,
});

// --- Computed ---
const totalNominal = computed(() => {
  return selectedInvoices.value.reduce(
    (sum, item) => sum + Number(item.TotalInvoice || 0),
    0,
  );
});

// --- Methods ---
const openSupplierSearch = () => {
  isSupplierModalVisible.value = true;
};

const handleSupplierSelect = (sup: LookupItem) => {
  if (!sup.Kode) return;

  form.pelh_sup_kode = sup.Kode;
  form.supNama = sup.Nama || "";

  isSupplierModalVisible.value = false;

  // Langsung fetch invoice begitu supplier dipilih
  fetchOutstanding(sup.Kode);
};

const fetchOutstanding = async (supKode: string) => {
  if (!supKode) return;
  loading.value = true;
  outstandingInvoices.value = [];
  selectedInvoices.value = [];

  try {
    const res = await api.get(
      `/mmt/pelunasan-pembelian/outstanding/${supKode}`,
    );
    outstandingInvoices.value = res.data;
  } catch (e) {
    toast.error("Gagal ambil data invoice outstanding");
  } finally {
    loading.value = false;
  }
};

const handleSave = async () => {
  if (!form.pelh_sup_kode || selectedInvoices.value.length === 0) {
    toast.warning("Pilih supplier dan minimal satu invoice!");
    return;
  }

  loading.value = true;
  try {
    const payload = {
      ...form,
      pelh_total_bayar: totalNominal.value,
      detail: selectedInvoices.value.map((inv) => ({
        peld_inv_nomor: inv.Nomor,
        peld_nominal: inv.TotalInvoice,
      })),
    };

    // 1. Tunggu respon dari server
    const res = await api.post("/mmt/pelunasan-pembelian/save", payload);

    // 2. Tampilkan toast sukses HANYA jika request berhasil
    toast.success("Pelunasan berhasil disimpan & Jurnal otomatis terbuat");

    // 3. Pindah halaman
    router.push({ name: "PelunasanPembelianBrowse" });
  } catch (e: any) {
    // Jika API gagal atau router.push gagal, baru toast ini muncul
    console.error("Save Error:", e);

    // Cegah toast ganda jika Anda sudah pakai interceptor global
    const errorMessage = e.response?.data?.message || "Gagal simpan pelunasan";
    toast.error(errorMessage);
  } finally {
    loading.value = false;
  }
};

const handleSupKodeExit = () => {
  if (form.pelh_sup_kode) {
    fetchOutstanding(form.pelh_sup_kode);
  }
};
</script>

<template>
  <PageLayout title="Input Pelunasan Baru" icon="mdi-cash-plus">
    <template #header-actions>
      <v-btn
        color="primary"
        @click="handleSave"
        :loading="loading"
        prepend-icon="mdi-content-save"
        size="small"
      >
        Simpan Pelunasan
      </v-btn>
      <v-btn variant="text" size="small" @click="router.back()">Batal</v-btn>
    </template>

    <v-container fluid>
      <v-row>
        <v-col cols="12" md="4">
          <v-card variant="outlined" class="pa-4">
            <v-text-field
              v-model="form.pelh_tanggal"
              type="date"
              label="Tanggal Bayar"
              density="compact"
              variant="outlined"
              class="mb-2"
            />

            <v-row no-gutters class="mb-2">
              <v-col cols="4" class="pr-1">
                <v-text-field
                  label="Kode Sup"
                  v-model="form.pelh_sup_kode"
                  @click:append-inner="openSupplierSearch"
                  @keyup.f1.prevent="openSupplierSearch"
                  @blur="handleSupKodeExit"
                  append-inner-icon="mdi-magnify"
                  density="compact"
                  variant="outlined"
                  hide-details
                  readonly
                  style="cursor: pointer"
                />
              </v-col>
              <v-col cols="8">
                <v-text-field
                  label="Nama Supplier"
                  v-model="form.supNama"
                  density="compact"
                  variant="outlined"
                  hide-details
                  readonly
                  disabled
                />
              </v-col>
            </v-row>

            <v-select
              v-model="form.pelh_akun_kas"
              :items="accounts"
              item-title="nama"
              item-value="kode"
              label="Bayar Menggunakan"
              density="compact"
              variant="outlined"
              prepend-inner-icon="mdi-bank"
              class="mb-2"
            />

            <v-textarea
              v-model="form.pelh_keterangan"
              label="Keterangan"
              density="compact"
              variant="outlined"
              rows="2"
              hide-details
            />
          </v-card>

          <v-card class="mt-4 bg-blue-lighten-5 pa-4" variant="flat" border>
            <div class="text-subtitle-2 text-blue-darken-3">
              Total Pembayaran:
            </div>
            <div class="text-h5 font-weight-bold text-blue-darken-4">
              Rp {{ totalNominal.toLocaleString("id-ID") }}
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" md="8">
          <v-card variant="outlined">
            <v-card-title class="text-subtitle-1 d-flex align-center">
              <v-icon start size="small">mdi-file-clock</v-icon>
              Daftar Invoice Belum Lunas
            </v-card-title>

            <v-divider></v-divider>

            <v-data-table
              v-model="selectedInvoices"
              :items="outstandingInvoices"
              :headers="[
                { title: 'Nomor Invoice', key: 'Nomor', sortable: true },
                { title: 'Tanggal', key: 'Tanggal', width: '120px' },
                { title: 'Jatuh Tempo', key: 'JatuhTempo', width: '120px' },
                {
                  title: 'Tagihan',
                  key: 'TotalInvoice',
                  align: 'end',
                  width: '150px',
                },
              ]"
              show-select
              return-object
              density="compact"
              :loading="loading"
              no-data-text="Pilih supplier untuk melihat invoice"
              class="elevation-0"
              style="font-size: 0.85rem"
            >
              <template #item.TotalInvoice="{ item }">
                <span class="font-weight-medium">
                  {{ item.TotalInvoice.toLocaleString("id-ID") }}
                </span>
              </template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <SupplierLookupModal
      v-if="isSupplierModalVisible"
      :isVisible="isSupplierModalVisible"
      @close="isSupplierModalVisible = false"
      @select="handleSupplierSelect"
    />
  </PageLayout>
</template>

<style scoped>
:deep(.v-data-table-header__content) {
  font-weight: bold !important;
}
</style>
