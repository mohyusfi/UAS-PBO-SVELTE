<script lang="ts">
  import { library } from '$lib/store.svelte';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/Button.svelte';
  // import Card from '$lib/components/Card.svelte';

  let { children } = $props();
  let isMenuOpen = $state(false);

  function handleLogout() {
    isMenuOpen = false;
    library.logout();
    goto('/login');
  }

  function closeMenu() {
    isMenuOpen = false;
  }
</script>

<div class="min-h-screen flex flex-col selection:bg-neo-pink selection:text-black">
  <!-- Navbar -->
  <header class="bg-white neo-border-b border-black sticky top-0 z-40 p-4 neo-shadow-sm">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      
      <div class="flex items-center justify-between gap-4 md:shrink-0">
        <a href="/" onclick={closeMenu} class="flex items-center gap-2 group min-w-0">
          <div class="bg-neo-yellow neo-border px-3 py-1 font-black text-base sm:text-xl uppercase tracking-wider neo-shadow-sm group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all truncate">
            TadikaMesra - LIB
          </div>
        </a>

        <button
          type="button"
          class="md:hidden neo-border neo-shadow-sm bg-white hover:bg-neo-bg active:translate-x-px active:translate-y-px active:shadow-none transition-all p-2 cursor-pointer shrink-0"
          aria-label={isMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
          aria-controls="app-navigation"
          aria-expanded={isMenuOpen}
          onclick={() => isMenuOpen = !isMenuOpen}
        >
          <span class="sr-only">{isMenuOpen ? 'Tutup menu' : 'Buka menu'}</span>
          <span class="flex flex-col gap-1.5 w-6">
            <span class={[
              'block h-1 bg-black transition-all',
              { 'translate-y-2.5 rotate-45': isMenuOpen }
            ]}></span>
            <span class={[
              'block h-1 bg-black transition-all',
              { 'opacity-0': isMenuOpen }
            ]}></span>
            <span class={[
              'block h-1 bg-black transition-all',
              { '-translate-y-2.5 -rotate-45': isMenuOpen }
            ]}></span>
          </span>
        </button>
      </div>


      <nav
        id="app-navigation"
        class={[
          'md:flex md:items-center md:justify-end md:gap-3 md:grow',
          {
            'block': isMenuOpen,
            'hidden': !isMenuOpen
          }
        ]}
      >
        <div class="flex flex-col md:flex-row md:items-center md:justify-end gap-3">
          <a href="/" onclick={closeMenu} class="font-black uppercase text-sm tracking-wide px-3 py-2 neo-border bg-white hover:bg-neo-bg transition-all text-center md:text-left">
            Home
          </a>
          <a href="/books" onclick={closeMenu} class="font-black uppercase text-sm tracking-wide px-3 py-2 neo-border bg-white hover:bg-neo-bg transition-all text-center md:text-left">
            Katalog Buku
          </a>

          {#if library.currentUser}
            <a href="/history" onclick={closeMenu} class="font-black uppercase text-sm tracking-wide px-3 py-2 neo-border bg-white hover:bg-neo-bg transition-all text-center md:text-left">
              Riwayat
            </a>

            <!-- Polymorphism: canManageBooks() beda per role -->
            {#if library.currentUser.canManageBooks()}
              <a href="/admin" onclick={closeMenu} class="font-black uppercase text-sm tracking-wide px-3 py-2 neo-border bg-neo-purple hover:bg-[#a19fff] transition-all text-center md:text-left">
                Dashboard Admin
              </a>
            {/if}
          {/if}
        </div>

        <div class="flex flex-col md:flex-row md:items-center md:justify-end gap-3 mt-3 md:mt-0">
          {#if library.currentUser}
            <div
              class={[
                'neo-border px-3 py-2 font-black text-xs uppercase tracking-wider text-center',
                {
                  'bg-neo-green': library.currentUser.canManageBooks(),
                  'bg-neo-blue': !library.currentUser.canManageBooks()
                }
              ]}
            >
              {library.currentUser.getDisplayInfo()}
            </div>

            <Button onclick={handleLogout} color="pink" class="px-3! py-2! text-xs! w-full md:w-auto">
              Logout
            </Button>
          {:else}
            <a href="/login" onclick={closeMenu}>
              <Button color="yellow" class="px-4! py-2! text-xs! w-full md:w-auto">
                Login / Daftar
              </Button>
            </a>
          {/if}
        </div>
      </nav>

    </div>
  </header>

  <!-- Main -->
  <main class="grow max-w-7xl mx-auto w-full p-4 md:p-8">
    {@render children()}
  </main>

  <!-- Footer -->
  <footer class="bg-[#1a1a1a] text-white py-8 p-6 neo-border-t border-black mt-12 text-center">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
      <p class="font-black uppercase tracking-wider text-sm">
        © 2026 TADIKAMESRA-LIB <span class="mx-5"> - </span>    UAS PBO KELOMPOK 6
      </p>
      <div class="flex gap-2">
        <span class="bg-neo-yellow text-black neo-border-2 border-black font-black px-2 py-0.5 text-xs uppercase">SvelteKit</span>
        <span class="bg-neo-pink text-black neo-border-2 border-black font-black px-2 py-0.5 text-xs uppercase">Tailwind v4</span>
        <span class="bg-neo-green text-black neo-border-2 border-black font-black px-2 py-0.5 text-xs uppercase">TypeScript</span>
      </div>
    </div>
  </footer>
</div>
