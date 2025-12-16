<template>
  <router-view /> 
</template>

<script setup>
// Script setup biasanya kosong di App.vue, karena logika navigasi 
// dan layout ditangani oleh Vue Router dan komponen Dashboard/Shell.
</script>

<style>
/* Ini adalah tempat untuk styling global atau reset CSS.
SEMUA STYLE DARI KOMPONEN BROWSE HARUS DIHAPUS DARI SINI
*/

/* Contoh reset CSS dasar */
body {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
  background-color: #f4f4f9;
}

#app {
  /* Pastikan elemen ini menempati seluruh ruang layar jika Anda menggunakan layout MDI */
  height: 100vh;
  width: 100vw;
  overflow: hidden; /* Mencegah scrollbar ganda */
}
</style>