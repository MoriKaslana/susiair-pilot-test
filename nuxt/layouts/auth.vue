<script setup lang="ts">
// TODO: implement
</script>

<template>
  <div class="auth-shell">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.auth-shell {
  max-width: $shell-max-width;
  min-height: 100vh;
  margin: 0 auto;
  padding: 24px 16px;
  background: $bg;
}
</style>
