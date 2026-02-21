import { ref, reactive, watch } from "vue";
import api from "@/services/api";
import { format, subDays } from "date-fns";
import { useToast } from "vue-toastification";
const props = defineProps();
const emit = defineEmits(["close", "select"]);
const toast = useToast();
const loading = ref(false);
const lhkList = ref([]);
const selectedItems = ref([]); // State untuk menampung item yang dipilih
const filters = reactive({
    startDate: format(subDays(new Date(), 7), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
});
const headers = [
    { title: "Nomor LHK", key: "Nomor", width: "130px" },
    { title: "Tanggal", key: "Tanggal", width: "100px" },
    { title: "Shift", key: "Shift", width: "80px" },
    { title: "Mesin", key: "Mesin", width: "90px" },
    { title: "Nomor SPK", key: "NomorSPK", width: "160px" },
    { title: "Nama SPK / Pekerjaan", key: "NamaOrder", width: "200px" },
    { title: "Qty", key: "TotalCetak", align: "end", width: "90px" },
    { title: "Operator", key: "Operator", width: "120px" },
];
const truncateString = (str, num) => {
    if (str?.length > num)
        return str.slice(0, num) + "...";
    return str;
};
const fetchLhkData = async () => {
    loading.value = true;
    selectedItems.value = []; // Reset pilihan setiap kali filter/refresh
    try {
        const response = await api.get("/mmt/lhk-cetak/lookup", {
            params: {
                startDate: filters.startDate,
                endDate: filters.endDate,
            },
        });
        lhkList.value = response.data.data || response.data;
    }
    catch (error) {
        toast.error("Gagal memuat daftar LHK Mesin");
    }
    finally {
        loading.value = false;
    }
};
const submitSelection = () => {
    if (selectedItems.value.length === 0) {
        toast.warning("Pilih minimal satu LHK");
        return;
    }
    // Kita kirim daftar nomor yang dipilih ke parent
    // selectedItems berisi array dari 'Nomor' karena item-value="Nomor" pada v-data-table
    emit("select", selectedItems.value);
    // Close modal dan reset
    emit("close");
    selectedItems.value = [];
};
const selectLhk = (item) => {
    // Pastikan item.Nomor tidak undefined
    if (!item.Nomor) {
        console.error("Data LHK tidak memiliki Nomor:", item);
        return;
    }
    // Jika Multiple Choice, kita kirim array.
    // Jika single, pastikan parent menerima objek yang benar.
    emit("select", [item]);
};
watch(() => props.isVisible, (val) => {
    if (val) {
        fetchLhkData();
        selectedItems.value = [];
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
const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({}));
const __VLS_11 = __VLS_10({}, ...__VLS_functionalComponentArgsRest(__VLS_10));
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
    ...{ class: "text-subtitle-1" },
}));
const __VLS_23 = __VLS_22({
    ...{ class: "text-subtitle-1" },
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
if (__VLS_ctx.selectedItems.length > 0) {
    // @ts-ignore
    [selectedItems,];
    const __VLS_33 = {}.VBtn;
    /** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
    // @ts-ignore
    VBtn;
    // @ts-ignore
    const __VLS_34 = __VLS_asFunctionalComponent(__VLS_33, new __VLS_33({
        ...{ 'onClick': {} },
        color: "white",
        variant: "elevated",
        size: "small",
        ...{ class: "text-primary mr-2 font-weight-bold" },
    }));
    const __VLS_35 = __VLS_34({
        ...{ 'onClick': {} },
        color: "white",
        variant: "elevated",
        size: "small",
        ...{ class: "text-primary mr-2 font-weight-bold" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_34));
    let __VLS_38;
    const __VLS_39 = ({ click: {} },
        { onClick: (__VLS_ctx.submitSelection) });
    const { default: __VLS_40 } = __VLS_36.slots;
    // @ts-ignore
    [submitSelection,];
    (__VLS_ctx.selectedItems.length);
    // @ts-ignore
    [selectedItems,];
    var __VLS_36;
    var __VLS_37;
}
const __VLS_41 = {}.VBtn;
/** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
// @ts-ignore
VBtn;
// @ts-ignore
const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({
    ...{ 'onClick': {} },
    icon: "mdi-close",
    variant: "text",
}));
const __VLS_43 = __VLS_42({
    ...{ 'onClick': {} },
    icon: "mdi-close",
    variant: "text",
}, ...__VLS_functionalComponentArgsRest(__VLS_42));
let __VLS_46;
const __VLS_47 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.emit('close');
            // @ts-ignore
            [emit,];
        } });
var __VLS_44;
var __VLS_45;
var __VLS_18;
const __VLS_49 = {}.VCardText;
/** @type {[typeof __VLS_components.VCardText, typeof __VLS_components.vCardText, typeof __VLS_components.VCardText, typeof __VLS_components.vCardText, ]} */ ;
// @ts-ignore
VCardText;
// @ts-ignore
const __VLS_50 = __VLS_asFunctionalComponent(__VLS_49, new __VLS_49({
    ...{ class: "pa-4" },
}));
const __VLS_51 = __VLS_50({
    ...{ class: "pa-4" },
}, ...__VLS_functionalComponentArgsRest(__VLS_50));
const { default: __VLS_54 } = __VLS_52.slots;
const __VLS_55 = {}.VRow;
/** @type {[typeof __VLS_components.VRow, typeof __VLS_components.vRow, typeof __VLS_components.VRow, typeof __VLS_components.vRow, ]} */ ;
// @ts-ignore
VRow;
// @ts-ignore
const __VLS_56 = __VLS_asFunctionalComponent(__VLS_55, new __VLS_55({
    dense: true,
    ...{ class: "mb-2" },
}));
const __VLS_57 = __VLS_56({
    dense: true,
    ...{ class: "mb-2" },
}, ...__VLS_functionalComponentArgsRest(__VLS_56));
const { default: __VLS_60 } = __VLS_58.slots;
const __VLS_61 = {}.VCol;
/** @type {[typeof __VLS_components.VCol, typeof __VLS_components.vCol, typeof __VLS_components.VCol, typeof __VLS_components.vCol, ]} */ ;
// @ts-ignore
VCol;
// @ts-ignore
const __VLS_62 = __VLS_asFunctionalComponent(__VLS_61, new __VLS_61({
    cols: "12",
    md: "5",
}));
const __VLS_63 = __VLS_62({
    cols: "12",
    md: "5",
}, ...__VLS_functionalComponentArgsRest(__VLS_62));
const { default: __VLS_66 } = __VLS_64.slots;
const __VLS_67 = {}.VTextField;
/** @type {[typeof __VLS_components.VTextField, typeof __VLS_components.vTextField, typeof __VLS_components.VTextField, typeof __VLS_components.vTextField, ]} */ ;
// @ts-ignore
VTextField;
// @ts-ignore
const __VLS_68 = __VLS_asFunctionalComponent(__VLS_67, new __VLS_67({
    modelValue: (__VLS_ctx.filters.startDate),
    label: "Dari Tanggal",
    type: "date",
    density: "compact",
    variant: "outlined",
}));
const __VLS_69 = __VLS_68({
    modelValue: (__VLS_ctx.filters.startDate),
    label: "Dari Tanggal",
    type: "date",
    density: "compact",
    variant: "outlined",
}, ...__VLS_functionalComponentArgsRest(__VLS_68));
// @ts-ignore
[filters,];
var __VLS_64;
const __VLS_73 = {}.VCol;
/** @type {[typeof __VLS_components.VCol, typeof __VLS_components.vCol, typeof __VLS_components.VCol, typeof __VLS_components.vCol, ]} */ ;
// @ts-ignore
VCol;
// @ts-ignore
const __VLS_74 = __VLS_asFunctionalComponent(__VLS_73, new __VLS_73({
    cols: "12",
    md: "5",
}));
const __VLS_75 = __VLS_74({
    cols: "12",
    md: "5",
}, ...__VLS_functionalComponentArgsRest(__VLS_74));
const { default: __VLS_78 } = __VLS_76.slots;
const __VLS_79 = {}.VTextField;
/** @type {[typeof __VLS_components.VTextField, typeof __VLS_components.vTextField, typeof __VLS_components.VTextField, typeof __VLS_components.vTextField, ]} */ ;
// @ts-ignore
VTextField;
// @ts-ignore
const __VLS_80 = __VLS_asFunctionalComponent(__VLS_79, new __VLS_79({
    modelValue: (__VLS_ctx.filters.endDate),
    label: "Sampai Tanggal",
    type: "date",
    density: "compact",
    variant: "outlined",
}));
const __VLS_81 = __VLS_80({
    modelValue: (__VLS_ctx.filters.endDate),
    label: "Sampai Tanggal",
    type: "date",
    density: "compact",
    variant: "outlined",
}, ...__VLS_functionalComponentArgsRest(__VLS_80));
// @ts-ignore
[filters,];
var __VLS_76;
const __VLS_85 = {}.VCol;
/** @type {[typeof __VLS_components.VCol, typeof __VLS_components.vCol, typeof __VLS_components.VCol, typeof __VLS_components.vCol, ]} */ ;
// @ts-ignore
VCol;
// @ts-ignore
const __VLS_86 = __VLS_asFunctionalComponent(__VLS_85, new __VLS_85({
    cols: "12",
    md: "2",
}));
const __VLS_87 = __VLS_86({
    cols: "12",
    md: "2",
}, ...__VLS_functionalComponentArgsRest(__VLS_86));
const { default: __VLS_90 } = __VLS_88.slots;
const __VLS_91 = {}.VBtn;
/** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
// @ts-ignore
VBtn;
// @ts-ignore
const __VLS_92 = __VLS_asFunctionalComponent(__VLS_91, new __VLS_91({
    ...{ 'onClick': {} },
    color: "primary",
    block: true,
    loading: (__VLS_ctx.loading),
}));
const __VLS_93 = __VLS_92({
    ...{ 'onClick': {} },
    color: "primary",
    block: true,
    loading: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_92));
let __VLS_96;
const __VLS_97 = ({ click: {} },
    { onClick: (__VLS_ctx.fetchLhkData) });
const { default: __VLS_98 } = __VLS_94.slots;
// @ts-ignore
[loading, fetchLhkData,];
var __VLS_94;
var __VLS_95;
var __VLS_88;
var __VLS_58;
const __VLS_99 = {}.VDivider;
/** @type {[typeof __VLS_components.VDivider, typeof __VLS_components.vDivider, typeof __VLS_components.VDivider, typeof __VLS_components.vDivider, ]} */ ;
// @ts-ignore
VDivider;
// @ts-ignore
const __VLS_100 = __VLS_asFunctionalComponent(__VLS_99, new __VLS_99({
    ...{ class: "mb-4" },
}));
const __VLS_101 = __VLS_100({
    ...{ class: "mb-4" },
}, ...__VLS_functionalComponentArgsRest(__VLS_100));
const __VLS_105 = {}.VDataTable;
/** @type {[typeof __VLS_components.VDataTable, typeof __VLS_components.vDataTable, typeof __VLS_components.VDataTable, typeof __VLS_components.vDataTable, ]} */ ;
// @ts-ignore
VDataTable;
// @ts-ignore
const __VLS_106 = __VLS_asFunctionalComponent(__VLS_105, new __VLS_105({
    modelValue: (__VLS_ctx.selectedItems),
    headers: (__VLS_ctx.headers),
    items: (__VLS_ctx.lhkList),
    loading: (__VLS_ctx.loading),
    itemValue: "Nomor",
    showSelect: true,
    density: "compact",
    hover: true,
    fixedHeader: true,
    height: "400px",
    ...{ class: "clickable-table" },
}));
const __VLS_107 = __VLS_106({
    modelValue: (__VLS_ctx.selectedItems),
    headers: (__VLS_ctx.headers),
    items: (__VLS_ctx.lhkList),
    loading: (__VLS_ctx.loading),
    itemValue: "Nomor",
    showSelect: true,
    density: "compact",
    hover: true,
    fixedHeader: true,
    height: "400px",
    ...{ class: "clickable-table" },
}, ...__VLS_functionalComponentArgsRest(__VLS_106));
const { default: __VLS_110 } = __VLS_108.slots;
// @ts-ignore
[selectedItems, loading, headers, lhkList,];
{
    const { [__VLS_tryAsConstant(`item.Tanggal`)]: __VLS_111 } = __VLS_108.slots;
    const [{ item }] = __VLS_getSlotParameters(__VLS_111);
    (__VLS_ctx.format(new Date(item.Tanggal), "dd/MM/yyyy"));
    // @ts-ignore
    [format,];
}
{
    const { [__VLS_tryAsConstant(`item.NomorSPK`)]: __VLS_112 } = __VLS_108.slots;
    const [{ item }] = __VLS_getSlotParameters(__VLS_112);
    if (item.JumlahSPK > 1) {
        const __VLS_113 = {}.VTooltip;
        /** @type {[typeof __VLS_components.VTooltip, typeof __VLS_components.vTooltip, typeof __VLS_components.VTooltip, typeof __VLS_components.vTooltip, ]} */ ;
        // @ts-ignore
        VTooltip;
        // @ts-ignore
        const __VLS_114 = __VLS_asFunctionalComponent(__VLS_113, new __VLS_113({
            text: "Multiple SPK detected",
        }));
        const __VLS_115 = __VLS_114({
            text: "Multiple SPK detected",
        }, ...__VLS_functionalComponentArgsRest(__VLS_114));
        const { default: __VLS_118 } = __VLS_116.slots;
        {
            const { activator: __VLS_119 } = __VLS_116.slots;
            const [{ props }] = __VLS_getSlotParameters(__VLS_119);
            __VLS_asFunctionalElement(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...(props),
                ...{ class: "font-weight-bold text-orange-darken-2" },
            });
        }
        var __VLS_116;
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.truncateString(item.NomorSPK, 20));
        // @ts-ignore
        [truncateString,];
    }
}
{
    const { [__VLS_tryAsConstant(`item.NamaOrder`)]: __VLS_120 } = __VLS_108.slots;
    const [{ item }] = __VLS_getSlotParameters(__VLS_120);
    __VLS_asFunctionalElement(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        title: (item.NamaOrder),
    });
    (__VLS_ctx.truncateString(item.NamaOrder || "-", 25));
    // @ts-ignore
    [truncateString,];
}
{
    const { [__VLS_tryAsConstant(`item.TotalCetak`)]: __VLS_121 } = __VLS_108.slots;
    const [{ item }] = __VLS_getSlotParameters(__VLS_121);
    const __VLS_122 = {}.VChip;
    /** @type {[typeof __VLS_components.VChip, typeof __VLS_components.vChip, typeof __VLS_components.VChip, typeof __VLS_components.vChip, ]} */ ;
    // @ts-ignore
    VChip;
    // @ts-ignore
    const __VLS_123 = __VLS_asFunctionalComponent(__VLS_122, new __VLS_122({
        size: "x-small",
        color: "blue",
        label: true,
    }));
    const __VLS_124 = __VLS_123({
        size: "x-small",
        color: "blue",
        label: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_123));
    const { default: __VLS_127 } = __VLS_125.slots;
    (item.TotalCetak);
    var __VLS_125;
}
{
    const { 'no-data': __VLS_128 } = __VLS_108.slots;
    __VLS_asFunctionalElement(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-center pa-4" },
    });
}
var __VLS_108;
var __VLS_52;
const __VLS_129 = {}.VDivider;
/** @type {[typeof __VLS_components.VDivider, typeof __VLS_components.vDivider, typeof __VLS_components.VDivider, typeof __VLS_components.vDivider, ]} */ ;
// @ts-ignore
VDivider;
// @ts-ignore
const __VLS_130 = __VLS_asFunctionalComponent(__VLS_129, new __VLS_129({}));
const __VLS_131 = __VLS_130({}, ...__VLS_functionalComponentArgsRest(__VLS_130));
if (__VLS_ctx.selectedItems.length > 0) {
    // @ts-ignore
    [selectedItems,];
    const __VLS_135 = {}.VCardActions;
    /** @type {[typeof __VLS_components.VCardActions, typeof __VLS_components.vCardActions, typeof __VLS_components.VCardActions, typeof __VLS_components.vCardActions, ]} */ ;
    // @ts-ignore
    VCardActions;
    // @ts-ignore
    const __VLS_136 = __VLS_asFunctionalComponent(__VLS_135, new __VLS_135({
        ...{ class: "pa-4" },
    }));
    const __VLS_137 = __VLS_136({
        ...{ class: "pa-4" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_136));
    const { default: __VLS_140 } = __VLS_138.slots;
    __VLS_asFunctionalElement(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "text-caption grey--text" },
    });
    (__VLS_ctx.selectedItems.length);
    // @ts-ignore
    [selectedItems,];
    const __VLS_141 = {}.VSpacer;
    /** @type {[typeof __VLS_components.VSpacer, typeof __VLS_components.vSpacer, typeof __VLS_components.VSpacer, typeof __VLS_components.vSpacer, ]} */ ;
    // @ts-ignore
    VSpacer;
    // @ts-ignore
    const __VLS_142 = __VLS_asFunctionalComponent(__VLS_141, new __VLS_141({}));
    const __VLS_143 = __VLS_142({}, ...__VLS_functionalComponentArgsRest(__VLS_142));
    const __VLS_147 = {}.VBtn;
    /** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
    // @ts-ignore
    VBtn;
    // @ts-ignore
    const __VLS_148 = __VLS_asFunctionalComponent(__VLS_147, new __VLS_147({
        ...{ 'onClick': {} },
        color: "error",
        variant: "text",
    }));
    const __VLS_149 = __VLS_148({
        ...{ 'onClick': {} },
        color: "error",
        variant: "text",
    }, ...__VLS_functionalComponentArgsRest(__VLS_148));
    let __VLS_152;
    const __VLS_153 = ({ click: {} },
        { onClick: (...[$event]) => {
                if (!(__VLS_ctx.selectedItems.length > 0))
                    return;
                __VLS_ctx.selectedItems = [];
                // @ts-ignore
                [selectedItems,];
            } });
    const { default: __VLS_154 } = __VLS_150.slots;
    var __VLS_150;
    var __VLS_151;
    const __VLS_155 = {}.VBtn;
    /** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
    // @ts-ignore
    VBtn;
    // @ts-ignore
    const __VLS_156 = __VLS_asFunctionalComponent(__VLS_155, new __VLS_155({
        ...{ 'onClick': {} },
        color: "primary",
        variant: "elevated",
    }));
    const __VLS_157 = __VLS_156({
        ...{ 'onClick': {} },
        color: "primary",
        variant: "elevated",
    }, ...__VLS_functionalComponentArgsRest(__VLS_156));
    let __VLS_160;
    const __VLS_161 = ({ click: {} },
        { onClick: (__VLS_ctx.submitSelection) });
    const { default: __VLS_162 } = __VLS_158.slots;
    // @ts-ignore
    [submitSelection,];
    var __VLS_158;
    var __VLS_159;
    var __VLS_138;
}
var __VLS_12;
var __VLS_3;
var __VLS_4;
/** @type {__VLS_StyleScopedClasses['text-subtitle-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
/** @type {__VLS_StyleScopedClasses['font-weight-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['pa-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['clickable-table']} */ ;
/** @type {__VLS_StyleScopedClasses['font-weight-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-orange-darken-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['pa-4']} */ ;
/** @type {__VLS_StyleScopedClasses['pa-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['grey--text']} */ ;
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    __typeProps: {},
});
export default {};
