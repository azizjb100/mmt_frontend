import { ref, reactive, watch, computed } from "vue";
import api from "@/services/api";
import { useToast } from "vue-toastification";
import { format, subDays } from "date-fns";
const props = defineProps();
const emit = defineEmits();
const toast = useToast();
// --- State ---
const API_URL = "/mmt/pengajuan-permintaan/lookup";
const PengajuanList = ref([]);
const loading = ref(false);
const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
const today = format(new Date(), "yyyy-MM-dd");
const filters = reactive({
    startDate: thirtyDaysAgo,
    endDate: today,
    keyword: "",
});
const headers = [
    { title: "Nomor PP", key: "Nomor", width: "150px" },
    { title: "Tanggal", key: "Tanggal", width: "110px" },
    { title: "Jenis", key: "Jenis", width: "120px" },
    { title: "Kepada", key: "Ditujukan_Ke", width: "120px" },
    { title: "Keterangan", key: "Keterangan", width: "350px" },
    {
        title: "Status",
        key: "Status_Acc",
        width: "100px",
        align: "center",
    },
    { title: "Proses", key: "Status_Proses", width: "120px", align: "center" },
    {
        title: "Aksi",
        key: "actions",
        sortable: false,
        width: "120px",
        align: "center",
    },
];
const filteredPengajuanList = computed(() => {
    if (!filters.keyword)
        return PengajuanList.value;
    const search = filters.keyword.toLowerCase();
    return PengajuanList.value.filter((item) => {
        return (item.Nomor.toLowerCase().includes(search) ||
            (item.Keterangan && item.Keterangan.toLowerCase().includes(search)) ||
            item.Jenis.toLowerCase().includes(search));
    });
});
// --- API & Logic ---
const fetchPengajuanData = async () => {
    loading.value = true;
    try {
        const response = await api.get(API_URL, {
            params: {
                startDate: filters.startDate,
                endDate: filters.endDate,
            },
        });
        PengajuanList.value = response.data || [];
    }
    catch (error) {
        const err = error;
        toast.error("Gagal memuat daftar Pengajuan.");
        PengajuanList.value = [];
    }
    finally {
        loading.value = false;
    }
};
const handleDoubleClick = (_event, { item }) => {
    selectPengajuan(item);
};
const selectPengajuan = (item) => {
    if (item.Status_Proses === "CLOSE") {
        toast.warning("Pengajuan ini sudah diproses menjadi Minta Bahan.");
        return;
    }
    emit("select", item);
    emit("close");
};
watch(() => props.isVisible, (visible) => {
    if (visible) {
        fetchPengajuanData();
    }
    else {
        filters.keyword = "";
    }
});
watch([() => filters.startDate, () => filters.endDate], () => {
    if (props.isVisible)
        fetchPengajuanData();
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
    color: "orange-darken-3",
    density: "compact",
}));
const __VLS_17 = __VLS_16({
    color: "orange-darken-3",
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
    label: "Cari Nomor PP/Keterangan/Jenis...",
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
    label: "Cari Nomor PP/Keterangan/Jenis...",
    prependInnerIcon: "mdi-magnify",
    variant: "outlined",
    density: "compact",
    clearable: true,
    ...{ class: "flex-grow-1" },
    hideDetails: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_60));
let __VLS_64;
const __VLS_65 = ({ keyup: {} },
    { onKeyup: (__VLS_ctx.fetchPengajuanData) });
