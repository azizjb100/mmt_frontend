<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useToast } from "vue-toastification";
import { useAuthStore } from "@/stores/authStore";
import { useForm } from "@/composables/useForm";
import api from "@/services/api";
import BaseForm from "@/components/BaseForm.vue";
import GudangLookupModal from "@/modal/GudangLookupView.vue";
import PenerimaanBahanLookupModal from "@/modal/PenerimaanBahanLookupModal.vue";
import {
  IconArrowLeftRight,
  IconSearch,
  IconTrash,
  IconPlus,
  IconCircleCheck,
} from "@tabler/icons-vue";

// --- Interfaces ---
interface DetailItem {
  barcode: string;
  sku: string;
  namaBarang: string;
  qty: number;
  satuan: string;
  panjang: number;
  lebar: number;
  harga: number;
  disc: number;
  expired: string;
  keterangan: string;
}

const router = useRouter();
const route = useRoute();
const toast = useToast();
const authStore = useAuthStore();

// Modals Visibility State
const isGudangModalVisible = ref(false);
const isSupplierModalVisible = ref(false);
const isInvoiceModalVisible = ref(false);
const showPrintConfirm = ref(false);
const savedNomor = ref("");

const formatDateLocal = (value?: string | Date) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val || 0);
};

// 1. Initial State Form
const initialData = {
  nomor: "AUTO",
  tanggal: formatDateLocal(new Date()),
  invoiceNomor: "",
  gudangKode: "WH-16",
  gudangNama: "Gudang Bahan MMT",
  supplierKode: "",
  supplierNama: "",
  memo: "",
  isPajak: true,
  discPrHeader: 0,
  discRpHeader: 0,
  detail: [] as DetailItem[],
};

// 2. Setup useForm Composable
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
  menuId: "129", // ID menu Retur Pembelian
  initialData,
  fetchApi: async () => {
    const res = await api.get(`/mmt/retur-beli/${route.params.nomor}`);
    const responseData = res.data?.data || res.data;
    const h = responseData.header || responseData;
    const d = responseData.details || responseData.Details || [];

    return {
      nomor: h.Nomor || h.nomor || "",
      tanggal: formatDateLocal(h.Tanggal || h.tanggal),
      invoiceNomor: h.InvoiceNomor || h.invoice_nomor || "",
      gudangKode: h.GudangKode || h.gudang_kode || "WH-16",
      gudangNama: h.GudangNama || h.gudang_nama || "Gudang Bahan MMT",
      supplierKode: h.SupplierKode || h.supplier_kode || "",
      supplierNama: h.SupplierNama || h.supplier_nama || "",
      memo: h.Memo || h.memo || "",
      isPajak: h.IsPajak ?? h.is_pajak ?? true,
      discPrHeader: Number(h.DiscPrHeader || h.disc_pr_header) || 0,
      discRpHeader: Number(h.DiscRpHeader || h.disc_rp_header) || 0,
      detail: d.map((item: any) => ({
        barcode: item.barcode || item.Barcode || "",
        sku: item.sku || item.Sku || item.Kode || "",
        namaBarang: item.namaBarang || item.NamaBarang || item.Nama || "",
        qty: Number(item.qty || item.Qty) || 0,
        satuan: item.satuan || item.Satuan || "ROLL",
        panjang: Number(item.panjang || item.Panjang) || 0,
        lebar: Number(item.lebar || item.Lebar) || 0,
        harga: Number(item.harga || item.Harga) || 0,
        disc: Number(item.disc || item.Disc) || 0,
        expired: formatDateLocal(item.expired || item.Expired),
        keterangan: item.keterangan || item.Keterangan || "",
      })),
    };
  },
  submitApi: async (data: typeof initialData): Promise<unknown> => {
    const validDetails = data.detail.filter(
      (d) => (d.sku.trim() !== "" || d.barcode.trim() !== "") && d.qty > 0,
    );
    const payload = {
      Nomor: data.nomor,
      Tanggal: data.tanggal,
      InvoiceNomor: data.invoiceNomor,
      GudangKode: data.gudangKode,
      SupplierKode: data.supplierKode,
      Memo: data.memo,
      IsPajak: data.isPajak,
      DiscPrHeader: Number(data.discPrHeader),
      DiscRpHeader: Number(data.discRpHeader),
      Details: validDetails.map((d) => ({
        sku: d.sku,
        barcode: d.barcode,
        namaBarang: d.namaBarang,
        qty: Number(d.qty),
        satuan: d.satuan,
        panjang: Number(d.panjang || 0),
        lebar: Number(d.lebar || 0),
        harga: Number(d.harga || 0),
        disc: Number(d.disc || 0),
        expired: d.expired || formatDateLocal(new Date()),
        keterangan: d.keterangan,
      })),
    };

    const res = isEditMode.value
      ? await api.put(`/mmt/retur-beli/${data.nomor}`, payload)
      : await api.post("/mmt/retur-beli", payload);

    savedNomor.value = res.data?.data?.nomor || data.nomor;
    showPrintConfirm.value = true;
    return res;
  },
});

