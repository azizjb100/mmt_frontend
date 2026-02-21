<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import type {
    ColDef,
    ColGroupDef,
    GridApi,
    GridReadyEvent,
} from "ag-grid-community";
import { AgGridVue } from "ag-grid-vue3";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import { format, parseISO, isValid } from "date-fns";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

const loading = ref({ report: false });
const allData = ref<any[]>([]);
const gridApi = ref<GridApi | null>(null);

const startDate = ref(new Date().toISOString().slice(0, 10));
const endDate = ref(new Date().toISOString().slice(0, 10));
const searchQuery = ref("");

const formatNumber = (val: any, dec = 0) => {
    const num = Number(val ?? 0);
    if (Number.isNaN(num)) return "-";
    return num.toLocaleString("id-ID", {
        minimumFractionDigits: dec,
        maximumFractionDigits: dec,
    });
};

const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = parseISO(dateStr);
    return isValid(date) ? format(date, "dd/MM/yyyy") : dateStr;
};

const statusCellRenderer = (params: any) => {
    const value = params.value ?? "";
    const cls = value === "Closed" ? "chip-closed" : "chip-open";
    return `<span class="status-chip ${cls}">${value}</span>`;
};

const nCol = (
    headerName: string,
    field: string,
    width = 80,
    dec = 0,
): ColDef => ({
    headerName,
    field,
    width,
    type: "numericColumn",
    cellClass: "text-right",
    valueFormatter: (p) => formatNumber(p.value, dec),
});

const columnDefs = ref<(ColDef | ColGroupDef)[]>([
    { headerName: "NOMOR SPK", field: "NOMOR", pinned: "left", width: 130 },
    { headerName: "NAMA ORDER", field: "spk_nama", pinned: "left", width: 210 },
    { headerName: "DIVISI", field: "DIVISI", width: 90 },
    {
        headerName: "TGL SPK",
        field: "spk_tanggal",
        width: 110,
        valueFormatter: (p) => formatDateDisplay(p.value),
    },
    {
        headerName: "DEADLINE",
        field: "deadline",
        width: 110,
        valueFormatter: (p) => formatDateDisplay(p.value),
    },
    { headerName: "JENIS", field: "jo_nama", width: 130 },
    {
        headerName: "STATUS",
        field: "status",
        width: 100,
        cellRenderer: statusCellRenderer,
    },
    nCol("GRAMASI", "spk_gramasi", 90, 0),
    nCol("PANJANG", "PANJANG", 85, 0),
    nCol("LEBAR", "LEBAR", 75, 0),
    { headerName: "KAIN", field: "KAIN", width: 120 },
    { headerName: "FINISHING", field: "FINISHING", width: 150 },

    {
        headerName: "JML ORDER",
        children: [nCol("PCS", "spk_jumlah", 80, 0)],
    },
    {
        headerName: "JML CETAK",
        children: [
            nCol("MT01", "mt01", 75, 0),
            nCol("MT02", "mt02", 75, 0),
            nCol("MT03", "mt03", 75, 0),
            nCol("MT04", "mt04", 75, 0),
            nCol("MT05", "mt05", 75, 0),
            nCol("TOTAL", "JML_CETAK", 85, 0),
        ],
    },
    nCol("JML SEAMING", "JML_seaming", 95, 0),
    nCol("JML MATA AYAM", "JML_mataayam", 110, 0),
    nCol("JML COLY", "JML_coly", 90, 0),
    nCol("JML JADI", "JML_JADI", 90, 0),
    nCol("JML KIRIM", "JML_KIRIM", 95, 0),

    {
        headerName: "CETAK METER",
        children: [
            nCol("MT01", "mt01_m", 80, 2),
            nCol("MT02", "mt02_m", 80, 2),
            nCol("MT03", "mt03_m", 80, 2),
            nCol("MT04", "mt04_m", 80, 2),
            nCol("MT05", "mt05_m", 80, 2),
            nCol("TOTAL", "M_CETAK", 90, 2),
        ],
    },
    {
        headerName: "SEAMING",
        children: [nCol("METER", "m_seaming", 95, 2)],
    },
    {
        headerName: "KIRIM",
        children: [nCol("METER", "JML_meter_KIRIM", 110, 2)],
    },
]);

const defaultColDef: ColDef = {
    sortable: true,
    resizable: true,
    filter: false,
    headerClass: "mmt-header-cell",
};

const totals = computed(() => {
    const t: any = {
        spk_jumlah: 0,
        mt01: 0,
        mt02: 0,
        mt03: 0,
        mt04: 0,
        mt05: 0,
        JML_CETAK: 0,
        JML_seaming: 0,
        JML_mataayam: 0,
        JML_coly: 0,
        JML_JADI: 0,
        JML_KIRIM: 0,
        mt01_m: 0,
        mt02_m: 0,
        mt03_m: 0,
        mt04_m: 0,
        mt05_m: 0,
        M_CETAK: 0,
        m_seaming: 0,
        JML_meter_KIRIM: 0,
    };

    allData.value.forEach((r: any) => {
        Object.keys(t).forEach((k) => {
            t[k] += Number(r?.[k] || 0);
        });
    });

    return t;
});