// @ts-ignore
[filters, fetchPengajuanData,];
var __VLS_62;
var __VLS_63;
const __VLS_67 = {}.VBtn;
/** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
// @ts-ignore
VBtn;
// @ts-ignore
const __VLS_68 = __VLS_asFunctionalComponent(__VLS_67, new __VLS_67({
    ...{ 'onClick': {} },
    color: "orange-darken-3",
    size: "small",
    loading: (__VLS_ctx.loading),
}));
const __VLS_69 = __VLS_68({
    ...{ 'onClick': {} },
    color: "orange-darken-3",
    size: "small",
    loading: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_68));
let __VLS_72;
const __VLS_73 = ({ click: {} },
    { onClick: (__VLS_ctx.fetchPengajuanData) });
const { default: __VLS_74 } = __VLS_70.slots;
// @ts-ignore
[fetchPengajuanData, loading,];
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
    items: (__VLS_ctx.filteredPengajuanList),
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
    items: (__VLS_ctx.filteredPengajuanList),
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
[loading, headers, filteredPengajuanList, handleDoubleClick,];
{
    const { 'item.Tanggal': __VLS_83 } = __VLS_78.slots;
    const [{ item }] = __VLS_getSlotParameters(__VLS_83);
    (item.Tanggal
        ? new Date(item.Tanggal).toLocaleDateString("id-ID")
        : "-");
}
{
    const { 'item.Jenis': __VLS_84 } = __VLS_78.slots;
    const [{ item }] = __VLS_getSlotParameters(__VLS_84);
    const __VLS_85 = {}.VChip;
    /** @type {[typeof __VLS_components.VChip, typeof __VLS_components.vChip, typeof __VLS_components.VChip, typeof __VLS_components.vChip, ]} */ ;
    // @ts-ignore
    VChip;
    // @ts-ignore
    const __VLS_86 = __VLS_asFunctionalComponent(__VLS_85, new __VLS_85({
        size: "x-small",
        label: true,
        color: "blue-grey-lighten-4",
    }));
    const __VLS_87 = __VLS_86({
        size: "x-small",
        label: true,
        color: "blue-grey-lighten-4",
    }, ...__VLS_functionalComponentArgsRest(__VLS_86));
    const { default: __VLS_90 } = __VLS_88.slots;
    (item.Jenis);
    var __VLS_88;
}
{
    const { 'item.Keterangan': __VLS_91 } = __VLS_78.slots;
    const [{ item }] = __VLS_getSlotParameters(__VLS_91);
    __VLS_asFunctionalElement(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        title: (item.Keterangan || '-'),
    });
    (item.Keterangan
        ? item.Keterangan.length > 60
            ? item.Keterangan.substring(0, 60) + "..."
            : item.Keterangan
        : "-");
}
{
    const { 'item.Status_Acc': __VLS_92 } = __VLS_78.slots;
    const [{ item }] = __VLS_getSlotParameters(__VLS_92);
    const __VLS_93 = {}.VChip;
    /** @type {[typeof __VLS_components.VChip, typeof __VLS_components.vChip, typeof __VLS_components.VChip, typeof __VLS_components.vChip, ]} */ ;
    // @ts-ignore
    VChip;
    // @ts-ignore
    const __VLS_94 = __VLS_asFunctionalComponent(__VLS_93, new __VLS_93({
        size: "small",
        color: (item.Status_Acc === 'Y' ? 'success' : 'error'),
        variant: "flat",
    }));
    const __VLS_95 = __VLS_94({
        size: "small",
        color: (item.Status_Acc === 'Y' ? 'success' : 'error'),
        variant: "flat",
    }, ...__VLS_functionalComponentArgsRest(__VLS_94));
    const { default: __VLS_98 } = __VLS_96.slots;
    (item.Status_Acc === "Y" ? "ACC" : "Pending");
    var __VLS_96;
}
{
    const { 'item.Status_Proses': __VLS_99 } = __VLS_78.slots;
    const [{ item }] = __VLS_getSlotParameters(__VLS_99);
    const __VLS_100 = {}.VChip;
    /** @type {[typeof __VLS_components.VChip, typeof __VLS_components.vChip, typeof __VLS_components.VChip, typeof __VLS_components.vChip, ]} */ ;
    // @ts-ignore
    VChip;
    // @ts-ignore
    const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
        size: "small",
        color: (item.Status_Proses === 'CLOSE' ? 'blue' : 'green'),
        variant: "flat",
    }));
    const __VLS_102 = __VLS_101({
        size: "small",
        color: (item.Status_Proses === 'CLOSE' ? 'blue' : 'green'),
        variant: "flat",
    }, ...__VLS_functionalComponentArgsRest(__VLS_101));
    const { default: __VLS_105 } = __VLS_103.slots;
    (item.Status_Proses);
    var __VLS_103;
}
{
    const { 'item.actions': __VLS_106 } = __VLS_78.slots;
    const [{ item }] = __VLS_getSlotParameters(__VLS_106);
    __VLS_asFunctionalElement(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-center" },
    });
    const __VLS_107 = {}.VBtn;
    /** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
    // @ts-ignore
    VBtn;
    // @ts-ignore
    const __VLS_108 = __VLS_asFunctionalComponent(__VLS_107, new __VLS_107({
        ...{ 'onClick': {} },
        color: "orange-darken-3",
        size: "x-small",
        disabled: (item.Status_Proses === 'CLOSE'),
        variant: "tonal",
    }));
    const __VLS_109 = __VLS_108({
        ...{ 'onClick': {} },
        color: "orange-darken-3",
        size: "x-small",
        disabled: (item.Status_Proses === 'CLOSE'),
        variant: "tonal",
    }, ...__VLS_functionalComponentArgsRest(__VLS_108));
    let __VLS_112;
    const __VLS_113 = ({ click: {} },
        { onClick: (...[$event]) => {
                __VLS_ctx.selectPengajuan(item);
                // @ts-ignore
                [selectPengajuan,];
            } });
    const { default: __VLS_114 } = __VLS_110.slots;
    var __VLS_110;
    var __VLS_111;
}
{
    const { 'no-data': __VLS_115 } = __VLS_78.slots;
    __VLS_asFunctionalElement(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-center pa-4" },
    });
}
{
    const { loading: __VLS_116 } = __VLS_78.slots;
    const __VLS_117 = {}.VProgressLinear;
    /** @type {[typeof __VLS_components.VProgressLinear, typeof __VLS_components.vProgressLinear, typeof __VLS_components.VProgressLinear, typeof __VLS_components.vProgressLinear, ]} */ ;
    // @ts-ignore
    VProgressLinear;
    // @ts-ignore
    const __VLS_118 = __VLS_asFunctionalComponent(__VLS_117, new __VLS_117({
        indeterminate: true,
        color: "orange-darken-3",
    }));
    const __VLS_119 = __VLS_118({
        indeterminate: true,
        color: "orange-darken-3",
    }, ...__VLS_functionalComponentArgsRest(__VLS_118));
}
var __VLS_78;
var __VLS_79;
var __VLS_44;
const __VLS_123 = {}.VCardActions;
/** @type {[typeof __VLS_components.VCardActions, typeof __VLS_components.vCardActions, typeof __VLS_components.VCardActions, typeof __VLS_components.vCardActions, ]} */ ;
// @ts-ignore
VCardActions;
// @ts-ignore
const __VLS_124 = __VLS_asFunctionalComponent(__VLS_123, new __VLS_123({
    ...{ class: "d-flex justify-end pa-4" },
}));
const __VLS_125 = __VLS_124({
    ...{ class: "d-flex justify-end pa-4" },
}, ...__VLS_functionalComponentArgsRest(__VLS_124));
const { default: __VLS_128 } = __VLS_126.slots;
const __VLS_129 = {}.VBtn;
/** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
// @ts-ignore
VBtn;
// @ts-ignore
const __VLS_130 = __VLS_asFunctionalComponent(__VLS_129, new __VLS_129({
    ...{ 'onClick': {} },
    color: "secondary",
    variant: "flat",
}));
const __VLS_131 = __VLS_130({
    ...{ 'onClick': {} },
    color: "secondary",
    variant: "flat",
}, ...__VLS_functionalComponentArgsRest(__VLS_130));
let __VLS_134;
const __VLS_135 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.emit('close');
            // @ts-ignore
            [emit,];
        } });
const { default: __VLS_136 } = __VLS_132.slots;
var __VLS_132;
var __VLS_133;
var __VLS_126;
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
/** @type {__VLS_StyleScopedClasses['pa-4']} */ ;
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};
