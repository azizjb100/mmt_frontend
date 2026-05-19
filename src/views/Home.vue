<template>
  <div
    class="min-h-screen bg-[#F1F5F9] p-6 font-sans antialiased text-slate-800"
  >
    <header
      class="mx-auto mb-8 flex max-w-[1400px] flex-col gap-4 rounded-2xl bg-white px-6 py-4 shadow-sm border border-slate-100 md:flex-row md:items-center md:justify-between"
    >
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-800">
          Inventory Dashboard
        </h1>
        <div class="mt-1 flex items-center gap-3">
          <div
            class="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 border border-green-200"
          >
            <span
              class="h-2 w-2 rounded-full bg-green-500 animate-pulse"
            ></span>
            <span class="text-[10px] font-semibold text-green-700"
              >Live System</span
            >
          </div>
          <span class="text-xs text-slate-400"
            >Last update: {{ lastUpdate }}</span
          >
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="refreshAllData"
          :disabled="isLoading"
          class="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-95 disabled:opacity-50"
        >
          <i :class="['mdi mdi-refresh', { 'animate-spin': isLoading }]"></i>
          Sync Data
        </button>
      </div>
    </header>

    <div
      class="mx-auto mb-8 grid max-w-[1400px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div
        v-for="(stat, index) in stats"
        :key="index"
        class="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 flex flex-col gap-4"
      >
        <div class="flex items-center gap-3">
          <div
            class="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center"
          >
            <i :class="['mdi', stat.icon, 'text-lg text-slate-700']"></i>
          </div>
          <span
            :class="[
              stat.trendColor,
              'ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100',
            ]"
          >
            {{ stat.trend }}
          </span>
        </div>
        <div>
          <p class="text-xs font-medium text-slate-500">{{ stat.label }}</p>
          <div class="flex items-baseline gap-2">
            <p class="text-2xl font-bold text-slate-800">{{ stat.value }}</p>
            <span class="text-xs text-slate-400">{{ stat.unit }}</span>
          </div>
        </div>
        <div class="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
          <div class="h-full bg-blue-500/60" style="width: 40%"></div>
        </div>
      </div>
    </div>

    <div class="mx-auto grid max-w-[1400px] grid-cols-12 gap-6">
      <div class="col-span-12 space-y-6 lg:col-span-8">
        <div class="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
          <h3 class="mb-6 text-sm font-semibold text-slate-700">
            Material Flow (Last 6 Months)
          </h3>
          <div class="h-[280px]">
            <canvas id="stockFlowChart"></canvas>
          </div>
        </div>
      </div>

      <div class="col-span-12 space-y-6 lg:col-span-4">
        <div class="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
          <h3 class="mb-6 text-sm font-semibold text-slate-700">
            Material Composition
          </h3>
          <div class="relative h-[220px]">
            <canvas id="compositionChart"></canvas>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-3xl font-bold text-slate-800">100%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="col-span-12 lg:col-span-6">
        <div
          class="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 h-full flex flex-col"
        >
          <div class="mb-4 flex items-center justify-between">
            <div>
              <h3 class="text-sm font-semibold text-slate-700">
                Top 10 Antrean Cetak (Mepet Deadline)
              </h3>
              <p class="text-xs text-slate-400 mt-0.5">
                Produksi yang harus segera dieksekusi hari ini
              </p>
            </div>
            <span
              class="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full animate-pulse"
            >
              CRITICAL
            </span>
          </div>

          <div class="overflow-x-auto flex-1">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr
                  class="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold"
                >
                  <th class="py-3 px-2 w-8 text-center">No</th>
                  <th class="py-3 px-2">No. SPK / WO</th>
                  <th class="py-3 px-2">Nama Produk / File</th>
                  <th class="py-3 px-2 text-right">Qty Kirim</th>
                  <th class="py-3 px-2 text-center">Sisa Waktu</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50 text-slate-600">
                <tr
                  v-for="(item, index) in topDeadlineCetak"
                  :key="index"
                  class="hover:bg-slate-50/50"
                >
                  <td class="py-3 px-2 text-center font-medium text-slate-400">
                    {{ index + 1 }}
                  </td>
                  <td class="py-3 px-2 font-mono font-medium text-slate-700">
                    {{ item.no_spk }}
                  </td>
                  <td
                    class="py-3 px-2 font-semibold text-slate-800 max-w-[180px] truncate"
                    :title="item.nama_produk"
                  >
                    {{ item.nama_produk }}
                  </td>
                  <td class="py-3 px-2 text-right font-medium text-slate-700">
                    {{ item.qty }} {{ item.unit }}
                  </td>
                  <td class="py-3 px-2 text-center">
                    <span
                      :class="[
                        item.menit_sisa <= 60
                          ? 'bg-red-100 text-red-700 font-bold border border-red-200'
                          : 'bg-amber-100 text-amber-700 font-medium',
                        'px-2 py-0.5 rounded text-[10px]',
                      ]"
                    >
                      {{ item.sisa_waktu }}
                    </span>
                  </td>
                </tr>
                <tr v-if="topDeadlineCetak.length === 0">
                  <td colspan="5" class="text-center py-6 text-slate-400">
                    Aman. Tidak ada antrean mepet.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="col-span-12 lg:col-span-6">
        <div
          class="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 h-full flex flex-col"
        >
          <div class="mb-4 flex items-center justify-between">
            <div>
              <h3 class="text-sm font-semibold text-slate-700">
                Permintaan Bahan Belum Terealisasi
              </h3>
              <p class="text-xs text-slate-400 mt-0.5">
                Bon bahan baku pending yang menahan proses cetak (Klik baris
                untuk melihat total data)
              </p>
            </div>
            <span
              class="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full"
            >
              GUDANG PENDING
            </span>
          </div>

          <div class="overflow-x-auto flex-1">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr
                  class="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold"
                >
                  <th class="py-3 px-2 w-8 text-center">No</th>
                  <th class="py-3 px-2">Bahan / Material</th>
                  <th class="py-3 px-2 text-center">Divisi Peminta</th>
                  <th class="py-3 px-2 text-right">Qty Diminta</th>
                  <th class="py-3 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50 text-slate-600">
                <tr
                  v-for="(item, index) in permintaanBahanPending"
                  :key="index"
                  class="hover:bg-slate-50/50 cursor-pointer transition-colors"
                  @click="openDetailModal"
                >
                  <td class="py-3 px-2 text-center font-medium text-slate-400">
                    {{ index + 1 }}
                  </td>
                  <td class="py-3 px-2 font-semibold text-slate-800">
                    {{ item.nama_bahan }}
                  </td>
                  <td class="py-3 px-2 text-center">
                    <span
                      class="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600"
                    >
                      {{ item.divisi }}
                    </span>
                  </td>
                  <td class="py-3 px-2 text-right font-medium text-blue-600">
                    {{ item.qty_minta }} {{ item.unit }}
                  </td>
                  <td class="py-3 px-2 text-center">
                    <span
                      v-if="item.status_permintaan === 'PENDING'"
                      class="inline-flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full font-medium"
                    >
                      <span
                        class="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"
                      ></span>
                      Pending Finance
                    </span>

                    <span
                      v-else-if="
                        item.status_permintaan === 'PROGRESS' ||
                        item.status_permintaan === 'ONPROSES'
                      "
                      class="inline-flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full font-medium"
                    >
                      Selesai PO
                    </span>

                    <span
                      v-else
                      class="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full font-medium"
                    >
                      {{ item.status_permintaan }}
                    </span>
                  </td>
                </tr>
                <tr v-if="permintaanBahanPending.length === 0">
                  <td colspan="5" class="text-center py-6 text-slate-400">
                    Semua bon permintaan bahan sudah dipenuhi gudang.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      @click.self="closeModal"
    >
      <div
        class="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-slate-100 max-h-[85vh] flex flex-col overflow-hidden"
      >
        <div
          class="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50"
        >
          <div>
            <h3 class="text-base font-bold text-slate-800">
              Daftar Total Permintaan Bahan Belum Terealisasi
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              Menampilkan seluruh total bon penyerahan/pembelian tanpa batasan
              data halaman utama
            </p>
          </div>
          <button
            @click="closeModal"
            class="h-8 w-8 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-slate-600 shadow-sm transition-all active:scale-95"
          >
            <i class="mdi mdi-close text-lg"></i>
          </button>
        </div>

        <div class="p-6 overflow-y-auto flex-1">
          <div class="overflow-x-auto border border-slate-100 rounded-2xl">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr
                  class="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold"
                >
                  <th class="py-3.5 px-4 w-12 text-center">No</th>
                  <th class="py-3.5 px-3">No. Bon / Referensi</th>
                  <th class="py-3.5 px-3">Bahan / Material</th>
                  <th class="py-3.5 px-3 text-center">Divisi Peminta</th>
                  <th class="py-3.5 px-3 text-right">Qty Diminta</th>
                  <th class="py-3.5 px-3 text-center">Tanggal Input</th>
                  <th class="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-600">
                <tr
                  v-for="(item, index) in totalPermintaanBahan"
                  :key="index"
                  class="hover:bg-slate-50/50 transition-colors"
                >
                  <td
                    class="py-3.5 px-4 text-center font-medium text-slate-400"
                  >
                    {{ index + 1 }}
                  </td>
                  <td class="py-3.5 px-3 font-mono font-medium text-slate-700">
                    {{ item.nomor_bon }}
                  </td>
                  <td class="py-3.5 px-3 font-semibold text-slate-800">
                    {{ item.nama_bahan }}
                  </td>
                  <td class="py-3.5 px-3 text-center">
                    <span
                      class="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium"
                      >{{ item.divisi }}</span
                    >
                  </td>
                  <td
                    class="py-3.5 px-3 text-right font-semibold text-blue-600"
                  >
                    {{ item.qty_minta }} {{ item.unit }}
                  </td>
                  <td class="py-3.5 px-3 text-center text-slate-400">
                    {{ formatDate(item.created_at) }}
                  </td>
                  <td class="py-3.5 px-4 text-center">
                    <span
                      class="inline-flex items-center gap-1 text-[10px] text-amber-600 font-medium bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full"
                    >
                      <span
                        class="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"
                      ></span>
                      Pending Finance
                    </span>
                  </td>
                </tr>
                <tr v-if="isLoadingTotal">
                  <td colspan="7" class="text-center py-8 text-slate-400">
                    <i class="mdi mdi-refresh animate-spin mr-2"></i> Memuat
                    seluruh total data...
                  </td>
                </tr>
                <tr v-if="totalPermintaanBahan.length === 0 && !isLoadingTotal">
                  <td colspan="7" class="text-center py-8 text-slate-400">
                    Tidak ada data total pending ditemukan.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div
          class="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs text-slate-400"
        >
          <div>
            Total:
            <span class="font-bold text-slate-700">{{
              totalPermintaanBahan.length
            }}</span>
            item data
          </div>
          <button
            @click="closeModal"
            class="px-4 py-2 border border-slate-200 bg-white rounded-xl text-slate-600 font-semibold shadow-sm hover:bg-slate-50 transition-all active:scale-95"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import Chart from "chart.js/auto";
