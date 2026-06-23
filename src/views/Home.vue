<template>
  <div
    class="min-h-screen bg-[#EBF5FF] p-6 font-sans antialiased text-slate-800"
  >
    <header
      class="mx-auto mb-8 flex max-w-[1400px] flex-col gap-4 rounded-2xl bg-white px-6 py-4 shadow-sm border border-sky-100 md:flex-row md:items-center md:justify-between"
    >
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-sky-900">
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
          <span class="text-xs text-sky-400"
            >Last update: {{ lastUpdate }}</span
          >
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="refreshAllData"
          :disabled="isLoading"
          class="flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-600 active:scale-95 disabled:opacity-50"
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
        class="rounded-3xl bg-white p-6 shadow-sm border border-sky-100 flex flex-col gap-4"
      >
        <div class="flex items-center gap-3">
          <div
            class="h-10 w-10 rounded-full bg-sky-50 flex items-center justify-center"
          >
            <i :class="['mdi', stat.icon, 'text-lg text-sky-600']"></i>
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
        <div class="h-1 w-full rounded-full bg-sky-100 overflow-hidden">
          <div class="h-full bg-sky-400" style="width: 40%"></div>
        </div>
      </div>
    </div>

    <div class="mx-auto grid max-w-[1400px] grid-cols-12 gap-6 mb-6">
      <div class="col-span-12 space-y-6 lg:col-span-8">
        <div class="rounded-3xl bg-white p-6 shadow-sm border border-sky-100">
          <h3 class="mb-6 text-sm font-semibold text-sky-800">
            Material Flow (Last 6 Months)
          </h3>
          <div class="h-[280px]">
            <canvas id="stockFlowChart"></canvas>
          </div>
        </div>
      </div>

      <div class="col-span-12 space-y-6 lg:col-span-4">
        <div class="rounded-3xl bg-white p-6 shadow-sm border border-sky-100">
          <h3 class="mb-6 text-sm font-semibold text-sky-800">
            Material Composition
          </h3>
          <div class="relative h-[220px]">
            <canvas id="compositionChart"></canvas>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-3xl font-bold text-sky-900">100%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

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
import { ref, onMounted } from "vue";
import Chart from "chart.js/auto";
import { format } from "date-fns";
import api from "@/services/api";

/* ================= ENDPOINT API ================= */
const ENDPOINT_SUMMARY = "/mmt/laporan-ls-bahan-utama/total-roll";
const ENDPOINT_FLOW = "/mmt/laporan-ls-bahan-utama/flow-6-bulan";
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

/* ================= STATE DYNAMIC MODAL ================= */
const isModalOpen = ref(false);
const isLoadingTotal = ref(false);
const modalType = ref(""); // 'deadline', 'bahan', atau 'planning_idle'
const totalModalData = ref([]);

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
