<template>
  <div class="placeholder-container">
    <h2>Segera Hadir</h2>
    <p>Halaman untuk modul <b>{{ $route.name }}</b> sedang dalam pengembangan.</p>
  </div>
</template>

<style scoped>
.placeholder-container {
  padding: 40px;
  text-align: center;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  border: 1px solid #ddd;
}
h2 {
  color: #333;
}
p {
  color: #666;
  font-size: 1.1rem;
}
</style>