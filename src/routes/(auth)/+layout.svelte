<script lang="ts">
  let { children } = $props();
</script>

<!-- Auth layout: tanpa navbar, full screen centered -->
<div class="min-h-screen bg-neo-bg flex flex-col selection:bg-neo-pink selection:text-black">
  {@render children()}
</div>
