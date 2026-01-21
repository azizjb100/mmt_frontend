<script setup lang="ts">
import { ref, onMounted, nextTick, watch, computed } from "vue";
import { useRoute } from "vue-router";
import api from "@/services/api";

/* ===== INTERFACES ===== */

interface PenerimaanDetail {
  No: number | string;
  Kode: string;
  Nama: string;
  Satuan: string;
  QtyPO: number;
  QtyTerima: number;
  Keterangan: string;
}

interface PenerimaanPrintData {
  Nomor: string;
  Tanggal: string;
  Supplier: string;
  Gudang: string;
  NoPO: string;
  Keterangan: string;
  Details: PenerimaanDetail[];
  Dibuat: string;
  Diketahui: string;
  Disetujui: string;
}

/* ===== STATE ===== */

const route = useRoute();
const printData = ref<PenerimaanPrintData | null>(null);
const isLoading = ref(true);

/* ===== COMPUTED ===== */

const numberedDetails = computed(() => {
  if (!printData.value || !Array.isArray(printData.value.Details)) return [];

  return printData.value.Details.map((item, idx) => ({
    ...item,
    No: idx + 1,
  }));
});

/* ===== METHODS ===== */

const fetchPrintData = async (nomor: string) => {
  isLoading.value = true;
  try {
    const res = await api.get(`/mmt/penerimaan-bahan/print/${nomor}`);
    printData.value = res.data.data || res.data;

    document.title = `Print Penerimaan - ${nomor}`;
  } catch (err) {
    console.error(err);
    alert("Gagal memuat data cetak penerimaan bahan.");
  } finally {
    isLoading.value = false;
  }
};

/* ===== AUTO PRINT ===== */

watch(isLoading, (val) => {
  if (val === false && printData.value) {
    nextTick(() => {
      setTimeout(() => window.print(), 800);
    });
  }
});

/* ===== LIFECYCLE ===== */

onMounted(() => {
  const nomor = route.params.nomor as string;
  if (nomor) fetchPrintData(nomor);
});
</script>
