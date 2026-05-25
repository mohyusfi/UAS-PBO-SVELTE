<script lang="ts">
  import { page } from '$app/stores';
  import { library } from '$lib/store.svelte';
  import { goto } from '$app/navigation';
  import Card from '$lib/components/Card.svelte';
  import Button from '$lib/components/Button.svelte';

  // Obtain book ID from SvelteKit page store params
  let bookId = $derived($page.params.id);

  // Find book in store
  let book = $derived(library.books.find(b => b.id === bookId));


  let alreadyBorrowed = $derived.by(() => {
    if (!library.currentUser || !library.currentUser.canBorrow()) return false;
    return library.borrowRecords.some(
      (record) =>
        record.bookId === bookId &&
        record.customerEmail && record.customerEmail.toLowerCase() === library.currentUser!.email.toLowerCase() &&
        record.isBorrowed
    );
  });

  // Book Category colors for brutalist covers
  const categoryColors: Record<string, string> = {
    'Fiksi': 'bg-neo-pink',
    'Filsafat': 'bg-neo-purple',
    'Pengembangan Diri': 'bg-neo-green',
    'default': 'bg-neo-yellow'
  };

  function handleBorrow() {
    if (!book) return;

    if (!library.currentUser) {
      alert('Anda harus Login/Daftar terlebih dahulu untuk meminjam buku!');
      goto('/login');
      return;
    }

    if (library.currentUser.canBorrow()) {
      executeBorrow(library.currentUser.email);
    } else {
      alert('Admin tidak dapat meminjam buku. Silakan gunakan akun customer.');
    }
  }

  function executeBorrow(customerEmail: string) {
    if (!book) return;
    const success = library.borrowBook(book.id, customerEmail);
    if (success) {
      alert('Buku berhasil dipinjam!');
    } else {
      alert('Gagal meminjam buku. Stok habis atau Anda sedang meminjam buku ini.');
    }
  }
</script>

<div class="max-w-4xl mx-auto py-6">
  
  <div class="mb-6">
    <a
      href="/"
      class="
        inline-block neo-border bg-white hover:bg-neo-bg px-4 py-2 font-black uppercase text-xs tracking-wider neo-shadow-sm
        active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all
      "
    >
      ← Kembali ke Beranda
    </a>
  </div>

  {#if !book}
    <Card color="pink" class="text-center py-12">
      <h2 class="text-2xl font-black uppercase tracking-wider text-black m-0 mb-4">
        ⚠️ BUKU TIDAK DI TEMUKAN
      </h2>
      <p class="font-bold text-sm text-gray-700 m-0">
        Maaf, buku dengan ID "{bookId}" tidak terdaftar di perpustakaan kami.
      </p>
    </Card>
  {:else}
    <!-- Detail Book Container -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      
      <!-- Column 1: Brutalist Cover Card -->
      <div class="md:col-span-1">
        <div class="
          neo-border border-black w-full aspect-[3/4] flex flex-col items-center justify-center p-6 text-center relative select-none neo-shadow-lg
          {categoryColors[book.category] || categoryColors['default']}
        ">
          <span class="bg-black text-white px-2 py-0.5 text-xs font-black uppercase tracking-widest absolute top-3 left-3 neo-border border-black">
            {book.category}
          </span>
          <div class="text-7xl mb-4">📖</div>
          <h3 class="font-black text-xl text-black leading-tight uppercase tracking-wider line-clamp-3">{book.title}</h3>
          <p class="text-xs font-black text-black/75 mt-2">Oleh: {book.author}</p>
        </div>
      </div>

      <!-- Column 2: Detailed Text & Controls -->
      <div class="md:col-span-2 flex flex-col gap-6">
        
        <!-- Main details -->
        <Card color="white" class="!gap-2">
          <span class="bg-neo-purple text-black neo-border-2 border-black font-black px-2 py-0.5 text-xs uppercase self-start">
            {book.category}
          </span>
          <h1 class="text-3xl md:text-5xl font-black uppercase tracking-tight text-gray-900 m-0 mt-2">
            {book.title}
          </h1>
          <p class="text-sm font-bold text-gray-500 m-0">Karya: <strong class="text-black font-black">{book.author}</strong></p>
          <div class="flex items-center gap-4 mt-2">
            <span class="font-mono text-xs text-gray-400">ISBN: {book.isbn}</span>
            <span class="neo-border-2 border-black px-2 py-0.5 text-xs font-black uppercase {book.stock > 0 ? 'bg-neo-green' : 'bg-neo-pink'}">
              Stok Tersedia: {book.stock} Unit
            </span>
          </div>
        </Card>

        <!-- Description Box -->
        <Card color="yellow" class="flex flex-col gap-3">
          <h3 class="font-black uppercase text-sm tracking-wider m-0 text-gray-800">
            Deskripsi Buku 📋
          </h3>
          <p class="font-bold text-sm md:text-base text-gray-800 leading-relaxed m-0">
            {book.description}
          </p>
        </Card>

        <!-- Actions -->
        <div class="flex items-center gap-4">
          <Button
            onclick={handleBorrow}
            color="green"
            disabled={book.stock <= 0 || alreadyBorrowed}
            class="!py-3.5 !px-8 !text-sm flex-grow sm:flex-grow-0"
          >
            {alreadyBorrowed ? 'Sedang Dipinjam' : book.stock > 0 ? '⚡ Pinjam Buku Ini' : '❌ Persediaan Habis'}
          </Button>
          
          {#if book.stock > 0}
            <div class="text-xs font-bold text-gray-600 uppercase tracking-wide hidden sm:block">
              * Segera pinjam sebelum kehabisan stok!
            </div>
          {/if}
        </div>

      </div>

    </div>


  {/if}

</div>
