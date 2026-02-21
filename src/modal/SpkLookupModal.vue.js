import { ref, watch } from "vue";
import api from "@/services/api";
import { useToast } from "vue-toastification";
const props = defineProps();
const emit = defineEmits();
const toast = useToast();
// --- State ---
const API_URL = "/mmt/SPK/lookup";
const SPKList = ref([]);
const searchKeyword = ref("");
const loading = ref(false);
const headers = [
    { title: "Nomor SPK", key: "SPK", width: "200px" },
    { title: "Nama Proyek/SPK", key: "Nama", width: "450px" },
    { title: "Tanggal", key: "Tanggal", width: "120px" },
    { title: "Target", key: "Jumlah", width: "90px", align: "end" },
    {
        title: "Sdh Cetak",
        key: "Sudah_Cetak",
        width: "90px",
        align: "end",
    },
    {
        title: "Kurang",
        key: "Kurang_Cetak",
        width: "90px",
        align: "end",
    },
    {
        title: "Aksi",
        key: "actions",
        sortable: false,
        width: "100px",
        align: "center",
    },
];
// --- API & Logic ---
const fetchSPKData = async () => {
    loading.value = true;
    try {
        // 1. Sesuaikan Tipe Generic Axios untuk menangkap { success, data }
        const response = await api.get(API_URL, {
            params: { keyword: searchKeyword.value },
        });
        // 2. Ambil data dari properti .data (sesuai struktur controller backend)
        const allData = response.data.data || [];
        // 3. Simpan ke state
        SPKList.value = !searchKeyword.value ? allData.slice(0, 200) : allData;
    }
    catch (error) {
        const err = error;
        console.error("Fetch SPK Error:", err); // Log untuk debug
        toast.error("Gagal memuat daftar SPK. Periksa koneksi backend.");
        SPKList.value = [];
    }
    finally {
        loading.value = false;
    }
};
const selectSPK = (SPK) => {
    if (!SPK.SPK) {
        toast.error("Error: Nomor SPK kosong.");
        return;
    }
    // 4. Pastikan Sudah_Cetak dan Kurang_Cetak ikut dikirim ke Parent
    emit("select", {
        Spk: SPK.SPK,
        Nama: SPK.Nama,
        Tanggal: SPK.Tanggal,
        Panjang: SPK.Panjang,
        Lebar: SPK.Lebar,
        Divisi: SPK.Divisi,
        Bahan: SPK.Bahan,
        Gramasi: SPK.Gramasi,
        Jumlah: SPK.Jumlah,
        Jumlah_jadi: SPK.Jumlah_jadi,
        Sudah_Cetak: SPK.Sudah_Cetak || 0,
        Kurang_Cetak: SPK.Kurang_Cetak || 0,
    });
    emit("close");
};
/**
 * Handler untuk double click pada baris tabel
 */
const handleDoubleClick = (_event, { item }) => {
    selectSPK(item);
};
watch(() => props.isVisible, (newValue) => {
    if (newValue) {
        searchKeyword.value = "";
        fetchSPKData();
    }
    else {
        SPKList.value = [];
    }
}, { immediate: true });
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['desktop-table']} */ ;
/** @type {__VLS_StyleScopedClasses['desktop-table']} */ ;
/** @type {__VLS_StyleScopedClasses['desktop-table']} */ ;
/** @type {__VLS_StyleScopedClasses['clickable-row']} */ ;
const __VLS_0 = {}.VDialog;
/** @type {[typeof __VLS_components.VDialog, typeof __VLS_components.vDialog, typeof __VLS_components.VDialog, typeof __VLS_components.vDialog, ]} */ ;
// @ts-ignore
VDialog;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.isVisible),
    maxWidth: "1000px",
    persistent: true,
}));
const __VLS_2 = __VLS_1({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.isVisible),
    maxWidth: "1000px",
    persistent: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (...[$event]) => {
            __VLS_ctx.emit('close');
            // @ts-ignore
            [isVisible, emit,];
        } });
