<template>
  <div
    class="min-h-screen bg-[#EBF5FF] p-6 font-sans antialiased text-slate-800"
  >
    <!-- HEADER -->
    <header
      class="mx-auto mb-8 flex max-w-[1400px] flex-col gap-4 rounded-2xl bg-white px-6 py-4 shadow-sm border border-sky-100 md:flex-row md:items-center md:justify-between"
    >
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-sky-900">
          Inventory & Production Waste Dashboard
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
          <span class="text-xs text-sky-400"
            >Last update: {{ lastUpdate }}</span
          >
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="refreshAllData"
          :disabled="isLoading"
          class="flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-600 active:scale-95 disabled:opacity-50 transition-all"
        >
          <i :class="['mdi mdi-refresh', { 'animate-spin': isLoading }]"></i>
          Sync Data
        </button>
      </div>
    </header>

    <!-- METRIC CARDS -->
    <div
      class="mx-auto mb-8 grid max-w-[1400px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
    >
      <!-- Total Stok -->
      <div
        class="rounded-3xl bg-white p-6 shadow-sm border border-sky-100 flex flex-col gap-3"
      >
        <div class="flex items-center justify-between">
          <div
            class="h-10 w-10 rounded-full bg-sky-50 flex items-center justify-center"
          >
            <i class="mdi mdi-archive-outline text-lg text-sky-600"></i>
          </div>
          <span
            class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500"
          >
            Current
          </span>
        </div>
        <div>
          <p class="text-xs font-medium text-slate-500">Total Stock Utama</p>
          <div class="flex items-baseline gap-2">
            <p class="text-2xl font-bold text-slate-800">
              {{ stats.totalStock }}
            </p>
            <span class="text-xs text-slate-400">Roll</span>
          </div>
        </div>
        <div class="h-1 w-full rounded-full bg-sky-100 overflow-hidden">
          <div class="h-full bg-sky-400" style="width: 40%"></div>
        </div>
      </div>

      <!-- Insiden BS / Afal -->
      <div
        class="rounded-3xl bg-white p-6 shadow-sm border border-amber-100 flex flex-col gap-3"
      >
        <div class="flex items-center justify-between">
          <div
            class="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center"
          >
            <i
              class="mdi mdi-alert-octagon-outline text-lg text-amber-600"
            ></i>
          </div>
          <span
            class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100"
          >
            Bulan Ini
          </span>
        </div>
        <div>
          <p class="text-xs font-medium text-slate-500">Insiden BS / Afal</p>
          <div class="flex items-baseline gap-2">
            <p class="text-2xl font-bold text-slate-800">
              {{ stats.totalKasusBs }}
            </p>
            <span class="text-xs text-slate-400">Kejadian</span>
          </div>
        </div>
        <div class="h-1 w-full rounded-full bg-amber-100 overflow-hidden">
          <div class="h-full bg-amber-400" style="width: 60%"></div>
        </div>
      </div>

      <!-- Panjang Sisa BS -->
      <div
        class="rounded-3xl bg-white p-6 shadow-sm border border-blue-100 flex flex-col gap-3"
      >
        <div class="flex items-center justify-between">
          <div
            class="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center"
          >
            <i class="mdi mdi-ruler text-lg text-blue-600"></i>
          </div>
          <span
            class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100"
          >
            Akumulasi
          </span>
        </div>
        <div>
          <p class="text-xs font-medium text-slate-500">Panjang Sisa BS</p>
          <div class="flex items-baseline gap-2">
            <p class="text-2xl font-bold text-slate-800">
              {{ formatNumber(stats.totalPanjangBs, 2) }}
            </p>
            <span class="text-xs text-slate-400">Meter</span>
          </div>
        </div>
        <div class="h-1 w-full rounded-full bg-blue-100 overflow-hidden">
          <div class="h-full bg-blue-400" style="width: 50%"></div>
        </div>
      </div>

      <!-- Total Luas Afal M2 -->
      <div
        class="rounded-3xl bg-white p-6 shadow-sm border border-red-100 bg-gradient-to-br from-white to-red-50/30 flex flex-col gap-3"
      >
        <div class="flex items-center justify-between">
          <div
            class="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center"
          >
            <i class="mdi mdi-texture-box text-lg text-red-600"></i>
          </div>
          <span
            :class="[
              bsGrowth >= 0
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700',
              'text-[10px] font-bold px-2 py-0.5 rounded-full',
            ]"
          >
            {{ bsGrowth >= 0 ? '+' : '' }}{{ bsGrowth }}% vs Bln Lalu
          </span>
        </div>
        <div>
          <p class="text-xs font-medium text-slate-500">
            Total Luas Afal (Waste)
          </p>
          <div class="flex items-baseline gap-2">
            <p class="text-2xl font-bold text-red-600">
              {{ formatNumber(stats.totalLuasBsM2, 2) }}
            </p>
            <span class="text-xs text-slate-400">M²</span>
          </div>
        </div>
        <div class="h-1 w-full rounded-full bg-red-100 overflow-hidden">
          <div class="h-full bg-red-500" style="width: 75%"></div>
        </div>
      </div>
    </div>

    <!-- GRAFIK UTAMA: MATERIAL FLOW & GRAFIK TREN BS PERBULAN -->
    <div class="mx-auto grid max-w-[1400px] grid-cols-12 gap-6 mb-6">
      <!-- Left Flow Chart (Material Flow) -->
      <div class="col-span-12 space-y-6 lg:col-span-7">
        <div class="rounded-3xl bg-white p-6 shadow-sm border border-sky-100">
          <h3 class="mb-6 text-sm font-semibold text-sky-800">
            Material Flow (Last 6 Months)
          </h3>
          <div class="h-[280px]">
            <canvas id="stockFlowChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Right Chart: GRAFIK REKAPITULASI BS / AFAL PER BULAN -->
      <div class="col-span-12 space-y-6 lg:col-span-5">
        <div
          class="rounded-3xl bg-white p-6 shadow-sm border border-red-100/60 h-full flex flex-col justify-between"
        >
          <div class="flex items-center justify-between mb-2">
            <div>
              <h3
                class="text-sm font-semibold text-slate-800 flex items-center gap-2"
              >
                <i class="mdi mdi-chart-bar text-red-500 text-base"></i>
                Rekap Afal & BS Produksi (M²)
              </h3>
              <p class="text-xs text-slate-400 mt-0.5">
                Total Luas BS terbuang per bulan
              </p>
            </div>
            <span
              class="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full"
            >
              WASTE METRICS
            </span>
          </div>

          <div class="relative h-[220px] mt-2">
            <canvas id="bsMonthlyChart"></canvas>
          </div>

          <div
            class="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500"
          >
            <span
              >Rata-rata BS:
              <strong class="text-slate-800"
                >{{ formatNumber(avgMonthlyBs, 2) }} M²</strong
              >/bln</span
            >
            <span class="text-slate-400">Target Minimasi: &lt; 50 M²</span>
          </div>
        </div>
      </div>
    </div>

    <!-- SECTION 1: TOP DEADLINE & PERMINTAAN BAHAN PENDING -->
    <div class="mx-auto grid max-w-[1400px] grid-cols-12 gap-6">
      <div class="col-span-12 lg:col-span-6">
        <div
          class="rounded-3xl bg-white p-6 shadow-sm border border-sky-100 h-full flex flex-col"
        >
          <div class="mb-4 flex items-center justify-between">
            <div>
              <h3 class="text-sm font-semibold text-sky-800">
                Top 10 SPK Cetak (Deadline)
              </h3>
              <p class="text-xs text-sky-400 mt-0.5">
                SPK aktif yang perlu segera di produksi
              </p>
            </div>
            <span
              class="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full animate-pulse"
            >
              CRITICAL
            </span>
          </div>

          <div
            class="overflow-x-auto flex-1 border border-sky-50 rounded-2xl bg-white"
          >
            <table
              class="w-full text-left border-collapse modern-blue-table table-layout-fixed"
            >
              <thead>
                <tr class="thead-tr">
                  <th class="py-3 px-2 w-[45px] text-center">No</th>
                  <th class="py-3 px-2 w-[115px]">No. SPK / WO</th>
                  <th class="py-3 px-2 w-[220px]">Nama Produk / File</th>
                  <th class="py-3 px-2 text-right w-[95px]">Sisa Cetak</th>
                  <th class="py-3 px-2 text-center w-[105px]">Sisa Waktu</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-sky-50/50">
                <tr
                  v-for="(item, index) in topDeadlineCetak"
                  :key="index"
                  class="tbody-tr transition-colors duration-150"
                  @click="openDetailModal('deadline')"
                >
                  <td class="py-2.5 px-2 text-center text-slate-950">
                    {{ index + 1 }}
                  </td>
                  <td class="py-2.5 px-2 text-slate-950">{{ item.no_spk }}</td>
                  <td
                    class="py-2.5 px-2 text-slate-800 cell-ellipsis"
                    :title="item.nama_produk"
                  >
                    {{ item.nama_produk }}
                  </td>
                  <td class="py-2.5 px-2 text-right text-slate-950">
                    {{ item.qty }} {{ item.unit }}
                  </td>
                  <td class="py-2.5 px-2 text-center whitespace-nowrap">
                    <span
                      :class="[
                        item.menit_sisa <= 60
                          ? 'bg-red-50 text-red-600 border border-red-100'
                          : 'bg-amber-50 text-amber-600 border border-amber-100',
                        'inline-block px-2 py-0.5 rounded min-w-[75px] text-center',
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
          class="rounded-3xl bg-white p-6 shadow-sm border border-sky-100 h-full flex flex-col"
        >
          <div class="mb-4 flex items-center justify-between">
            <div>
              <h3 class="text-sm font-semibold text-sky-800">
                Permintaan Bahan Belum Terealisasi
              </h3>
              <p class="text-xs text-sky-400 mt-0.5">
                Bon pending penahan proses cetak (Klik baris untuk detail)
              </p>
            </div>
            <span
              class="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full"
            >
              GUDANG PENDING
            </span>
          </div>

          <div class="overflow-x-auto flex-1 border border-sky-50 rounded-2xl">
            <table
              class="w-full text-left border-collapse modern-blue-table table-layout-fixed"
            >
              <thead>
                <tr class="thead-tr">
                  <th class="py-3 px-2 w-[45px] text-center">No</th>
                  <th class="py-3 px-2 w-[200px]">Bahan / Material</th>
                  <th class="py-3 px-2 text-center w-[90px]">Divisi</th>
                  <th class="py-3 px-2 text-right w-[110px]">Qty Diminta</th>
                  <th class="py-3 px-2 text-center w-[115px]">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-sky-50/50">
                <tr
                  v-for="(item, index) in permintaanBahanPending"
                  :key="index"
                  class="tbody-tr transition-colors duration-150"
                  @click="openDetailModal('bahan')"
                >
                  <td
                    class="py-2.5 px-2 text-center text-slate-950 font-semibold"
                  >
                    {{ index + 1 }}
                  </td>
                  <td class="py-2.5 px-2 text-slate-800 cell-ellipsis">
                    {{ item.nama_bahan }}
                  </td>
                  <td class="py-2.5 px-2 text-center">
                    <span
                      class="bg-sky-50 px-1.5 py-0.5 rounded text-sky-700 font-semibold"
                      >{{ item.divisi }}</span
                    >
                  </td>
                  <td
                    class="py-2.5 px-2 text-right text-slate-950 font-semibold"
                  >
                    {{ item.qty_minta }} {{ item.unit }}
                  </td>
                  <td class="py-2.5 px-2 text-center">
                    <span
                      v-if="item.status_permintaan === 'PENDING'"
                      class="inline-flex items-center gap-1 text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full font-semibold"
                    >
                      <span
                        class="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"
                      ></span>
                      Pending Finance
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center gap-1 text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full font-semibold"
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

    <!-- SECTION 2: TOP PLANNING BELUM LHK -->
    <div class="mx-auto grid max-w-[1400px] grid-cols-12 gap-6 mt-6">
      <div class="col-span-12">
        <div
          class="rounded-3xl bg-white p-6 shadow-sm border border-sky-100 flex flex-col"
        >
          <div class="mb-4 flex items-center justify-between">
            <div>
              <h3 class="text-sm font-semibold text-sky-800">
                Top 5 SPK Terencana Belum LHK (Realisasi Produksi)
              </h3>
              <p class="text-xs text-sky-400 mt-0.5">
                SPK ter-planning yang belum dibuat LHK oleh operator mesin (Klik
                baris untuk detail total)
              </p>
            </div>
            <span
              class="text-[10px] font-bold text-sky-600 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-full"
            >
              PLANNING IDLE
            </span>
          </div>

          <div
            class="overflow-x-auto flex-1 border border-sky-50 rounded-2xl bg-white"
          >
            <table
              class="w-full text-left border-collapse modern-blue-table table-layout-fixed"
            >
              <thead>
                <tr class="thead-tr">
                  <th class="py-3 px-2 w-[45px] text-center">No</th>
                  <th class="py-3 px-2 w-[120px]">No. SPK</th>
                  <th class="py-3 px-2 w-[100px] text-center">Mesin</th>
                  <th class="py-3 px-2 w-[220px]">Nama SPK / File</th>
                  <th class="py-3 px-2 w-[150px]">Bahan</th>
                  <th class="py-3 px-2 text-right w-[100px]">Plan Qty</th>
                  <th class="py-3 px-2 text-right w-[100px]">Plan (M2)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-sky-50/50">
                <tr
                  v-for="(item, index) in topPlanningBelumLhk"
                  :key="index"
                  class="tbody-tr transition-colors duration-150"
                  @click="openDetailModal('planning_idle')"
                >
                  <td class="py-2.5 px-2 text-center text-slate-950">
                    {{ index + 1 }}
                  </td>
                  <td class="py-2.5 px-2 text-slate-950 font-semibold">
                    {{ item.NomorSPK }}
                  </td>
                  <td class="py-2.5 px-2 text-center">
                    <span
                      class="bg-blue-50 px-1.5 py-0.5 rounded text-blue-700 font-bold"
                      >{{ item.Mesin }}</span
                    >
                  </td>
                  <td
                    class="py-2.5 px-2 text-slate-800 cell-ellipsis"
                    :title="item.NamaSPK"
                  >
                    {{ item.NamaSPK }}
                  </td>
                  <td
                    class="py-2.5 px-2 text-slate-600 cell-ellipsis"
                    :title="item.Bahan"
                  >
                    {{ item.Bahan }}
                  </td>
                  <td
                    class="py-2.5 px-2 text-right text-slate-950 font-semibold"
                  >
                    {{ item.Plan_Qty }}
                  </td>
                  <td
                    class="py-2.5 px-2 text-right text-sky-700 font-mono font-semibold"
                  >
                    {{ item.Plan_M2 }} m²
                  </td>
                </tr>
                <tr v-if="topPlanningBelumLhk.length === 0">
                  <td colspan="7" class="text-center py-6 text-slate-400">
                    Semua planning aktif sudah dikerjakan operator (LHK Klop).
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL DETAIL DYNAMIK -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      @click.self="closeModal"
    >
      <div
        class="w-full max-w-5xl bg-white rounded-3xl shadow-xl border border-sky-100 max-h-[85vh] flex flex-col overflow-hidden"
      >
        <div
          class="px-6 py-5 border-b border-sky-100 flex items-center justify-between bg-sky-50/50"
        >
          <div v-if="modalType === 'deadline'">
            <h3 class="text-base font-bold text-sky-900">
              Seluruh Antrean Cetak Berdasarkan Deadline
            </h3>
            <p class="text-xs text-sky-400 mt-0.5">
              Menampilkan semua data SPK aktif yang masih memiliki sisa cetak
              produksi
            </p>
          </div>
          <div v-else-if="modalType === 'bahan'">
            <h3 class="text-base font-bold text-sky-900">
              Daftar Total Permintaan Bahan Belum Terealisasi
            </h3>
            <p class="text-xs text-sky-400 mt-0.5">
              Menampilkan seluruh total bon penyerahan/pembelian tanpa batasan
              data halaman utama
            </p>
          </div>
          <div v-else-if="modalType === 'planning_idle'">
            <h3 class="text-base font-bold text-sky-900">
              Daftar Lengkap SPK Terencana Belum Terealisasi (Belum LHK)
            </h3>
            <p class="text-xs text-sky-400 mt-0.5">
              Menampilkan seluruh order planning mmt aktif yang belum tercatat
              di data LHK Operator
            </p>
          </div>
          <button
            @click="closeModal"
            class="h-8 w-8 rounded-full flex items-center justify-center bg-white border border-sky-200 text-sky-500 hover:text-sky-700 shadow-sm transition-all active:scale-95"
          >
            <i class="mdi mdi-close text-lg"></i>
          </button>
        </div>

        <div class="p-6 overflow-y-auto flex-1">
          <div v-if="isLoadingTotal" class="text-center py-12 text-sky-400">
            <i class="mdi mdi-refresh animate-spin text-2xl mr-2"></i>
            <span class="block mt-2 text-sm"
              >Memuat data lengkap dari server...</span
            >
          </div>

          <div v-else class="overflow-x-auto border border-sky-100 rounded-2xl">
            <table
              v-if="modalType === 'deadline'"
              class="w-full text-left border-collapse modern-blue-table table-layout-fixed"
            >
              <thead>
                <tr class="thead-tr">
                  <th class="py-3 px-2 w-[45px] text-center">No</th>
                  <th class="py-3 px-2 w-[115px]">No. SPK</th>
                  <th class="py-3 px-2 w-[340px]">Nama Produk / File</th>
                  <th class="py-3 px-2 text-right w-[85px]">Qty Order</th>
                  <th class="py-3 px-2 text-right w-[95px]">Sudah Cetak</th>
                  <th class="py-3 px-2 text-right w-[90px]">Sisa Cetak</th>
                  <th class="py-3 px-2 text-center w-[105px]">Deadline</th>
                  <th class="py-3 px-3 text-center w-[125px]">Sisa Waktu</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-sky-50/50 text-slate-600">
                <tr
                  v-for="(item, index) in totalModalData"
                  :key="index"
                  class="tbody-tr transition-colors duration-150"
                >
                  <td
                    class="py-2.5 px-2 text-center text-slate-400 font-medium"
                  >
                    {{ index + 1 }}
                  </td>
                  <td
                    class="py-2.5 px-2 font-mono font-semibold text-sky-700 cell-spk-bg"
                  >
                    {{ item.no_spk }}
                  </td>
                  <td
                    class="py-2.5 px-2 font-medium text-slate-800 cell-ellipsis"
                    :title="item.nama_produk"
                  >
                    {{ item.nama_produk }}
                  </td>
                  <td
                    class="py-2.5 px-2 text-right text-slate-600 font-medium font-mono"
                  >
                    {{ item.qty_order }}
                  </td>
                  <td
                    class="py-2.5 px-2 text-right text-green-600 font-semibold font-mono"
                  >
                    {{ item.sudah_cetak }}
                  </td>
                  <td
                    class="py-2.5 px-2 text-right font-bold text-slate-900 font-mono cell-sisa-bg"
                  >
                    {{ item.qty }}
                  </td>
                  <td class="py-2.5 px-2 text-center text-slate-500 font-mono">
                    {{ formatDate(item.tanggal_spk) }}
                  </td>
                  <td class="py-2.5 px-3 text-center whitespace-nowrap">
                    <span
                      :class="[
                        item.sisa_waktu &&
                        item.sisa_waktu.toLowerCase().includes('lewat')
                          ? 'bg-red-50 text-red-600 border border-red-100 font-semibold'
                          : 'bg-amber-50 text-amber-600 border border-amber-100 font-medium',
                        'inline-block px-2.5 py-0.5 rounded-full text-[11px] min-w-[95px] text-center tracking-wide shadow-sm',
                      ]"
                    >
                      {{ item.sisa_waktu }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            <table
              v-if="modalType === 'bahan'"
              class="w-full text-left border-collapse modern-blue-table table-layout-fixed"
            >
              <thead>
                <tr class="thead-tr">
                  <th class="py-3.5 px-4 w-12 text-center">No</th>
                  <th class="py-3.5 px-3 w-[150px]">No. Bon / Referensi</th>
                  <th class="py-3.5 px-3 w-[240px]">Bahan / Material</th>
                  <th class="py-3.5 px-3 text-center w-[110px]">
                    Divisi Peminta
                  </th>
                  <th class="py-3.5 px-3 text-right w-[110px]">Qty Diminta</th>
                  <th class="py-3.5 px-3 text-center w-[110px]">
                    Tanggal Input
                  </th>
                  <th class="py-3.5 px-4 text-center w-[120px]">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-sky-50/50 text-slate-600">
                <tr
                  v-for="(item, index) in totalModalData"
                  :key="index"
                  class="tbody-tr transition-colors duration-150"
                >
                  <td
                    class="py-3.5 px-4 text-center font-medium text-slate-400"
                  >
                    {{ index + 1 }}
                  </td>
                  <td class="py-3.5 px-3 font-mono font-medium text-slate-700">
                    {{ item.nomor_bon }}
                  </td>
                  <td
                    class="py-3.5 px-3 font-semibold text-slate-800 cell-ellipsis"
                  >
                    {{ item.nama_bahan }}
                  </td>
                  <td class="py-3.5 px-3 text-center">
                    <span
                      class="bg-sky-50 px-2 py-0.5 rounded text-sky-700 font-medium"
                      >{{ item.divisi }}</span
                    >
                  </td>
                  <td class="py-3.5 px-3 text-right font-semibold text-sky-600">
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
              </tbody>
            </table>

            <table
              v-if="modalType === 'planning_idle'"
              class="w-full text-left border-collapse modern-blue-table table-layout-fixed"
            >
              <thead>
                <tr class="thead-tr">
                  <th class="py-3.5 px-4 w-12 text-center">No</th>
                  <th class="py-3.5 px-3 w-[120px]">No. SPK</th>
                  <th class="py-3.5 px-3 w-[90px] text-center">Mesin</th>
                  <th class="py-3.5 px-3 w-[260px]">Nama SPK / File</th>
                  <th class="py-3.5 px-3 w-[180px]">Spesifikasi Bahan</th>
                  <th class="py-3.5 px-3 text-center w-[120px]">
                    Ukuran (LxP)
                  </th>
                  <th class="py-3.5 px-3 text-right w-[100px]">Plan Qty</th>
                  <th class="py-3.5 px-3 text-right w-[110px]">Total M2</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-sky-50/50 text-slate-600">
                <tr
                  v-for="(item, index) in totalModalData"
                  :key="index"
                  class="tbody-tr transition-colors duration-150"
                >
                  <td
                    class="py-3.5 px-4 text-center font-medium text-slate-400"
                  >
                    {{ index + 1 }}
                  </td>
                  <td class="py-3.5 px-3 font-mono font-bold text-slate-900">
                    {{ item.NomorSPK }}
                  </td>
                  <td class="py-3.5 px-3 text-center">
                    <span
                      class="bg-blue-50 px-2 py-0.5 rounded text-blue-700 font-semibold"
                      >{{ item.Mesin }}</span
                    >
                  </td>
                  <td
                    class="py-3.5 px-3 font-medium text-slate-800 cell-ellipsis"
                    :title="item.NamaSPK"
                  >
                    {{ item.NamaSPK }}
                  </td>
                  <td
                    class="py-3.5 px-3 text-slate-600 cell-ellipsis"
                    :title="item.Bahan"
                  >
                    {{ item.Bahan }}
                  </td>
                  <td
                    class="py-3.5 px-3 text-center font-mono text-xs text-slate-500"
                  >
                    {{ item.Lebar }} x {{ item.Panjang }}
                  </td>
                  <td
                    class="py-3.5 px-3 text-right font-semibold text-slate-900"
                  >
                    {{ item.Plan_Qty }}
                  </td>
                  <td
                    class="py-3.5 px-3 text-right font-bold text-sky-600 font-mono"
                  >
                    {{ item.Plan_M2 }} m²
                  </td>
                </tr>
              </tbody>
            </table>

            <div
              v-if="totalModalData.length === 0 && !isLoadingTotal"
              class="text-center py-8 text-sky-400"
            >
              Tidak ada data ditemukan.
            </div>
          </div>
        </div>

        <div
          class="px-6 py-4 border-t border-sky-100 bg-sky-50/50 flex justify-between items-center text-xs text-sky-400"
        >
          <div>
            Total:
            <span class="font-bold text-sky-700">{{
              totalModalData.length
            }}</span>
            item data
          </div>
          <button
            @click="closeModal"
            class="px-4 py-2 border border-sky-200 bg-white rounded-xl text-sky-600 font-semibold shadow-sm hover:bg-sky-50 transition-all active:scale-95"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import Chart from "chart.js/auto";
import { format } from "date-fns";
import api from "@/services/api";

/* ================= ENDPOINT API ================= */
const ENDPOINT_SUMMARY = "/mmt/laporan-ls-bahan-utama/total-roll";
const ENDPOINT_FLOW = "/mmt/laporan-ls-bahan-utama/flow-6-bulan";
const ENDPOINT_BS_MONTHLY = "/mmt/dashboard/grafik-bulanan";
const ENDPOINT_DEADLINE = "mmt/dashboard/top-10-deadline";
const ENDPOINT_DEADLINE_TOTAL = "mmt/dashboard/top-10-deadline-total";
const ENDPOINT_PENDING_BAHAN = "mmt/dashboard/permintaan-pending";
const ENDPOINT_PENDING_BAHAN_TOTAL = "mmt/dashboard/permintaan-pending-total";
const ENDPOINT_PLANNING_IDLE = "mmt/dashboard/planning-belum-lhk";
const ENDPOINT_PLANNING_IDLE_TOTAL = "mmt/dashboard/planning-belum-lhk-total";

/* ================= STATE DASHBOARD ================= */
const lastUpdate = ref(format(new Date(), "HH:mm:ss"));
const isLoading = ref(false);
const topDeadlineCetak = ref([]);
const permintaanBahanPending = ref([]);
const topPlanningBelumLhk = ref([]);
const monthlyBsData = ref([]);

const stats = ref({
  totalStock: 0,
  totalKasusBs: 0,
  totalPanjangBs: 0,
  totalLuasBsM2: 0,
});

/* ================= STATE DYNAMIC MODAL ================= */
const isModalOpen = ref(false);
const isLoadingTotal = ref(false);
const modalType = ref(""); // 'deadline', 'bahan', atau 'planning_idle'
const totalModalData = ref([]);

let flowChartInstance = null;
let bsChartInstance = null;

/* ================= COMPUTED PROPERTIES FOR BS ================= */
// Hitung % kenaikan/penurunan BS dibanding bulan lalu
const bsGrowth = computed(() => {
  if (monthlyBsData.value.length < 2) return 0;
  const current =
    monthlyBsData.value[monthlyBsData.value.length - 1]?.total_luas_m2 || 0;
  const prev =
    monthlyBsData.value[monthlyBsData.value.length - 2]?.total_luas_m2 || 0;
  if (prev === 0) return 0;
  return Number((((current - prev) / prev) * 100).toFixed(1));
});

// Hitung rata-rata akumulasi BS per bulan
const avgMonthlyBs = computed(() => {
  if (monthlyBsData.value.length === 0) return 0;
  const total = monthlyBsData.value.reduce(
    (acc, curr) => acc + Number(curr.total_luas_m2 || 0),
    0
  );
  return total / monthlyBsData.value.length;
});

/* ================= API CALLS FUNCTIONS ================= */
const fetchSummary = async () => {
  try {
    const response = await api.get(ENDPOINT_SUMMARY);
    const res = response.data;
    if (res.success && res.data) {
      stats.value.totalStock = res.data.total_roll || 0;
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

/* ================= API CALL FUNCTION ================= */
const fetchBsMonthlyData = async () => {
  try {
    const response = await api.get(ENDPOINT_BS_MONTHLY);
    const res = response.data;
    if (res.success && res.data) {
      const { labels, datasets } = res.data;
      renderBsLineChart(labels, datasets);
    }
  } catch (err) {
    console.error("Gagal mengambil data grafik BS 3 divisi:", err);
  }
};

/* ================= RENDER MULTI-LINE CHART ================= */
const renderBsLineChart = (labels, datasets) => {
  const ctx = document.getElementById("bsMonthlyChart");
  if (!ctx) return;
  if (bsChartInstance) bsChartInstance.destroy();

  bsChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels, // ['Nov 2025', 'Des 2025', 'Jan 2026', ...]
      datasets: [
        {
          label: "BS Tekstil",
          data: datasets["TEKSTIL"] || [],
          borderColor: "#ec4899", // Warna Pink / Rose
          backgroundColor: "#ec4899",
          pointStyle: "triangle", // Marker Segitiga
          pointRadius: 6,
          pointHoverRadius: 9,
          borderWidth: 2,
          tension: 0.1, // Garis lurus tegas berpola patah seperti gambar referensi
        },
        {
          label: "BS Finishing",
          data: datasets["FINISHING"] || [],
          borderColor: "#dc2626", // Warna Merah
          backgroundColor: "#dc2626",
          pointStyle: "rectRot", // Marker Diamond / Ketupat
          pointRadius: 6,
          pointHoverRadius: 9,
          borderWidth: 2,
          tension: 0.1,
        },
        {
          label: "BS MMT",
          data: datasets["MMT"] || [],
          borderColor: "#2563eb", // Warna Biru
          backgroundColor: "#2563eb",
          pointStyle: "circle", // Marker Lingkaran
          pointRadius: 6,
          pointHoverRadius: 9,
          borderWidth: 2,
          tension: 0.1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            usePointStyle: true,
            boxWidth: 10,
            font: { size: 11, weight: "bold" },
            padding: 15,
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${formatNumber(ctx.raw, 2)} M²`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: true, color: "#f1f5f9" },
          ticks: { font: { size: 11, weight: "bold" }, color: "#475569" },
        },
        y: {
          border: { dash: [4, 4], display: true },
          grid: { color: "#e2e8f0" },
          ticks: {
            font: { size: 10 },
            color: "#64748b",
            callback: (value) => `${value} M²`,
          },
        },
      },
    },
  });
};

const fetchDeadlineCetak = async () => {
  try {
    const response = await api.get(ENDPOINT_DEADLINE);
    const res = response.data;
    topDeadlineCetak.value = res.success && res.data ? res.data : [];
  } catch (err) {
    console.error("Gagal mengambil data antrean cetak:", err);
    topDeadlineCetak.value = [];
  }
};



const fetchPermintaanPending = async () => {
  try {
    const response = await api.get(ENDPOINT_PENDING_BAHAN);
    const res = response.data;
    permintaanBahanPending.value = res.success && res.data ? res.data : [];
  } catch (err) {
    console.error("Gagal mengambil data permintaan pending:", err);
    permintaanBahanPending.value = [];
  }
};

const fetchPlanningBelumLhk = async () => {
  try {
    const response = await api.get(ENDPOINT_PLANNING_IDLE);
    const res = response.data;
    topPlanningBelumLhk.value = res.success && res.data ? res.data : [];
  } catch (err) {
    console.error("Gagal mengambil data planning idle:", err);
    topPlanningBelumLhk.value = [];
  }
};

/* ================= CONTROL MASTER MODAL ================= */
const openDetailModal = async (type) => {
  modalType.value = type;
  isModalOpen.value = true;
  isLoadingTotal.value = true;
  totalModalData.value = [];

  try {
    let response;
    if (type === "deadline") response = await api.get(ENDPOINT_DEADLINE_TOTAL);
    else if (type === "bahan")
      response = await api.get(ENDPOINT_PENDING_BAHAN_TOTAL);
    else if (type === "planning_idle")
      response = await api.get(ENDPOINT_PLANNING_IDLE_TOTAL);

    const res = response?.data;
    if (res && res.success && res.data) {
      totalModalData.value = res.data;
    }
  } catch (err) {
    console.error(`Gagal mengambil data modal detail (${type}):`, err);
  } finally {
    isLoadingTotal.value = false;
  }
};

const closeModal = () => {
  isModalOpen.value = false;
  modalType.value = "";
  totalModalData.value = [];
};

/* ================= REFRESH SYSTEM ================= */
const refreshAllData = async () => {
  isLoading.value = true;
  try {
    await Promise.all([
      fetchSummary(),
      fetchFlowData(),
      fetchBsMonthlyData(),
      fetchDeadlineCetak(),
      fetchPermintaanPending(),
      fetchPlanningBelumLhk(),
    ]);
    lastUpdate.value = format(new Date(), "HH:mm:ss");
  } catch (err) {
    console.error("Gagal melakukan sinkronisasi data dashboard:", err);
  } finally {
    isLoading.value = false;
  }
};

/* ================= HELPERS FUNCTIONS ================= */
const formatNumber = (val, dec = 2) => {
  if (val === null || val === undefined) return "0,00";
  const num = parseFloat(val);
  return isNaN(num)
    ? "0,00"
    : num.toLocaleString("id-ID", {
        minimumFractionDigits: dec,
        maximumFractionDigits: dec,
      });
};

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

const renderBsMonthlyChart = (labels, dataLuas) => {
  const ctx = document.getElementById("bsMonthlyChart");
  if (!ctx) return;
  if (bsChartInstance) bsChartInstance.destroy();

  bsChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Luas Afal BS (M²)",
          data: dataLuas,
          backgroundColor: "rgba(239, 68, 68, 0.85)", // Tailwind Red-500
          hoverBackgroundColor: "#dc2626",
          borderRadius: 8,
          borderSkipped: false,
          barThickness: 24,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` Luas BS: ${formatNumber(ctx.raw, 2)} M²`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 }, color: "#64748b" },
        },
        y: {
          border: { dash: [4, 4], display: false },
          ticks: {
            font: { size: 10 },
            color: "#94a3b8",
            callback: (value) => `${value} m²`,
          },
        },
      },
    },
  });
};

onMounted(async () => {
  await refreshAllData();
});
</script>

<style scoped>
canvas {
  width: 100% !important;
  height: 100% !important;
}
.modern-blue-table.table-layout-fixed {
  table-layout: fixed !important;
  width: 100%;
}
.modern-blue-table th,
.modern-blue-table td,
.modern-blue-table span,
.modern-blue-table td font {
  font-size: 12px !important;
  font-family: inherit !important;
  vertical-align: middle !important;
}
.modern-blue-table thead tr {
  background-color: #e0f2fe !important;
  border-bottom: 2px solid #bae6fd !important;
}
.modern-blue-table th {
  color: #0369a1 !important;
  font-weight: 700 !important;
  height: 38px !important;
}
.modern-blue-table .tbody-tr {
  height: 38px !important;
  background-color: #ffffff !important;
}
.modern-blue-table .tbody-tr:hover {
  background-color: #f0f9ff !important;
  cursor: pointer;
}
.modern-blue-table .text-slate-950,
.modern-blue-table td:first-child,
.modern-blue-table td:nth-child(2) {
  color: #0f172a !important;
}
.modern-blue-table .cell-spk-bg {
  background-color: transparent !important;
}
.modern-blue-table .cell-sisa-bg {
  background-color: transparent !important;
}
.modern-blue-table .cell-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>