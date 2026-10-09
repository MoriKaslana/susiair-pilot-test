<script setup lang="ts">
import { User } from 'lucide-vue-next'
import type { PilotProfile } from '~/types/api'

const props = defineProps<{
  profile: PilotProfile | null
  error: string | null
}>()

defineEmits<{ retry: [] }>()

const { formatHours } = useDateFormat()

// Time-of-day greeting from the browser clock is the one allowed use of the local
// time. Set after mount so server and client markup match.
const greeting = ref('Welcome')
onMounted(() => {
  const hour = new Date().getHours()
  greeting.value = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
})

const avatarFailed = ref(false)
watch(
  () => props.profile?.avatarUrl,
  () => {
    avatarFailed.value = false
  },
)
</script>

<template>
  <header class="header">
    <img class="logo" src="/susiair-logo.png" alt="Susi Air" />

    <StateBlock v-if="!profile && error" state="error" :message="error" @retry="$emit('retry')" />

    <StateBlock v-else-if="!profile" state="loading" :lines="2" min-height="120px" />

    <section v-else class="profile">
      <div class="avatar">
        <img
          v-if="!avatarFailed"
          :src="profile.avatarUrl"
          :alt="`${profile.name} avatar`"
          @error="avatarFailed = true"
        />
        <User v-else :size="26" />
      </div>

      <div class="who">
        <p class="greeting">{{ greeting }}</p>
        <h1 class="name">{{ profile.name }}</h1>
      </div>

      <div class="total">
        <span class="total-label">Total flight hours</span>
        <span class="total-value">{{ formatHours(profile.totalFlightHours) }}<small>h</small></span>
      </div>
    </section>
  </header>
</template>

<style lang="scss" scoped>
.header {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 24px;
}

.logo {
  align-self: flex-start;
  height: 28px;
  width: auto;
}

.profile {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 4px 14px;
  padding: 18px;
  border-radius: $radius-card;
  background: $navy;
  color: $card;
  box-shadow: $shadow-card;
}

.avatar {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  overflow: hidden;
  border-radius: 50%;
  background: rgba($card, 0.14);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.who {
  min-width: 0;
}

.greeting {
  margin: 0;
  font-size: 13px;
  color: rgba($card, 0.7);
}

.name {
  margin: 2px 0 0;
  font-size: 20px;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.total {
  grid-column: 1 / -1;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba($card, 0.14);
}

.total-label {
  font-size: 13px;
  color: rgba($card, 0.7);
}

.total-value {
  font-size: 30px;
  font-weight: 800;
  line-height: 1;

  small {
    margin-left: 3px;
    font-size: 15px;
    font-weight: 700;
    color: rgba($card, 0.7);
  }
}
</style>
