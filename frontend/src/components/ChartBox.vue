<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);
Chart.defaults.font.size = 16;
Chart.defaults.color = '#111827';

const props = defineProps({
  type: String, // pie | bar | line
  labels: Array,
  values: Array,
  label: String,
  colors: { type: Array, default: () => ['#1D4ED8'] },
});
const canvas = ref(null);
let chart;

onMounted(() => {
  const pie = props.type === 'pie';
  chart = new Chart(canvas.value, {
    type: props.type,
    data: {
      labels: props.labels,
      datasets: [{
        label: props.label,
        data: props.values,
        backgroundColor: pie ? props.colors : props.colors[0],
        borderColor: props.type === 'line' ? props.colors[0] : '#FFFFFF',
        borderWidth: props.type === 'line' ? 3 : 2,
        tension: 0.2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: pie, position: 'bottom' } },
      scales: pie ? {} : { y: { beginAtZero: true, ticks: { precision: 0 } } },
    },
  });
});
onBeforeUnmount(() => chart && chart.destroy());
</script>

<template>
  <div class="chart-wrap"><canvas ref="canvas" role="img" :aria-label="label"></canvas></div>
</template>
