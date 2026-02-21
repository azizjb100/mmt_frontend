import { ref, reactive, watch, computed } from "vue";
import api from "@/services/api";
import { useToast } from "vue-toastification";
import { format, subDays } from "date-fns";
const props = defineProps();
const emit = defineEmits();
const toast = useToast();
// --- State ---
const API_URL = "/mmt/permintaan-bahan/lookup";
const PermintaanList = ref([]);
const loading = ref(false);
const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
const today = format(new Date(), "yyyy-MM-dd");
const filters = reactive({
    startDate: thirtyDaysAgo,
    endDate: today,
    keyword: "",
});
const headers = [
    { title: "Nomor Permintaan", key: "Nomor", width: "200px" },
    { title: "Tanggal", key: "Tanggal", width: "120px" },
    { title: "Gudang Tujuan", key: "NamaGudang", width: "200px" },
    { title: "ACC Status", key: "ACC", width: "100px", align: "center" },
    {
        title: "Status Permintaan",
        key: "Status_Proses",
        width: "110px",
        align: "center",
    },
    {
        title: "Aksi",
        key: "actions",
        sortable: false,
        width: "100px",
        align: "center",
    },
];
const filteredPermintaanList = computed(() => {
    if (!filters.keyword)
        return PermintaanList.value;
    const search = filters.keyword.toLowerCase();
    return PermintaanList.value.filter((item) => {
        const nomorMatch = item.Nomor.toLowerCase().includes(search);
        const keteranganMatch = item.Keterangan && item.Keterangan.toLowerCase().includes(search);
        return nomorMatch || keteranganMatch;
    });
});
// --- API & Logic ---
const fetchPermintaanData = async () => {
    loading.value = true;
    PermintaanList.value = [];
    try {
        const response = await api.get(API_URL, {
            params: {
                startDate: filters.startDate,
                endDate: filters.endDate,
            },
        });
        PermintaanList.value = response.data || [];
    }
    catch (error) {
        const err = error;
        toast.error("Gagal memuat daftar Permintaan Bahan.");
        PermintaanList.value = [];
    }
    finally {
        loading.value = false;
    }
};
const selectPermintaan = (item) => {
    if (item.Status_Proses === "CLOSE") {
        toast.warning("Permintaan ini sudah selesai (CLOSE).");
        return;
    }
    if (!item.Nomor) {
        toast.error("Error: Nomor Permintaan kosong.");
        return;
    }
    emit("select", item);
    emit("close");
};
/**
 * Handler Double Click
 */
const handleDoubleClick = (_event, { item }) => {
    selectPermintaan(item);
};
watch(() => props.isVisible, (newValue) => {
    if (newValue) {
        fetchPermintaanData();
    }
    else {
        PermintaanList.value = [];
        filters.keyword = "";
    }
}, { immediate: true });
watch([() => filters.startDate, () => filters.endDate], () => {
    if (props.isVisible) {
        fetchPermintaanData();
    }
});
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
    maxWidth: "1200px",
    persistent: true,
}));
const __VLS_2 = __VLS_1({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.isVisible),
    maxWidth: "1200px",
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
__VLS_asFunctionalElement(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "d-flex align-center ga-4 mb-4 flex-shrink-0" },
});
const __VLS_47 = {}.VTextField;
/** @type {[typeof __VLS_components.VTextField, typeof __VLS_components.vTextField, typeof __VLS_components.VTextField, typeof __VLS_components.vTextField, ]} */ ;
// @ts-ignore
VTextField;
// @ts-ignore
const __VLS_48 = __VLS_asFunctionalComponent(__VLS_47, new __VLS_47({
    modelValue: (__VLS_ctx.filters.startDate),
    type: "date",
    label: "Dari Tanggal",
    variant: "outlined",
    density: "compact",
    ...{ style: "max-width: 150px" },
    hideDetails: true,
}));
const __VLS_49 = __VLS_48({
    modelValue: (__VLS_ctx.filters.startDate),
    type: "date",
    label: "Dari Tanggal",
    variant: "outlined",
    density: "compact",
    ...{ style: "max-width: 150px" },
    hideDetails: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_48));
// @ts-ignore
[filters,];
const __VLS_53 = {}.VTextField;
/** @type {[typeof __VLS_components.VTextField, typeof __VLS_components.vTextField, typeof __VLS_components.VTextField, typeof __VLS_components.vTextField, ]} */ ;
// @ts-ignore
VTextField;
// @ts-ignore
const __VLS_54 = __VLS_asFunctionalComponent(__VLS_53, new __VLS_53({
    modelValue: (__VLS_ctx.filters.endDate),
    type: "date",
    label: "Sampai Tanggal",
    variant: "outlined",
    density: "compact",
    ...{ style: "max-width: 150px" },
    hideDetails: true,
}));
const __VLS_55 = __VLS_54({
    modelValue: (__VLS_ctx.filters.endDate),
    type: "date",
    label: "Sampai Tanggal",
    variant: "outlined",
    density: "compact",
    ...{ style: "max-width: 150px" },
    hideDetails: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_54));
