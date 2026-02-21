import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

// 1. Impor semua Halaman (Views) Anda
import LoginView from '../views/LoginView.vue';
import Dashboard from '../views/Dashboard.vue';
import Home from '../views/Home.vue';
import MaterialRequestForm from '../components/MaterialRequestForm.vue';
import ComingSoon from '../views/ComingSoon.vue';
import LhkCetakView from '../views/LhkMesinCetakView.vue';
import LhkFinishingView from '../views/LhkFinishingView.vue';
import StbjMmtBiew from '../views/StbjMmtView.vue';
import lapBahanUtamaView from '../views/LapLsBahanUtamaView.vue';
import lapBahanPenolongView from '../views/LapLsBahanPenolongView.vue';
import LapMonCetakView from '../views/LapMonCetakView.vue';

// Pastikan file-file ini sudah ada di views/ dan path ../views adalah benar
import PermintaanBahanView from '../views/PermintaanBahanView.vue';
import penerimaanBahanView from '../views/penerimaanBahanView.vue';
import FormPenerimaanBahanView from '../views/FormPenerimaanBahanView.vue';
import FormPermintaanBahanView from '../views/FormPermintaanBahanView.vue'; // Asumsi Anda punya form ini
import PermintaanProduksiView from '../views/PermintaanProduksiView.vue';
import FormPermintaanProduksiView from '../views/FormPermintaanProduksiView.vue';
import ReturBeliView from '@/views/ReturBeliView.vue';
import KoreksiStokMMTView from '@/views/KoreksiStokMMTView.vue';
import POPaperprintView from '@/views/POPaperprintView.vue';
import OperatorView from '@/views/OperatorView.vue';
import MasterBahanView from '@/views/MasterBahanView.vue';
import FormPoBahanMmtView from '@/views/FormPoBahanMmtView.vue';
import POBahanMmtView from '@/views/POBahanMmtView.vue';
import PoPrintView from '@/views/PoPrintView.vue';
import LapLsBahanUtamaView from '../views/LapLsBahanUtamaView.vue';
import LapLsBahanPenolongView from '../views/LapLsBahanPenolongView.vue';
import FormLhkCetakView from '@/views/FormLhkCetakView.vue';
import PermintaanBahanPrintView from '@/views/PermintaanBahanPrintView.vue';
import FormLhkCetakViewNew from '@/views/FormLhkCetakViewNew.vue';
import FormRecreateBarcode from '@/views/FormRecreateBarcode.vue';
import LapMonLmkpMmtView from '@/views/LapMonLmkpMmtView.vue';
import FormInvoiceView from '@/views/FormInvoiceView.vue';
import LapSpkMmtView from '@/views/LapSpkMmtView.vue';
import LapPlanProdView from '@/views/LapPlanProdView.vue';
import LapBarangJadiView from '@/views/LapBarangJadiView.vue';
import LapStokTintaMmtView from '@/views/LapStokTintaMmtView.vue';
import LapOutputMesinView from '@/views/LapOutputMesinView.vue';
import FormReturBeliView from '@/views/FormReturBeliView.vue';
import InvoiceView from '@/views/InvoiceView.vue';
import FormPengajuanPermintaanView from '@/views/FormPengajuanPermintaanView.vue';
import PengajuanPermintaanView from '@/views/PengajuanPermintaanView.vue';
import MutasiProduksiView from '@/views/MutasiProduksiView.vue';
import FormMutasiProduksiView from '@/views/FormMutasiProduksiView.vue';
import PengajuanPermintaanPrintView from '@/views/PengajuanPermintaanPrintView.vue';
import FormLhkFinishingView from '@/views/FormLhkFinishingView.vue';
import PenerimaanBahanPrint from '@/views/PenerimaanBahanPrint.vue';
import FormKoreksiStokView from '@/views/FormKoreksiStokView.vue';
import FormLhkMesinCetakView from '@/views/FormLhkMesinCetakView.vue';
import LhkMesinCetakView from '../views/LhkMesinCetakView.vue';
import LhkCetakMmtView from '@/views/LhkCetakMmtView.vue';
import PlanningProduksiView from '@/views/PlanningProduksiView.vue';
import CreateBarcodeView from '@/views/CreateBarcodeView.vue';
import LhkTekstilView from '@/views/LhkTekstilView.vue';
import LhkTekstilMmtView from '@/views/LhkTekstilMmtView.vue';
import SupplierView from '@/views/SupplierView.vue';
import FormSupplierView from '@/views/FormSupplierView.vue';
import FormReturProduksiView from '@/views/FormReturProduksiView.vue';
import { Form } from 'lucide-vue-next';
import ReturProduksiView from '@/views/ReturProduksiView.vue';
import FormMasterBahanView from '@/views/FormMasterBahanView.vue';
import FormLhkCetakMmtView from '@/views/FormLhkCetakMmtView.vue';
import StokOpnameView from '@/views/StokOpnameView.vue';
import LapLHKView from '@/views/LapLHKView.vue';


