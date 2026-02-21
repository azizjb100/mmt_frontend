import { ref, watch, onMounted } from 'vue';
import api from "@/services/api";
const props = defineProps({
    isVisible: Boolean
});
const emit = defineEmits(['close', 'select']);
const internalVisible = ref(props.isVisible);
const isLoading = ref(false);
const searchQuery = ref('');
const items = ref([]);
const headers = [
    { title: 'Nomor Rec', key: 'Nomor', width: '150px' },
    { title: 'Tanggal', key: 'Tanggal', width: '120px' },
    { title: 'Supplier', key: 'Supplier' },
    { title: 'No. Permintaan', key: 'No_Permintaan' },
    { title: 'Aksi', key: 'action', sortable: false, align: 'center' }
];
// Sinkronisasi prop isVisible ke internal state
watch(() => props.isVisible, (val) => {
    internalVisible.ref = val;
    if (val)
        fetchData();
});
const fetchData = async () => {
    try {
        isLoading.value = true;
        // Menggunakan route yang tadi kita buat: /api/penerimaan/lookup-invoice
        const response = await api.get('mmt/penerimaan-bahan/lookup-invoice', {
            params: { q: searchQuery.value }
        });
        items.value = response.data.data || response.data;
    }
    catch (error) {
        console.error("Gagal load lookup penerimaan:", error);
    }
    finally {
        isLoading.value = false;
    }
};
const closeModal = () => {
    emit('close');
};
const selectItem = (item) => {
    emit('select', item);
};
onMounted(() => {
    if (props.isVisible)
        fetchData();
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
/** @type {__VLS_StyleScopedClasses['lookup-table']} */ ;
const __VLS_0 = {}.VDialog;
/** @type {[typeof __VLS_components.VDialog, typeof __VLS_components.vDialog, typeof __VLS_components.VDialog, typeof __VLS_components.vDialog, ]} */ ;
// @ts-ignore
VDialog;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.internalVisible),
    maxWidth: "800px",
    persistent: true,
}));
const __VLS_2 = __VLS_1({
    modelValue: (__VLS_ctx.internalVisible),
    maxWidth: "800px",
    persistent: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
const { default: __VLS_6 } = __VLS_3.slots;
// @ts-ignore
[internalVisible,];
const __VLS_7 = {}.VCard;
/** @type {[typeof __VLS_components.VCard, typeof __VLS_components.vCard, typeof __VLS_components.VCard, typeof __VLS_components.vCard, ]} */ ;
// @ts-ignore
VCard;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent(__VLS_7, new __VLS_7({}));
const __VLS_9 = __VLS_8({}, ...__VLS_functionalComponentArgsRest(__VLS_8));
const { default: __VLS_12 } = __VLS_10.slots;
const __VLS_13 = {}.VCardTitle;
/** @type {[typeof __VLS_components.VCardTitle, typeof __VLS_components.vCardTitle, typeof __VLS_components.VCardTitle, typeof __VLS_components.vCardTitle, ]} */ ;
// @ts-ignore
VCardTitle;
// @ts-ignore
const __VLS_14 = __VLS_asFunctionalComponent(__VLS_13, new __VLS_13({
    ...{ class: "bg-primary text-white d-flex align-center pa-4" },
}));
const __VLS_15 = __VLS_14({
    ...{ class: "bg-primary text-white d-flex align-center pa-4" },
}, ...__VLS_functionalComponentArgsRest(__VLS_14));
const { default: __VLS_18 } = __VLS_16.slots;
const __VLS_19 = {}.VIcon;
/** @type {[typeof __VLS_components.VIcon, typeof __VLS_components.vIcon, typeof __VLS_components.VIcon, typeof __VLS_components.vIcon, ]} */ ;
// @ts-ignore
VIcon;
// @ts-ignore
const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({
    start: true,
}));
const __VLS_21 = __VLS_20({
    start: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_20));
const { default: __VLS_24 } = __VLS_22.slots;
var __VLS_22;
const __VLS_25 = {}.VSpacer;
/** @type {[typeof __VLS_components.VSpacer, typeof __VLS_components.vSpacer, ]} */ ;
// @ts-ignore
VSpacer;
// @ts-ignore
const __VLS_26 = __VLS_asFunctionalComponent(__VLS_25, new __VLS_25({}));
const __VLS_27 = __VLS_26({}, ...__VLS_functionalComponentArgsRest(__VLS_26));
const __VLS_31 = {}.VBtn;
/** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
// @ts-ignore
VBtn;
// @ts-ignore
const __VLS_32 = __VLS_asFunctionalComponent(__VLS_31, new __VLS_31({
    ...{ 'onClick': {} },
    icon: "mdi-close",
    variant: "text",
}));
const __VLS_33 = __VLS_32({
    ...{ 'onClick': {} },
    icon: "mdi-close",
    variant: "text",
}, ...__VLS_functionalComponentArgsRest(__VLS_32));
let __VLS_36;
const __VLS_37 = ({ click: {} },
    { onClick: (__VLS_ctx.closeModal) });
// @ts-ignore
[closeModal,];
var __VLS_34;
var __VLS_35;
var __VLS_16;
const __VLS_39 = {}.VCardText;
/** @type {[typeof __VLS_components.VCardText, typeof __VLS_components.vCardText, typeof __VLS_components.VCardText, typeof __VLS_components.vCardText, ]} */ ;
// @ts-ignore
VCardText;
// @ts-ignore
const __VLS_40 = __VLS_asFunctionalComponent(__VLS_39, new __VLS_39({
    ...{ class: "pa-4" },
}));
const __VLS_41 = __VLS_40({
    ...{ class: "pa-4" },
}, ...__VLS_functionalComponentArgsRest(__VLS_40));
const { default: __VLS_44 } = __VLS_42.slots;
const __VLS_45 = {}.VTextField;
/** @type {[typeof __VLS_components.VTextField, typeof __VLS_components.vTextField, ]} */ ;
// @ts-ignore
VTextField;
// @ts-ignore
const __VLS_46 = __VLS_asFunctionalComponent(__VLS_45, new __VLS_45({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.searchQuery),
    label: "Cari Nomor Rec / Supplier / Memo...",
    prependInnerIcon: "mdi-magnify",
    variant: "outlined",
    density: "compact",
    hideDetails: true,
    ...{ class: "mb-4" },
    clearable: true,
}));
const __VLS_47 = __VLS_46({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.searchQuery),
    label: "Cari Nomor Rec / Supplier / Memo...",
    prependInnerIcon: "mdi-magnify",
    variant: "outlined",
    density: "compact",
    hideDetails: true,
    ...{ class: "mb-4" },
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_46));
let __VLS_50;
const __VLS_51 = ({ keyup: {} },
    { onKeyup: (__VLS_ctx.fetchData) });