// @ts-ignore
[filters,];
const __VLS_59 = {}.VTextField;
/** @type {[typeof __VLS_components.VTextField, typeof __VLS_components.vTextField, typeof __VLS_components.VTextField, typeof __VLS_components.vTextField, ]} */ ;
// @ts-ignore
VTextField;
// @ts-ignore
const __VLS_60 = __VLS_asFunctionalComponent(__VLS_59, new __VLS_59({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.filters.keyword),
    label: "Cari Nomor/Keterangan...",
    prependInnerIcon: "mdi-magnify",
    variant: "outlined",
    density: "compact",
    clearable: true,
    ...{ class: "flex-grow-1" },
    hideDetails: true,
}));
const __VLS_61 = __VLS_60({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.filters.keyword),
    label: "Cari Nomor/Keterangan...",
    prependInnerIcon: "mdi-magnify",
    variant: "outlined",
    density: "compact",
    clearable: true,
    ...{ class: "flex-grow-1" },
    hideDetails: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_60));
let __VLS_64;
const __VLS_65 = ({ keyup: {} },
    { onKeyup: (__VLS_ctx.fetchPermintaanData) });
// @ts-ignore
[filters, fetchPermintaanData,];
var __VLS_62;
var __VLS_63;
const __VLS_67 = {}.VBtn;
/** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
// @ts-ignore
VBtn;
// @ts-ignore
const __VLS_68 = __VLS_asFunctionalComponent(__VLS_67, new __VLS_67({
    ...{ 'onClick': {} },
    color: "primary",
    size: "small",
}));
const __VLS_69 = __VLS_68({
    ...{ 'onClick': {} },
    color: "primary",
    size: "small",
}, ...__VLS_functionalComponentArgsRest(__VLS_68));
let __VLS_72;
const __VLS_73 = ({ click: {} },
    { onClick: (__VLS_ctx.fetchPermintaanData) });
const { default: __VLS_74 } = __VLS_70.slots;
// @ts-ignore
[fetchPermintaanData,];
var __VLS_70;
var __VLS_71;
const __VLS_75 = {}.VDataTable;
/** @type {[typeof __VLS_components.VDataTable, typeof __VLS_components.vDataTable, typeof __VLS_components.VDataTable, typeof __VLS_components.vDataTable, ]} */ ;
// @ts-ignore
VDataTable;
// @ts-ignore
const __VLS_76 = __VLS_asFunctionalComponent(__VLS_75, new __VLS_75({
    ...{ 'onDblclick:row': {} },
    headers: (__VLS_ctx.headers),
    items: (__VLS_ctx.filteredPermintaanList),
    loading: (__VLS_ctx.loading),
    hover: true,
    ...{ class: "desktop-table flex-grow-1 clickable-row" },
    density: "compact",
    itemKey: "Nomor",
    fixedHeader: true,
    itemsPerPage: (20),
}));
const __VLS_77 = __VLS_76({
    ...{ 'onDblclick:row': {} },
    headers: (__VLS_ctx.headers),
    items: (__VLS_ctx.filteredPermintaanList),
    loading: (__VLS_ctx.loading),
    hover: true,
    ...{ class: "desktop-table flex-grow-1 clickable-row" },
    density: "compact",
    itemKey: "Nomor",
    fixedHeader: true,
    itemsPerPage: (20),
}, ...__VLS_functionalComponentArgsRest(__VLS_76));
let __VLS_80;
const __VLS_81 = ({ 'dblclick:row': {} },
    { 'onDblclick:row': (__VLS_ctx.handleDoubleClick) });
