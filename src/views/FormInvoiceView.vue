<template>
  <PageLayout :title="formTitle" icon="mdi-file-document-edit">
    <template #header-actions>
      <v-btn size="x-small" color="primary" @click="handleSave" :loading="isSaving" :disabled="isSaving || !isFormValid">
        <v-icon start>mdi-content-save</v-icon> Simpan (F10)
      </v-btn>
      <v-btn size="x-small" @click="handleCancel" :disabled="isSaving">
        <v-icon start>mdi-undo</v-icon> Batal (F7)
      </v-btn>
      <v-btn v-if="isEditMode" size="x-small" color="teal" @click="handlePrint" :disabled="isSaving">
        <v-icon start>mdi-printer</v-icon> Cetak (F3)
      </v-btn>
      <v-btn size="x-small" @click="closeForm">
        <v-icon start>mdi-close</v-icon> Tutup
      </v-btn>
    </template>

    <div class="form-grid-container">
      <div class="left-column">
        <v-card class="desktop-form-section mb-4" flat border>
          <v-card-title class="text-subtitle-1 d-flex align-center pa-2">
            Data Header
            <v-spacer />
            <v-chip size="small" :color="getInvoiceStatusColor()" label>
              {{ isEditMode ? 'TERDAFTAR' : 'BARU' }}
            </v-chip>
          </v-card-title>

          <v-card-text>
            <v-row dense>
              <v-col cols="12">
                <v-text-field label="Nomor Invoice" v-model="formData.inv_nomor" readonly filled density="compact" variant="outlined" />
              </v-col>

              <v-col cols="12">
                <v-text-field label="Tanggal Invoice" v-model="formData.inv_tanggal" type="date" variant="outlined" density="compact" hide-details />
              </v-col>

              <v-col cols="12" class="mt-2">
                <v-text-field label="Tanggal Tempo" v-model="formData.inv_tanggal_tempo" type="date" variant="outlined" density="compact" hide-details />
              </v-col>

              <v-divider class="my-4" />

              <v-col cols="4">
                <v-text-field 
                  label="Kode Sup" 
                  v-model="formData.inv_sup_kode" 
                  append-inner-icon="mdi-magnify" 
                  @click="openSupplierSearch" 
                  density="compact" 
                  variant="outlined" 
                  hide-details 
                  style="cursor: pointer" 
                />
              </v-col>
              <v-col cols="8">
                <v-text-field label="Nama Supplier" v-model="formData.sup_nama" readonly filled density="compact" hide-details />
              </v-col>

              <v-col cols="12">
                <v-textarea label="Alamat Penagihan" v-model="formData.inv_sup_alamat" variant="outlined" density="compact" rows="2" hide-details class="mt-2" />
              </v-col>

              <v-divider class="my-4" />

              <v-col cols="12">
                <v-text-field 
                  label="Ambil Dari Penerimaan Bahan" 
                  v-model="formData.inv_rekening" 
                  append-inner-icon="mdi-magnify" 
                  @click="openPenerimaanSearch" 
                  readonly 
                  variant="outlined" 
                  density="compact" 
                  hide-details 
                  placeholder="Klik untuk cari Penerimaan..." 
                  style="cursor: pointer" 
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </div>

      <div class="right-column">
        <v-card border flat class="mb-3 d-flex flex-column">
          <v-card-title class="text-subtitle-1 pa-2">Detail Item Penagihan</v-card-title>
          <v-card-text class="pa-0">
            <div class="detail-table-wrapper">
              <v-data-table :headers="detailHeaders" :items="formData.detail" :items-per-page="-1" density="compact" hide-default-footer fixed-header height="calc(100vh - 420px)" class="detail-entry-table">
                
                <template #[`item.invd_spk_nomor`]="{ item, index }">
                  <v-text-field v-if="item" v-model="item.invd_spk_nomor" @click="openSPKSearch(index)" readonly density="compact" variant="plain" hide-details append-inner-icon="mdi-magnify" />
                </template>

                <template #[`item.nama_barang`]="{ item }">
                  <v-text-field v-model="item.nama_barang" variant="plain" density="compact" hide-details />
                </template>

                <template #[`item.invd_jumlah`]="{ item }">
                  <v-text-field v-model.number="item.invd_jumlah" type="number" @update:model-value="hitung" variant="plain" density="compact" hide-details class="text-right-input font-weight-bold" />
                </template>

                <template #[`item.invd_harga`]="{ item }">
                  <v-text-field v-model.number="item.invd_harga" type="number" @update:model-value="hitung" variant="plain" density="compact" hide-details class="text-right-input" />
                </template>

                <template #[`item.total`]="{ item }">
                  <div class="text-right font-weight-bold pr-2">{{ formatCurrency(item.invd_jumlah * item.invd_harga) }}</div>
                </template>

                <template #[`item.actions`]="{ index }">
                  <v-btn icon="mdi-delete" size="x-small" color="error" variant="text" @click="removeDetail(index)" />
                </template>

                <template #bottom>
                  <v-container class="py-2">
                    <v-btn size="x-small" color="primary" prepend-icon="mdi-plus" @click="addDetail">Tambah Baris</v-btn>
                  </v-container>
                </template>
              </v-data-table>
            </div>
          </v-card-text>
        </v-card>

        <v-card flat border class="desktop-form-section">
          <v-card-text>
            <v-row dense>
              <v-col cols="7">
                <v-textarea label="Keterangan Invoice" v-model="formData.inv_keterangan" rows="3" variant="outlined" density="compact" hide-details />
              </v-col>
              <v-col cols="5">
                <v-row dense>
                  <v-col cols="6">
                    <v-checkbox label="PPN" v-model="formData.isPpn" @change="hitung" density="compact" hide-details />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field label="Rate PPN (%)" v-model.number="formData.ppnRate" type="number" @update:model-value="hitung" density="compact" variant="outlined" hide-details class="text-right" />
                  </v-col>
                  <v-col cols="12">
                    <v-text-field label="Subtotal" :model-value="formatCurrency(calculatedSubTotal)" readonly density="compact" variant="plain" hide-details class="text-right" />
                  </v-col>
                  <v-col cols="12">
                    <v-text-field label="Grand Total" :model-value="formatCurrency(calculatedGrandTotal)" readonly density="compact" variant="outlined" hide-details class="text-right font-weight-bold text-primary" />
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </div>
    </div>

