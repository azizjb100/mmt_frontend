<template>
  <div class="min-h-screen bg-[#F0F4F8] p-4 md:p-8 font-sans antialiased text-slate-900">
    
    <header class="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-3xl font-black tracking-tight text-transparent">
          Inventory Dashboard
        </h1>
        <div class="mt-2 flex items-center gap-3">
          <div class="flex items-center gap-2 rounded-full border border-slate-100 bg-white px-3 py-1 shadow-sm">
            <span class="relative flex h-2 w-2">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span class="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </span>
            <p class="text-[10px] font-bold uppercase tracking-widest text-slate-500 italic">Live System</p>
          </div>
          <p class="text-xs font-medium text-slate-400">Sync: {{ lastUpdate }}</p>
        </div>
      </div>
      
      <div class="flex items-center gap-4">
        <select class="cursor-pointer rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold outline-none transition-all hover:border-blue-300 focus:ring-4 focus:ring-blue-100">
          <option>All Warehouses</option>
          <option>Main Office</option>
        </select>
        <button @click="fetchSummary" :disabled="isLoading" 
          class="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50">
          <i :class="['mdi mdi-refresh text-lg', { 'animate-spin': isLoading }]"></i>
          <span>Sync Data</span>
        </button>
      </div>
    </header>

    <div class="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <div v-for="(stat, index) in stats" :key="index" 
        class="relative overflow-hidden rounded-[2rem] border border-white bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl">
        <div class="relative z-10 flex flex-col">
          <div class="mb-6 flex items-start justify-between">
            <div :class="[stat.iconBg, 'rounded-2xl p-3 text-white shadow-lg']">
              <i :class="['mdi', stat.icon, 'text-2xl']"></i>
            </div>
            <div :class="[stat.trendColor, 'rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase']">
              {{ stat.trend }}
            </div>
          </div>
          <p class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{{ stat.label }}</p>
          <div class="mt-1 flex items-baseline gap-2">
            <h2 class="text-3xl font-black tracking-tight text-slate-800">{{ stat.value }}</h2>
            <span class="text-xs font-bold text-slate-400">{{ stat.unit }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-12 gap-8">
      
      <div class="col-span-12 space-y-8 lg:col-span-8">
        <div class="rounded-[2.5rem] border border-white bg-white p-8 shadow-sm">
          <h3 class="mb-8 text-sm font-black uppercase tracking-[0.15em] text-slate-700 text-left">Material Flow (Last 6 Months)</h3>
          <div class="h-[320px] w-full">
            <canvas id="stockFlowChart"></canvas>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-8 md:grid-cols-2 text-left">
          <div class="rounded-[2rem] bg-white p-8 shadow-sm">
            <h3 class="mb-6 text-xs font-black uppercase tracking-widest text-slate-500">Weekly Stock Trend</h3>
            <div class="h-[180px] w-full">
              <canvas id="stockTrendChart"></canvas>
            </div>
          </div>
          <div class="rounded-[2rem] bg-white p-8 shadow-sm">
            <h3 class="mb-6 text-xs font-black uppercase tracking-widest text-slate-500">Production vs Out</h3>
            <div class="h-[180px] w-full">
              <canvas id="productionChart"></canvas>
            </div>
          </div>
        </div>
      </div>

      <div class="col-span-12 space-y-8 lg:col-span-4">
        <div class="flex flex-col items-center rounded-[2.5rem] bg-white p-8 shadow-sm">
          <h3 class="mb-8 w-full text-left text-xs font-black uppercase tracking-widest text-slate-500">Composition</h3>
          <div class="relative h-[240px] w-full">
            <canvas id="compositionChart"></canvas>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-4xl font-black tracking-tighter text-slate-800">100%</span>
              <span class="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Inventory</span>
            </div>
          </div>
          <div class="mt-10 w-full space-y-3">
            <div v-for="item in composition" :key="item.name" class="flex justify-between rounded-xl p-2 hover:bg-slate-50">
              <div class="flex items-center gap-3">
                <span :style="{ backgroundColor: item.hex }" class="h-3 w-3 rounded-full"></span>
                <span class="text-xs font-bold text-slate-600">{{ item.name }}</span>
              </div>
              <span class="text-xs font-black text-slate-800">{{ item.value }}%</span>
            </div>
          </div>
        </div>

        <div class="rounded-[2.5rem] bg-slate-900 p-8 text-left shadow-2xl">
          <h3 class="mb-6 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Total Valuation</h3>
          <p class="mb-2 text-3xl font-black leading-none text-white tracking-tighter">Rp 44.850.000.000</p>
          <div class="flex w-fit items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[10px] font-black text-emerald-400 italic">
            <i class="mdi mdi-trending-up"></i>
            <span>+2.4% vs Last Month</span>
          </div>
          <button class="mt-10 w-full rounded-2xl bg-white py-4 text-xs font-black uppercase tracking-widest text-slate-900 transition-all hover:bg-blue-50 active:scale-95">
            View Invoice Details
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import Chart from 'chart.js/auto';
import { format } from 'date-fns';

const lastUpdate = ref(format(new Date(), 'HH:mm:ss'));
const isLoading = ref(false);

const stats = ref([
  { label: 'Total Stok', value: '0', unit: 'Roll', icon: 'mdi-archive-outline', iconBg: 'bg-blue-600', trend: '▲ 5.2%', trendColor: 'text-green-500' },
  { label: 'Kategori SKU', value: '0', unit: 'Item', icon: 'mdi-tag-outline', iconBg: 'bg-slate-700', trend: 'STABIL', trendColor: 'text-slate-400' },
  { label: 'Barang Masuk', value: '142', unit: 'Roll', icon: 'mdi-arrow-down-bold-circle-outline', iconBg: 'bg-emerald-500', trend: '▲ 12%', trendColor: 'text-green-500' },
  { label: 'Barang Keluar', value: '98', unit: 'Roll', icon: 'mdi-arrow-up-bold-circle-outline', iconBg: 'bg-rose-500', trend: '▼ 3.1%', trendColor: 'text-rose-500' },
]);

const composition = [
  { name: 'Flexy Frontier', value: 45, hex: '#1e293b' },
  { name: 'Sticker Ritrama', value: 35, hex: '#22d3ee' },
  { name: 'Kain TC/Satin', value: 20, hex: '#2563eb' },
];

const initCharts = () => {
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } },
      y: { border: { display: false }, grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', font: { size: 10 } } }
    }
  };

  // 1. Flow Chart
  new Chart(document.getElementById('stockFlowChart'), {
    type: 'bar',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        { data: [45, 52, 48, 70, 65, 58], backgroundColor: '#2563eb', borderRadius: 8, barThickness: 15 },
        { data: [30, 40, 35, 50, 45, 42], backgroundColor: '#a5f3fc', borderRadius: 8, barThickness: 15 }
      ]
    },
    options: commonOptions
  });

  // 2. Trend Chart
  const ctx = document.getElementById('stockTrendChart').getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 150);
  gradient.addColorStop(0, 'rgba(37, 99, 235, 0.2)');
  gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['S', 'M', 'T', 'W', 'T', 'F'],
      datasets: [{
        data: [20, 35, 25, 45, 60, 55],
        borderColor: '#2563eb',
        borderWidth: 3,
        fill: true,
        backgroundColor: gradient,
        tension: 0.4,
        pointRadius: 0
      }]
    },
    options: commonOptions
  });

  // 3. Composition
  new Chart(document.getElementById('compositionChart'), {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [45, 35, 20],
        backgroundColor: ['#1e293b', '#22d3ee', '#2563eb'],
        cutout: '85%',
        borderWidth: 0
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
};

const fetchSummary = async () => {
  isLoading.value = true;
  try {
    const res = await axios.get('/api/reports/ls-bahan-baku/total-roll');
    if (res.data.success) {
      stats.value[0].value = res.data.data.total_roll;
      stats.value[1].value = res.data.data.total_jenis_barang;
      lastUpdate.value = format(new Date(), 'HH:mm:ss');
    }
  } catch (e) {
    console.error(e);
  } finally {
    setTimeout(() => isLoading.value = false, 500);
  }
};

onMounted(() => {
  fetchSummary();
  initCharts();
});
</script>