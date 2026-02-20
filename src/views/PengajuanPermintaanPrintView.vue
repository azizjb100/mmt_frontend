<script setup lang="ts">
import { ref, onMounted, nextTick, watch, computed } from "vue";
import { useRoute } from "vue-router";
import api from "@/services/api";

interface PengajuanDetail {
    No: number | string;
    SPK: string;
    Jenis: string;
    Keterangan: string;
    Satuan: string;
    QTY: number | string;
}

interface PengajuanPrintData {
    NoPengajuan: string;
    Tanggal: string;
    Kepada: string;
    JenisPengajuan: string;
    Priority: string;
    Keterangan: string;
    Details: PengajuanDetail[];
    Dibuat: string;
    Diketahui: string;
    Status_Acc: string;
}

const route = useRoute();
const printData = ref<PengajuanPrintData | null>(null);
const isLoading = ref(true);

const filteredDetails = computed(() => {
    if (!printData.value || !Array.isArray(printData.value.Details)) return [];
    return printData.value.Details.map((item, index) => ({
        ...item,
        No: index + 1,
    }));
});

const fetchPrintData = async (nomor: string) => {
    isLoading.value = true;
    try {
        const response = await api.get(
            `mmt/pengajuan-permintaan/print/${nomor}`,
        );
        printData.value = response.data;
        document.title = `Cetak Pengajuan - ${nomor}`;
    } catch (error) {
        console.error("Error fetching print data:", error);
        alert("Gagal memuat data.");
    } finally {
        isLoading.value = false;
    }
};

watch(isLoading, (newValue) => {
    if (newValue === false && printData.value) {
        nextTick(() => {
            setTimeout(() => {
                window.print();
            }, 800);
        });
    }
});

onMounted(() => {
    const nomor = route.params.nomor as string;
    if (nomor) fetchPrintData(nomor);
});
</script>

<template>
    <div class="pp-print-container">
        <div v-if="isLoading" class="text-center pt-10">Memuat data...</div>

        <div v-else-if="printData" class="pp-page">
            <h2 class="form-title">FORM PENGAJUAN PERMINTAAN (PERSIAPAN)</h2>

            <div class="header-info">
                <div class="left-column">
                    <div class="info-row">
                        <span class="label">NO. PENGAJUAN</span>
                        <span class="value">: {{ printData.NoPengajuan }}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">TANGGAL</span>
                        <span class="value">: {{ printData.Tanggal }}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">JENIS</span>
                        <span class="value"
                            >: {{ printData.JenisPengajuan }}</span
                        >
                    </div>
                </div>

                <div class="right-column">
                    <div class="info-row">
                        <span class="label">Priority</span>
                        <span class="value">: {{ printData.Priority }}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">KETERANGAN</span>
                        <span class="value">: {{ printData.Keterangan }}</span>
                    </div>
                </div>
            </div>

            <div class="items-table-wrapper">
                <table class="items-table">
                    <thead>
                        <tr>
                            <th style="width: 5%">NO</th>
                            <th style="width: 15%">SPK</th>
                            <th style="width: 40%">NAMA BAHAN / BARANG</th>
                            <th style="width: 10%">QTY</th>
                            <th style="width: 10%">SATUAN</th>
                            <th style="width: 20%">KETERANGAN</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="(item, index) in filteredDetails"
                            :key="'item-' + index"
                        >
                            <td class="text-center">{{ item.No }}</td>
                            <td class="text-center">{{ item.SPK }}</td>
                            <td>{{ item.Jenis }}</td>
                            <td class="text-right">{{ item.QTY }}</td>
                            <td class="text-center">{{ item.Satuan }}</td>
                            <td>{{ item.Keterangan }}</td>
                        </tr>
                        <tr
                            v-for="i in Math.max(0, 8 - filteredDetails.length)"
                            :key="'empty-' + i"
                            class="empty-row"
                        >
                            <td>&nbsp;</td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="signature-footer">
                <div class="signature-box">
                    <div class="signature-label">Pemohon,</div>
                    <div class="spacer"></div>
                    <div class="signer-name">{{ printData.Dibuat }}</div>
                    <div class="signer-role">Staff / User</div>
                </div>

                <div class="signature-box">
                    <div class="signature-label">Mengetahui,</div>
                    <div class="spacer"></div>
                    <div class="signer-name">{{ printData.Diketahui }}</div>
                    <div class="signer-role">SPV / Koordinator</div>
                </div>
            </div>

            <div class="print-note">
                * Dokumen ini merupakan bukti pengajuan persiapan pengadaan
                barang.
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Pengaturan Layout untuk Tampilan Browser */
.pp-page {
    font-family: Arial, sans-serif;
    font-size: 9pt;
    background: white;
    margin: 0 auto;
    width: 210mm; /* Lebar A4 */
    min-height: 148.5mm; /* Tinggi A5 (setengah A4) */
    padding: 10mm;
    box-sizing: border-box;
}

.form-title {
    text-align: center;
    font-size: 12pt;
    font-weight: bold;
    text-decoration: underline;
    margin-bottom: 15px;
}

.header-info {
    display: flex;
    justify-content: space-between;
    border-top: 1.5px solid #eee;
    padding-top: 8px;
    margin-bottom: 10px;
}

.left-column,
.right-column {
    width: 48%;
    gap: 2px;
}

.info-row {
    display: flex;
    margin-bottom: 2px; /* Jarak antar baris header sangat rapat */
    line-height: 1.2;
}

.label {
    width: 110px;
    font-weight: bold;
}

/* Tabel */
.items-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 15px;
}
.items-table th,
.items-table td {
    border: 1px solid black;
    padding: 4px 6px;
}
.items-table thead th {
    background-color: #f9f9f9;
    text-transform: uppercase;
    font-size: 8.5pt;
}
.empty-row td {
    height: 18pt;
}

/* Tanda Tangan */
.signature-footer {
    display: flex;
    justify-content: space-around;
    margin-top: 20px;
}
.signature-box {
    width: 220px;
    text-align: center;
}
.spacer {
    height: 45px;
}
.signer-name {
    font-weight: bold;
    text-decoration: underline;
    text-transform: uppercase;
}
.signer-role {
    border-top: 1px solid black;
    display: block;
    margin-top: 2px;
    font-size: 8pt;
}

.print-note {
    margin-top: 30px;
    font-size: 7pt;
    font-style: italic;
    color: #555;
}

/* KUNCI CETAK: Kertas A4, tapi konten hanya 1/2 atas */
@media print {
    @page {
        size: A4 portrait;
        margin: 0; /* Margin nol karena kita atur padding di .pp-page */
    }

    body {
        margin: 0;
    }

    .pp-page {
        width: 210mm;
        height: 148.5mm; /* Paksa tinggi hanya setengah A4 */
        border: none;
        position: absolute;
        top: 0;
        left: 0;
    }

    /* Hilangkan elemen yang tidak perlu saat print */
    button,
    .v-btn,
    .v-toolbar {
        display: none !important;
    }
}

.text-center {
    text-align: center;
}
.text-right {
    text-align: right;
}
</style>