// 2. Definisikan Rute (Jalan)
const routes: RouteRecordRaw[] = [
    {
        path: '/login',
        name: 'Login',
        component: LoginView,
    },

    {
        path: '/',
        name: 'DashboardLayout',
        component: Dashboard,
        meta: { requiresAuth: true },
        children: [
            // Rute Default untuk Dashboard (Home)
            { path: '', name: 'Home', component: Home },

            // Rute yang sudah dibuat (PATH DIBUAT RELATIF - TANPA '/')
            { path: 'garmen/permintaan-material', name: 'Permintaan Material', component: MaterialRequestForm },
            { path: 'mmt/lhk/cetak-mmt', name: 'LHKCetakMMT', component: LhkCetakMmtView },
            { path: 'mmt/lhk/cetak-mmt/new', name: 'LhkCetakMmtNew', component: FormLhkCetakMmtView },
            { path: 'mmt/lhk/cetak-mmt/edit/:nomor', name: 'LhkCetakMmtEdit', component: FormLhkCetakMmtView, props: { isEditMode: false } },

            { path: 'mmt/lhk/cetak', name: 'LHKMesinCetakView', component: LhkMesinCetakView },
            { path: 'mmt/lhk/cetak/new', name: 'LhkCetakCreate', component: FormLhkMesinCetakView },
            { path: 'mmt/lhk/cetak/edit/:nomor', name: 'LhkCetakEdit', component: FormLhkMesinCetakView, props: { isEditMode: false } },
            { path: 'mmt/lhk/finishing', name: 'LHK Finishing MMT', component: LhkFinishingView },{
                path: 'mmt/lhk/finishing/new',
                name: 'LhkFinishingNew',
                component: FormLhkFinishingView,
                props: { isEditMode: false }
            },
            { path: 'mmt/daftar/stbj', name: 'STBJ MMT', component: StbjMmtBiew },
            { path: 'mmt/pengajuan-permintaan', name: 'PengajuanPermintaanBrowse', component: PengajuanPermintaanView },
            {
                path: 'mmt/pengajuan-permintaan/new',
                name: 'PengajuanPermintaanNew',
                component: FormPengajuanPermintaanView,
                props: { isEditMode: false }
            },
            {
                path: 'mmt/pengajuan-permintaan/edit/:nomor',
                name: 'PengajuanPermintaanEdit',
                component: FormPengajuanPermintaanView,
                props: { isEditMode: false }
            },
            {
                path: 'mmt/pengajuan-permintaan/print/:nomor',
                name: 'PengajuanPermintaanPrint',
                component: PengajuanPermintaanPrintView,
                props: true,
                meta: {
                    PrintLayout: true,
                    layout: "PrintLayout", 
                },
            },
            { path: 'mmt/permintaan-bahan', name: 'PermintaanBahanBrowse', component: PermintaanBahanView },

            {
                path: 'mmt/permintaan-bahan/new',
                name: 'PermintaanBahanNew',
                component: FormPermintaanBahanView,
                props: { isEditMode: false }
            },

            // 3. Ubah (Edit Existing)
            {
                path: 'mmt/permintaan-bahan/edit/:nomor',
                name: 'PermintaanBahanEdit',
                component: FormPermintaanBahanView,
                props: true
            },
            {
                path: 'mmt/permintaan-bahan/print/:nomor',
                name: 'PermintaanBahanPrint',
                component: PermintaanBahanPrintView,
                props: true,
                meta: {
                    PrintLayout: true, // Tagging untuk layout
                    layout: "PrintLayout", // Nama Layout yang akan digunakan
                },
            },
            { path: 'mmt/po-bahan-mmt', name: 'POBahanMmtBrowse', component: POBahanMmtView },
            {
                // 2. Rute untuk Halaman Input Baru
                path: 'mmt/po-bahan-mmt/new',
                name: 'PoBahanMmtNew',
                component: FormPoBahanMmtView,
                props: { isEditMode: false }
            },
            {
                path: 'mmt/po-bahan-mmt/edit/:nomor',
                name: 'PoBahanMmtEdit', // 👈 Nama Unik: Untuk mengedit
                component: FormPoBahanMmtView,
                props: (route) => ({
                    isEditMode: true,
                    nomor: route.params.nomor // Meneruskan parameter nomor
                })
            },
            {
                path: 'mmt/po-bahan-mmt/print/:nomor',
                name: 'PoPrint', // <--- NAMA INI HARUS SAMA PERSIS
                component: PoPrintView,
                props: true 
            },
            { path: 'mmt/penerimaan-bahan', name: 'PenerimaanBahanBrowse', component: penerimaanBahanView },

            // 2. Tambah Baru (New Entry)
            {
                path: 'mmt/penerimaan-bahan/new',
                name: 'PenerimaanBahanNew',
                component: FormPenerimaanBahanView,
                props: { isEditMode: false }
            },
            {
                path: 'mmt/penerimaan-bahan/edit/:nomor',
                name: 'PenerimaanBahanEdit',
                component: FormPenerimaanBahanView,
                props: true
            },
            {
                path: 'mmt/penerimaan-bahan/print/:nomor',
                name: 'PenerimaanBahanPrint',
                component: PenerimaanBahanPrint,
                props: true
            },

            { path: 'mmt/retur-beli', name: 'Retur Beli MMT', component: ReturBeliView },
            { path: 'mmt/retur-beli/new', name: 'ReturBeliNew', component: FormReturBeliView },

            { path: 'mmt/invoice', name: 'InvoiceBrowse', component: InvoiceView },
            {
                path: 'mmt/invoice/new',
                name: 'InvoiceNew',
                component: FormInvoiceView,
                props: { isEditMode: false }
            },
            { path: 'mmt/create-barcode', name: 'CreateBarcode', component: CreateBarcodeView },
            { path: 'mmt/create-barcode/new', name: 'CreateBarcodeNew', component: FormRecreateBarcode },
            { path: 'mmt/stok-opname', name: 'StokOpnameBrowse', component: StokOpnameView },
            { path: 'mmt/koreksi-stok', name: 'KoreksiStokBrowse', component: KoreksiStokMMTView },
            {
                path: 'mmt/koreksi-stok/new',
                name: 'KoreksiStokNew',
                component: FormKoreksiStokView,
                props: { isEditMode: false }
            },
            { path: 'mmt/permintaan-produksi', name: 'PermintaanProduksiBrowse', component: PermintaanProduksiView },
            {
                path: 'mmt/permintaan-produksi/new',
                name: 'PermintaanProduksiNew',
                component: FormPermintaanProduksiView,
                props: { isEditMode: false }
            },
            // 3. Ubah (Edit Existing)
            {
                path: 'mmt/permintaan-produksi/edit/:nomor',
                name: 'PermintaanProduksiEdit',
                component: FormPermintaanProduksiView,
                props: true
            },

            { path: 'mmt/realisasi-produksi', name: 'MutasiProduksiBrowse', component: MutasiProduksiView },
            {
                path: 'mmt/realisasi-produksi/new',
                name: 'MutasiProduksiNew',
                component: FormMutasiProduksiView,
                props: { isEditMode: false }
            },
            {
                path: 'mmt/realisasi-produksi/edit/:nomor',
                name: 'MutasiProduksiEdit',
                component: FormMutasiProduksiView,
                props: true
            },
            
            { path: 'mmt/retur-produksi', name: 'ReturProduksiBrowse', component: ReturProduksiView },
            {
                path: 'mmt/retur-produksi/new',
                name: 'ReturProduksiNew',
                component: FormReturProduksiView,
                props: { isEditMode: false }
            },
            // 3. Ubah (Edit Existing)
            {
                path: 'mmt/realisasi-produksi/edit/:nomor',
                name: 'ReturProduksiEdit',
                component: FormReturProduksiView,
                props: true
            },
            { path: 'mmt/planning-produksi', name: 'PlanningProduksiBrowse', component: PlanningProduksiView },

            // --- GRUP COMING SOON / UMUM (PATH DIBUAT RELATIF) ---
            { path: 'file/user', name: 'User', component: ComingSoon },
            { path: 'file/perusahaan', name: 'Identitas Perusahaan', component: ComingSoon },
            { path: 'file/ganti-password', name: 'Ganti Password', component: ComingSoon },
            { path: 'daftar/supplier', name: 'Supplier', component: SupplierView },            
            { path: 'daftar/supplier/new', name: 'SupplierNew', component: FormSupplierView },
            { path: 'daftar/supplier/edit/:kode', name: 'SupplierEdit', component: FormSupplierView, props: true },
            { path: 'daftar/kode-bayar', name: 'Kode Bayar', component: ComingSoon },
            { path: 'daftar/jenis-barang', name: 'Jenis Barang', component: ComingSoon },
            { path: 'daftar/gudang', name: 'Gudang', component: ComingSoon },
            { path: 'daftar/jasa', name: 'Jasa', component: ComingSoon },
            { path: 'daftar/gudang-produksi', name: 'Gudang Produksi', component: ComingSoon },
            { path: 'daftar/komponen-spk', name: 'Komponen SPK', component: ComingSoon },
            { path: 'daftar/customer', name: 'Customer', component: ComingSoon },
            { path: 'daftar/tanda-terima', name: 'Tanda Terima', component: ComingSoon },
            { path: 'daftar/jenis-order', name: 'Jenis Order', component: ComingSoon },
            { path: 'daftar/sales', name: 'Sales', component: ComingSoon },
            { path: 'daftar/barang', name: 'Barang', component: ComingSoon },
            { path: 'daftar/jenis-potongan', name: 'Jenis Potongan', component: ComingSoon },
            { path: 'daftar/bahan', name: 'Bahan', component: ComingSoon },
            { path: 'pembelian/mkb', name: 'MKB', component: ComingSoon },
            { path: 'pembelian/po-bahan', name: 'PO Bahan', component: ComingSoon },
            { path: 'pembelian/input-ppn', name: 'Input PPN', component: ComingSoon },
            { path: 'pembelian/retur-ppn', name: 'Retur PPN', component: ComingSoon },
            { path: 'pembelian/retur-beli', name: 'Retur Pembelian', component: ComingSoon },
            { path: 'garmen/bpb-bahan', name: 'BPB Bahan', component: ComingSoon },
            { path: 'garmen/po-jasa', name: 'PO Jasa', component: ComingSoon },
            { path: 'garmen/po-paper-print', name: 'PO Paper Print', component: ComingSoon },
            { path: 'garmen/bpb-jasa', name: 'BPB Jasa', component: ComingSoon },
            { path: 'garmen/stbj', name: 'STBJ', component: ComingSoon },
            { path: 'garmen/mutasi-produksi', name: 'Mutasi Produksi', component: ComingSoon },
            { path: 'garmen/retur-material', name: 'Retur Material', component: ComingSoon },
            { path: 'garmen/koreksi-stok-jadi', name: 'Koreksi Stok Barang Jadi', component: ComingSoon },
            { path: 'garmen/koreksi-stok-bahan', name: 'Koreksi Stok Bahan Baku', component: ComingSoon },
            { path: 'garmen/bpb-non-po', name: 'BPB Non PO', component: ComingSoon },
            { path: 'garmen/jadwal-kirim-produksi', name: 'Jadwal Kirim Produksi', component: ComingSoon },
            { path: 'spanduk/terima-supplier', name: 'Terima Supplier', component: ComingSoon },
            { path: 'spanduk/retur-beli', name: 'Retur Beli', component: ComingSoon },
            { path: 'spanduk/mutasi-gudang', name: 'Mutasi Gudang Spanduk', component: ComingSoon },
            { path: 'spanduk/permintaan-produksi', name: 'Permintaan Produksi Spanduk', component: ComingSoon },
            { path: 'spanduk/realisasi-produksi', name: 'Realisasi Produksi Spanduk', component: ComingSoon },
            { path: 'spanduk/anval', name: 'Anval', component: ComingSoon },
            { path: 'spanduk/penjualan', name: 'Penjualan Spanduk', component: ComingSoon },
            { path: 'spanduk/koreksi-stok', name: 'Koreksi Stok v2', component: ComingSoon },
            { path: 'spanduk/spk-tambahan', name: 'SPK Tambahan', component: ComingSoon },
            { path: 'spanduk/monitoring-proof', name: 'Monitoring Proof', component: ComingSoon },
            { path: 'spanduk/lhk-cetak', name: 'LHK Cetak Spanduk', component: ComingSoon },
            { path: 'spanduk/lhk-jahit', name: 'LHK Jahit Spanduk', component: ComingSoon },
            { path: 'spanduk/lhk-lipat', name: 'LHK Lipat Spanduk', component: ComingSoon },
            { path: 'spanduk/lhk-quiring', name: 'LHK Quiring Spanduk', component: ComingSoon },
            { path: 'spanduk/mon-cetak', name: 'Mon Cetak Spanduk', component: ComingSoon },
            { path: 'spanduk/mon-jahit', name: 'Mon Jahit Spanduk', component: ComingSoon },
            { path: 'spanduk/mon-lipat', name: 'Mon Lipat Spanduk', component: ComingSoon },
            { path: 'spanduk/mon-quiring', name: 'Mon Quiring Spanduk', component: ComingSoon },

            // --- GRUP MMT (LANJUTAN) ---

            { path: 'mmt/daftar/bahan', name: 'Master Bahan', component: MasterBahanView },
            { path: 'mmt/daftar/bahan/new', name: 'MasterBahanNew', component: FormMasterBahanView },
            { path: 'mmt/daftar/operator', name: 'Operator', component: OperatorView },
            { path: 'mmt/daftar/retur-permintaan-produksi', name: 'Retur Permintaan Produksi MMT', component: ComingSoon },
            { path: 'mmt/daftar/planning-produksi', name: 'Planning Produksi MMT', component: ComingSoon },
            { path: 'mmt/daftar/stbj', name: 'STBJ MMT', component: ComingSoon },
            { path: 'mmt/lhk/kain', name: 'tekstilMMT', component: LhkTekstilMmtView },
            { path: 'mmt/lhk/proof', name: 'LHK Proof MMT', component: ComingSoon },
            { path: 'mmt/lhk/sublim', name: 'LHK Sublim MMT', component: ComingSoon },
            { path: 'mmt/lhk/rtr', name: 'LHK RTR MMT', component: ComingSoon },
            { path: 'mmt/bs-digital', name: 'BS & Sisa Digital Print', component: ComingSoon },
            { path: 'mmt/bs-tekstil', name: 'BS & Sisa Tekstil', component: ComingSoon },
            { path: 'mmt/bahan-sisa', name: 'Bahan Sisa MMT', component: ComingSoon },
            { path: 'mmt/po-paperprint', name: 'PO Paperprint MMT', component: POPaperprintView },
            { path: 'mmt/penerimaan-po-external', name: 'Penerimaan PO External MMT', component: ComingSoon },

            // Rute untuk "Produksi MMT"
            { path: 'produksi-mmt/mon/cetak', name: 'Monitoring Cetak MMT', component: ComingSoon },
            { path: 'produksi-mmt/mon/finishing', name: 'Monitoring Finishing MMT', component: ComingSoon },
            { path: 'produksi-mmt/mon/proof', name: 'Monitoring Proof MMT', component: ComingSoon },
            { path: 'produksi-mmt/mon/sublim', name: 'Monitoring Sublim MMT', component: ComingSoon },
            { path: 'produksi-mmt/mon/rtr', name: 'Monitoring RTR MMT', component: ComingSoon },
            { path: 'produksi-mmt/mon/tekstil', name: 'Monitoring Tekstil MMT', component: ComingSoon },
            { path: 'laporan/mmt/ls-bahan-utama', name: 'LS Bahan Utama', component: LapLsBahanUtamaView },
            { path: 'laporan/mmt/ls-bahan-penolong', name: 'LS Bahan Penolong', component: LapLsBahanPenolongView },
            { path: 'laporan/mmt/lap-mon-lmkp-mmt', name: 'lapMonLmkpMmt', component: LapMonLmkpMmtView },
            { path: 'laporan/mmt/lap-mon-cetak', name: 'lapMonCetak', component: LapMonCetakView },
            { path: 'laporan/mmt/lap-spk-mmt', name: 'lapSpkMmt', component: LapSpkMmtView },
            { path: 'laporan/mmt/lap-plan-produksi', name: 'lapPlanProduksi', component: LapPlanProdView },
            { path: 'laporan/mmt/lap-barang-jadi', name: 'lapBarangJadi', component: LapBarangJadiView },
            { path: 'laporan/mmt/lap-stok-tinta', name: 'lapStokTinta', component: LapStokTintaMmtView },
            { path: 'laporan/mmt/lap-output-mesin', name: 'lapOutputMesin', component: LapOutputMesinView },
            { path: 'laporan/mmt/lap-lhk', name: 'LapLHK', component: LapLHKView },

            { path: 'produksi-mmt/ls-tinta', name: 'LS Tinta', component: ComingSoon },
            { path: 'produksi-mmt/ls-bahan-kain', name: 'LS Bahan Kain', component: ComingSoon },
            { path: 'produksi-mmt/kartu-stock-bahan', name: 'Kartu Stock Bahan MMT', component: ComingSoon },
            { path: 'produksi-mmt/lap-bs-digital', name: 'Lap BS & Sisa Digital Print', component: ComingSoon },
            { path: 'produksi-mmt/lap-bs-tekstil', name: 'Lap BS & Sisa Tekstil', component: ComingSoon },
            { path: 'produksi-mmt/spk-stbj-sj', name: 'SPK vs STBJ vs SJ (MMT)', component: ComingSoon },
            { path: 'produksi-mmt/lap-mon-brg-jadi', name: 'Lap Monitoring Barang Jadi', component: ComingSoon },
            { path: 'produksi-mmt/lap-lpbu', name: 'Laporan LPBU Digital Print', component: ComingSoon },
            { path: 'produksi-mmt/ls-sisa-mmt', name: 'LS Bahan Sisa MMT', component: ComingSoon },
            { path: 'produksi-mmt/ls-sisa-tekstil', name: 'LS Bahan Sisa Tekstil', component: ComingSoon },
            { path: 'laporan/marketing/target-vs-realisasi', name: 'Lap Target vs Realisasi', component: ComingSoon },
            { path: 'laporan/marketing/proyeksi-vs-realisasi', name: 'Lap Proyeksi vs Realisasi', component: ComingSoon },
        ],
    },
];

