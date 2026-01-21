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
                    {{ formatCurrency(item.invd_jumlah * item.invd_harga) }}
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
import { ref, reactive, computed, onMounted } from "vue";
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
const isSPKModalVisible = ref(false);
const activeDetailIndex = ref(-1);

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
      invd_jumlah: 0,
      invd_harga: 0,
    },
  ],
});

// Judul Form
const formTitle = computed(() =>
  isEditMode.value ? "Ubah Invoice Pembelian" : "Input Invoice Pembelian"
);

// Fungsi hitung (Trigger re-kalkulasi)
const hitung = () => {
  console.log("Menghitung ulang total...");
};

const openSupplierSearch = () => (isSupplierModalVisible.value = true);
const openPenerimaanSearch = () => (isRecModalVisible.value = true);
const openSPKSearch = (index: number) => {
  activeDetailIndex.value = index;
  // isSPKModalVisible.value = true;
};

const handleSupplierSelect = async (s: any) => {
  formData.inv_sup_kode = s.Kode;
  formData.sup_nama = s.Nama;
  formData.inv_sup_alamat = s.Alamat;
  isSupplierModalVisible.value = false;
};

const handlePenerimaanSelect = async (rec: any) => {
  try {
    isSaving.value = true;
    const response = await api.get(
      `/mmt/penerimaan-bahan/detail-invoice/${encodeURIComponent(rec.Nomor)}`
    );
    const payload = response.data.data;

    if (!payload || !payload.details)
      throw new Error("Struktur data tidak sesuai");

    formData.inv_rekening = payload.header.rec_nomor;
    formData.inv_sup_kode = payload.header.rec_sup_kode;
    formData.sup_nama = rec.Supplier || payload.header.sup_nama;
    formData.inv_sup_alamat = rec.Keterangan || payload.header.sup_alamat || "";

    formData.detail = payload.details.map((d: any) => ({
      invd_spk_nomor: payload.header.rec_memo || payload.header.rec_nomor,
      kode: d.Kode,
      nama_barang: d.Nama_Barang,
      satuan: d.Satuan,
      invd_jumlah: Number(d.Qty) || 0,
      invd_harga: Number(d.Harga_Beli) || 0,
    }));

    addDetail();
    formData.isPpn = payload.header.rec_istax === 1;
    formData.ppnRate = payload.header.rec_taxamount || 11;

    toast.success(`Berhasil memuat Penerimaan ${rec.Nomor}`);
    isRecModalVisible.value = false;
  } catch (err: any) {
    toast.error(err.message || "Gagal memuat detail penerimaan");
  } finally {
    isSaving.value = false;
  }
};

const loadInvoice = async () => {
  try {
    const nomor = route.params.nomor as string;
    const res = await api.get(`${API_DETAIL}/${nomor}`);
    const data = res.data;

    Object.assign(formData, {
      inv_nomor: data.inv_nomor,
      inv_tanggal: data.inv_tanggal,
      inv_tanggal_tempo: data.inv_tanggal_tempo,
      inv_sup_kode: data.inv_sup_kode,
      sup_nama: data.sup_nama,
      inv_sup_alamat: data.inv_sup_alamat,
      inv_rekening: data.inv_rekening,
      inv_keterangan: data.inv_keterangan,
      isPpn: data.inv_is_ppn === "Y",
      ppnRate: Number(data.inv_ppn_rate || 11),
      detail: data.Detail.map((d: any) => ({
        invd_spk_nomor: d.invd_spk_nomor,
        nama_barang: d.nama_barang,
        invd_jumlah: Number(d.invd_jumlah),
        invd_harga: Number(d.invd_harga),
      })),
    });
  } catch (err) {
    toast.error("Gagal memuat data invoice");
  }
};