// @ts-ignore
[searchQuery, fetchData,];
var __VLS_48;
var __VLS_49;
const __VLS_53 = {}.VDataTable;
/** @type {[typeof __VLS_components.VDataTable, typeof __VLS_components.vDataTable, typeof __VLS_components.VDataTable, typeof __VLS_components.vDataTable, ]} */ ;
// @ts-ignore
VDataTable;
// @ts-ignore
const __VLS_54 = __VLS_asFunctionalComponent(__VLS_53, new __VLS_53({
    headers: (__VLS_ctx.headers),
    items: (__VLS_ctx.items),
    loading: (__VLS_ctx.isLoading),
    itemsPerPage: (10),
    density: "compact",
    hover: true,
    ...{ class: "lookup-table border" },
    height: "400px",
    fixedHeader: true,
}));
const __VLS_55 = __VLS_54({
    headers: (__VLS_ctx.headers),
    items: (__VLS_ctx.items),
    loading: (__VLS_ctx.isLoading),
    itemsPerPage: (10),
    density: "compact",
    hover: true,
    ...{ class: "lookup-table border" },
    height: "400px",
    fixedHeader: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_54));
const { default: __VLS_58 } = __VLS_56.slots;
// @ts-ignore
[headers, items, isLoading,];
{
    const { [__VLS_tryAsConstant(`item.action`)]: __VLS_59 } = __VLS_56.slots;
    const [{ item }] = __VLS_getSlotParameters(__VLS_59);
    const __VLS_60 = {}.VBtn;
    /** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
    // @ts-ignore
    VBtn;
    // @ts-ignore
    const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
        ...{ 'onClick': {} },
        color: "primary",
        size: "x-small",
        prependIcon: "mdi-check-circle",
    }));
    const __VLS_62 = __VLS_61({
        ...{ 'onClick': {} },
        color: "primary",
        size: "x-small",
        prependIcon: "mdi-check-circle",
    }, ...__VLS_functionalComponentArgsRest(__VLS_61));
    let __VLS_65;
    const __VLS_66 = ({ click: {} },
        { onClick: (...[$event]) => {
                __VLS_ctx.selectItem(item);
                // @ts-ignore
                [selectItem,];
            } });
    const { default: __VLS_67 } = __VLS_63.slots;
    var __VLS_63;
    var __VLS_64;
}
{
    const { 'no-data': __VLS_68 } = __VLS_56.slots;
    __VLS_asFunctionalElement(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "pa-4 text-center" },
    });
}
var __VLS_56;
var __VLS_42;
const __VLS_69 = {}.VDivider;
/** @type {[typeof __VLS_components.VDivider, typeof __VLS_components.vDivider, typeof __VLS_components.VDivider, typeof __VLS_components.vDivider, ]} */ ;
// @ts-ignore
VDivider;
// @ts-ignore
const __VLS_70 = __VLS_asFunctionalComponent(__VLS_69, new __VLS_69({}));
const __VLS_71 = __VLS_70({}, ...__VLS_functionalComponentArgsRest(__VLS_70));
const __VLS_75 = {}.VCardActions;
/** @type {[typeof __VLS_components.VCardActions, typeof __VLS_components.vCardActions, typeof __VLS_components.VCardActions, typeof __VLS_components.vCardActions, ]} */ ;
// @ts-ignore
VCardActions;
// @ts-ignore
const __VLS_76 = __VLS_asFunctionalComponent(__VLS_75, new __VLS_75({
    ...{ class: "pa-4" },
}));
const __VLS_77 = __VLS_76({
    ...{ class: "pa-4" },
}, ...__VLS_functionalComponentArgsRest(__VLS_76));
const { default: __VLS_80 } = __VLS_78.slots;
const __VLS_81 = {}.VSpacer;
/** @type {[typeof __VLS_components.VSpacer, typeof __VLS_components.vSpacer, typeof __VLS_components.VSpacer, typeof __VLS_components.vSpacer, ]} */ ;
// @ts-ignore
VSpacer;
// @ts-ignore
const __VLS_82 = __VLS_asFunctionalComponent(__VLS_81, new __VLS_81({}));
const __VLS_83 = __VLS_82({}, ...__VLS_functionalComponentArgsRest(__VLS_82));
const __VLS_87 = {}.VBtn;
/** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
// @ts-ignore
VBtn;
// @ts-ignore
const __VLS_88 = __VLS_asFunctionalComponent(__VLS_87, new __VLS_87({
    ...{ 'onClick': {} },
    variant: "text",
}));
const __VLS_89 = __VLS_88({
    ...{ 'onClick': {} },
    variant: "text",
}, ...__VLS_functionalComponentArgsRest(__VLS_88));
let __VLS_92;
const __VLS_93 = ({ click: {} },
    { onClick: (__VLS_ctx.closeModal) });
const { default: __VLS_94 } = __VLS_90.slots;
// @ts-ignore
[closeModal,];
var __VLS_90;
var __VLS_91;
const __VLS_95 = {}.VBtn;
/** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
// @ts-ignore
VBtn;
// @ts-ignore
const __VLS_96 = __VLS_asFunctionalComponent(__VLS_95, new __VLS_95({
    ...{ 'onClick': {} },
    color: "primary",
    loading: (__VLS_ctx.isLoading),
}));
const __VLS_97 = __VLS_96({
    ...{ 'onClick': {} },
    color: "primary",
    loading: (__VLS_ctx.isLoading),
}, ...__VLS_functionalComponentArgsRest(__VLS_96));
let __VLS_100;
const __VLS_101 = ({ click: {} },
    { onClick: (__VLS_ctx.fetchData) });
const { default: __VLS_102 } = __VLS_98.slots;
// @ts-ignore
[fetchData, isLoading,];
var __VLS_98;
var __VLS_99;
var __VLS_78;
var __VLS_10;
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['bg-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['align-center']} */ ;
/** @type {__VLS_StyleScopedClasses['pa-4']} */ ;
/** @type {__VLS_StyleScopedClasses['pa-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['lookup-table']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['pa-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['pa-4']} */ ;
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    props: {
        isVisible: Boolean
    },
});
export default {};