// 3. Buat router
const router = createRouter({
    history: createWebHistory(),
    routes,
    linkActiveClass: 'router-link-active',
    linkExactActiveClass: 'router-link-exact-active',
});

// 🧭 NAVIGATION GUARD (Perbaikan Akhir)
router.beforeEach((to, from, next) => {
    // Dapatkan instance store. Harus dipanggil di dalam function.
    const authStore = useAuthStore();

    // 1. Dapatkan status autentikasi dari Pinia Store (menggunakan Getter yang sudah dibuat)
    const loggedIn = authStore.isAuthenticated;

    // 2. Cek apakah rute tujuan memerlukan autentikasi (meta: { requiresAuth: true })
    const requiresAuth = Boolean(to.meta?.requiresAuth);

    if (requiresAuth && !loggedIn) {
        // A. Jika rute memerlukan auth TAPI pengguna belum login (atau token expired)

        // Panggil action handleSessionExpired untuk membersihkan data lokal
        if (authStore.isTokenExpired) {
            authStore.handleSessionExpired();
        }

        // Redirect ke Login, simpan tujuan awal di query
        return next({ name: 'Login', query: { redirect: to.fullPath } });
    }

    if (to.name === 'Login' && loggedIn) {
        // B. Jika pengguna SUDAH login TAPI mencoba mengakses halaman Login
        // Redirect ke halaman utama (Home)
        return next({ name: 'Home' });
    }

    // C. Lanjutkan navigasi (sudah login, atau rute tidak memerlukan auth)
    return next();
});

export default router;
