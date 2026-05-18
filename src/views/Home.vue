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
      <!-- GRAPH FLOW -->
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

      <!-- GRAPH COMPOSITION -->
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

      <!-- ================= KONDISI KRITIS OPERASIONAL ================= -->

      <!-- KIRI: TOP 10 MEPEET DEADLINE -->
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

      <!-- KANAN: PERMINTAAN BAHAN BELUM TEREALISASI -->
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
                Bon bahan baku pending yang menahan proses cetak
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
                  class="hover:bg-slate-50/50"
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
                      >{{ item.divisi }}</span
                    >
                  </td>
                  <td class="py-3 px-2 text-right font-medium text-blue-600">
                    {{ item.qty_minta }} {{ item.unit }}
                  </td>
                  <td class="py-3 px-2 text-center">
                    <span
                      class="inline-flex items-center gap-1 text-[10px] text-amber-600 font-medium"
                    >
                      <span
                        class="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping"
                      ></span>
                      Belum Keluar
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
const ENDPOINT_FLOW = "/mmt/laporan-ls-bahan-utama/flow-6-bulan";
const ENDPOINT_DEADLINE = "/mmt/laporan-ls-bahan-utama/top-10-deadline"; // Endpoint baru cetak mepet
const ENDPOINT_PENDING_BAHAN = "/mmt/laporan-ls-bahan-utama/permintaan-pending"; // Endpoint baru bon tertunda

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

const topDeadlineCetak = ref([]);
const permintaanBahanPending = ref([]);

let flowChartInstance = null;
let compositionChartInstance = null;

/* ================= API CALLS ================= */

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

// Fetch 1: Antrean Cetak Mepet Deadline
const fetchDeadlineCetak = async () => {
  try {
    const response = await api.get(ENDPOINT_DEADLINE);
    const res = response.data;
    if (res.success && res.data && res.data.length > 0) {
      topDeadlineCetak.value = res.data;
    } else {
      // Mock Data jika API belum siap
      topDeadlineCetak.value = [
        {
          no_spk: "SPK-2026-0089",
          nama_produk: "Baliho Pemda Ramadan 4x6m",
          qty: 2,
          unit: "Pcs",
          sisa_waktu: "15 Menit",
          menit_sisa: 15,
        },
        {
          no_spk: "SPK-2026-0091",
          nama_produk: "X-Banner Event Astra Motor",
          qty: 25,
          unit: "Pcs",
          sisa_waktu: "45 Menit",
          menit_sisa: 45,
        },
        {
          no_spk: "SPK-2026-0092",
          nama_produk: "Sticker Branding Mobil Box J&T",
          qty: 1,
          unit: "Set",
          sisa_waktu: "1.5 Jam",
          menit_sisa: 90,
        },
        {
          no_spk: "SPK-2026-0095",
          nama_produk: "Neon Box Toko Kelontong Jaya",
          qty: 2,
          unit: "Pcs",
          sisa_waktu: "3 Jam",
          menit_sisa: 180,
        },
        {
          no_spk: "SPK-2026-0100",
          nama_produk: "Backdrop Panggung Hotel Santika",
          qty: 1,
          unit: "Pcs",
          sisa_waktu: "5 Jam",
          menit_sisa: 300,
        },
      ];
    }
  } catch (err) {
    console.error(err);
  }
};

// Fetch 2: Permintaan Bahan Belum Direalisasikan Gudang
const fetchPermintaanPending = async () => {
  try {
    const response = await api.get(ENDPOINT_PENDING_BAHAN);
    const res = response.data;
    if (res.success && res.data && res.data.length > 0) {
      permintaanBahanPending.value = res.data;
    } else {
      // Mock Data jika API belum siap
      permintaanBahanPending.value = [
        {
          nama_bahan: "Flexi Frontlit 280g (Lebar 3.2m)",
          divisi: "Outdoor",
          qty_minta: 2,
          unit: "Roll",
        },
        {
          nama_bahan: "Sticker Ritrama Glossy (Lebar 1.2m)",
          divisi: "Indoor/Eco",
          qty_minta: 1,
          unit: "Roll",
        },
        {
          nama_bahan: "Tinta High-Solvent Cyan 5L",
          divisi: "Outdoor",
          qty_minta: 4,
          unit: "Botol",
        },
        {
          nama_bahan: "Mata Ayam / Eyelet Kuningan",
          divisi: "Finishing",
          qty_minta: 2,
          unit: "Box",
        },
        {
          nama_bahan: "Impraboard Black 3mm",
          divisi: "Display",
          qty_minta: 15,
          unit: "Lembar",
        },
      ];
    }
  } catch (err) {
    console.error(err);
  }
};

// Master Refresh
const refreshAllData = async () => {
  isLoading.value = true;
  await Promise.all([
    fetchSummary(),
    fetchFlowData(),
    fetchDeadlineCetak(),
    fetchPermintaanPending(),
  ]);
  lastUpdate.value = format(new Date(), "HH:mm:ss");
  isLoading.value = false;
};

/* ================= CHARTS LOGIC ================= */
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
