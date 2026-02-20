<template>
    <PageLayout :title="formTitle" icon="mdi-truck-plus">
        <template #header-actions>
            <v-btn
                size="small"
                color="error"
                class="mr-2"
                @click="handleDelete"
                v-if="isEditMode"
            >
                <v-icon start>mdi-trash-can</v-icon> Hapus (F5)
            </v-btn>
            <v-btn
                size="small"
                color="primary"
                class="mr-2"
                @click="handleSave"
                :loading="saving"
            >
                <v-icon start>mdi-check-circle</v-icon> Simpan (F10)
            </v-btn>
            <v-btn
                size="small"
                color="success"
                class="mr-2"
                @click="refreshData"
            >
                <v-icon start>mdi-content-save-all</v-icon> Simpan & Baru (F7)
            </v-btn>
            <v-btn size="small" @click="closeForm">
                <v-icon start>mdi-close</v-icon> Tutup
            </v-btn>
        </template>

        <v-form ref="formSupplier">
            <div class="form-grid-container">
                <div class="left-column">
                    <v-card class="desktop-form-section" flat>
                        <v-card-title class="text-subtitle-1"
                            >Data Utama</v-card-title
                        >
                        <v-card-text>
                            <v-row dense>
                                <v-col cols="12">
                                    <v-text-field
                                        v-model="form.Kode"
                                        label="Kode Supplier (Otomatis)"
                                        hint="Otomatis dari sistem"
                                        persistent-hint
                                        readonly
                                        variant="outlined"
                                        density="compact"
                                        hide-details
                                    />
                                </v-col>
                                <v-col cols="12">
                                    <v-text-field
                                        v-model="form.Nama"
                                        label="Nama Supplier"
                                        variant="outlined"
                                        density="compact"
                                        hide-details
                                        required
                                        :rules="[
                                            (v) => !!v || 'Nama wajib diisi',
                                        ]"
                                        class="text-uppercase"
                                        @input="
                                            form.Nama = form.Nama.toUpperCase()
                                        "
                                    />
                                </v-col>
                                <v-col cols="12">
                                    <v-text-field
                                        v-model="form.Alamat"
                                        label="Alamat"
                                        variant="outlined"
                                        density="compact"
                                        hide-details
                                        class="text-uppercase"
                                        @input="
                                            form.Alamat =
                                                form.Alamat.toUpperCase()
                                        "
                                    />
                                </v-col>
                                <v-col cols="12">
                                    <v-text-field
                                        v-model="form.Kota"
                                        label="Kota"
                                        variant="outlined"
                                        density="compact"
                                        hide-details
                                        class="text-uppercase"
                                        @input="
                                            form.Kota = form.Kota.toUpperCase()
                                        "
                                    />
                                </v-col>
                                <v-text-field
                                    v-model="form.Telp"
                                    label="Telepon"
                                    variant="outlined"
                                    density="compact"
                                    hide-details
                                    inputmode="numeric"
                                    @input="
                                        form.Telp = form.Telp.replace(
                                            /[^0-9]/g,
                                            '',
                                        )
                                    "
                                />
                                <v-col cols="6">
                                    <v-text-field
                                        v-model="form.Fax"
                                        label="Fax"
                                        variant="outlined"
                                        density="compact"
                                        hide-details
                                    />
                                </v-col>
                                <v-col cols="12">
                                    <v-text-field
                                        v-model="form.Contact"
                                        label="Kontak Person"
                                        variant="outlined"
                                        density="compact"
                                        hide-details
                                        class="text-uppercase"
                                        @input="
                                            form.Contact =
                                                form.Contact.toUpperCase()
                                        "
                                    />
                                </v-col>
                                <v-col cols="12">
                                    <v-textarea
                                        v-model="form.Keterangan"
                                        label="Keterangan"
                                        rows="3"
                                        variant="outlined"
                                        density="compact"
                                        hide-details
                                    />
                                </v-col>
                            </v-row>
                        </v-card-text>
                    </v-card>
                </div>

                <div class="right-column">
                    <v-card class="desktop-form-section" flat>
                        <v-card-title class="text-subtitle-1"
                            >Perpajakan (NPWP) (Opsional)</v-card-title
                        >
                        <v-card-text>
                            <v-row dense>
                                <v-col cols="12">
                                    <v-text-field
                                        v-model="form.KodeNPWP"
                                        label="Nomor NPWP"
                                        variant="outlined"
                                        density="compact"
                                        hide-details
                                        inputmode="numeric"
                                        @input="
                                            form.KodeNPWP =
                                                form.KodeNPWP.replace(
                                                    /[^0-9]/g,
                                                    '',
                                                )
                                        "
                                    />
                                </v-col>
                                <v-col cols="12">
                                    <v-text-field
                                        v-model="form.NamaNPWP"
                                        label="Nama di NPWP"
                                        variant="outlined"
                                        density="compact"
                                        hide-details
                                        class="text-uppercase"
                                        @input="
                                            form.NamaNPWP =
                                                form.NamaNPWP.toUpperCase()
                                        "
                                    />
                                </v-col>
                                <v-col cols="12">
                                    <v-text-field
                                        v-model="form.AlamatNPWP"
                                        label="Alamat NPWP"
                                        variant="outlined"
                                        density="compact"
                                        hide-details
                                        class="text-uppercase"
                                        @input="
                                            form.AlamatNPWP =
                                                form.AlamatNPWP.toUpperCase()
                                        "
                                    />
                                </v-col>
                                <v-col cols="12">
                                    <v-text-field
                                        v-model="form.KotaNPWP"
                                        label="Kota NPWP"
                                        variant="outlined"
                                        density="compact"
                                        hide-details
                                        class="text-uppercase"
                                        @input="
                                            form.KotaNPWP =
                                                form.KotaNPWP.toUpperCase()
                                        "
                                    />
                                </v-col>
                            </v-row>
                        </v-card-text>
                    </v-card>

                    <v-card class="desktop-form-section mt-4" flat>
                        <v-card-title class="text-subtitle-1"
                            >Informasi Perbankan & Lainnya
                            (Opsional)</v-card-title
                        >
                        <v-card-text>
                            <v-row dense>
                                <v-col cols="6">
                                    <v-text-field
                                        v-model="form.Bank"
                                        label="Nama Bank"
                                        variant="outlined"
                                        density="compact"
                                        hide-details
                                        class="text-uppercase"
                                        @input="
                                            form.Bank = form.Bank.toUpperCase()
                                        "
                                    />
                                </v-col>
                                <v-col cols="6">
                                    <v-text-field
                                        v-model="form.NoRekening"
                                        label="No. Rekening"
                                        variant="outlined"
                                        density="compact"
                                        hide-details
                                        inputmode="numeric"
                                        @input="
                                            form.NoRekening =
                                                form.NoRekening.replace(
                                                    /[^0-9]/g,
                                                    '',
                                                )
                                        "
                                    />
                                </v-col>
                                <v-col cols="6">
                                    <v-text-field
                                        v-model="form.AtasNama"
                                        label="Atas Nama"
                                        variant="outlined"
                                        density="compact"
                                        hide-details
                                        class="text-uppercase"
                                        @input="
                                            form.AtasNama =
                                                form.AtasNama.toUpperCase()
                                        "
                                    />
                                </v-col>
                                <v-col cols="6">
                                    <v-text-field
                                        v-model="form.Cabang"
                                        label="Cabang"
                                        variant="outlined"
                                        density="compact"
                                        hide-details
                                    />
                                </v-col>
                                <v-col cols="6">
                                    <v-text-field
                                        v-model.number="form.Top"
                                        type="number"
                                        min="0"
                                        label="TOP (hari)"
                                        variant="outlined"
                                        density="compact"
                                        hide-details
                                    />
                                </v-col>
                                <v-col cols="6">
                                    <v-text-field
                                        v-model.number="form.TargetMitra"
                                        type="number"
                                        min="0"
                                        label="Target Mitra"
                                        variant="outlined"
                                        density="compact"
                                        hide-details
                                    />
                                </v-col>
                            </v-row>
                        </v-card-text>
                    </v-card>
                </div>
            </div>
        </v-form>

        <v-dialog v-model="dialogBantuan" max-width="600px">
            <v-card>
                <v-card-title>Pilih Supplier</v-card-title>
                <v-card-text>
                    <v-data-table
                        :headers="headersBantuan"
                        :items="listBantuan"
                        hover
                        @click:row="(e, { item }) => selectSupplier(item.Kode)"
                    />
                </v-card-text>
            </v-card>
        </v-dialog>
    </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";

