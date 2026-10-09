<template>
  <div class="auth-shell">
    <div class="auth-inner">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.auth-shell {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  background: $bg;
}

.auth-inner {
  width: 100%;
  max-width: $shell-max-width;
  padding: 32px 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
</style>