const { default: __VLS_82 } = __VLS_78.slots;
// @ts-ignore
[headers, filteredPermintaanList, loading, handleDoubleClick,];
{
    const { 'item.Tanggal': __VLS_83 } = __VLS_78.slots;
    const [{ item }] = __VLS_getSlotParameters(__VLS_83);
    (item.Tanggal
        ? new Date(item.Tanggal).toLocaleDateString("id-ID")
        : "-");
}
{
    const { 'item.Keterangan': __VLS_84 } = __VLS_78.slots;
    const [{ item }] = __VLS_getSlotParameters(__VLS_84);
    __VLS_asFunctionalElement(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        title: (item.Keterangan),
    });
    (item.Keterangan
        ? item.Keterangan.substring(0, 50) +
            (item.Keterangan.length > 50 ? "..." : "")
        : "-");
}
{
    const { 'item.ACC': __VLS_85 } = __VLS_78.slots;
    const [{ item }] = __VLS_getSlotParameters(__VLS_85);
    const __VLS_86 = {}.VChip;
    /** @type {[typeof __VLS_components.VChip, typeof __VLS_components.vChip, typeof __VLS_components.VChip, typeof __VLS_components.vChip, ]} */ ;
    // @ts-ignore
    VChip;
    // @ts-ignore
    const __VLS_87 = __VLS_asFunctionalComponent(__VLS_86, new __VLS_86({
        color: (item.ACC === 'Y' ? 'success' : 'red'),
        size: "small",
    }));
    const __VLS_88 = __VLS_87({
        color: (item.ACC === 'Y' ? 'success' : 'red'),
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_87));
    const { default: __VLS_91 } = __VLS_89.slots;
    (item.ACC === "Y" ? "ACC" : "Pending");
    var __VLS_89;
}
{
    const { 'item.Status_Proses': __VLS_92 } = __VLS_78.slots;
    const [{ item }] = __VLS_getSlotParameters(__VLS_92);
    const __VLS_93 = {}.VChip;
    /** @type {[typeof __VLS_components.VChip, typeof __VLS_components.vChip, typeof __VLS_components.VChip, typeof __VLS_components.vChip, ]} */ ;
    // @ts-ignore
    VChip;
    // @ts-ignore
    const __VLS_94 = __VLS_asFunctionalComponent(__VLS_93, new __VLS_93({
        size: "small",
        color: (item.Status_Proses === 'OPEN'
            ? 'success'
            : item.Status_Proses === 'PROGRESS'
                ? 'warning'
                : 'grey'),
    }));
    const __VLS_95 = __VLS_94({
        size: "small",
        color: (item.Status_Proses === 'OPEN'
            ? 'success'
            : item.Status_Proses === 'PROGRESS'
                ? 'warning'
                : 'grey'),
    }, ...__VLS_functionalComponentArgsRest(__VLS_94));
    const { default: __VLS_98 } = __VLS_96.slots;
    (item.Status_Proses);
    var __VLS_96;
}
{
    const { 'item.actions': __VLS_99 } = __VLS_78.slots;
    const [{ item }] = __VLS_getSlotParameters(__VLS_99);
    __VLS_asFunctionalElement(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-center" },
    });
    const __VLS_100 = {}.VBtn;
    /** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
    // @ts-ignore
    VBtn;
    // @ts-ignore
    const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
        ...{ 'onClick': {} },
        color: "success",
        size: "x-small",
        variant: "tonal",
        disabled: (item.Status_Proses === 'CLOSE'),
    }));
    const __VLS_102 = __VLS_101({
        ...{ 'onClick': {} },
        color: "success",
        size: "x-small",
        variant: "tonal",
        disabled: (item.Status_Proses === 'CLOSE'),
    }, ...__VLS_functionalComponentArgsRest(__VLS_101));
    let __VLS_105;
    const __VLS_106 = ({ click: {} },
        { onClick: (...[$event]) => {
                __VLS_ctx.selectPermintaan(item);
                // @ts-ignore
                [selectPermintaan,];
            } });
    const { default: __VLS_107 } = __VLS_103.slots;
    var __VLS_103;
    var __VLS_104;
}
{
    const { 'no-data': __VLS_108 } = __VLS_78.slots;
    __VLS_asFunctionalElement(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-center pa-4" },
    });
}
{
    const { loading: __VLS_109 } = __VLS_78.slots;
    const __VLS_110 = {}.VProgressLinear;
    /** @type {[typeof __VLS_components.VProgressLinear, typeof __VLS_components.vProgressLinear, typeof __VLS_components.VProgressLinear, typeof __VLS_components.vProgressLinear, ]} */ ;
    // @ts-ignore
    VProgressLinear;
    // @ts-ignore
    const __VLS_111 = __VLS_asFunctionalComponent(__VLS_110, new __VLS_110({
        indeterminate: true,
        color: "primary",
    }));
    const __VLS_112 = __VLS_111({
        indeterminate: true,
        color: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_111));
}
var __VLS_78;
var __VLS_79;
var __VLS_44;
const __VLS_116 = {}.VCardActions;
/** @type {[typeof __VLS_components.VCardActions, typeof __VLS_components.vCardActions, typeof __VLS_components.VCardActions, typeof __VLS_components.vCardActions, ]} */ ;
// @ts-ignore
VCardActions;
// @ts-ignore
const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
    ...{ class: "d-flex justify-end" },
}));
const __VLS_118 = __VLS_117({
    ...{ class: "d-flex justify-end" },
}, ...__VLS_functionalComponentArgsRest(__VLS_117));
const { default: __VLS_121 } = __VLS_119.slots;
const __VLS_122 = {}.VBtn;
/** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
// @ts-ignore
VBtn;
// @ts-ignore
const __VLS_123 = __VLS_asFunctionalComponent(__VLS_122, new __VLS_122({
    ...{ 'onClick': {} },
    color: "secondary",
    variant: "flat",
}));
const __VLS_124 = __VLS_123({
    ...{ 'onClick': {} },
    color: "secondary",
    variant: "flat",
}, ...__VLS_functionalComponentArgsRest(__VLS_123));
let __VLS_127;
const __VLS_128 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.emit('close');
            // @ts-ignore
            [emit,];
        } });
const { default: __VLS_129 } = __VLS_125.slots;
var __VLS_125;
var __VLS_126;
var __VLS_119;
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
/** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['align-center']} */ ;
/** @type {__VLS_StyleScopedClasses['ga-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-grow-1']} */ ;
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
