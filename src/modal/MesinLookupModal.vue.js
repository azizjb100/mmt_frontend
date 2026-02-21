import { ref, watch, defineProps, defineEmits, computed } from "vue";
import api from "@/services/api";
import { useToast } from "vue-toastification";
const props = defineProps();
const emit = defineEmits();
const toast = useToast();
// --- State ---
// Endpoint yang sesuai dengan backend Node.js/Express lookup service
// (GET /api/v1/lookup/mesin)
const API_URL = "/mmt/lookup/mesin";
const mesinList = ref([]);
const searchKeyword = ref("");
const loading = ref(false);
// --- Konfigurasi Header v-data-table ---
const headers = [
    { title: "Kode", key: "Kode", width: "150px" },
    { title: "Nama Mesin", key: "Nama", width: "300px" },
    { title: "Keterangan", key: "Keterangan", width: "250px" },
    {
        title: "Aksi",
        key: "actions",
        sortable: false,
        width: "100px",
        align: "center",
    },
];
// --- Computed untuk Filter Sisi Klien ---
// Mengingat backend lookup tidak selalu support pencarian kompleks, kita filter di klien.
const filteredMesinList = computed(() => {
    if (!searchKeyword.value) {
        return mesinList.value;
    }
    const keyword = searchKeyword.value.toLowerCase();
    return mesinList.value.filter((m) => m.Kode.toLowerCase().includes(keyword) ||
        m.Nama.toLowerCase().includes(keyword) ||
        (m.Keterangan && m.Keterangan.toLowerCase().includes(keyword)));
});
// --- API & Logic ---
const fetchMesinData = async () => {
    loading.value = true;
    try {
        // Panggil endpoint GET /api/v1/lookup/mesin
        const response = await api.get(API_URL);
        mesinList.value = response.data.data || [];
    }
    catch (error) {
        const err = error;
        const errorMessage = err.response?.data?.message ||
            "Gagal memuat daftar Mesin.";
        toast.error(errorMessage);
        mesinList.value = [];
    }
    finally {
        loading.value = false;
    }
};
const selectMesin = (mesin) => {
    if (!mesin.Kode) {
        toast.error("Error: Kode Mesin kosong.");
        return;
    }
    // Mengirim objek mesin lengkap ke form pemanggil
    emit("select", mesin);
    emit("close");
};
// --- Watchers & Lifecycle ---
// Muat data saat modal terlihat
watch(() => props.isVisible, (newValue) => {
    if (newValue) {
        searchKeyword.value = ""; // Reset keyword saat modal dibuka
        fetchMesinData();
    }
    else {
        mesinList.value = []; // Bersihkan list data saat ditutup
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
const __VLS_0 = {}.VDialog;
/** @type {[typeof __VLS_components.VDialog, typeof __VLS_components.vDialog, typeof __VLS_components.VDialog, typeof __VLS_components.vDialog, ]} */ ;
// @ts-ignore
VDialog;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.isVisible),
    maxWidth: "800px",
    persistent: true,
}));
const __VLS_2 = __VLS_1({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.isVisible),
    maxWidth: "800px",
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
    ...{ style: "height: 65vh" },
}));
const __VLS_11 = __VLS_10({
    ...{ class: "dialog-card d-flex flex-column" },
    ...{ style: "height: 65vh" },
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
    label: "Cari Kode, Nama Mesin, atau Keterangan...",
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
    label: "Cari Kode, Nama Mesin, atau Keterangan...",
    prependInnerIcon: "mdi-magnify",
    variant: "outlined",
    density: "compact",
    clearable: true,
    ...{ class: "mb-4 flex-shrink-0" },
    hideDetails: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_48));
let __VLS_52;
const __VLS_53 = ({ keyup: {} },
    { onKeyup: (__VLS_ctx.fetchMesinData) });
