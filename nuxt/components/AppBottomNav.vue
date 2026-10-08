<script setup lang="ts">
// TODO: implement icons + active state
</script>

<template>
  <nav class="bottom-nav">
    <NuxtLink to="/">Home</NuxtLink>
    <NuxtLink to="/schedule">Schedule</NuxtLink>
    <NuxtLink to="/logbook">Logbook</NuxtLink>
    <NuxtLink to="/more">More</NuxtLink>
  </nav>
</template>

<style lang="scss" scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: $shell-max-width;
  display: flex;
  justify-content: space-around;
  padding: 12px 0;
  background: $card;
  box-shadow: $shadow-card;

  a {
    color: $text-secondary;
    text-decoration: none;
    font-size: 13px;
    font-weight: 600;
  }
}
</style>