const router = useRouter();
const route = useRoute();
const toast = useToast();

const isEditMode = ref(false);
const saving = ref(false);
const dialogBantuan = ref(false);
const listBantuan = ref([]);

const formTitle = computed(() =>
    isEditMode.value
        ? `Master Supplier Edit${form.Kode ? `: ${form.Kode}` : ""}`
        : "Master Supplier Baru",
);

const form = reactive({
    Kode: "",
    Nama: "",
    Alamat: "",
    Kota: "",
    Telp: "",
    Fax: "",
    Contact: "",
    KodeNPWP: "",
    NamaNPWP: "",
    AlamatNPWP: "",
    KotaNPWP: "",
    Top: 0,
    TargetMitra: 0,
    NoRekening: "",
    Bank: "",
    AtasNama: "",
    Cabang: "",
    Keterangan: "",
    SaldoHutang: 0,
});

const headersBantuan = [
    { title: "Kode", key: "Kode" },
    { title: "Nama", key: "Nama" },
    { title: "Alamat", key: "Alamat" },
];

const loadNextKode = async () => {
    try {
        const response = await api.get("/supplier/next-kode");
        form.Kode = String(response.data?.data?.kode || "");
    } catch (_e) {
        form.Kode = "";
        toast.error("Gagal mengambil kode supplier otomatis");
    }
};

