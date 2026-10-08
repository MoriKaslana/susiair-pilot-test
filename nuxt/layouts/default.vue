<script setup lang="ts">
// TODO: implement
</script>

<template>
  <div class="app-shell">
    <main class="app-main">
      <slot />
    </main>
    <AppBottomNav />
  </div>
</template>

<style lang="scss" scoped>
.app-shell {
  max-width: $shell-max-width;
  min-height: 100vh;
  margin: 0 auto;
  background: $bg;
}

.app-main {
  padding: 16px 16px 88px;
}
</style>
