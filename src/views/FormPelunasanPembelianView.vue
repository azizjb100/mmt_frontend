<script setup lang="ts">
import { ref, reactive, computed } from "vue";
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
}

const router = useRouter();
const toast = useToast();

// --- State ---
const loading = ref(false);
const isSupplierModalVisible = ref(false);

// Mengubah penamaan state agar sesuai konteks BPB/Penerimaan Bahan
const outstandingPenerimaan = ref([]);
const selectedPenerimaan = ref([]);

const form = reactive({
  vch_tanggal: format(new Date(), "yyyy-MM-dd"),
  vch_sup_kode: "",
  supNama: "",
  vch_invoice_no: "", // <-- Inputan Baru: Nomor Invoice dari Supplier
  vch_faktur_pajak_no: "", // <-- Inputan Baru: Nomor Faktur Pajak
  vch_keterangan: "",
  vch_perush_kode: "KP",
  vch_jenis: "HUTANG",
});

// --- Computed ---
// Menghitung total pengajuan dari BPB yang dipilih
const totalPengajuan = computed(() => {
  return selectedPenerimaan.value.reduce(
    (sum, item) => sum + Number(item.TotalBpb || 0),
    0,
  );
});

// --- Methods ---
const openSupplierSearch = () => {
  isSupplierModalVisible.value = true;
};

const handleSupplierSelect = (sup: LookupItem) => {
  if (!sup.Kode) return;
  form.vch_sup_kode = sup.Kode;
  form.supNama = sup.Nama || "";
  isSupplierModalVisible.value = false;
  fetchOutstandingBPB(sup.Kode); // Panggil fungsi outstanding BPB
};

// Mengubah endpoint dan penampung data ke BPB Outstanding
const fetchOutstandingBPB = async (supKode: string) => {
  if (!supKode) return;
  loading.value = true;
  outstandingPenerimaan.value = [];
  selectedPenerimaan.value = [];

  try {
    // Silakan sesuaikan URL endpoint backend ini untuk mengambil data BPB belum lunas
    const res = await api.get(
      `/mmt/pelunasan-pembelian/outstanding-bpb/${supKode}`,
    );
    outstandingPenerimaan.value = res.data;
  } catch (e) {
    toast.error("Gagal mengambil daftar Penerimaan Bahan (BPB)");
  } finally {
    loading.value = false;
  }
};