// @ts-ignore
[searchKeyword, fetchMesinData,];
var __VLS_50;
var __VLS_51;
const __VLS_55 = {}.VDataTable;
/** @type {[typeof __VLS_components.VDataTable, typeof __VLS_components.vDataTable, typeof __VLS_components.VDataTable, typeof __VLS_components.vDataTable, ]} */ ;
// @ts-ignore
VDataTable;
// @ts-ignore
const __VLS_56 = __VLS_asFunctionalComponent(__VLS_55, new __VLS_55({
    headers: (__VLS_ctx.headers),
    items: (__VLS_ctx.filteredMesinList),
    loading: (__VLS_ctx.loading),
    hover: true,
    ...{ class: "desktop-table flex-grow-1" },
    density: "compact",
    itemKey: "Kode",
    fixedHeader: true,
    itemsPerPage: (10),
}));
const __VLS_57 = __VLS_56({
    headers: (__VLS_ctx.headers),
    items: (__VLS_ctx.filteredMesinList),
    loading: (__VLS_ctx.loading),
    hover: true,
    ...{ class: "desktop-table flex-grow-1" },
    density: "compact",
    itemKey: "Kode",
    fixedHeader: true,
    itemsPerPage: (10),
}, ...__VLS_functionalComponentArgsRest(__VLS_56));
const { default: __VLS_60 } = __VLS_58.slots;
// @ts-ignore
[headers, filteredMesinList, loading,];
{
    const { 'item.Kode': __VLS_61 } = __VLS_58.slots;
    const [{ item }] = __VLS_getSlotParameters(__VLS_61);
    (item.Kode);
}
{
    const { 'item.Nama': __VLS_62 } = __VLS_58.slots;
    const [{ item }] = __VLS_getSlotParameters(__VLS_62);
    (item.Nama);
}
{
    const { 'item.Keterangan': __VLS_63 } = __VLS_58.slots;
    const [{ item }] = __VLS_getSlotParameters(__VLS_63);
    (item.Keterangan);
}
{
    const { 'item.actions': __VLS_64 } = __VLS_58.slots;
    const [{ item }] = __VLS_getSlotParameters(__VLS_64);
    __VLS_asFunctionalElement(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-center" },
    });
    const __VLS_65 = {}.VBtn;
    /** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
    // @ts-ignore
    VBtn;
    // @ts-ignore
    const __VLS_66 = __VLS_asFunctionalComponent(__VLS_65, new __VLS_65({
        ...{ 'onClick': {} },
        color: "success",
        size: "x-small",
        variant: "tonal",
    }));
    const __VLS_67 = __VLS_66({
        ...{ 'onClick': {} },
        color: "success",
        size: "x-small",
        variant: "tonal",
    }, ...__VLS_functionalComponentArgsRest(__VLS_66));
    let __VLS_70;
    const __VLS_71 = ({ click: {} },
        { onClick: (...[$event]) => {
                __VLS_ctx.selectMesin(item);
                // @ts-ignore
                [selectMesin,];
            } });
    const { default: __VLS_72 } = __VLS_68.slots;
    var __VLS_68;
    var __VLS_69;
}
{
    const { 'no-data': __VLS_73 } = __VLS_58.slots;
    __VLS_asFunctionalElement(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-center pa-4" },
    });
}
{
    const { loading: __VLS_74 } = __VLS_58.slots;
    const __VLS_75 = {}.VProgressLinear;
    /** @type {[typeof __VLS_components.VProgressLinear, typeof __VLS_components.vProgressLinear, typeof __VLS_components.VProgressLinear, typeof __VLS_components.vProgressLinear, ]} */ ;
    // @ts-ignore
    VProgressLinear;
    // @ts-ignore
    const __VLS_76 = __VLS_asFunctionalComponent(__VLS_75, new __VLS_75({
        indeterminate: true,
        color: "primary",
    }));
    const __VLS_77 = __VLS_76({
        indeterminate: true,
        color: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_76));
}
var __VLS_58;
var __VLS_44;
const __VLS_81 = {}.VCardActions;
/** @type {[typeof __VLS_components.VCardActions, typeof __VLS_components.vCardActions, typeof __VLS_components.VCardActions, typeof __VLS_components.vCardActions, ]} */ ;
// @ts-ignore
VCardActions;
// @ts-ignore
const __VLS_82 = __VLS_asFunctionalComponent(__VLS_81, new __VLS_81({
    ...{ class: "d-flex justify-end" },
}));
const __VLS_83 = __VLS_82({
    ...{ class: "d-flex justify-end" },
}, ...__VLS_functionalComponentArgsRest(__VLS_82));
const { default: __VLS_86 } = __VLS_84.slots;
const __VLS_87 = {}.VBtn;
/** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
// @ts-ignore
VBtn;
// @ts-ignore
const __VLS_88 = __VLS_asFunctionalComponent(__VLS_87, new __VLS_87({
    ...{ 'onClick': {} },
    color: "secondary",
    variant: "flat",
}));
const __VLS_89 = __VLS_88({
    ...{ 'onClick': {} },
    color: "secondary",
    variant: "flat",
}, ...__VLS_functionalComponentArgsRest(__VLS_88));
let __VLS_92;
const __VLS_93 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.emit('close');
            // @ts-ignore
            [emit,];
        } });
const { default: __VLS_94 } = __VLS_90.slots;
var __VLS_90;
var __VLS_91;
var __VLS_84;
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
