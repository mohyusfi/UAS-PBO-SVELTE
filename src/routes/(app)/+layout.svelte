<script lang="ts">
  import { library } from '$lib/store.svelte';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/Button.svelte';
  // import Card from '$lib/components/Card.svelte';

  let { children } = $props();

  function handleLogout() {
    library.logout();
    goto('/login');
  }
</script>

<div class="min-h-screen flex flex-col selection:bg-neo-pink selection:text-black">
  <!-- Navbar -->
  <header class="bg-white neo-border-b border-black sticky top-0 z-40 p-4 neo-shadow-sm">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      
      <!-- Brand -->
      <a href="/" class="flex items-center gap-2 group self-start">
        <div class="bg-neo-yellow neo-border px-3 py-1 font-black text-xl uppercase tracking-wider neo-shadow-sm group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all">
          TadikaMesra - LIB
        </div>
      </a>

      <!-- Nav Links -->
      <div class="flex items-center gap-3 flex-wrap">
        <a href="/" class="font-black uppercase text-sm tracking-wide px-3 py-2 neo-border bg-white hover:bg-neo-bg transition-all">
          Home
        </a>
        <a href="/books" class="font-black uppercase text-sm tracking-wide px-3 py-2 neo-border bg-white hover:bg-neo-bg transition-all">
          Katalog Buku
        </a>

        {#if library.currentUser}
          <a href="/history" class="font-black uppercase text-sm tracking-wide px-3 py-2 neo-border bg-white hover:bg-neo-bg transition-all">
            Riwayat
          </a>

          <!-- Polymorphism: canManageBooks() beda per role -->
          {#if library.currentUser.canManageBooks()}
            <a href="/admin" class="font-black uppercase text-sm tracking-wide px-3 py-2 neo-border bg-neo-purple hover:bg-[#a19fff] transition-all">
              Dashboard Admin
            </a>
          {/if}

          <!-- Polymorphism: getDisplayInfo() beda per role -->
          <div class="
            neo-border px-3 py-2 font-black text-xs uppercase tracking-wider
            {library.currentUser.canManageBooks() ? 'bg-neo-green' : 'bg-neo-blue'}
          ">
            {library.currentUser.getDisplayInfo()}
          </div>

          <Button onclick={handleLogout} color="pink" class="px-3! py-2! text-xs!">
            Logout
          </Button>
        {:else}
          <!-- Tampil jika belum login -->
          <a href="/login">
            <Button color="yellow" class="px-4! py-2! text-xs!">
              🔑 Login / Daftar
            </Button>
          </a>
        {/if}
      </div>

    </div>
  </header>

  <!-- Main -->
  <main class="grow max-w-7xl mx-auto w-full p-4 md:p-8">
    {@render children()}
  </main>

  <!-- Footer -->
  <footer class="bg-[#1a1a1a] text-white p-6 neo-border-t border-black mt-12 text-center">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
      <p class="font-black uppercase tracking-wider text-sm">
        © 2026 NEO-LIB - UAS PBO KELOMPOK 6
      </p>
      <div class="flex gap-2">
        <span class="bg-neo-yellow text-black neo-border-2 border-black font-black px-2 py-0.5 text-xs uppercase">SvelteKit</span>
        <span class="bg-neo-pink text-black neo-border-2 border-black font-black px-2 py-0.5 text-xs uppercase">Tailwind v4</span>
        <span class="bg-neo-green text-black neo-border-2 border-black font-black px-2 py-0.5 text-xs uppercase">TypeScript</span>
      </div>
    </div>
  </footer>
</div>