const pinnedBottomRowData = computed(() => [
    {
        NOMOR: "TOTAL",
        ...totals.value,
        status: "",
    },
]);

const onGridReady = (e: GridReadyEvent) => {
    gridApi.value = e.api;
    e.api.setGridOption("quickFilterText", searchQuery.value);
};

watch(searchQuery, (val) => {
    gridApi.value?.setGridOption("quickFilterText", val);
});

const fetchReport = async () => {
    loading.value.report = true;
    try {
        const res = await api.get("mmt/laporan-spk-mmt", {
            params: { startDate: startDate.value, endDate: endDate.value },
        });
        allData.value = res.data.data || [];
    } finally {
        loading.value.report = false;
    }
};

onMounted(fetchReport);
</script>

<template>
    <PageLayout title="Laporan SPK MMT" icon="mdi-file-chart">
        <div class="spk-mmt-wrapper">
            <v-card flat class="mb-4 pa-3 filter-card">
                <div class="d-flex align-center flex-wrap ga-3">
                    <v-label class="text-caption font-weight-bold"
                        >Periode:</v-label
                    >
                    <v-text-field
                        v-model="startDate"
                        type="date"
                        density="compact"
                        hide-details
                        variant="outlined"
                        style="max-width: 160px"
                    />
                    <v-label>s.d</v-label>
                    <v-text-field
                        v-model="endDate"
                        type="date"
                        density="compact"
                        hide-details
                        variant="outlined"
                        style="max-width: 160px"
                    />

                    <v-btn
                        color="success"
                        icon="mdi-refresh"
                        size="small"
                        @click="fetchReport"
                        :loading="loading.report"
                    />

                    <v-spacer />

                    <v-text-field
                        v-model="searchQuery"
                        prepend-inner-icon="mdi-magnify"
                        placeholder="Cari SPK..."
                        density="compact"
                        hide-details
                        variant="outlined"
                        style="max-width: 250px"
                    />
                </div>
            </v-card>

            <v-card class="table-container" elevation="2">
                <AgGridVue
                    class="ag-theme-alpine mmt-ag-grid"
                    :columnDefs="columnDefs"
                    :defaultColDef="defaultColDef"
                    :rowData="allData"
                    :pinnedBottomRowData="pinnedBottomRowData"
                    :rowClassRules="{
                        'row-closed': (p: any) => p?.data?.status === 'Closed',
                        'row-pending': (p: any) =>
                            Number(p?.data?.JML_CETAK || 0) === 0 &&
                            p?.node?.rowPinned !== 'bottom',
                    }"
                    :suppressCellFocus="true"
                    :animateRows="false"
                    rowSelection="single"
                    @grid-ready="onGridReady"
                />
            </v-card>
        </div>
    </PageLayout>
</template>

<style scoped>
.spk-mmt-wrapper {
    padding: 12px;
    background-color: #f5f5f5;
}

.filter-card {
    border-radius: 8px;
    border: 1px solid #ddd;
}

.table-container {
    height: calc(100vh - 220px);
    overflow: hidden;
}

.mmt-ag-grid {
    width: 100%;
    height: 100%;
    --ag-header-background-color: #64a9df;
    --ag-header-foreground-color: #ffffff;
    --ag-header-column-separator-color: #8ec0e8;
    --ag-borders: solid 1px #dbe7f2;
    --ag-row-border-color: #eef2f6;
    --ag-font-size: 12px;
    --ag-header-height: 30px;
    --ag-group-header-height: 28px;
}

.mmt-ag-grid :deep(.ag-header-cell-label) {
    justify-content: center;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 11px;
}

.mmt-ag-grid :deep(.ag-cell.text-right) {
    text-align: right;
}

.mmt-ag-grid :deep(.status-chip) {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
    color: #fff;
}

.mmt-ag-grid :deep(.chip-closed) {
    background: #2e7d32;
}

.mmt-ag-grid :deep(.chip-open) {
    background: #ef6c00;
}

.mmt-ag-grid :deep(.ag-row.row-closed .ag-cell) {
    background-color: #e8f5e9 !important;
}

.mmt-ag-grid :deep(.ag-row.row-pending .ag-cell) {
    color: #d32f2f !important;
    font-weight: 700;
}

.mmt-ag-grid :deep(.ag-row-pinned .ag-cell) {
    background-color: #f5f5f5 !important;
    font-weight: 700;
    border-top: 2px solid #283593 !important;
}
</style>
