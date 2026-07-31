<script setup lang="ts">
import { ref } from 'vue'

defineEmits<{ pulse: [] }>()

const rolesOpen = ref(false)
const roles = [
  { title: 'Senior Product Designer', craft: 'Design', place: 'London · Hybrid' },
  { title: 'Creative Web Engineer', craft: 'Technology', place: 'Remote · Europe' },
  { title: 'Studio Producer', craft: 'Operations', place: 'London · Hybrid' },
]
</script>

<template>
  <section class="page page-careers" aria-labelledby="careers-title">
    <div class="page-copy">
      <p class="eyebrow"><span></span> Work in the open</p>
      <h1 id="careers-title">Come make useful things strange.</h1>
      <p class="lede">
        Orbit is a compact, curious team. We share context early, protect deep work, and leave room
        for every discipline to change the answer.
      </p>
      <div class="page-actions">
        <button
          type="button"
          class="primary-action"
          :aria-expanded="rolesOpen"
          aria-controls="open-roles"
          @click="rolesOpen = !rolesOpen"
        >
          {{ rolesOpen ? 'Hide open roles' : 'View open roles' }} <span aria-hidden="true">↗</span>
        </button>
        <button type="button" class="text-action button-link" @click="$emit('pulse')">
          Ring the launch bell <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>

    <Transition name="roles">
      <aside v-if="rolesOpen" id="open-roles" class="role-panel" aria-labelledby="roles-title">
        <div class="role-panel-heading">
          <div>
            <p>Now boarding</p>
            <h2 id="roles-title">Open roles</h2>
          </div>
          <button type="button" aria-label="Close open roles" @click="rolesOpen = false">×</button>
        </div>
        <ul>
          <li v-for="role in roles" :key="role.title">
            <a :href="`mailto:hello@orbit.example?subject=${encodeURIComponent(role.title)}`">
              <span class="role-craft">{{ role.craft }}</span>
              <strong>{{ role.title }}</strong>
              <span>{{ role.place }}</span>
              <i aria-hidden="true">↗</i>
            </a>
          </li>
        </ul>
        <p class="role-footnote">No perfect match? Tell us what only you can bring.</p>
      </aside>
    </Transition>
  </section>
</template>