<SupplierLookupModal
  v-if="isSupplierModalVisible"
  :isVisible="isSupplierModalVisible"
  @close="isSupplierModalVisible = false"
  @select="handleSupplierSelect"
/>

<SPKLookupModal
  v-if="isSPKModalVisible"
  :isVisible="isSPKModalVisible"
  @close="isSPKModalVisible = false"
  @select="handleSPKSelect"
/>

<PenerimaanBahanLookupModal
  v-if="isRecModalVisible"
  :isVisible="isRecModalVisible"
  @close="isRecModalVisible = false"
  @select="handlePenerimaanSelect"
/>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { format } from 'date-fns';
import PageLayout from "@/components/PageLayout.vue";
import { useToast } from "vue-toastification";
import api from "@/services/api";

// Modals
import SupplierLookupModal from "@/modal/SupplierLookupModal.vue"; 
import SPKLookupModal from "@/modal/SpkLookupModal.vue";
import PenerimaanBahanLookupModal from "@/modal/PenerimaanBahanLookupModal.vue";

const toast = useToast();
const route = useRoute();
const router = useRouter();

const isEditMode = ref(!!route.params.nomor);
const isSaving = ref(false);

const isSupplierModalVisible = ref(false);
const isRecModalVisible = ref(false);
const isSPKModalVisible = ref(false);
const activeDetailIndex = ref(-1);

