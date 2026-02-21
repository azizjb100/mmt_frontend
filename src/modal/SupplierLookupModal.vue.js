import { ref, onMounted, computed, defineProps, defineEmits } from 'vue';
import api from '@/services/api';
import { useToast } from 'vue-toastification';
const props = defineProps();
const emit = defineEmits();
const toast = useToast();
const suppliers = ref([]);
const searchTerm = ref('');
const isLoading = ref(false);
// --- Header v-data-table diperluas (FIXED TYPE) ---
// FIX UTAMA: Menetapkan tipe 'align' sebagai literal type yang diizinkan Vuetify 3
const headers = [
    { title: 'Kode', key: 'Kode', sortable: false, width: '120px' },
    { title: 'Nama', key: 'Nama', sortable: false, width: '250px' },
    { title: 'Kota', key: 'Kota', sortable: false, width: '150px' },
    { title: 'Telp', key: 'Telp', sortable: false, width: '150px' },
    { title: 'Aksi', key: 'actions', sortable: false, width: '80px', align: 'center' }, // Menggunakan 'center' as const
]; // Menetapkan seluruh array sebagai const yang readonly
// --- API & Logic (TETAP SAMA) ---
const fetchSuppliers = async (query) => {
    isLoading.value = true;
    try {
        const response = await api.get('/supplier', { params: { q: query } });
        suppliers.value = response.data.data || [];
    }
    catch (error) {
        const err = error;
        if (err.response?.data?.message) {
            toast.error(err.response.data.message);
        }
        else if (err.message) {
            toast.error(err.message);
        }
        else {
            toast.error("Gagal mengambil daftar supplier.");
        }
        suppliers.value = [];
    }
    finally {
        isLoading.value = false;
    }
};
// Filter dilakukan secara lokal (client-side)
const filteredSuppliers = computed(() => {
    if (!searchTerm.value) {
        return suppliers.value;
    }
    const lowerCaseSearch = searchTerm.value.toLowerCase();
    return suppliers.value.filter(supplier => 
    // FIX: Menggunakan Kode, Nama, Kota
    supplier.Kode.toLowerCase().includes(lowerCaseSearch) ||
        supplier.Nama.toLowerCase().includes(lowerCaseSearch) ||
        supplier.Kota.toLowerCase().includes(lowerCaseSearch));
});
// Aksi saat tombol 'Pilih' diklik atau baris diklik
const selectSupplier = (supplier) => {
    emit('select', supplier); // Emit event 'select' (sesuai Parent Component)
    emit('close'); // Tutup modal
};
onMounted(fetchSuppliers);
// Tambahkan watch untuk memuat ulang data saat searchTerm berubah (Opsional)
/* Jika Anda ingin pencarian dilakukan setiap kali user mengetik, gunakan watch dengan debounce:
import debounce from 'lodash/debounce';
const debouncedSearch = debounce(fetchAllSuppliers, 300);
watch(searchTerm, () => {
    debouncedSearch();
});
*/
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
    modelValue: (true),
    maxWidth: "900px",
    persistent: true,
}));
const __VLS_2 = __VLS_1({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (true),
    maxWidth: "900px",
    persistent: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (...[$event]) => {
            __VLS_ctx.emit('close');
            // @ts-ignore
            [emit,];
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
    ...{ style: "height: 80vh;" },
}));
const __VLS_11 = __VLS_10({
    ...{ class: "dialog-card d-flex flex-column" },
    ...{ style: "height: 80vh;" },
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
    modelValue: (__VLS_ctx.searchTerm),
    label: "Cari berdasarkan Kode, Nama, atau Kota...",
    prependInnerIcon: "mdi-magnify",
    variant: "outlined",
    density: "compact",
    clearable: true,
    ...{ class: "mb-4 flex-shrink-0" },
    hideDetails: true,
}));
const __VLS_49 = __VLS_48({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.searchTerm),
    label: "Cari berdasarkan Kode, Nama, atau Kota...",
    prependInnerIcon: "mdi-magnify",
    variant: "outlined",
    density: "compact",
    clearable: true,
    ...{ class: "mb-4 flex-shrink-0" },
    hideDetails: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_48));
