<template>
    <PageLayout title="Data Master Supplier" icon="mdi-truck-delivery-outline">
        <template #header-actions>
            <v-btn size="x-small" color="success" @click="handleNew">
                <v-icon start>mdi-plus</v-icon> Baru
            </v-btn>
            <v-btn
                size="x-small"
                color="warning"
                :disabled="!isSingleSelected"
                @click="handleEdit"
            >
                <v-icon start>mdi-pencil</v-icon> Ubah
            </v-btn>
            <v-btn size="x-small" color="info" @click="btnRefreshClick">
                <v-icon start>mdi-refresh</v-icon> Refresh
            </v-btn>
        </template>

        <div class="browse-content">
            <v-card flat class="mb-4">
                <v-card-text>
                    <div
                        class="filter-section d-flex align-center flex-wrap ga-4"
                    >
                        <v-text-field
                            v-model="filters.keyword"
                            label="Cari Kode / Nama Supplier"
                            density="compact"
                            hide-details
                            variant="outlined"
                            style="max-width: 300px"
                            prepend-inner-icon="mdi-magnify"
                        />
                        <v-spacer />
                    </div>
                </v-card-text>
            </v-card>

            <div class="table-container">
                <v-data-table
                    v-model:selected="selected"
                    :headers="headers"
                    :items="filteredMasterData"
                    :loading="loading"
                    :row-props="rowProps"
                    item-value="Kode"
                    density="compact"
                    fixed-header
                    class="desktop-table elevation-1"
                    return-object
                    show-select
                    select-strategy="single"
                    @click:row="handleRowClick"
                >
                    <template #item.Alamat="{ item }">
                        <div class="text-truncate" style="max-width: 250px">
                            {{ item.Alamat }}
                        </div>
                    </template>
                </v-data-table>
            </div>
        </div>
    </PageLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { useAuthStore } from "../stores/authStore"; // Asumsi store auth untuk cek hak akses
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";

interface Supplier {
    Kode: string;
    Nama: string;
    Alamat: string;
    Kota: string;
    Fax: string;
    Telp: string;
    Contact: string;
    TargetMitra: string;
    Keterangan: string;
}

const API_SUPPLIER = "/supplier";
const FORM_NAME = "frmBrowSupplier";

const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();

const masterData = ref<Supplier[]>([]);
const selected = ref<Supplier[]>([]);
const loading = ref(true);

const filters = reactive({
    keyword: "",
});

const isSingleSelected = computed(() => selected.value.length === 1);

const selectedKode = computed(() =>
    isSingleSelected.value ? selected.value[0].Kode : null,
);

const handleRowClick = (_event: Event, payload: any) => {
    const row = payload?.item?.raw ?? payload?.item ?? null;
    if (!row) return;
    selected.value = [row];
};

const rowProps = ({ item }: any) => {
    const raw = item?.raw ?? item;
    const isActive =
        String(raw?.Kode ?? "") === String(selectedKode.value ?? "");
    return { class: isActive ? "row-selected" : "" };
};

const filteredMasterData = computed<Supplier[]>(() => {
    const list = Array.isArray(masterData.value) ? masterData.value : [];
    if (!filters.keyword) return list;

    const kw = filters.keyword.toLowerCase();
    return list.filter(
        (i) =>
            (i.Kode ?? "").toLowerCase().includes(kw) ||
            (i.Nama ?? "").toLowerCase().includes(kw) ||
            (i.Kota ?? "").toLowerCase().includes(kw),
    );
});

const headers = [
    { title: "Kode", key: "Kode", width: "100px", fixed: true },
    { title: "Nama Supplier", key: "Nama", width: "200px" },
    { title: "Alamat", key: "Alamat", width: "250px" },
    { title: "Kota", key: "Kota", width: "120px" },
    { title: "Telp", key: "Telp", width: "120px" },
    { title: "Fax", key: "Fax", width: "100px" },
    { title: "Contact Person", key: "Contact", width: "150px" },
    { title: "Keterangan", key: "Keterangan", width: "200px" },
];

const btnRefreshClick = async () => {
    loading.value = true;
    try {
        const response = await api.get(`${API_SUPPLIER}?sort=Nama`);
        const res = response.data;

        masterData.value = res.data || res || [];
        selected.value = [];
    } catch (error) {
        toast.error("Gagal mengambil data Supplier.");
    } finally {
        loading.value = false;
    }
};

const hasAccess = (type: "insert" | "edit") => {
    const permissions: any =
        (authStore as any).permissions ??
        JSON.parse(localStorage.getItem("userPermissions") || "null");

    if (!permissions) return true;

    if (Array.isArray(permissions)) {
        const hit = permissions.find(
            (p) =>
                String(p?.form || p?.formName || "").toLowerCase() ===
                FORM_NAME.toLowerCase(),
        );
        return hit ? Boolean(hit[type]) : true;
    }

    return permissions?.[FORM_NAME]?.[type] ?? true;
};

const handleNew = () => {
    if (!hasAccess("insert")) {
        toast.warning("Anda tidak berhak Menambah data di Modul ini");
        return;
    }
    router.push({ name: "SupplierNew" });
};

const handleEdit = () => {
    if (!isSingleSelected.value) return;

    if (!hasAccess("edit")) {
        toast.warning("Anda tidak berhak mengubah data di Modul ini.");
        return;
    }

    router.push({
        name: "SupplierEdit",
        params: { kode: selectedKode.value },
    });
};

onMounted(() => {
    btnRefreshClick();
});
</script>

<style scoped>
.browse-content {
    padding: 12px;
}
.table-container {
    height: calc(100vh - 220px);
}
:deep(.v-data-table) {
    height: 100%;
}

:deep(.row-selected) {
    background-color: rgba(25, 118, 210, 0.12) !important;
}
</style>