import { format } from "date-fns";
import api from "@/services/api";

/* ================= ENDPOINT API ================= */
const ENDPOINT_SUMMARY = "/mmt/laporan-ls-bahan-utama/total-roll";
const ENDPOINT_FLOW = "/mmt/laporan-ls-bahan-utama/flow-6-bulan";
const ENDPOINT_DEADLINE = "mmt/dashboard/top-10-deadline";
const ENDPOINT_PENDING_BAHAN = "mmt/dashboard/permintaan-pending";
const ENDPOINT_PENDING_BAHAN_TOTAL = "mmt/dashboard/permintaan-pending-total"; // Gunakan endpoint tanpa LIMIT untuk modal

/* ================= STATE DASHBOARD ================= */
const lastUpdate = ref(format(new Date(), "HH:mm:ss"));
const isLoading = ref(false);
const topDeadlineCetak = ref([]);
const permintaanBahanPending = ref([]);

/* ================= STATE MODAL DETAIL ================= */
const isModalOpen = ref(false);
const isLoadingTotal = ref(false);
const totalPermintaanBahan = ref([]);

const stats = ref([
  {
    label: "Total Stock",
    value: "0",
    unit: "Roll",
    icon: "mdi-archive-outline",
    trend: "+5.2%",
    trendColor: "text-green-600",
  },
  {
    label: "SKU Category",
    value: "0",
    unit: "Item",
    icon: "mdi-tag-outline",
    trend: "Stable",
    trendColor: "text-slate-500",
  },
  {
    label: "Incoming",
    value: "0",
    unit: "Roll",
    icon: "mdi-arrow-down-bold-circle-outline",
    trend: "+12%",
    trendColor: "text-green-600",
  },
  {
    label: "Outgoing",
    value: "0",
    unit: "Roll",
    icon: "mdi-arrow-up-bold-circle-outline",
    trend: "-3.1%",
    trendColor: "text-red-500",
  },
]);

