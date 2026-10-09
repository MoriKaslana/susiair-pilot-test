<script setup lang="ts">
import { LogOut } from 'lucide-vue-next'

const auth = useAuthStore()

async function signOut() {
  auth.logout()
  await navigateTo('/login')
}
</script>

<template>
  <div class="more">
    <h1>More</h1>
    <p class="muted">More features are coming soon.</p>
    <button type="button" class="signout" @click="signOut">
      <LogOut :size="18" />
      Sign out
    </button>
  </div>
</template>

<style lang="scss" scoped>
h1 {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 800;
}

.muted {
  margin: 0 0 24px;
  color: $text-secondary;
  font-size: 14px;
}

.signout {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 20px;
  font-size: 14px;
  font-weight: 700;
  color: $brand-red;
  background: $card;
  border: 1px solid $brand-red;
  border-radius: $radius-pill;
  cursor: pointer;
}
</style>
