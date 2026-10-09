<script setup lang="ts">
import { Eye, EyeOff, CircleAlert } from 'lucide-vue-next'

definePageMeta({ layout: 'auth' })
useHead({ title: 'Sign in - Susi Air Pilot' })

const auth = useAuthStore()
const username = ref('')
const password = ref('')
const showPassword = ref(false)

const canSubmit = computed(
  () => username.value.trim() !== '' && password.value !== '' && !auth.loading,
)

// Clear a previous error as soon as the pilot starts correcting the form.
watch([username, password], () => {
  if (auth.error) auth.error = null
})

async function onSubmit() {
  if (!canSubmit.value) return
  const ok = await auth.login(username.value.trim(), password.value)
  if (ok) await navigateTo('/')
}
</script>

<template>
  <div class="login">
    <img class="logo" src="/susiair-logo.png" alt="Susi Air" />

    <header class="intro">
      <h1>Pilot App</h1>
      <p>Sign in to see your schedule, flight hours and document status.</p>
    </header>

    <form class="card" novalidate @submit.prevent="onSubmit">
      <label class="field">
        <span>Username</span>
        <input
          v-model="username"
          type="text"
          autocomplete="username"
          autocapitalize="none"
          spellcheck="false"
          placeholder="Enter your username"
          :disabled="auth.loading"
        />
      </label>

      <label class="field">
        <span>Password</span>
        <div class="password">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            placeholder="Enter your password"
            :disabled="auth.loading"
          />
          <button
            type="button"
            class="toggle"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
            @click="showPassword = !showPassword"
          >
            <EyeOff v-if="showPassword" :size="18" />
            <Eye v-else :size="18" />
          </button>
        </div>
      </label>

      <p v-if="auth.error" class="error" role="alert">
        <CircleAlert :size="16" />
        <span>{{ auth.error }}</span>
      </p>

      <button type="submit" class="submit" :disabled="!canSubmit">
        {{ auth.loading ? 'Signing in...' : 'Sign in' }}
      </button>
    </form>
  </div>
</template>

<style lang="scss" scoped>
.logo {
  height: 44px;
  width: auto;
  align-self: flex-start;
  margin-bottom: 28px;
}

.intro {
  h1 {
    margin: 0 0 6px;
    font-size: 28px;
    font-weight: 800;
  }

  p {
    margin: 0 0 24px;
    font-size: 14px;
    line-height: 1.5;
    color: $text-secondary;
  }
}

.card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: $card;
  border-radius: $radius-card;
  box-shadow: $shadow-card;
}

.field > span {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
}

input {
  width: 100%;
  height: 48px;
  padding: 0 14px;
  font-size: 15px;
  color: $text-primary;
  background: #fff;
  border: 1px solid $border;
  border-radius: $radius-card-sm;
  outline: none;

  &:focus {
    border-color: $navy;
    box-shadow: 0 0 0 3px rgba($navy, 0.12);
  }

  &:disabled {
    background: $bg;
  }
}

.password {
  position: relative;

  input {
    padding-right: 46px;
  }
}

.toggle {
  position: absolute;
  top: 50%;
  right: 6px;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  color: $text-secondary;
  background: transparent;
  border: 0;
  transform: translateY(-50%);
  cursor: pointer;
}

.error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 600;
  color: $danger;
  background: rgba($danger, 0.08);
  border-radius: $radius-card-sm;

  svg {
    flex-shrink: 0;
    margin-top: 1px;
  }
}

.submit {
  height: 48px;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  background: $brand-red;
  border: 0;
  border-radius: $radius-pill;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
