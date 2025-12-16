<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-content">
      <h3>Pilih User (F1)</h3>
      <input type="text" v-model="filter" placeholder="Cari Kode atau Nama..." class="filter-input"/>
      <div class="user-list">
        <table>
          <thead>
            <tr>
              <th>Kode User</th>
              <th>Nama User</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="2">Memuat data...</td>
            </tr>
            <tr v-for="user in filteredUsers" :key="user.user_kode" @click="selectUser(user)">
              <td>{{ user.user_kode }}</td>
              <td>{{ user.user_Nama }}</td>
            </tr>
            <tr v-if="!loading && filteredUsers.length === 0">
              <td colspan="2">Tidak ada data.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <button @click="$emit('close')" class="btn-tutup">Tutup</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { fetchUserHelpers } from '../stores/authStore';

const emit = defineEmits(['close', 'select']);
const users = ref([]);
const filter = ref('');
const loading = ref(true);

onMounted(async () => {
  try {
    users.value = await fetchUserHelpers();
  } catch (error) {
    alert(error.message);
  } finally {
    loading.value = false;
  }
});

const filteredUsers = computed(() => {
  if (!filter.value) {
    return users.value;
  }
  const f = filter.value.toLowerCase();
  return users.value.filter(u => 
    u.user_kode.toLowerCase().includes(f) || 
    u.user_Nama.toLowerCase().includes(f)
  );
});

const selectUser = (user) => {
  emit('select', user);
  emit('close');
};
</script>

<style scoped>
.modal-backdrop {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex; justify-content: center; align-items: center; z-index: 1000;
}
.modal-content {
  background: white; padding: 20px; border-radius: 8px;
  width: 500px; max-height: 80vh; display: flex; flex-direction: column;
}
.filter-input {
  width: 100%; padding: 8px; box-sizing: border-box; margin-bottom: 10px;
}
.user-list {
  overflow-y: auto;
  border: 1px solid #ccc;
  margin: 10px 0;
  flex-grow: 1;
}
table { width: 100%; border-collapse: collapse; }
th, td { padding: 8px; border-bottom: 1px solid #ddd; text-align: left; }
tbody tr { cursor: pointer; }
tbody tr:hover { background-color: #f0f0f0; }
.btn-tutup {
  margin-top: 10px; padding: 10px; background-color: #6c757d;
  color: white; border: none; border-radius: 4px;
}
</style>