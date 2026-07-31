<script setup lang="ts">
defineEmits<{ pulse: [] }>()
</script>

<template>
  <section class="page page-home" aria-labelledby="home-title">
    <div class="page-copy">
      <p class="eyebrow"><span></span> Independent creative studio</p>
      <h1 id="home-title">Digital products with a pulse.</h1>
      <p class="lede">
        We turn ambitious ideas into useful, characterful products—strategy, design, and technology
        moving as one small system.
      </p>
      <div class="page-actions">
        <button type="button" class="primary-action" @click="$emit('pulse')">
          Wake the studio <span aria-hidden="true">↗</span>
        </button>
        <RouterLink class="text-action" to="/careers">Meet the crew <span aria-hidden="true">→</span></RouterLink>
      </div>
    </div>

    <div class="discipline-list" aria-label="Orbit disciplines">
      <span>Product strategy</span>
      <span>Brand systems</span>
      <span>Creative technology</span>
    </div>
  </section>
</template>