let flowChartInstance = null;
let compositionChartInstance = null;

/* ================= API CALLS FUNCTIONS ================= */

// 1. Fetch Summary (Stat Cards)
const fetchSummary = async () => {
  try {
    const response = await api.get(ENDPOINT_SUMMARY);
    const res = response.data;
    if (res.success && res.data) {
      stats.value[0].value = res.data.total_roll || 0;
      stats.value[1].value = res.data.total_jenis_barang || 0;
      stats.value[2].value = res.data.total_incoming || 0;
      stats.value[3].value = res.data.total_outgoing || 0;
    }
  } catch (err) {
    console.error("Gagal mengambil summary:", err);
  }
};

// 2. Fetch Flow Data & Render Chart
const fetchFlowData = async () => {
  try {
    const response = await api.get(ENDPOINT_FLOW);
    const res = response.data;
    if (res.success && res.data) {
      const labels = res.data.map((item) => item.bulan);
      const dataMasuk = res.data.map((item) => item.masuk);
      const dataKeluar = res.data.map((item) => item.keluar);
      renderFlowChart(labels, dataMasuk, dataKeluar);
    }
  } catch (err) {
    console.error("Gagal mengambil data flow:", err);
  }
};

// 3. Fetch Top 10 Antrean Cetak Mepet Deadline
const fetchDeadlineCetak = async () => {
  try {
    const response = await api.get(ENDPOINT_DEADLINE);
    const res = response.data;
    if (res.success && res.data) {
      topDeadlineCetak.value = res.data;
    } else {
      topDeadlineCetak.value = [];
    }
  } catch (err) {
    console.error("Gagal mengambil data antrean cetak:", err);
    topDeadlineCetak.value = [];
  }
};