const loadData = async (kode: string) => {
    if (!kode) return;
    try {
        const response = await api.get(`/supplier/${kode}`);
        if (response.data.data) {
            Object.assign(form, response.data.data);
            isEditMode.value = true;
        } else {
            toast.info("Kode tersebut belum ada");
        }
    } catch (e) {
        toast.error("Gagal memuat data");
    }
};

const handleSave = async () => {
    if (!form.Nama) {
        toast.warning("Nama Supplier belum diisi");
        return;
    }

    if (!confirm("Yakin ingin simpan?")) return;

    saving.value = true;
    try {
        const payload = { header: form, isEditMode: isEditMode.value };
        const response = await api.post("/supplier/save", payload);
        toast.success(`Tersimpan dengan kode: ${response.data.kode}`);
        refreshData();
    } catch (e: any) {
        toast.error("Gagal Simpan: " + e.message);
    } finally {
        saving.value = false;
    }
};

const handleDelete = async () => {
    if (!confirm("Yakin ingin hapus?")) return;
    try {
        await api.delete(`/supplier/${form.Kode}`);
        toast.success("Berhasil hapus");
        refreshData();
    } catch (e) {
        toast.error("Gagal hapus");
    }
};

const refreshData = async () => {
    Object.assign(form, {
        Kode: "",
        Nama: "",
        Alamat: "",
        Kota: "",
        Telp: "",
        Fax: "",
        Contact: "",
        KodeNPWP: "",
        NamaNPWP: "",
        AlamatNPWP: "",
        Top: 0,
        TargetMitra: 0,
        NoRekening: "",
        Bank: "",
        AtasNama: "",
        Cabang: "",
        Keterangan: "",
        SaldoHutang: 0,
    });
    isEditMode.value = false;
    await loadNextKode();
};

const closeForm = () => {
    router.back();
};

const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "F10") {
        e.preventDefault();
        handleSave();
    }
    if (e.key === "F7") {
        e.preventDefault();
        void refreshData();
    }
    if (e.key === "F5" && isEditMode.value) {
        e.preventDefault();
        handleDelete();
    }
};

const openBantuan = async () => {
    const res = await api.get("/supplier");
    listBantuan.value = res.data.data;
    dialogBantuan.value = true;
};

const selectSupplier = (kode: string) => {
    form.Kode = kode;
    loadData(kode);
    dialogBantuan.value = false;
};

onMounted(() => {
    window.addEventListener("keydown", handleKeyDown);
    if (route.params.kode) {
        loadData(route.params.kode as string);
    } else {
        void refreshData();
    }
});

onBeforeUnmount(() => {
    window.removeEventListener("keydown", handleKeyDown);
});
</script>

<style scoped>
.form-grid-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    padding: 20px;
    align-items: flex-start;
}

.left-column,
.right-column {
    display: flex;
    flex-direction: column;
    gap: 20px;
}
</style>
