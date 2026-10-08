<script setup lang="ts">
const route = useRoute()
</script>

<template>
  <div>
    <h1>{{ route.params.date }}</h1>
    <p>Detail page coming soon</p>
    <NuxtLink to="/schedule">Back</NuxtLink>
  </div>
</template>