const createEmptyDetail = (): DetailItem => ({
  barcode: "",
  sku: "",
  namaBarang: "",
  qty: 0,
  satuan: "",
  panjang: 0,
  lebar: 0,
  harga: 0,
  disc: 0,
  expired: formatDateLocal(new Date()),
  keterangan: "",
});

// Computed Summary Calculator
const calculatedSummary = computed(() => {
  const subtotal = formData.value.detail.reduce(
    (sum, d) => sum + Number(d.qty || 0) * Number(d.harga || 0),
    0,
  );
  const discTotal =
    (Number(formData.value.discPrHeader || 0) / 100) * subtotal +
    Number(formData.value.discRpHeader || 0);
  const netSubtotal = subtotal - discTotal;
  const ppn = formData.value.isPajak ? netSubtotal * 0.11 : 0;
  const total = netSubtotal + ppn;

  return { subtotal, discTotal, netSubtotal, ppn, total };
});

const totalQty = computed(() => {
  return formData.value.detail.reduce((sum, d) => sum + Number(d.qty || 0), 0);
});

// Barcode Scan Handler
const handleBarcodeScan = async (index: number) => {
  const targetItem = formData.value.detail[index];
  if (!targetItem.barcode) return;

  try {
    const response = await api.get(
      `/mmt/retur-beli/scan/${encodeURIComponent(targetItem.barcode)}`,
    );
    const item = response.data?.data || response.data;

    if (!item) {
      toast.error("Barang tidak ditemukan.");
      return;
    }

    targetItem.sku = item.Kode || item.kode || item.sku;
    targetItem.namaBarang = item.Nama || item.nama || item.namaBarang;
    targetItem.satuan = item.Satuan || item.satuan || "ROLL";
    targetItem.harga = item.Harga || item.harga || 0;
    targetItem.qty = 1;
    targetItem.panjang = item.Panjang || item.panjang || 0;
    targetItem.lebar = item.Lebar || item.lebar || 0;
    targetItem.expired = formatDateLocal(
      item.Expired || item.expired || new Date(),
    );

    if (index === formData.value.detail.length - 1) {
      formData.value.detail.push(createEmptyDetail());
    }

    await nextTick();
    const nextInput = document.getElementById(`barcode-${index + 1}`);
    if (nextInput) (nextInput as HTMLInputElement).focus();
  } catch (err) {
    toast.error("Gagal scan barcode atau barang tidak terdaftar.");
  }
};

// Modal Selection Handlers
const handleGudangSelect = (gudang: any) => {
  formData.value.gudangKode = gudang.Kode || gudang.kode;
  formData.value.gudangNama = gudang.Nama || gudang.nama;
  isGudangModalVisible.value = false;
};

const handleSupplierSelect = (supplier: any) => {
  formData.value.supplierKode = supplier.Kode || supplier.kode;
  formData.value.supplierNama = supplier.Nama || supplier.nama;
  isSupplierModalVisible.value = false;
};

const handleInvoiceSelect = (inv: any) => {
  formData.value.invoiceNomor = inv.nomorInvoice || inv.nomor || "";
  formData.value.supplierKode = inv.supplierKode || inv.supplier_kode || "";
  formData.value.supplierNama = inv.supplierNama || inv.supplier_nama || "";
  formData.value.gudangKode = inv.gudangKode || inv.gudang_kode || "WH-16";
  formData.value.gudangNama =
    inv.gudangNama || inv.gudang_nama || "Gudang Bahan MMT";

  if (inv.detail && Array.isArray(inv.detail) && inv.detail.length > 0) {
    formData.value.detail = inv.detail.map((item: any) => ({
      barcode: item.barcode || "",
      sku: item.sku || item.Kode || "",
      namaBarang: item.namaBarang || item.Nama || "",
      qty: Number(item.qty) || 0,
      satuan: item.satuan || "ROLL",
      panjang: Number(item.panjang) || 0,
      lebar: Number(item.lebar) || 0,
      harga: Number(item.harga) || 0,
      disc: Number(item.disc) || 0,
      expired: formatDateLocal(item.expired || new Date()),
      keterangan: item.keterangan || "",
    }));
  }
  isInvoiceModalVisible.value = false;
};