var __VLS_7 = {};
const { default: __VLS_8 } = __VLS_3.slots;
const __VLS_9 = {}.VCard;
/** @type {[typeof __VLS_components.VCard, typeof __VLS_components.vCard, typeof __VLS_components.VCard, typeof __VLS_components.vCard, ]} */ ;
// @ts-ignore
VCard;
// @ts-ignore
const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({
    ...{ class: "dialog-card d-flex flex-column" },
    ...{ style: "height: 85vh" },
}));
const __VLS_11 = __VLS_10({
    ...{ class: "dialog-card d-flex flex-column" },
    ...{ style: "height: 85vh" },
}, ...__VLS_functionalComponentArgsRest(__VLS_10));
const { default: __VLS_14 } = __VLS_12.slots;
const __VLS_15 = {}.VToolbar;
/** @type {[typeof __VLS_components.VToolbar, typeof __VLS_components.vToolbar, typeof __VLS_components.VToolbar, typeof __VLS_components.vToolbar, ]} */ ;
// @ts-ignore
VToolbar;
// @ts-ignore
const __VLS_16 = __VLS_asFunctionalComponent(__VLS_15, new __VLS_15({
    color: "primary",
    density: "compact",
}));
const __VLS_17 = __VLS_16({
    color: "primary",
    density: "compact",
}, ...__VLS_functionalComponentArgsRest(__VLS_16));
const { default: __VLS_20 } = __VLS_18.slots;
const __VLS_21 = {}.VToolbarTitle;
/** @type {[typeof __VLS_components.VToolbarTitle, typeof __VLS_components.vToolbarTitle, typeof __VLS_components.VToolbarTitle, typeof __VLS_components.vToolbarTitle, ]} */ ;
// @ts-ignore
VToolbarTitle;
// @ts-ignore
const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({
    ...{ class: "text-subtitle-1 font-weight-bold" },
}));
const __VLS_23 = __VLS_22({
    ...{ class: "text-subtitle-1 font-weight-bold" },
}, ...__VLS_functionalComponentArgsRest(__VLS_22));
const { default: __VLS_26 } = __VLS_24.slots;
var __VLS_24;
const __VLS_27 = {}.VSpacer;
/** @type {[typeof __VLS_components.VSpacer, typeof __VLS_components.vSpacer, typeof __VLS_components.VSpacer, typeof __VLS_components.vSpacer, ]} */ ;
// @ts-ignore
VSpacer;
// @ts-ignore
const __VLS_28 = __VLS_asFunctionalComponent(__VLS_27, new __VLS_27({}));
const __VLS_29 = __VLS_28({}, ...__VLS_functionalComponentArgsRest(__VLS_28));
const __VLS_33 = {}.VBtn;
/** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
// @ts-ignore
VBtn;
// @ts-ignore
const __VLS_34 = __VLS_asFunctionalComponent(__VLS_33, new __VLS_33({
    ...{ 'onClick': {} },
    icon: "mdi-close",
    variant: "text",
    size: "small",
}));
const __VLS_35 = __VLS_34({
    ...{ 'onClick': {} },
    icon: "mdi-close",
    variant: "text",
    size: "small",
}, ...__VLS_functionalComponentArgsRest(__VLS_34));
let __VLS_38;
const __VLS_39 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.emit('close');
            // @ts-ignore
            [emit,];
        } });
var __VLS_36;
var __VLS_37;
var __VLS_18;
const __VLS_41 = {}.VCardText;
/** @type {[typeof __VLS_components.VCardText, typeof __VLS_components.vCardText, typeof __VLS_components.VCardText, typeof __VLS_components.vCardText, ]} */ ;
// @ts-ignore
VCardText;
// @ts-ignore
const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({
    ...{ class: "pa-4 d-flex flex-column flex-grow-1" },
}));
const __VLS_43 = __VLS_42({
    ...{ class: "pa-4 d-flex flex-column flex-grow-1" },
}, ...__VLS_functionalComponentArgsRest(__VLS_42));
const { default: __VLS_46 } = __VLS_44.slots;
const __VLS_47 = {}.VTextField;
/** @type {[typeof __VLS_components.VTextField, typeof __VLS_components.vTextField, typeof __VLS_components.VTextField, typeof __VLS_components.vTextField, ]} */ ;
// @ts-ignore
VTextField;
// @ts-ignore
const __VLS_48 = __VLS_asFunctionalComponent(__VLS_47, new __VLS_47({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.searchKeyword),
    label: "Cari Nomor atau Nama SPK...",
    prependInnerIcon: "mdi-magnify",
    variant: "outlined",
    density: "compact",
    clearable: true,
    ...{ class: "mb-4 flex-shrink-0" },
    hideDetails: true,
}));
const __VLS_49 = __VLS_48({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.searchKeyword),
    label: "Cari Nomor atau Nama SPK...",
    prependInnerIcon: "mdi-magnify",
    variant: "outlined",
    density: "compact",
    clearable: true,
    ...{ class: "mb-4 flex-shrink-0" },
    hideDetails: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_48));
