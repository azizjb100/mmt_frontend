<template>
  <div class="min-h-screen bg-[#F1F5F9] p-6 font-sans antialiased text-slate-800">

    <!-- HEADER -->
    <header
      class="mx-auto mb-8 flex max-w-[1400px] flex-col gap-4
             rounded-2xl bg-white px-6 py-4 shadow-sm border border-slate-100
             md:flex-row md:items-center md:justify-between"
    >
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-800">
          Inventory Dashboard
        </h1>
        <div class="mt-1 flex items-center gap-3">
          <div class="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 border border-green-200">
            <span class="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
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
        <select
          class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm
                 outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option>All Warehouses</option>
          <option>Main Office</option>
        </select>

        <button
          @click="fetchSummary"
          :disabled="isLoading"
          class="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2
                 text-sm font-semibold text-white shadow-sm
                 hover:bg-blue-700 active:scale-95 disabled:opacity-50"
        >
          <i :class="['mdi mdi-refresh', { 'animate-spin': isLoading }]"></i>
          Sync Data
        </button>
      </div>
    </header>

    <!-- STAT CARDS -->
    <div class="mx-auto mb-8 grid max-w-[1400px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="(stat, index) in stats"
        :key="index"
        class="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 flex flex-col gap-4"
      >
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
            <i :class="['mdi', stat.icon, 'text-lg text-slate-700']"></i>
          </div>

          <span
            :class="[
              stat.trendColor,
              'ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100'
            ]"
          >
            {{ stat.trend }}
          </span>
        </div>

        <div>
          <p class="text-xs font-medium text-slate-500">
            {{ stat.label }}
          </p>
          <div class="flex items-baseline gap-2">
            <p class="text-2xl font-bold text-slate-800">
              {{ stat.value }}
            </p>
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

      <!-- LEFT -->
      <div class="col-span-12 space-y-6 lg:col-span-8">

        <div class="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
          <h3 class="mb-6 text-sm font-semibold text-slate-700">
            Material Flow (Last 6 Months)
          </h3>
          <div class="h-[280px]">
            <canvas id="stockFlowChart"></canvas>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div class="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
            <h3 class="mb-4 text-sm font-medium text-slate-600">
              Weekly Stock Trend
            </h3>
            <div class="h-[180px]">
              <canvas id="stockTrendChart"></canvas>
            </div>
          </div>

          <div class="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
            <h3 class="mb-4 text-sm font-medium text-slate-600">
              Production vs Outgoing
            </h3>
            <div class="h-[180px]">
              <canvas id="productionChart"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT -->
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

          <div class="mt-6 space-y-3">
            <div
              v-for="item in composition"
              :key="item.name"
              class="flex justify-between text-sm"
            >
              <div class="flex items-center gap-2">
                <span
                  class="h-3 w-3 rounded-full"
                  :style="{ backgroundColor: item.hex }"
                ></span>
                <span class="text-slate-600">{{ item.name }}</span>
              </div>
              <span class="font-semibold text-slate-800">
                {{ item.value }}%
              </span>
            </div>
          </div>
        </div>

        <div class="rounded-3xl bg-slate-900 p-6 shadow-lg">
          <h3 class="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Estimated Billing
          </h3>
          <p class="text-2xl font-bold text-white mb-2">
            Rp 44.8M
          </p>
          <div class="flex items-center gap-1 text-xs font-semibold text-green-400 mb-6">
            <i class="mdi mdi-trending-up"></i>
            +2.4% from last month
          </div>

          <button
            class="w-full rounded-xl bg-white py-3 text-xs font-bold uppercase tracking-widest
                   text-slate-900 hover:bg-slate-100 active:scale-95"
          >
            View Invoice Details
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import Chart from 'chart.js/auto'
import { format } from 'date-fns'

const lastUpdate = ref(format(new Date(), 'HH:mm:ss'))
const isLoading = ref(false)

const stats = ref([
  { label: 'Total Stock', value: '0', unit: 'Roll', icon: 'mdi-archive-outline', trend: '+5.2%', trendColor: 'text-green-600' },
  { label: 'SKU Category', value: '0', unit: 'Item', icon: 'mdi-tag-outline', trend: 'Stable', trendColor: 'text-slate-500' },
  { label: 'Incoming', value: '142', unit: 'Roll', icon: 'mdi-arrow-down-bold-circle-outline', trend: '+12%', trendColor: 'text-green-600' },
  { label: 'Outgoing', value: '98', unit: 'Roll', icon: 'mdi-arrow-up-bold-circle-outline', trend: '-3.1%', trendColor: 'text-red-500' }
])

const composition = [
  { name: 'Flexy Frontier', value: 45, hex: '#1e293b' },
  { name: 'Sticker Ritrama', value: 35, hex: '#22d3ee' },
  { name: 'Kain TC/Satin', value: 20, hex: '#2563eb' }
]

const initCharts = () => {
  new Chart(document.getElementById('stockFlowChart'), {
    type: 'bar',
    data: {
      labels: ['Jan','Feb','Mar','Apr','May','Jun'],
      datasets: [
        { data: [45,52,48,70,65,58], backgroundColor: '#2563eb', borderRadius: 6 },
        { data: [30,40,35,50,45,42], backgroundColor: '#93c5fd', borderRadius: 6 }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
  })

  const ctx = document.getElementById('stockTrendChart')
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Mon','Tue','Wed','Thu','Fri','Sat'],
      datasets: [{
        data: [20,35,25,45,60,55],
        borderColor: '#2563eb',
        tension: .4,
        fill: false
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
  })

  new Chart(document.getElementById('compositionChart'), {
    type: 'doughnut',
    data: {
      datasets: [{
        data: composition.map(i => i.value),
        backgroundColor: composition.map(i => i.hex),
        cutout: '80%'
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  })
}

const fetchSummary = async () => {
  isLoading.value = true
  try {
    const res = await axios.get('/api/reports/ls-bahan-baku/total-roll')
    if (res.data?.success) {
      stats.value[0].value = res.data.data.total_roll
      stats.value[1].value = res.data.data.total_jenis_barang
      lastUpdate.value = format(new Date(), 'HH:mm:ss')
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchSummary()
  initCharts()
})
</script>

<style scoped>
canvas {
  width: 100% !important;
  height: 100% !important;
}
</style>