const formData = reactive({
  inv_nomor: "AUTO",
  inv_tanggal: format(new Date(), "yyyy-MM-dd"),
  inv_tanggal_tempo: format(new Date(), "yyyy-MM-dd"),
  inv_sup_kode: "",
  sup_nama: "",
  inv_sup_alamat: "",
  inv_rekening: "", 
  inv_keterangan: "",
  isPpn: false,
  ppnRate: 11,
  detail: [{ invd_spk_nomor: '', nama_barang: '', invd_jumlah: 0, invd_harga: 0 }]
});

const openSupplierSearch = () => isSupplierModalVisible.value = true;
const openPenerimaanSearch = () => isRecModalVisible.value = true;
const openSPKSearch = (index: number) => {
  activeDetailIndex.value = index;
  isSPKModalVisible.value = true;
};

// HANDLER SUPPLIER
const handleSupplierSelect = async (s: any) => {
  formData.inv_sup_kode = s.Kode;
  formData.sup_nama = s.Nama;
  formData.inv_sup_alamat = s.Alamat;
  isSupplierModalVisible.value = false;
};

// HANDLER PENERIMAAN (LOOKUP)
const handlePenerimaanSelect = async (rec: any) => {
  try {
    isSaving.value = true;
    const response = await api.get(`/mmt/penerimaan-bahan/detail-invoice/${encodeURIComponent(rec.Nomor)}`);
    const result = response.data.data; 
    formData.inv_rekening = rec.Nomor; 
    formData.inv_sup_kode = result.header.rec_sup_kode;
    formData.sup_nama = rec.Supplier;
    formData.inv_sup_alamat = rec.Keterangan;
    formData.detail = result.details.map((d: any) => ({
      invd_spk_nomor: rec.No_Permintaan || rec.Nomor,
      nama_barang: d.Nama_Barang,
      invd_jumlah: Number(d.Qty) || 0,
      invd_harga: Number(d.Harga_Beli) || 0,
    }));

    if (formData.detail.length > 0) {
      formData.detail.push({ invd_spk_nomor: '', nama_barang: '', invd_jumlah: 0, invd_harga: 0 });
    }

    formData.isPpn = result.header.rec_istax === 1;
    formData.ppnRate = result.header.rec_taxamount || 11;

    toast.success(`Data penerimaan ${rec.Nomor} dimuat`);
  } catch (err) {
    toast.error("Gagal memuat detail penerimaan");
  } finally {
    isRecModalVisible.value = false;
    isSaving.value = false;
  }
};

// --- Utils ---
const detailHeaders = [
  { title: "Referensi/PO", key: "invd_spk_nomor", width: "150px" },
  { title: "Deskripsi Barang", key: "nama_barang" },
  { title: "Qty", key: "invd_jumlah", width: "100px", align: "end" as const },
  { title: "Harga", key: "invd_harga", width: "130px", align: "end" as const },
  { title: "Total", key: "total", width: "150px", align: "end" as const },
  { title: "Aksi", key: "actions", width: "50px", sortable: false },
];

const formatCurrency = (val: number) => val.toLocaleString("id-ID", { minimumFractionDigits: 2 });
const calculatedSubTotal = computed(() => formData.detail.reduce((sum, item) => sum + (item.invd_jumlah * item.invd_harga), 0));
const calculatedGrandTotal = computed(() => {
  const sub = calculatedSubTotal.value;
  return formData.isPpn ? sub * (1 + formData.ppnRate / 100) : sub;
});

const isFormValid = computed(() => !!formData.inv_sup_kode && formData.detail.some(d => d.invd_jumlah > 0));
const addDetail = () => formData.detail.push({ invd_spk_nomor: '', nama_barang: '', invd_jumlah: 0, invd_harga: 0 });
const removeDetail = (index: number) => formData.detail.splice(index, 1);
const closeForm = () => router.push({ name: 'InvoiceBrowse' });
const getInvoiceStatusColor = () => isEditMode.value ? 'blue' : 'green';
</script>