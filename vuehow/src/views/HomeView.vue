<template>
  <div class="home">
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useStore } from 'vuex';

export default defineComponent({
  name: 'HomeView',
  components: {},
  setup() {
    const store = useStore();
  }
});
</script>
