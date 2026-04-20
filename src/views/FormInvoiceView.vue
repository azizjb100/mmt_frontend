<template>
  <PageLayout :title="formTitle" icon="mdi-file-document-edit">
    <template #header-actions>
      <v-btn
        size="x-small"
        color="primary"
        @click="handleSave"
        :loading="isSaving"
        :disabled="isSaving || !isFormValid"
      >
        <v-icon start>mdi-content-save</v-icon> Simpan (F10)
      </v-btn>
      <v-btn size="x-small" @click="handleCancel" :disabled="isSaving">
        <v-icon start>mdi-undo</v-icon> Batal (F7)
      </v-btn>
      <v-btn
        v-if="isEditMode"
        size="x-small"
        color="teal"
        @click="handlePrint"
        :disabled="isSaving"
      >
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
              {{ isEditMode ? "TERDAFTAR" : "BARU" }}
            </v-chip>
          </v-card-title>

          <v-card-text>
            <v-row dense>
              <v-col cols="12">
                <v-text-field
                  label="Nomor Invoice"
                  v-model="formData.inv_nomor"
                  readonly
                  filled
                  density="compact"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  label="Tanggal Invoice"
                  v-model="formData.inv_tanggal"
                  type="date"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>

              <v-col cols="12" class="mt-2">
                <v-text-field
                  label="Tanggal Tempo"
                  v-model="formData.inv_tanggal_tempo"
                  type="date"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
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
                <v-text-field
                  label="Nama Supplier"
                  v-model="formData.sup_nama"
                  readonly
                  filled
                  density="compact"
                  hide-details
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  label="Alamat Penagihan"
                  v-model="formData.inv_sup_alamat"
                  variant="outlined"
                  density="compact"
                  rows="2"
                  hide-details
                  class="mt-2"
                />
              </v-col>

              <v-divider class="my-4" />
            </v-row>
          </v-card-text>
        </v-card>
      </div>

      <div class="right-column">
        <v-card border flat class="mb-3 d-flex flex-column">
          <v-card-title class="text-subtitle-1 pa-2"
            >Detail Item Penagihan</v-card-title
          >
          <v-card-text class="pa-0">
            <div class="detail-table-wrapper">
              <v-data-table
                :headers="detailHeaders"
                :items="formData.detail"
                :items-per-page="-1"
                density="compact"
                hide-default-footer
                fixed-header
                height="calc(100vh - 420px)"
                class="detail-entry-table"
              >
                <template #[`item.invd_spk_nomor`]="{ item, index }">
                  <v-text-field
                    v-if="item"
                    v-model="item.invd_spk_nomor"
                    @click="openSPKSearch(index)"
                    readonly
                    density="compact"
                    variant="plain"
                    hide-details
                    append-inner-icon="mdi-magnify"
                  />
                </template>

                <template #[`item.nama_barang`]="{ item }">
                  <v-text-field
                    v-model="item.nama_barang"
                    variant="plain"
                    density="compact"
                    hide-details
                  />
                </template>

                <template #[`item.invd_jumlah`]="{ item }">
                  <v-text-field
                    v-model.number="item.invd_jumlah"
                    type="number"
                    @update:model-value="hitung"
                    variant="plain"
                    density="compact"
                    hide-details
                    class="text-right-input font-weight-bold"
                  />
                </template>

                <template #[`item.invd_harga`]="{ item }">
                  <v-text-field
                    v-model.number="item.invd_harga"
                    type="number"
                    @update:model-value="hitung"
                    variant="plain"
                    density="compact"
                    hide-details
                    class="text-right-input"
                  />
                </template>

                <template #[`item.total`]="{ item }">
                  <div class="text-right font-weight-bold pr-2">
                    {{ formatCurrency(item.total) }}
                  </div>
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
                  <v-container class="py-2">
                    <v-btn
                      size="x-small"
                      color="primary"
                      prepend-icon="mdi-plus"
                      @click="addDetail"
                      >Tambah Baris</v-btn
                    >
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
                <v-textarea
                  label="Keterangan Invoice"
                  v-model="formData.inv_keterangan"
                  rows="3"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="5">
                <v-row dense>
                  <v-col cols="6">
                    <v-checkbox
                      label="PPN"
                      v-model="formData.isPpn"
                      @change="hitung"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                      label="Rate PPN (%)"
                      v-model.number="formData.ppnRate"
                      type="number"
                      @update:model-value="hitung"
                      density="compact"
                      variant="outlined"
                      hide-details
                      class="text-right"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                      label="Subtotal"
                      :model-value="formatCurrency(calculatedSubTotal)"
                      readonly
                      density="compact"
                      variant="plain"
                      hide-details
                      class="text-right"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                      label="Grand Total"
                      :model-value="formatCurrency(calculatedGrandTotal)"
                      readonly
                      density="compact"
                      variant="outlined"
                      hide-details
                      class="text-right font-weight-bold text-primary"
                    />
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

    <PenerimaanBahanLookupModal
      v-if="isRecModalVisible"
      :isVisible="isRecModalVisible"
      @close="isRecModalVisible = false"
      @select="handlePenerimaanSelect"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { format } from "date-fns";
