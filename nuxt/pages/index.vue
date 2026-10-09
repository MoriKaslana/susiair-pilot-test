<script setup lang="ts">
useHead({ title: 'Home - Susi Air Pilot' })

const pilot = usePilotStore()
const flightHours = useFlightHoursStore()
const documents = useDocumentsStore()

// Each section loads independently, so one failing request never blanks the page.
onMounted(() => {
  pilot.fetchProfile()
  flightHours.fetchLimits()
  flightHours.fetchSummary()
  documents.fetchDocuments()
})
</script>

<template>
  <div class="home">
    <PilotHeader :profile="pilot.profile" :error="pilot.error" @retry="pilot.fetchProfile()" />

    <section class="section" aria-labelledby="limits-title">
      <h2 id="limits-title" class="title">Hours to Limit</h2>

      <LimitCards
        :cards="flightHours.limits?.cards ?? null"
        :error="flightHours.limitsError"
        @retry="flightHours.fetchLimits()"
      />

      <div class="chart-card">
        <RangeToggle :model-value="flightHours.range" @update:model-value="flightHours.setRange($event)" />
        <FlightHoursChart
          :summary="flightHours.summary"
          :loading="flightHours.summaryLoading"
          :error="flightHours.summaryError"
          @retry="flightHours.fetchSummary()"
        />
      </div>
    </section>

    <section class="section" aria-labelledby="documents-title">
      <h2 id="documents-title" class="title">My Documents</h2>

      <DocumentList
        :documents="documents.data?.documents ?? null"
        :error="documents.error"
        @retry="documents.fetchDocuments()"
      />
    </section>
  </div>
</template>

<style lang="scss" scoped>
.section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
}

.chart-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
  background: $card;
  border-radius: $radius-card;
  box-shadow: $shadow-card;
}
</style>
