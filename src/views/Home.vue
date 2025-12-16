<template>
  <div class="home">
    <h1>Selamat Datang di Dashboard</h1>
    <p>{{ message }}</p>
  </div>
</template>

<script>
export default {
  name: "Home",
  data() {
    return {
      message: "Ini halaman utama aplikasi MMT",
    };
  },
};
</script>

<style scoped>
.home {
  text-align: center;
  padding: 10px;
}
</style>