const validateBeforeSave = () => {
  if (!formData.value.supplierKode) {
    return toast.warning("Supplier retur wajib dipilih.");
  }
  if (!formData.value.gudangKode) {
    return toast.warning("Gudang retur wajib dipilih.");
  }
  const hasValidItems = formData.value.detail.some(
    (d) => (d.sku || d.barcode) && d.qty > 0,
  );
  if (!hasValidItems) {
    return toast.warning(
      "Isi detail barang retur dengan benar (SKU/Barcode & Qty > 0).",
    );
  }
  showSaveDialog.value = true;
};

const finishFlow = () => {
  showPrintConfirm.value = false;
  router.push("/mmt/retur-beli");
};

onMounted(async () => {
  if (isEditMode.value) {
    await fetchData();
  } else {
    formData.value.detail = [createEmptyDetail()];
  }
});
</script>

<template>
  <BaseForm
    :title="(isEditMode ? 'Ubah' : 'Baru') + ' Retur Pembelian MMT'"
    menu-id="129"
    :icon="IconArrowLeftRight"
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
    <!-- Column Kiri: Header Form & Total Ringkasan -->
    <template #left-column>
      <div class="desktop-form-section header-section">
        <div class="text-caption font-weight-bold mb-2 text-primary">
          HEADER RETUR PEMBELIAN
        </div>

        <v-text-field
          v-model="formData.nomor"
          label="No. Retur"
          density="compact"
          variant="outlined"
          readonly
          placeholder="Otomatis"
          hide-details
          class="mb-1"
        />

        <v-text-field
          v-model="formData.tanggal"
          type="date"
          label="Tanggal Retur"
          density="compact"
          variant="outlined"
          hide-details
          class="mb-1"
        />

        <v-text-field
          v-model="formData.invoiceNomor"
          label="No. Invoice / Penerimaan"
          placeholder="Pilih Invoice jika ada"
          density="compact"
          variant="outlined"
          hide-details
          readonly
          class="mb-1 text-primary"
          @click="isInvoiceModalVisible = true"
        >
          <template #append-inner>
            <IconSearch
              :size="16"
              style="cursor: pointer"
              @click="isInvoiceModalVisible = true"
            />
          </template>
        </v-text-field>

        <v-text-field
          :model-value="
            formData.supplierKode
              ? `${formData.supplierKode} - ${formData.supplierNama}`
              : ''
          "
          label="Supplier"
          placeholder="Pilih Supplier"
          density="compact"
          variant="outlined"
          hide-details
          readonly
          class="mb-1 text-primary"
          @click="isSupplierModalVisible = true"
        >
          <template #append-inner>
            <IconSearch
              :size="16"
              style="cursor: pointer"
              @click="isSupplierModalVisible = true"
            />
          </template>
        </v-text-field>

        <v-text-field
          :model-value="
            formData.gudangKode
              ? `${formData.gudangKode} - ${formData.gudangNama}`
              : ''
          "
          label="Gudang"
          placeholder="Pilih Gudang"
          density="compact"
          variant="outlined"
          hide-details
          readonly
          class="mb-1 text-primary"
          @click="isGudangModalVisible = true"
        >
          <template #append-inner>
            <IconSearch
              :size="16"
              style="cursor: pointer"
              @click="isGudangModalVisible = true"
            />
          </template>
        </v-text-field>

        <v-textarea
          v-model="formData.memo"
          label="Alasan Retur / Memo"
          density="compact"
          variant="outlined"
          rows="2"
          hide-details
          class="mb-2"
        />

        <v-divider class="my-2" />

        <!-- Ringkasan Nilai Transaksi -->
        <div class="summary-box pa-2 bg-grey-lighten-4 rounded">
          <div class="d-flex justify-space-between text-caption mb-1">
            <span>Subtotal:</span>
            <span class="font-weight-medium">{{
              formatCurrency(calculatedSummary.subtotal)
            }}</span>
          </div>
          <div
            class="d-flex justify-space-between text-caption text-error mb-1"
          >
            <span>Diskon Header:</span>
            <span>- {{ formatCurrency(calculatedSummary.discTotal) }}</span>
          </div>
          <div class="d-flex justify-space-between text-caption mb-1">
            <v-checkbox
              v-model="formData.isPajak"
              label="PPN (11%)"
              density="compact"
              hide-details
              class="ma-0 pa-0"
            />
            <span class="align-self-center">{{
              formatCurrency(calculatedSummary.ppn)
            }}</span>
          </div>
          <v-divider class="my-1" />
          <div
            class="d-flex justify-space-between text-subtitle-2 font-weight-bold text-primary"
          >
            <span>TOTAL RETUR:</span>
            <span>{{ formatCurrency(calculatedSummary.total) }}</span>
          </div>
        </div>
      </div>
    </template>

    <!-- Column Kanan: Tabel Detail Data Manksi Table -->
    <template #right-column>
      <v-card border flat class="d-flex flex-column fill-height">
        <div class="table-container flex-grow-1">
          <table class="manksi-table">
            <thead>
              <tr>
                <th width="35">No</th>
                <th width="140">Barcode / SKU</th>
                <th>Nama Barang</th>
                <th width="65">Satuan</th>
                <th width="75">Panjang</th>
                <th width="75">Lebar</th>
                <th width="75">Qty</th>
                <th width="100">Harga</th>
                <th width="110">Subtotal</th>
                <th>Keterangan</th>
                <th width="35"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in formData.detail" :key="index">
                <td class="text-center">{{ index + 1 }}</td>
                <td class="pa-0">
                  <div class="d-flex align-center fill-height px-1">
                    <input
                      :id="`barcode-${index}`"
                      v-model="item.barcode"
                      class="cell-input fw-bold text-primary flex-grow-1"
                      placeholder="Scan & Enter..."
                      @keyup.enter="handleBarcodeScan(index)"
                    />
                    <v-btn
                      size="x-small"
                      variant="text"
                      density="comfortable"
                      color="primary"
                    >
                      <IconSearch :size="14" :stroke-width="1.7" />
                    </v-btn>
                  </div>
                </td>
                <td>
                  <input
                    v-model="item.namaBarang"
                    class="cell-input"
                    placeholder="Nama Barang..."
                  />
                </td>
                <td class="text-center">
                  <input
                    v-model="item.satuan"
                    class="cell-input text-center"
                    placeholder="Satuan"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    v-model.number="item.panjang"
                    class="cell-input tr"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    v-model.number="item.lebar"
                    class="cell-input tr"
                  />
                </td>
                <td class="bg-yellow-lighten-5">
                  <input
                    type="number"
                    v-model.number="item.qty"
                    class="cell-input tr fw-bold"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    v-model.number="item.harga"
                    class="cell-input tr"
                  />
                </td>
                <td class="text-right px-2 font-mono">
                  {{ formatCurrency((item.qty || 0) * (item.harga || 0)) }}
                </td>
                <td>
                  <input
                    v-model="item.keterangan"
                    class="cell-input"
                    placeholder="Catatan..."
                  />
                </td>
                <td class="text-center">
                  <v-btn
                    size="x-small"
                    variant="text"
                    color="error"
                    @click="formData.detail.splice(index, 1)"
                  >
                    <IconTrash :size="14" :stroke-width="1.7" />
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
            @click="formData.detail.push(createEmptyDetail())"
          >
            <template #prepend>
              <IconPlus :size="14" :stroke-width="2" />
            </template>
            Tambah Baris
          </v-btn>
          <v-spacer />
          <div class="text-caption font-weight-bold">
            Total Qty Retur: {{ totalQty }}
          </div>
        </div>
      </v-card>
    </template>
  </BaseForm>

  <!-- Modals -->
  <GudangLookupModal
    :isVisible="isGudangModalVisible"
    @close="isGudangModalVisible = false"
    @select="handleGudangSelect"
  />

  <PenerimaanBahanLookupModal
    :isVisible="isInvoiceModalVisible"
    @close="isInvoiceModalVisible = false"
    @select="handleInvoiceSelect"
  />

  <!-- Modal Konfirmasi Sukses Simpan -->
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
          Retur Pembelian ({{ savedNomor }}) berhasil disimpan!
        </div>
      </v-card-text>
      <v-card-actions class="bg-grey-lighten-4 pa-3">
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="elevated" @click="finishFlow">
          Selesai
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
.font-mono {
  font-family: monospace;
}
</style>