// 4. Fetch Permintaan Bahan Pending Halaman Depan (Terlimit 15)
const fetchPermintaanPending = async () => {
  try {
    const response = await api.get(ENDPOINT_PENDING_BAHAN);
    const res = response.data;
    if (res.success && res.data) {
      permintaanBahanPending.value = res.data;
    } else {
      permintaanBahanPending.value = [];
    }
  } catch (err) {
    console.error("Gagal mengambil data permintaan pending:", err);
    permintaanBahanPending.value = [];
  }
};

// 5. Fetch Keseluruhan Data Tanpa Limit khusus untuk Modal Pop-up
const openDetailModal = async () => {
  isModalOpen.value = true;
  isLoadingTotal.value = true;
  try {
    const response = await api.get(ENDPOINT_PENDING_BAHAN_TOTAL);
    const res = response.data;
    if (res.success && res.data) {
      totalPermintaanBahan.value = res.data;
    } else {
      totalPermintaanBahan.value = [];
    }
  } catch (err) {
    console.error("Gagal mengambil total data pending full:", err);
    totalPermintaanBahan.value = [];
  } finally {
    isLoadingTotal.value = false;
  }
};

// Fungsi menutup modal
const closeModal = () => {
  isModalOpen.value = false;
};

// Master Refresh Sync Data
const refreshAllData = async () => {
  isLoading.value = true;
  try {
    await Promise.all([
      fetchSummary(),
      fetchFlowData(),
      fetchDeadlineCetak(),
      fetchPermintaanPending(),
    ]);
    lastUpdate.value = format(new Date(), "HH:mm:ss");
  } catch (err) {
    console.error("Gagal melakukan sinkronisasi data dashboard:", err);
  } finally {
    isLoading.value = false;
  }
};

/* ================= HELPERS FUNCTIONS ================= */
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* ================= CHARTS RENDER LOGIC ================= */
const renderFlowChart = (labels, incomingData, outgoingData) => {
  const flowCtx = document.getElementById("stockFlowChart");
  if (!flowCtx) return;
  if (flowChartInstance) flowChartInstance.destroy();

  flowChartInstance = new Chart(flowCtx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Incoming",
          data: incomingData,
          backgroundColor: "#2563eb",
          borderRadius: 6,
        },
        {
          label: "Outgoing",
          data: outgoingData,
          backgroundColor: "#93c5fd",
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
          align: "end",
          labels: { boxWidth: 10, font: { size: 10 } },
        },
      },
      scales: {
        x: { grid: { display: false } },
        y: { border: { display: false } },
      },
    },
  });
};

const initCompositionChart = () => {
  const compCtx = document.getElementById("compositionChart");
  if (!compCtx) return;
  if (compositionChartInstance) compositionChartInstance.destroy();

  compositionChartInstance = new Chart(compCtx, {
    type: "doughnut",
    data: {
      datasets: [
        {
          data: [45, 35, 20],
          backgroundColor: ["#1e293b", "#22d3ee", "#2563eb"],
          cutout: "80%",
        },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false },
  });
};

/* ================= LIFECYCLE HOOKS ================= */
onMounted(async () => {
  await refreshAllData();
  initCompositionChart();
});
</script>

<style scoped>
canvas {
  width: 100% !important;
  height: 100% !important;
}
</style>