let __VLS_52;
const __VLS_53 = ({ keyup: {} },
    { onKeyup: (__VLS_ctx.fetchSPKData) });
// @ts-ignore
[searchKeyword, fetchSPKData,];
var __VLS_50;
var __VLS_51;
const __VLS_55 = {}.VDataTable;
/** @type {[typeof __VLS_components.VDataTable, typeof __VLS_components.vDataTable, typeof __VLS_components.VDataTable, typeof __VLS_components.vDataTable, ]} */ ;
// @ts-ignore
VDataTable;
// @ts-ignore
const __VLS_56 = __VLS_asFunctionalComponent(__VLS_55, new __VLS_55({
    ...{ 'onDblclick:row': {} },
    headers: (__VLS_ctx.headers),
    items: (__VLS_ctx.SPKList),
    loading: (__VLS_ctx.loading),
    hover: true,
    ...{ class: "desktop-table flex-grow-1 clickable-row" },
    density: "compact",
    itemKey: "SPK",
    fixedHeader: true,
    itemsPerPage: (20),
}));
const __VLS_57 = __VLS_56({
    ...{ 'onDblclick:row': {} },
    headers: (__VLS_ctx.headers),
    items: (__VLS_ctx.SPKList),
    loading: (__VLS_ctx.loading),
    hover: true,
    ...{ class: "desktop-table flex-grow-1 clickable-row" },
    density: "compact",
    itemKey: "SPK",
    fixedHeader: true,
    itemsPerPage: (20),
}, ...__VLS_functionalComponentArgsRest(__VLS_56));
let __VLS_60;
const __VLS_61 = ({ 'dblclick:row': {} },
    { 'onDblclick:row': (__VLS_ctx.handleDoubleClick) });