import PageLayout from "@/components/PageLayout.vue";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import SupplierLookupModal from "@/modal/SupplierLookupModal.vue";
import PenerimaanBahanLookupModal from "@/modal/PenerimaanBahanLookupModal.vue";

const API_SAVE = "/mmt/invoice/save";
const API_DETAIL = "/invoice";

const toast = useToast();
const route = useRoute();
const router = useRouter();

const isEditMode = ref(!!route.params.nomor);
const isSaving = ref(false);

const isSupplierModalVisible = ref(false);
const isRecModalVisible = ref(false);
const activeDetailIndex = ref(-1);

const getInvoiceStatusColor = () => (isEditMode.value ? "blue" : "green");

const closeForm = () => router.push({ name: "InvoiceBrowse" });

const handleCancel = () => {
  if (confirm("Batalkan perubahan?")) {
    if (isEditMode.value) {
      // Panggil fungsi load data jika sedang edit
      // loadInvoice();
    } else {
      closeForm();
    }
  }
};

const handlePrint = () => {
  const url = router.resolve({
    name: "InvoicePembelianPrint",
    params: { nomor: formData.inv_nomor },
  }).href;
  window.open(url, "_blank");
};

// 1. Inisialisasi struktur formData dengan lengkap agar tidak undefined di awal
const formData = reactive({
  invp_perush_kode: "001",
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
  detail: [
    {
      kode: "",
      invd_spk_nomor: "",
      nama_barang: "",
      satuan: "",
      satuanHarga: "QTY", // Tambahkan default
      m2: 0, // Tambahkan default
      invd_jumlah: 0,
      invd_harga: 0,
      total: 0, // Tambahkan default agar tidak undefined saat render
    },
  ],
});

const formTitle = computed(() =>
  isEditMode.value ? "Ubah Invoice Pembelian" : "Input Invoice Pembelian",
);

// 2. Perbaikan Fungsi hitung
const hitung = () => {
  formData.detail.forEach((item) => {
    const qty = Number(item.invd_jumlah) || 0;
    const harga = Number(item.invd_harga) || 0;
    const m2 = Number(item.m2) || 0;

    if (item.satuanHarga === "M2" && m2 > 0) {
      // RUMUS: Qty * LuasM2 * Harga
      item.total = qty * m2 * harga;
    } else {
      // RUMUS: Qty * Harga
      item.total = qty * harga;
    }
  });
};

// Watcher untuk menghitung otomatis jika ada perubahan data di tabel
watch(
  () => formData.detail,
  () => {
    hitung();
  },
  { deep: true },
);

const openSupplierSearch = () => (isSupplierModalVisible.value = true);
const openPenerimaanSearch = () => (isRecModalVisible.value = true);

const handleSupplierSelect = async (s: any) => {
  formData.inv_sup_kode = s.Kode;
  formData.sup_nama = s.Nama;
  formData.inv_sup_alamat = s.Alamat;
  isSupplierModalVisible.value = false;
};

