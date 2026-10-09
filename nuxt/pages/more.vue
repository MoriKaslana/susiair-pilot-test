<script setup lang="ts">
import { Info, LogOut, User } from 'lucide-vue-next'

useHead({ title: 'More - Susi Air Pilot' })

const auth = useAuthStore()
const pilot = usePilotStore()
const { formatHours } = useDateFormat()

const avatarFailed = ref(false)
watch(
  () => pilot.profile?.avatarUrl,
  () => {
    avatarFailed.value = false
  },
)

onMounted(() => {
  if (!pilot.profile) pilot.fetchProfile()
})

async function signOut() {
  auth.logout()
  await navigateTo('/login')
}
</script>

<template>
  <div class="more">
    <h1 class="title">More</h1>

    <StateBlock
      v-if="!pilot.profile && pilot.error"
      state="error"
      :message="pilot.error"
      @retry="pilot.fetchProfile()"
    />

    <StateBlock v-else-if="!pilot.profile" state="loading" :lines="2" min-height="110px" />

    <section v-else class="profile" aria-label="Pilot profile">
      <div class="avatar">
        <img
          v-if="!avatarFailed"
          :src="pilot.profile.avatarUrl"
          :alt="`${pilot.profile.name} avatar`"
          @error="avatarFailed = true"
        />
        <User v-else :size="26" />
      </div>
      <div class="who">
        <h2 class="name">{{ pilot.profile.name }}</h2>
        <p class="hours">
          <span class="hours-value">{{ formatHours(pilot.profile.totalFlightHours) }}<small>h</small></span>
          <span class="hours-label">total flight hours</span>
        </p>
      </div>
    </section>

    <section class="about" aria-label="About">
      <Info :size="18" />
      <p>Susi Air Pilot App</p>
    </section>

    <button type="button" class="signout" @click="signOut">
      <LogOut :size="18" />
      Sign out
    </button>
  </div>
</template>

<style lang="scss" scoped>
.more {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
}

.profile {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: $card;
  border-radius: $radius-card;
  box-shadow: $shadow-card;
}

.avatar {
  display: grid;
  flex: none;
  place-items: center;
  width: 56px;
  height: 56px;
  overflow: hidden;
  border-radius: 50%;
  background: $bg;
  color: $text-secondary;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.who {
  min-width: 0;
}

.name {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.hours {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px 8px;
  margin: 4px 0 0;
}

.hours-value {
  font-size: 22px;
  font-weight: 800;
  line-height: 1.1;

  small {
    margin-left: 2px;
    font-size: 13px;
    font-weight: 700;
    color: $text-secondary;
  }
}

.hours-label {
  font-size: 12px;
  color: $text-secondary;
}

.about {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: $card;
  border-radius: $radius-card;
  box-shadow: $shadow-card;
  color: $text-secondary;

  p {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: $text-primary;
  }
}

.signout {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
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

  &:focus-visible {
    outline: 2px solid $navy;
    outline-offset: 2px;
  }
}
</style>