const handleSaveVoucher = async () => {
  if (!form.vch_sup_kode || selectedPenerimaan.value.length === 0) {
    toast.warning(
      "Pilih supplier dan tandai Penerimaan (BPB) yang akan diajukan!",
    );
    return;
  }

  loading.value = true;
  try {
    const payload = {
      ...form,
      vch_total_pengajuan: totalPengajuan.value,
      // Menyesuaikan mapping detail voucher dengan struktur field database BPB Anda
      detail: selectedPenerimaan.value.map((bpb) => ({
        vchd_bpb_nomor: bpb.Nomor, // Mengubah vchd_inv_nomor -> vchd_bpb_nomor
        vchd_nominal: bpb.TotalBpb, // Nilai tagihan real dari BPB tersebut
      })),
    };

    await api.post("/mmt/voucher-pelunasan/save", payload);

    toast.success(
      "Voucher Pengajuan berbasis BPB berhasil dibuat. Menunggu approval.",
    );
    router.push({ name: "VoucherPembayaranBrowse" });
  } catch (e: any) {
    console.error("Save Error:", e);
    const errorMessage = e.response?.data?.message || "Gagal membuat voucher";
    toast.error(errorMessage);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <PageLayout
    title="Buat Voucher Pengajuan Pelunasan (Berbasis BPB)"
    icon="mdi-file-document-edit-outline"
  >
    <template #header-actions>
      <v-btn
        color="success"
        @click="handleSaveVoucher"
        :loading="loading"
        prepend-icon="mdi-check-decagram"
        size="small"
      >
        Ajukan Voucher
      </v-btn>
      <v-btn variant="text" size="small" @click="router.back()">Batal</v-btn>
    </template>

    <v-container fluid>
      <v-row>
        <v-col cols="12" md="4">
          <v-card variant="outlined" class="pa-4 border-dashed">
            <div class="text-overline mb-2 text-primary">Informasi Voucher</div>

            <v-text-field
              v-model="form.vch_tanggal"
              type="date"
              label="Tanggal Pengajuan"
              density="compact"
              variant="outlined"
            />

            <v-row no-gutters class="mt-2">
              <v-col cols="4" class="pr-1">
                <v-text-field
                  label="Supplier"
                  v-model="form.vch_sup_kode"
                  @click:append-inner="openSupplierSearch"
                  append-inner-icon="mdi-magnify"
                  density="compact"
                  variant="outlined"
                  readonly
                />
              </v-col>
              <v-col cols="8">
                <v-text-field
                  label="Nama"
                  v-model="form.supNama"
                  density="compact"
                  variant="outlined"
                  readonly
                  disabled
                />
              </v-col>
            </v-row>

            <!-- Inputan Baru: Nomor Invoice -->
            <v-text-field
              v-model="form.vch_invoice_no"
              label="Nomor Invoice Supplier"
              placeholder="Masukkan nomor invoice / nota fisik"
              density="compact"
              variant="outlined"
              clearable
              class="mt-2"
            />

            <!-- Inputan Baru: Nomor Faktur Pajak -->
            <v-text-field
              v-model="form.vch_faktur_pajak_no"
              label="Nomor Faktur Pajak"
              placeholder="000.000-00.00000000"
              density="compact"
              variant="outlined"
              clearable
              class="mt-2"
            />

            <v-textarea
              v-model="form.vch_keterangan"
              label="Alasan/Keterangan Pengajuan"
              density="compact"
              variant="outlined"
              rows="3"
              placeholder="Contoh: Pelunasan penerimaan bahan / BPB minggu ini"
              class="mt-2"
            />

            <v-alert
              type="info"
              variant="tonal"
              density="compact"
              class="mt-4"
              text="Data ini akan masuk ke daftar antrian pembayaran kasir berdasarkan nota BPB."
            />
          </v-card>

          <v-card class="mt-4 bg-green-lighten-5 pa-4" variant="flat" border>
            <div class="text-subtitle-2 text-green-darken-3">
              Total Yang Diajukan:
            </div>
            <div class="text-h5 font-weight-bold text-green-darken-4">
              Rp {{ totalPengajuan.toLocaleString("id-ID") }}
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" md="8">
          <v-card variant="outlined">
            <v-card-title class="text-subtitle-1 d-flex align-center">
              <v-icon start color="orange">mdi-alert-circle-outline</v-icon>
              Pilih Bukti Penerimaan Barang (BPB) untuk Diajukan
            </v-card-title>

            <v-divider></v-divider>

            <v-data-table
              v-model="selectedPenerimaan"
              :items="outstandingPenerimaan"
              :headers="[
                { title: 'Nomor BPB', key: 'Nomor' },
                {
                  title: 'Tanggal Terima',
                  key: 'TanggalTerima',
                  width: '150px',
                },
                { title: 'Nilai Tagihan BPB', key: 'TotalBpb', align: 'end' },
              ]"
              show-select
              return-object
              density="compact"
              :loading="loading"
              no-data-text="Silahkan pilih supplier terlebih dahulu"
            >
              <template #item.TanggalTerima="{ item }">
                {{
                  item.TanggalTerima
                    ? format(new Date(item.TanggalTerima), "dd-MM-yyyy")
                    : "-"
                }}
              </template>
              <template #item.TotalBpb="{ item }">
                <span class="font-weight-bold">
                  {{ item.TotalBpb.toLocaleString("id-ID") }}
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
