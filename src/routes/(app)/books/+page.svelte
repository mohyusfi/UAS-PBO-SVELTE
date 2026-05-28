<script lang="ts">
  import { library } from '$lib/store.svelte';
  import { goto } from '$app/navigation';
  import Card from '$lib/components/Card.svelte';
  import Button from '$lib/components/Button.svelte';
  import Input from '$lib/components/Input.svelte';

  // Search & Filter state
  let searchQuery = $state('');
  let selectedCategory = $state('Semua');

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  }

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

  function openPaymentPage(bookId: string) {
    if (!library.currentUser) {
      goto('/login');
      return;
    }

    // Polymorphism: canBorrow() returns different value per User type
    if (!library.currentUser.canBorrow()) {
      alert('Admin tidak dapat meminjam buku. Silakan gunakan akun customer.');
      return;
    }

    goto(`/books/${bookId}/payment`);
  }

  function handleReturn(recordId: string) {
    const result = library.returnBook(recordId);
    if (result.success) {
      const fineMessage = result.fineAmount && result.fineAmount > 0
        ? ` Denda keterlambatan: ${formatCurrency(result.fineAmount)}.`
        : '';
      alert(`Buku berhasil dikembalikan.${fineMessage}`);
    } else {
      alert(result.error ?? 'Gagal mengembalikan buku.');
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
      {#each activeBorrowRecords as record (record.id)}
        <div class="neo-border bg-white p-4 neo-shadow flex items-center justify-between gap-4">
          <div class="flex flex-col gap-1">
            <span class="text-xs font-black uppercase text-neo-pink tracking-widest">DIPINJAM</span>
            <h3 class="font-black text-lg text-gray-900 m-0 leading-tight">{record.bookTitle}</h3>
            <p class="text-xs font-bold text-gray-500 m-0">Dipinjam pada: {record.borrowDate}</p>
            <p class="text-xs font-bold text-gray-500 m-0">Deadline: {record.dueDate}</p>
            {#if record.isOverdue}
              <p class="text-xs font-black text-neo-pink m-0">
                Terlambat {record.lateDays} hari - Estimasi denda {formatCurrency(record.fineAmount)}
              </p>
            {/if}
          </div>
          <Button onclick={() => handleReturn(record.id)} color="green" class="py-2! px-4! text-xs!">
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
      class="shadow-sm!"
    />
  </div>
</div>

<!-- Categories Filter -->
<div class="flex flex-wrap gap-2 mb-8">
  {#each categories as category (category)}
    <button
      onclick={() => selectedCategory = category}
      class="
        px-4 py-2 font-black uppercase text-xs tracking-wider neo-border neo-shadow-sm transition-all cursor-pointer
        {selectedCategory === category ? 'bg-neo-pink translate-y-0.5 translate-x-0.5 shadow-none' : 'bg-white hover:bg-neo-bg'}
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
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
    {#each filteredBooks as book (book.id)}
      {@const alreadyBorrowed = activeBorrowedBookIds.has(book.id)}
      <Card interactive={true} color="white" class="h-full p-4! gap-3! justify-between overflow-hidden">
        <!-- Cover -->
        <div class="neo-border border-black w-full aspect-[4/3] flex flex-col justify-between p-4 text-center relative overflow-hidden select-none {categoryColors[book.category] || categoryColors['default']}">
          <div class="relative z-10 flex items-start justify-between gap-2">
            <span class="bg-black text-white px-2 py-1 text-[10px] font-black uppercase tracking-widest neo-border-2 border-black max-w-[70%] truncate">
              {book.category}
            </span>
            <span class="bg-white text-black px-2 py-1 text-[10px] font-black uppercase neo-border-2 border-black">
              #{book.id.replace('book-', '')}
            </span>
          </div>

          {#if book.coverUrl}
            <img
              src={book.coverUrl}
              alt="Cover {book.title}"
              class="absolute inset-0 w-full h-full object-cover"
            />
            <div class="absolute inset-0 bg-black/20"></div>
          {:else}
            <div class="flex flex-1 items-center justify-center">
              <div class="bg-white/80 neo-border-2 border-black w-20 h-20 flex items-center justify-center text-4xl">
                📖
              </div>
            </div>
          {/if}
        </div>

        <!-- Info -->
        <div class="flex flex-col gap-3 grow">
          <div class="min-h-20">
            <h3 class="font-black text-lg text-gray-900 line-clamp-2 m-0 leading-tight">{book.title}</h3>
            <p class="text-xs font-bold text-gray-500 m-0 mt-1 line-clamp-1">Penulis: {book.author}</p>
            <p class="text-[11px] font-mono text-gray-400 m-0 mt-1 truncate">ISBN: {book.isbn}</p>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="neo-border-2 border-black bg-neo-bg px-2 py-2 min-h-14">
              <p class="text-[9px] font-black uppercase tracking-widest text-gray-500 m-0">Stok</p>
              <p class="text-sm font-black text-black m-0">{book.stock}</p>
            </div>
            <div class="neo-border-2 border-black bg-neo-bg px-2 py-2 min-h-14">
              <p class="text-[9px] font-black uppercase tracking-widest text-gray-500 m-0">Dipinjam</p>
              <p class="text-sm font-black text-black m-0">{book.borrowedCount}x</p>
            </div>
          </div>

          <div class="neo-border-2 border-black bg-neo-yellow px-3 py-2 flex items-center justify-between gap-2 min-h-11">
            <span class="text-[10px] font-black uppercase tracking-widest text-black">Harga</span>
            <span class="text-sm font-black text-black whitespace-nowrap">{formatCurrency(book.price)}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="grid grid-cols-2 gap-2 pt-1">
          <a
            href="/books/{book.id}"
            class="
              neo-border bg-white hover:bg-neo-bg text-center h-11 px-3 font-black uppercase text-xs tracking-wider neo-shadow-sm
              active:translate-x-px active:translate-y-px active:shadow-none transition-all flex items-center justify-center
            "
          >
            Detail
          </a>

          <Button
            onclick={() => openPaymentPage(book.id)}
            color="yellow"
            disabled={!book.isAvailable || alreadyBorrowed}
            class="h-11! py-0! px-3! text-xs! shadow-sm! w-full!"
          >
            {alreadyBorrowed ? 'Dipinjam' : book.isAvailable ? 'Bayar' : 'Habis'}
          </Button>
        </div>

        <div class="neo-border-2 border-black px-3 py-1.5 text-[10px] font-black uppercase text-center {alreadyBorrowed ? 'bg-neo-blue' : book.isAvailable ? 'bg-neo-green' : 'bg-neo-pink'}">
          {alreadyBorrowed ? 'Sedang Anda pinjam' : book.isAvailable ? 'Siap dipinjam' : 'Stok belum tersedia'}
        </div>
      </Card>
    {/each}
  </div>
{/if}
