<script lang="ts">
  import './layout.css';

  let { children } = $props();
</script>

<svelte:head>
  <title>NeoLib - Perpustakaan Neo Brutalism</title>
  <meta name="description" content="Aplikasi Perpustakaan Modern dengan Gaya Desain Neo Brutalism." />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&display=swap" rel="stylesheet">
</svelte:head>

{@render children()}
