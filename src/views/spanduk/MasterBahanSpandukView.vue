<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import BaseBrowse from "@/components/BaseBrowse.vue";

const router = useRouter();
const toast = useToast();
const API_BARANG_SPANDUK = "spanduk/master-bahan/";

// --- State Management ---
const masterData = ref<any[]>([]);
const loading = ref(true);
const selected = ref<any[]>([]);
const keyword = ref("");

// Parameter divisi bawaan Delphi: brg_divisi in (1,5). Kita set default 1 (Spanduk/MMT)
const zdivisi = ref<number | null>(1); 

// --- Headers Master Grid (Disesuaikan dari SELECT tbarang_NEW Delphi) ---
const masterHeaders = [
  { title: "Gudang", key: "GUDANG", minWidth: "130px", fixed: true },
  { title: "Divisi", key: "DIVISI", minWidth: "100px" },
  { title: "Kategori", key: "KTGORI", minWidth: "140px" },
  { title: "Kode", key: "KODE", minWidth: "100px" },
  { title: "Nama Barang", key: "NAMA BARANG", minWidth: "250px" },
  { title: "Jenis", key: "JENIS", minWidth: "120px" },
  { title: "Supplier", key: "SUPPLIER", minWidth: "220px" },
  { title: "Konstruksi", key: "KONSTRUKSI", minWidth: "120px" },
  { title: "Panjang", key: "PANJANG", minWidth: "100px", align: "end" },
  { title: "Lebar", key: "LEBAR", minWidth: "100px", align: "end" },
  { title: "Satuan", key: "SATUAN", minWidth: "90px", align: "center" },
  { title: "Status", key: "STATUS", minWidth: "110px", align: "center" },
  { title: "Stok Gudang", key: "STOK", minWidth: "120px", align: "end", fixed: "right" },
];

// --- Fetch Data Master dari Backend Express ---
const fetchData = async () => {
  loading.value = true;
  selected.value = [];
  try {
    const res = await api.get(API_BARANG_SPANDUK, {
      params: { 
        zdivisi: zdivisi.value, 
        q: keyword.value 
      },
    });
    masterData.value = res.data.data || [];
  } catch (error: any) {
    toast.error("Gagal memuat master data barang spanduk.");
  } finally {
    loading.value = false;
  }
};

// --- Redirect Aksi Simpan / Ubah (cxButton2Click & cxButton1Click Delphi) ---
const actionSaveRedirect = (mode: "new" | "edit") => {
  if (mode === "new") {
    router.push({ name: "BarangSpandukNew" });
  } else {
    const selectedRow = selected.value[0];
    if (!selectedRow || !selectedRow.KODE) {
      toast.warning("Silahkan pilih satu baris data terlebih dahulu.");
      return;
    }
    router.push({
      name: "BarangSpandukEdit",
      params: { kode: selectedRow.KODE },
    });
  }
};

// --- Aksi Hapus Data (cxButton4Click di Delphi) ---
const handleActionDelete = async () => {
  const selectedRow = selected.value[0];
  if (!selectedRow || !selectedRow.KODE) {
    toast.warning("Silahkan pilih data yang ingin dihapus.");
    return;
  }

  if (confirm(`Yakin ingin menghapus barang dengan kode: ${selectedRow.KODE}?`)) {
    try {
      await api.delete(`${API_BARANG_SPANDUK}/${selectedRow.KODE}`);
      toast.success("Data barang berhasil dihapus.");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menghapus data.");
    }
  }
};

// --- Event Row Clicks & Styling ---
const handleRowClick = (_event: any, row: any) => {
  const itemData = row.item?.raw || row.item || row;
  if (!itemData || !itemData.KODE) return;

  selected.value = selected.value.some((s: any) => s.KODE === itemData.KODE)
    ? []
    : [itemData];
};

const getRowProps = ({ item }: any) => {
  const itemData = item?.raw || item;
  return {
    class: selected.value.some((s: any) => s.KODE === itemData?.KODE)
      ? "row-selected cursor-pointer"
      : "cursor-pointer",
  };
};

// --- Watcher untuk live filter keyword pencarian ---
watch(keyword, () => {
  fetchData();
});

onMounted(fetchData);
</script>

<template>
  <BaseBrowse
    title="Master Barang Spanduk / MMT"
    icon="mdi-printer-3d"
    :headers="masterHeaders"
    :items="masterData"
    :loading="loading"
    v-model:selected="selected"
    v-model:search="keyword"
    has-delete
    @refresh="fetchData"
    @action:new="actionSaveRedirect('new')"
    @action:edit="actionSaveRedirect('edit')"
    @action:delete="handleActionDelete"
    @row-click="handleRowClick"
    :row-props="getRowProps"
  >
    <!-- Slot Tambahan Filter Divisi di Top Bar jika diperlukan -->
    <template #filters>
      <v-select
        v-model="zdivisi"
        :items="[
          { title: 'Divisi Spanduk (1, 5)', value: 1 },
          { title: 'Divisi Garmen (3, 4)', value: 4 }
        ]"
        item-title="title"
        item-value="value"
        label="Filter Kelompok Divisi"
        density="compact"
        variant="outlined"
        hide-details
        style="max-width: 260px;"
        @update:model-value="fetchData"
      />
    </template>

    <!-- Format Angka Panjang -->
    <template #[`item.PANJANG`]="{ value }">
      {{ Number(value || 0).toLocaleString("id-ID", { minimumFractionDigits: 2 }) }}
    </template>

    <!-- Format Angka Lebar -->
    <template #[`item.LEBAR`]="{ value }">
      {{ Number(value || 0).toLocaleString("id-ID", { minimumFractionDigits: 2 }) }}
    </template>

    <!-- Custom Styling badge status Lebar Kain (FM320, SM200, dll) -->
    <template #[`item.STATUS`]="{ value }">
      <v-chip
        size="small"
        color="indigo"
        variant="flat"
        class="font-weight-bold"
        label
      >
        {{ value }}
      </v-chip>
    </template>

    <!-- Custom Warna Kolom Stok Akhir -->
    <template #[`item.STOK`]="{ value }">
      <div :class="Number(value) <= 0 ? 'text-red font-weight-bold' : 'text-green font-weight-bold'">
        {{ Number(value || 0).toLocaleString("id-ID") }}
      </div>
    </template>
  </BaseBrowse>
</template>

<style scoped>
.row-selected {
  background-color: #d8efff !important;
}
:deep(.row-selected td) {
  background-color: #d8efff !important;
}
</style>