let __VLS_52;
const __VLS_53 = ({ keyup: {} },
    { onKeyup: (__VLS_ctx.fetchSuppliers) });
// @ts-ignore
[searchTerm, fetchSuppliers,];
var __VLS_50;
var __VLS_51;
const __VLS_55 = {}.VDataTable;
/** @type {[typeof __VLS_components.VDataTable, typeof __VLS_components.vDataTable, typeof __VLS_components.VDataTable, typeof __VLS_components.vDataTable, ]} */ ;
// @ts-ignore
VDataTable;
// @ts-ignore
const __VLS_56 = __VLS_asFunctionalComponent(__VLS_55, new __VLS_55({
    headers: (__VLS_ctx.headers),
    items: (__VLS_ctx.filteredSuppliers),
    loading: (__VLS_ctx.isLoading),
    hover: true,
    ...{ class: "desktop-table flex-grow-1" },
    density: "compact",
    itemKey: "Kode",
    fixedHeader: true,
    itemsPerPage: (15),
}));
const __VLS_57 = __VLS_56({
    headers: (__VLS_ctx.headers),
    items: (__VLS_ctx.filteredSuppliers),
    loading: (__VLS_ctx.isLoading),
    hover: true,
    ...{ class: "desktop-table flex-grow-1" },
    density: "compact",
    itemKey: "Kode",
    fixedHeader: true,
    itemsPerPage: (15),
}, ...__VLS_functionalComponentArgsRest(__VLS_56));
const { default: __VLS_60 } = __VLS_58.slots;
// @ts-ignore
[headers, filteredSuppliers, isLoading,];
{
    const { item: __VLS_61 } = __VLS_58.slots;
    const [{ item }] = __VLS_getSlotParameters(__VLS_61);
    __VLS_asFunctionalElement(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.selectSupplier(item);
                // @ts-ignore
                [selectSupplier,];
            } },
        ...{ style: "cursor: pointer;" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    (item.Kode);
    __VLS_asFunctionalElement(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    (item.Nama);
    __VLS_asFunctionalElement(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    (item.Kota);
    __VLS_asFunctionalElement(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    (item.Telp);
    __VLS_asFunctionalElement(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "text-center" },
    });
    const __VLS_62 = {}.VBtn;
    /** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
    // @ts-ignore
    VBtn;
    // @ts-ignore
    const __VLS_63 = __VLS_asFunctionalComponent(__VLS_62, new __VLS_62({
        ...{ 'onClick': {} },
        color: "success",
        size: "x-small",
        variant: "tonal",
    }));
    const __VLS_64 = __VLS_63({
        ...{ 'onClick': {} },
        color: "success",
        size: "x-small",
        variant: "tonal",
    }, ...__VLS_functionalComponentArgsRest(__VLS_63));
    let __VLS_67;
    const __VLS_68 = ({ click: {} },
        { onClick: (...[$event]) => {
                __VLS_ctx.selectSupplier(item);
                // @ts-ignore
                [selectSupplier,];
            } });
    const { default: __VLS_69 } = __VLS_65.slots;
    var __VLS_65;
    var __VLS_66;
}
{
    const { 'no-data': __VLS_70 } = __VLS_58.slots;
    __VLS_asFunctionalElement(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-center pa-4" },
    });
}
{
    const { loading: __VLS_71 } = __VLS_58.slots;
    const __VLS_72 = {}.VProgressLinear;
    /** @type {[typeof __VLS_components.VProgressLinear, typeof __VLS_components.vProgressLinear, typeof __VLS_components.VProgressLinear, typeof __VLS_components.vProgressLinear, ]} */ ;
    // @ts-ignore
    VProgressLinear;
    // @ts-ignore
    const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
        indeterminate: true,
        color: "primary",
    }));
    const __VLS_74 = __VLS_73({
        indeterminate: true,
        color: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_73));
}
var __VLS_58;
var __VLS_44;
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
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};
