<script lang="ts">
  import { library } from '$lib/store.svelte';
  import { goto } from '$app/navigation';
  import Card from '$lib/components/Card.svelte';
  import Button from '$lib/components/Button.svelte';
  import Input from '$lib/components/Input.svelte';

  // Search & Filter state
  let searchQuery = $state('');
  let selectedCategory = $state('Semua');

  // Filtered books list
  let filteredBooks = $derived.by(() => {
    let result = library.books;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter((b) =>
          (b.title && b.title.toLowerCase().includes(q)) ||
          (b.author && b.author.toLowerCase().includes(q)) ||
          (b.isbn && b.isbn.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'Semua') {
      result = result.filter((b) => b.category === selectedCategory);
    }

    return result;
  });

  // Unique categories list
  let categories = $derived.by(() => {
    const list = new Set(library.books.map((b) => b.category));
    return ['Semua', ...Array.from(list)];
  });

  // Active borrow records for logged in customer
  let activeBorrowRecords = $derived.by(() => {
    if (!library.currentUser || !library.currentUser.canBorrow()) return [];
    return library.borrowRecords.filter(
      (r) =>
        r.customerEmail && r.customerEmail.toLowerCase() === library.currentUser!.email.toLowerCase() &&
        r.isBorrowed // Encapsulation: getter on BorrowRecord
    );
  });

  let activeBorrowedBookIds = $derived.by(() => {
    return new Set(activeBorrowRecords.map((record) => record.bookId));
  });

  // Category colors
  const categoryColors: Record<string, string> = {
    'Fiksi': 'bg-neo-pink',
    'Filsafat': 'bg-neo-purple',
    'Pengembangan Diri': 'bg-neo-green',
    'default': 'bg-neo-yellow'
  };

  // Borrow action — uses Polymorphism (canBorrow)
  function handleBorrow(bookId: string) {
    if (!library.currentUser) {
      goto('/login');
      return;
    }

    // Polymorphism: canBorrow() returns different value per User type
    if (!library.currentUser.canBorrow()) {
      alert('Admin tidak dapat meminjam buku. Silakan gunakan akun customer.');
      return;
    }

    const success = library.borrowBook(bookId, library.currentUser.email);
    if (success) {
      alert('Buku berhasil dipinjam! Silakan kembalikan tepat waktu.');
    } else {
      alert('Gagal meminjam buku. Stok habis atau Anda sudah meminjam buku ini.');
    }
  }

  function handleReturn(recordId: string) {
    const success = library.returnBook(recordId);
    if (success) {
      alert('Buku berhasil dikembalikan. Terima kasih!');
    } else {
      alert('Gagal mengembalikan buku.');
    }
  }
</script>

<!-- Page Title -->
<div class="flex items-center gap-2 mb-8">
  <span class="inline-block w-4 h-8 bg-neo-blue neo-border border-black"></span>
  <h1 class="text-3xl md:text-4xl font-black uppercase tracking-wider m-0">Katalog Buku 📚</h1>
</div>

<!-- Active Borrowings Section for Customer -->
{#if library.currentUser?.canBorrow() && activeBorrowRecords.length > 0}
  <section class="mb-12">
    <div class="flex items-center gap-2 mb-6">
      <span class="inline-block w-4 h-8 bg-neo-pink neo-border border-black"></span>
      <h2 class="text-2xl font-black uppercase tracking-wider m-0">
        Buku yang Anda Pinjam ({activeBorrowRecords.length})
      </h2>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      {#each activeBorrowRecords as record}
        <div class="neo-border bg-white p-4 neo-shadow flex items-center justify-between gap-4">
          <div class="flex flex-col gap-1">
            <span class="text-xs font-black uppercase text-neo-pink tracking-widest">DIPINJAM</span>
            <h3 class="font-black text-lg text-gray-900 m-0 leading-tight">{record.bookTitle}</h3>
            <p class="text-xs font-bold text-gray-500 m-0">Dipinjam pada: {record.borrowDate}</p>
          </div>
          <Button onclick={() => handleReturn(record.id)} color="green" class="!py-2 !px-4 !text-xs">
            Kembalikan
          </Button>
        </div>
      {/each}
    </div>
  </section>
{/if}

<!-- Search & Filter -->
<div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
  <div class="flex items-center gap-2">
    <span class="inline-block w-4 h-8 bg-neo-green neo-border border-black"></span>
    <h2 class="text-2xl font-black uppercase tracking-wider m-0">Daftar Buku ({filteredBooks.length})</h2>
  </div>

  <div class="w-full md:max-w-md">
    <Input
      id="search"
      placeholder="Cari judul, penulis, atau ISBN..."
      bind:value={searchQuery}
      class="!shadow-sm"
    />
  </div>
</div>

<!-- Categories Filter -->
<div class="flex flex-wrap gap-2 mb-8">
  {#each categories as category}
    <button
      onclick={() => selectedCategory = category}
      class="
        px-4 py-2 font-black uppercase text-xs tracking-wider neo-border neo-shadow-sm transition-all cursor-pointer
        {selectedCategory === category ? 'bg-neo-pink translate-y-[2px] translate-x-[2px] shadow-none' : 'bg-white hover:bg-neo-bg'}
      "
    >
      {category}
    </button>
  {/each}
</div>

<!-- Book Grid -->
{#if filteredBooks.length === 0}
  <Card color="white" class="text-center py-12">
    <p class="font-black text-lg text-gray-500 uppercase tracking-wide m-0">Tidak ada buku yang cocok dengan pencarian Anda.</p>
  </Card>
{:else}
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {#each filteredBooks as book (book.id)}
      {@const alreadyBorrowed = activeBorrowedBookIds.has(book.id)}
      <Card interactive={true} color="white" class="h-full flex flex-col justify-between">
        <!-- Cover -->
        <div class="neo-border border-black w-full aspect-[3/4] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden select-none {categoryColors[book.category] || categoryColors['default']}">
          <span class="bg-black text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-widest absolute top-2 left-2 neo-border-2 border-black">
            {book.category}
          </span>
          <div class="text-5xl mb-3">📖</div>
          <h4 class="font-black text-lg text-black leading-tight line-clamp-2 uppercase tracking-wide">{book.title}</h4>
          <p class="text-xs font-black text-black/75 mt-1">Oleh: {book.author}</p>
        </div>

        <!-- Info -->
        <div class="flex flex-col gap-2 flex-grow mt-4">
          <h3 class="font-black text-lg text-gray-900 line-clamp-1 m-0">{book.title}</h3>
          <p class="text-xs font-bold text-gray-500 m-0">Penulis: {book.author}</p>
          <p class="text-xs font-mono text-gray-400 m-0">ISBN: {book.isbn}</p>
          
          <div class="flex items-center gap-2 mt-2">
            <!-- Encapsulation: isAvailable getter dari class Book -->
            <span class="neo-border-2 border-black px-2 py-0.5 text-xs font-black uppercase {book.isAvailable ? 'bg-neo-green' : 'bg-neo-pink'}">
              Stok: {book.stock}
            </span>
            <span class="bg-white neo-border-2 border-black px-2 py-0.5 text-xs font-black uppercase">
              Dipinjam: {book.borrowedCount}x
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="grid grid-cols-2 gap-2 mt-4">
          <a
            href="/books/{book.id}"
            class="
              neo-border bg-white hover:bg-neo-bg text-center py-2.5 font-black uppercase text-xs tracking-wider neo-shadow-sm
              active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all block
            "
          >
            Detail
          </a>
          
          <Button
            onclick={() => handleBorrow(book.id)}
            color="yellow"
            disabled={!book.isAvailable || alreadyBorrowed}
            class="!py-2.5 !text-xs !shadow-sm !w-full"
          >
            {alreadyBorrowed ? 'Dipinjam' : book.isAvailable ? 'Pinjam' : 'Habis'}
          </Button>
        </div>
      </Card>
    {/each}
  </div>
{/if}
