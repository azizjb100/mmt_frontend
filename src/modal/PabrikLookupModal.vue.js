import { ref, watch, onMounted } from 'vue';
import api from '@/services/api';
const props = defineProps({
    isVisible: Boolean
});
const emit = defineEmits(['close', 'select']);
const internalVisible = ref(props.isVisible);
const search = ref('');
const items = ref([]);
const loading = ref(false);
const headers = [
    { title: 'Kode', key: 'Kode', width: '100px' },
    { title: 'Nama Pabrik', key: 'Nama' },
    { title: 'Alamat', key: 'Alamat', align: 'center' }
];
watch(() => props.isVisible, async (val) => {
    internalVisible.value = val;
    if (val && items.value.length === 0) {
        fetchData();
    }
});
const fetchData = async () => {
    loading.value = true;
    try {
        const response = await api.get('/mmt/lookup-pabrik', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        items.value = response.data;
    }
    catch (err) {
        console.error('Gagal memuat pabrik', err);
    }
    finally {
        loading.value = false;
    }
};
const selectItem = (item) => {
    emit('select', item);
    close();
};
const close = () => {
    emit('close');
};
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
    modelValue: (__VLS_ctx.internalVisible),
    maxWidth: "600px",
    scrollable: true,
}));
const __VLS_2 = __VLS_1({
    modelValue: (__VLS_ctx.internalVisible),
    maxWidth: "600px",
    scrollable: true,
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
const __VLS_8 = __VLS_asFunctionalComponent(__VLS_7, new __VLS_7({
    title: "Pilih Pabrik",
}));
const __VLS_9 = __VLS_8({
    title: "Pilih Pabrik",
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
const { default: __VLS_12 } = __VLS_10.slots;
const __VLS_13 = {}.VCardText;
/** @type {[typeof __VLS_components.VCardText, typeof __VLS_components.vCardText, typeof __VLS_components.VCardText, typeof __VLS_components.vCardText, ]} */ ;
// @ts-ignore
VCardText;
// @ts-ignore
const __VLS_14 = __VLS_asFunctionalComponent(__VLS_13, new __VLS_13({
    ...{ class: "pa-0" },
}));
const __VLS_15 = __VLS_14({
    ...{ class: "pa-0" },
}, ...__VLS_functionalComponentArgsRest(__VLS_14));
const { default: __VLS_18 } = __VLS_16.slots;
const __VLS_19 = {}.VTextField;
/** @type {[typeof __VLS_components.VTextField, typeof __VLS_components.vTextField, typeof __VLS_components.VTextField, typeof __VLS_components.vTextField, ]} */ ;
// @ts-ignore
VTextField;
// @ts-ignore
const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({
    modelValue: (__VLS_ctx.search),
    prependInnerIcon: "mdi-magnify",
    label: "Cari Pabrik...",
    variant: "solo-filled",
    hideDetails: true,
    flat: true,
}));
const __VLS_21 = __VLS_20({
    modelValue: (__VLS_ctx.search),
    prependInnerIcon: "mdi-magnify",
    label: "Cari Pabrik...",
    variant: "solo-filled",
    hideDetails: true,
    flat: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_20));
// @ts-ignore
[search,];
const __VLS_25 = {}.VDataTable;
/** @type {[typeof __VLS_components.VDataTable, typeof __VLS_components.vDataTable, typeof __VLS_components.VDataTable, typeof __VLS_components.vDataTable, ]} */ ;
// @ts-ignore
VDataTable;
// @ts-ignore
const __VLS_26 = __VLS_asFunctionalComponent(__VLS_25, new __VLS_25({
    ...{ 'onClick:row': {} },
    headers: (__VLS_ctx.headers),
    items: (__VLS_ctx.items),
    search: (__VLS_ctx.search),
    loading: (__VLS_ctx.loading),
    density: "compact",
    hover: true,
    height: "400px",
}));
const __VLS_27 = __VLS_26({
    ...{ 'onClick:row': {} },
    headers: (__VLS_ctx.headers),
    items: (__VLS_ctx.items),
    search: (__VLS_ctx.search),
    loading: (__VLS_ctx.loading),
    density: "compact",
    hover: true,
    height: "400px",
}, ...__VLS_functionalComponentArgsRest(__VLS_26));
let __VLS_30;
const __VLS_31 = ({ 'click:row': {} },
    { 'onClick:row': ((e, { item }) => __VLS_ctx.selectItem(item)) });
const { default: __VLS_32 } = __VLS_28.slots;
// @ts-ignore
[search, headers, items, loading, selectItem,];
{
    const { 'item.MintaObat': __VLS_33 } = __VLS_28.slots;
    const [{ value }] = __VLS_getSlotParameters(__VLS_33);
    const __VLS_34 = {}.VChip;
    /** @type {[typeof __VLS_components.VChip, typeof __VLS_components.vChip, typeof __VLS_components.VChip, typeof __VLS_components.vChip, ]} */ ;
    // @ts-ignore
    VChip;
    // @ts-ignore
    const __VLS_35 = __VLS_asFunctionalComponent(__VLS_34, new __VLS_34({
        size: "x-small",
        color: (value === 'Y' ? 'success' : 'grey'),
    }));
    const __VLS_36 = __VLS_35({
        size: "x-small",
        color: (value === 'Y' ? 'success' : 'grey'),
    }, ...__VLS_functionalComponentArgsRest(__VLS_35));
    const { default: __VLS_39 } = __VLS_37.slots;
    (value);
    var __VLS_37;
}
var __VLS_28;
var __VLS_29;
var __VLS_16;
const __VLS_40 = {}.VDivider;
/** @type {[typeof __VLS_components.VDivider, typeof __VLS_components.vDivider, typeof __VLS_components.VDivider, typeof __VLS_components.vDivider, ]} */ ;
// @ts-ignore
VDivider;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({}));
const __VLS_42 = __VLS_41({}, ...__VLS_functionalComponentArgsRest(__VLS_41));
const __VLS_46 = {}.VCardActions;
/** @type {[typeof __VLS_components.VCardActions, typeof __VLS_components.vCardActions, typeof __VLS_components.VCardActions, typeof __VLS_components.vCardActions, ]} */ ;
// @ts-ignore
VCardActions;
// @ts-ignore
const __VLS_47 = __VLS_asFunctionalComponent(__VLS_46, new __VLS_46({}));
const __VLS_48 = __VLS_47({}, ...__VLS_functionalComponentArgsRest(__VLS_47));
const { default: __VLS_51 } = __VLS_49.slots;
const __VLS_52 = {}.VSpacer;
/** @type {[typeof __VLS_components.VSpacer, typeof __VLS_components.vSpacer, typeof __VLS_components.VSpacer, typeof __VLS_components.vSpacer, ]} */ ;
// @ts-ignore
VSpacer;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({}));
const __VLS_54 = __VLS_53({}, ...__VLS_functionalComponentArgsRest(__VLS_53));
const __VLS_58 = {}.VBtn;
/** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
// @ts-ignore
VBtn;
// @ts-ignore
const __VLS_59 = __VLS_asFunctionalComponent(__VLS_58, new __VLS_58({
    ...{ 'onClick': {} },
    color: "grey",
    variant: "text",
}));
const __VLS_60 = __VLS_59({
    ...{ 'onClick': {} },
    color: "grey",
    variant: "text",
}, ...__VLS_functionalComponentArgsRest(__VLS_59));
let __VLS_63;
const __VLS_64 = ({ click: {} },
    { onClick: (__VLS_ctx.close) });
const { default: __VLS_65 } = __VLS_61.slots;
// @ts-ignore
[close,];
var __VLS_61;
var __VLS_62;
var __VLS_49;
var __VLS_10;
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['pa-0']} */ ;
const __VLS_export = (await import('vue')).defineComponent({
    setup: () => ({
        ...props,
        ...{},
        ...{},
    }),
});
export default {};
