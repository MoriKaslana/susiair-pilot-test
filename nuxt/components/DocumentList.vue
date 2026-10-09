<script setup lang="ts">
import { FileText } from 'lucide-vue-next'
import type { PilotDocument } from '~/types/api'

defineProps<{
  documents: PilotDocument[] | null
  error: string | null
}>()

defineEmits<{ retry: [] }>()

const { formatLongDate } = useDateFormat()
</script>

<template>
  <StateBlock v-if="!documents && error" state="error" :message="error" @retry="$emit('retry')" />

  <StateBlock v-else-if="!documents" state="loading" :lines="4" />

  <StateBlock v-else-if="documents.length === 0" state="empty" message="No documents on file." />

  <ul v-else class="list">
    <li v-for="doc in documents" :key="doc.id" class="row">
      <span class="icon"><FileText :size="18" /></span>
      <div class="info">
        <p class="label">{{ doc.label }}</p>
        <p class="date">Expires {{ formatLongDate(doc.expiryDate) }}</p>
      </div>
      <DocumentBadge :status="doc.status" :days-remaining="doc.daysRemaining" />
    </li>
  </ul>
</template>

<style lang="scss" scoped>
.list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 4px 14px;
  list-style: none;
  background: $card;
  border-radius: $radius-card;
  box-shadow: $shadow-card;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;

  & + & {
    border-top: 1px solid $border;
  }
}

.icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: $radius-card-sm;
  background: $bg;
  color: $text-secondary;
}

.info {
  flex: 1;
  min-width: 0;
}

.label {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.date {
  margin: 2px 0 0;
  font-size: 12px;
  color: $text-secondary;
}
</style>
