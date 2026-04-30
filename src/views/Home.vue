<template>
  <div
    class="min-h-screen bg-[#F1F5F9] p-6 font-sans antialiased text-slate-800"
  >
    <!-- HEADER -->
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
            <span class="text-[10px] font-semibold text-green-700">
              Live System
            </span>
          </div>
          <span class="text-xs text-slate-400">
            Last update: {{ lastUpdate }}
          </span>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="fetchSummary"
          :disabled="isLoading"
          class="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-95 disabled:opacity-50"
        >
          <i :class="['mdi mdi-refresh', { 'animate-spin': isLoading }]"></i>
          Sync Data
        </button>
      </div>
    </header>

    <!-- STAT CARDS -->
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

    <!-- MAIN GRID -->
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
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import Chart from "chart.js/auto";
import { format } from "date-fns";
import api from "@/services/api";

/* ================= STATE ================= */
const lastUpdate = ref(format(new Date(), "HH:mm:ss"));
const isLoading = ref(false);

const ENDPOINT_SUMMARY = "/mmt/laporan-ls-bahan-utama/total-roll";
const ENDPOINT_FLOW = "/mmt/laporan-ls-bahan-utama/flow-6-bulan"; // Endpoint baru

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

// Instance chart disimpan di luar agar bisa di-destroy/update
let flowChartInstance = null;

/* ================= API CALLS ================= */

// 1. Fetch Summary (Stat Cards)
const fetchSummary = async () => {
  isLoading.value = true;
  try {
    const response = await api.get(ENDPOINT_SUMMARY);
    const res = response.data;
    if (res.success && res.data) {
      stats.value[0].value = res.data.total_roll || 0;
      stats.value[1].value = res.data.total_jenis_barang || 0;
      stats.value[2].value = res.data.total_incoming || 0;
      stats.value[3].value = res.data.total_outgoing || 0;
      lastUpdate.value = format(new Date(), "HH:mm:ss");
    }
  } catch (err) {
    console.error("Gagal mengambil summary:", err);
  } finally {
    isLoading.value = false;
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

/* ================= CHARTS LOGIC ================= */

const renderFlowChart = (labels, incomingData, outgoingData) => {
  const flowCtx = document.getElementById("stockFlowChart");
  if (!flowCtx) return;

  // Hancurkan chart lama jika ada (mencegah tumpang tindih saat refresh)
  if (flowChartInstance) {
    flowChartInstance.destroy();
  }

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
  if (compCtx) {
    new Chart(compCtx, {
      type: "doughnut",
      data: {
        datasets: [
          {
            data: [45, 35, 20], // Sementara statis atau ambil dari API lain
            backgroundColor: ["#1e293b", "#22d3ee", "#2563eb"],
            cutout: "80%",
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });
  }
};

/* ================= LIFECYCLE ================= */
onMounted(async () => {
  // Jalankan fetch secara paralel
  await Promise.all([fetchSummary(), fetchFlowData()]);

  initCompositionChart();
});
</script>

<style scoped>
canvas {
  width: 100% !important;
  height: 100% !important;
}
</style>