// 3. Perbaikan handlePenerimaanSelect (Pastikan data dimensi diproses)
const handlePenerimaanSelect = async (rec: any) => {
  try {
    isSaving.value = true;
    const response = await api.get(
      `/mmt/penerimaan-bahan/detail-invoice/${encodeURIComponent(rec.Nomor)}`,
    );
    const payload = response.data.data;

    formData.inv_rekening = payload.header.rec_nomor;
    formData.inv_sup_kode = payload.header.rec_sup_kode;
    formData.sup_nama = rec.Supplier || payload.header.sup_nama;
    formData.inv_sup_alamat = rec.Keterangan || payload.header.sup_alamat || "";

    formData.detail = payload.details.map((d: any) => {
      const p = Number(d.Panjang || d.brg_panjang || 0);
      const l = Number(d.Lebar || d.brg_lebar || 0);
      const m2Calculated = p * l;
      const finalM2 =
        m2Calculated > 0 ? m2Calculated : Number(d.M2 || d.m2) || 1;

      return {
        invd_spk_nomor: payload.header.rec_memo || payload.header.rec_nomor,
        kode: d.Kode,
        nama_barang: d.Nama_Barang,
        satuan: d.Satuan,
        satuanHarga: (d.Satuan_Harga || "QTY").toUpperCase(),
        m2: finalM2,
        invd_jumlah: Number(d.Qty) || 0,
        invd_harga: Number(d.Harga_Beli) || 0,
        total: 0, // Akan diupdate oleh hitung()
      };
    });

    hitung();
    toast.success(`Berhasil memuat Penerimaan ${rec.Nomor}`);
    isRecModalVisible.value = false;
  } catch (err: any) {
    toast.error("Gagal memuat detail penerimaan");
  } finally {
    isSaving.value = false;
  }
};

// 4. Perbaikan formatCurrency (Kebal terhadap undefined/NaN)
const formatCurrency = (val: any) => {
  const numericValue = parseFloat(val);
  if (isNaN(numericValue)) {
    return "0,00";
  }
  return numericValue.toLocaleString("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const calculatedSubTotal = computed(() => {
  return formData.detail.reduce(
    (sum, item) => sum + (Number(item.total) || 0),
    0,
  );
});

const calculatedGrandTotal = computed(() => {
  const sub = calculatedSubTotal.value;
  return formData.isPpn ? sub + sub * (formData.ppnRate / 100) : sub;
});

const isFormValid = computed(
  () =>
    !!formData.inv_sup_kode && formData.detail.some((d) => d.invd_jumlah > 0),
);

const addDetail = () =>
  formData.detail.push({
    kode: "",
    invd_spk_nomor: "",
    nama_barang: "",
    satuan: "",
    satuanHarga: "QTY",
    m2: 0,
    invd_jumlah: 0,
    invd_harga: 0,
    total: 0,
  });

const removeDetail = (index: number) => {
  formData.detail.splice(index, 1);
  if (formData.detail.length === 0) addDetail();
};

const handleSave = async () => {
  if (!isFormValid.value) {
    toast.warning("Data belum lengkap");
    return;
  }

  if (isSaving.value) return;

  try {
    isSaving.value = true;
    const validDetails = formData.detail
      .filter((d) => d.invd_jumlah > 0 && d.nama_barang)
      .map((d) => ({
        ...d,
        invd_spk_nomor: d.invd_spk_nomor || null,
        kode_barang: d.kode || null,
      }));

    const payload = {
      ...formData,
      inv_subtotal: calculatedSubTotal.value,
      inv_is_ppn: formData.isPpn ? "Y" : "N",
      inv_grand_total: calculatedGrandTotal.value,
      detail: validDetails,
    };

    const res = await api.post(API_SAVE, {
      nomorToEdit: isEditMode.value ? formData.inv_nomor : null,
      ...payload,
    });

    toast.success(res.data.message || "Invoice berhasil disimpan");
    router.push({ name: "InvoiceBrowse" });
  } catch (err: any) {
    toast.error(err.response?.data?.message || "Gagal simpan invoice");
  } finally {
    isSaving.value = false;
  }
};

const onMountedFunc = async () => {
  if (isEditMode.value) {
    // Implementasi loadInvoice() di sini
  }
};

onMounted(onMountedFunc);
</script>