const detailHeaders = [
  { title: "Referensi/PO", key: "invd_spk_nomor", width: "150px" },
  { title: "Deskripsi Barang", key: "nama_barang" },
  { title: "Qty", key: "invd_jumlah", width: "100px", align: "end" as const },
  { title: "Harga", key: "invd_harga", width: "130px", align: "end" as const },
  { title: "Total", key: "total", width: "150px", align: "end" as const },
  { title: "Aksi", key: "actions", width: "50px", sortable: false },
];

const formatCurrency = (val: number) =>
  val.toLocaleString("id-ID", { minimumFractionDigits: 2 });

const calculatedSubTotal = computed(() =>
  formData.detail.reduce(
    (sum, item) => sum + Number(item.invd_jumlah) * Number(item.invd_harga),
    0
  )
);

const calculatedGrandTotal = computed(() => {
  const sub = calculatedSubTotal.value;
  return formData.isPpn ? sub + sub * (formData.ppnRate / 100) : sub;
});

const isFormValid = computed(
  () =>
    !!formData.inv_sup_kode && formData.detail.some((d) => d.invd_jumlah > 0)
);

const addDetail = () =>
  formData.detail.push({
    kode: "",
    invd_spk_nomor: "",
    nama_barang: "",
    satuan: "",
    invd_jumlah: 0,
    invd_harga: 0,
  });

const removeDetail = (index: number) => formData.detail.splice(index, 1);

const closeForm = () => router.push({ name: "InvoiceBrowse" });

const getInvoiceStatusColor = () => (isEditMode.value ? "blue" : "green");

const handleSave = async () => {
  if (!isFormValid.value) {
    toast.warning("Data belum lengkap");
    return;
  }

  // Prevent duplicate clicks
  if (isSaving.value) return;

  try {
    isSaving.value = true;

    const validDetails = formData.detail
      .filter((d) => d.invd_jumlah > 0 && d.nama_barang)
      .map((d) => ({
        invd_spk_nomor: d.invd_spk_nomor || null,
        nama_barang: d.nama_barang,
        invd_jumlah: Number(d.invd_jumlah),
        invd_harga: Number(d.invd_harga),
        kode_barang: d.kode || null,
        satuan: d.satuan || null,
      }));

    if (validDetails.length === 0)
      throw new Error("Detail item tidak boleh kosong");

    const payload = {
      invp_perush_kode: formData.invp_perush_kode || "001",
      inv_nomor: formData.inv_nomor,
      inv_tanggal: formData.inv_tanggal,
      inv_tanggal_tempo: formData.inv_tanggal_tempo,
      inv_sup_kode: formData.inv_sup_kode,
      inv_sup_alamat: formData.inv_sup_alamat,
      inv_rekening: formData.inv_rekening,
      inv_keterangan: formData.inv_keterangan,
      inv_subtotal: calculatedSubTotal.value,
      inv_is_ppn: formData.isPpn ? "Y" : "N",
      inv_ppn_rate: formData.ppnRate,
      inv_grand_total: calculatedGrandTotal.value,
      detail: validDetails,
    };

    const res = await api.post(API_SAVE, {
      // CRITICAL: Ensure this is null when not in edit mode to trigger INSERT
      nomorToEdit: isEditMode.value ? formData.inv_nomor : null,
      ...payload,
    });

    // Handle success

    toast.success(res.data.message || "Invoice berhasil disimpan");

    // KEMBALI KE BROWSE: Menggunakan push ke name route "InvoiceBrowse"
    router.push({ name: "InvoiceBrowse" });
  } catch (err: any) {
    console.error("Save Error:", err);
    toast.error(
      err.response?.data?.message || err.message || "Gagal simpan invoice"
    );
  } finally {
    isSaving.value = false;
  }
};

const handleCancel = () => {
  if (confirm("Batalkan perubahan?")) {
    if (isEditMode.value) loadInvoice();
    else closeForm();
  }
};

const handlePrint = () => {
  const url = router.resolve({
    name: "InvoicePembelianPrint",
    params: { nomor: formData.inv_nomor },
  }).href;
  window.open(url, "_blank");
};

onMounted(() => {
  if (isEditMode.value) loadInvoice();
});
</script>