const { default: __VLS_62 } = __VLS_58.slots;
// @ts-ignore
[headers, SPKList, loading, handleDoubleClick,];
{
    const { 'item.SPK': __VLS_63 } = __VLS_58.slots;
    const [{ item }] = __VLS_getSlotParameters(__VLS_63);
    (item.SPK);
}
{
    const { 'item.Nama': __VLS_64 } = __VLS_58.slots;
    const [{ item }] = __VLS_getSlotParameters(__VLS_64);
    (item.Nama);
}
{
    const { 'item.Tanggal': __VLS_65 } = __VLS_58.slots;
    const [{ item }] = __VLS_getSlotParameters(__VLS_65);
    (item.Tanggal
        ? new Date(item.Tanggal).toLocaleDateString("id-ID")
        : "-");
}
{
    const { 'item.Divisi': __VLS_66 } = __VLS_58.slots;
    const [{ item }] = __VLS_getSlotParameters(__VLS_66);
    (item.Divisi);
}
{
    const { 'item.actions': __VLS_67 } = __VLS_58.slots;
    const [{ item }] = __VLS_getSlotParameters(__VLS_67);
    __VLS_asFunctionalElement(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-center" },
    });
    const __VLS_68 = {}.VBtn;
    /** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
    // @ts-ignore
    VBtn;
    // @ts-ignore
    const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
        ...{ 'onClick': {} },
        color: "success",
        size: "x-small",
        variant: "tonal",
    }));
    const __VLS_70 = __VLS_69({
        ...{ 'onClick': {} },
        color: "success",
        size: "x-small",
        variant: "tonal",
    }, ...__VLS_functionalComponentArgsRest(__VLS_69));
    let __VLS_73;
    const __VLS_74 = ({ click: {} },
        { onClick: (...[$event]) => {
                __VLS_ctx.selectSPK(item);
                // @ts-ignore
                [selectSPK,];
            } });
    const { default: __VLS_75 } = __VLS_71.slots;
    var __VLS_71;
    var __VLS_72;
}
{
    const { 'no-data': __VLS_76 } = __VLS_58.slots;
    __VLS_asFunctionalElement(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-center pa-4" },
    });
}
{
    const { loading: __VLS_77 } = __VLS_58.slots;
    const __VLS_78 = {}.VProgressLinear;
    /** @type {[typeof __VLS_components.VProgressLinear, typeof __VLS_components.vProgressLinear, typeof __VLS_components.VProgressLinear, typeof __VLS_components.vProgressLinear, ]} */ ;
    // @ts-ignore
    VProgressLinear;
    // @ts-ignore
    const __VLS_79 = __VLS_asFunctionalComponent(__VLS_78, new __VLS_78({
        indeterminate: true,
        color: "primary",
    }));
    const __VLS_80 = __VLS_79({
        indeterminate: true,
        color: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_79));
}
var __VLS_58;
var __VLS_59;
var __VLS_44;
const __VLS_84 = {}.VCardActions;
/** @type {[typeof __VLS_components.VCardActions, typeof __VLS_components.vCardActions, typeof __VLS_components.VCardActions, typeof __VLS_components.vCardActions, ]} */ ;
// @ts-ignore
VCardActions;
// @ts-ignore
const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
    ...{ class: "d-flex justify-end" },
}));
const __VLS_86 = __VLS_85({
    ...{ class: "d-flex justify-end" },
}, ...__VLS_functionalComponentArgsRest(__VLS_85));
const { default: __VLS_89 } = __VLS_87.slots;
const __VLS_90 = {}.VBtn;
/** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
// @ts-ignore
VBtn;
// @ts-ignore
const __VLS_91 = __VLS_asFunctionalComponent(__VLS_90, new __VLS_90({
    ...{ 'onClick': {} },
    color: "secondary",
    variant: "flat",
}));
const __VLS_92 = __VLS_91({
    ...{ 'onClick': {} },
    color: "secondary",
    variant: "flat",
}, ...__VLS_functionalComponentArgsRest(__VLS_91));
let __VLS_95;
const __VLS_96 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.emit('close');
            // @ts-ignore
            [emit,];
        } });
const { default: __VLS_97 } = __VLS_93.slots;
var __VLS_93;
var __VLS_94;
var __VLS_87;
var __VLS_12;
var __VLS_3;
var __VLS_4;
/** @type {__VLS_StyleScopedClasses['dialog-card']} */ ;
/** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-column']} */ ;
/** @type {__VLS_StyleScopedClasses['text-subtitle-1']} */ ;
/** @type {__VLS_StyleScopedClasses['font-weight-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['pa-4']} */ ;
/** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-column']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-grow-1']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['desktop-table']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-grow-1']} */ ;
/** @type {__VLS_StyleScopedClasses['clickable-row']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['pa-4']} */ ;
/** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};
