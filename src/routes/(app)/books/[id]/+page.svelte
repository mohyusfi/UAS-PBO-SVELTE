<script lang="ts">
  import { page } from '$app/stores';
  import { library } from '$lib/store.svelte';
  import { goto } from '$app/navigation';
  import Card from '$lib/components/Card.svelte';
  import Button from '$lib/components/Button.svelte';
  import { DEFAULT_BORROW_DAYS, addDaysToISODate, todayISO } from '$lib/models/BorrowRecord';

  // Obtain book ID from SvelteKit page store params
  let bookId = $derived($page.params.id);

  // Find book in store
  let book = $derived(library.books.find(b => b.id === bookId));
  let estimatedDueDate = $derived(addDaysToISODate(todayISO(), DEFAULT_BORROW_DAYS));

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  }

  let alreadyBorrowed = $derived.by(() => {
    if (!library.currentUser || !library.currentUser.canBorrow()) return false;
    return library.borrowRecords.some(
      (record) =>
        record.bookId === bookId &&
        record.customerEmail && record.customerEmail.toLowerCase() === library.currentUser!.email.toLowerCase() &&
        record.isBorrowed
    );
  });

  function openPaymentPage() {
    if (!book) return;

    if (!library.currentUser) {
      alert('Anda harus Login/Daftar terlebih dahulu untuk meminjam buku!');
      goto('/login');
      return;
    }

    if (library.currentUser.canBorrow()) {
      goto(`/books/${book.id}/payment`);
    } else {
      alert('Admin tidak dapat meminjam buku. Silakan gunakan akun customer.');
    }
  }
</script>

<div class="max-w-6xl mx-auto py-6">

  <div class="mb-8">
    <a
      href="/books"
      class="
        inline-flex items-center gap-2 neo-border bg-white hover:bg-neo-bg px-4 py-2 font-black uppercase text-xs tracking-wider neo-shadow-sm
        active:translate-x-px active:translate-y-px active:shadow-none transition-all
      "
    >
      <span aria-hidden="true">←</span>
      Kembali ke Katalog
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
    <div class="grid grid-cols-1 lg:grid-cols-[minmax(260px,360px)_1fr] gap-8 items-start">

      <!-- Column 1: Brutalist Cover Card -->
      <aside class="lg:sticky lg:top-24 flex flex-col gap-4">
        <div
          class={[
            'neo-border border-black w-full aspect-3/4 flex flex-col justify-between p-6 text-center relative select-none neo-shadow-lg',
            {
              'bg-neo-pink': book.category === 'Fiksi',
              'bg-neo-purple': book.category === 'Filsafat',
              'bg-neo-green': book.category === 'Pengembangan Diri',
              'bg-neo-yellow': !['Fiksi', 'Filsafat', 'Pengembangan Diri'].includes(book.category)
            }
          ]}
        >
          <div class="flex justify-between items-start gap-3">
            <span class="bg-black text-white px-2 py-0.5 text-xs font-black uppercase tracking-widest neo-border border-black">
              {book.category}
            </span>
            <span class="bg-white text-black px-2 py-0.5 text-xs font-black uppercase neo-border border-black">
              #{book.id}
            </span>
          </div>

          <div class="flex flex-col items-center justify-center gap-4">
            <div class="text-7xl leading-none">📖</div>
            <div>
              <h3 class="font-black text-2xl text-black leading-tight uppercase tracking-wide line-clamp-4 m-0">
                {book.title}
              </h3>
              <p class="text-xs font-black text-black/75 mt-3 mb-0 uppercase tracking-wider">
                {book.author}
              </p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 text-left">
            <div class="neo-border-2 border-black bg-white px-3 py-2">
              <p class="text-[10px] font-black uppercase text-gray-500 m-0">Stok</p>
              <p class="text-xl font-black text-black m-0">{book.stock}</p>
            </div>
            <div class="neo-border-2 border-black bg-white px-3 py-2">
              <p class="text-[10px] font-black uppercase text-gray-500 m-0">Dipinjam</p>
              <p class="text-xl font-black text-black m-0">{book.borrowedCount}</p>
            </div>
            <div class="neo-border-2 border-black bg-white px-3 py-2 col-span-2">
              <p class="text-[10px] font-black uppercase text-gray-500 m-0">Harga Pinjam</p>
              <p class="text-xl font-black text-black m-0">{formatCurrency(book.price)}</p>
            </div>
          </div>
        </div>

        <Card color={book.isAvailable ? 'green' : 'pink'} class="p-4! gap-1!">
          <p class="text-[10px] font-black uppercase tracking-widest text-gray-700 m-0">
            Status Buku
          </p>
          <p class="text-lg font-black uppercase text-black m-0">
            {book.isAvailable ? 'Tersedia' : 'Stok Habis'}
          </p>
        </Card>
      </aside>

      <!-- Column 2: Detailed Text & Controls -->
      <div class="flex flex-col gap-6">

        <!-- Main details -->
        <Card color="white" class="gap-5!">
          <div class="flex flex-wrap items-center gap-3">
            <span class="bg-neo-purple text-black neo-border-2 border-black font-black px-3 py-1 text-xs uppercase">
              {book.category}
            </span>
            <span
              class={[
                'neo-border-2 border-black px-3 py-1 text-xs font-black uppercase',
                {
                  'bg-neo-green': book.isAvailable,
                  'bg-neo-pink': !book.isAvailable
                }
              ]}
            >
              {book.isAvailable ? `${book.stock} unit tersedia` : 'Persediaan habis'}
            </span>
          </div>

          <div class="flex flex-col gap-3">
            <h1 class="text-3xl md:text-5xl font-black uppercase tracking-tight leading-none text-gray-900 m-0">
              {book.title}
            </h1>
            <p class="text-base font-bold text-gray-600 m-0">
              Karya <strong class="text-black font-black">{book.author}</strong>
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div class="neo-border-2 border-black bg-neo-bg px-4 py-3">
              <p class="text-[10px] font-black uppercase tracking-widest text-gray-500 m-0">ISBN</p>
              <p class="font-mono text-sm font-black text-black break-all m-0 mt-1">{book.isbn}</p>
            </div>
            <div class="neo-border-2 border-black bg-neo-bg px-4 py-3">
              <p class="text-[10px] font-black uppercase tracking-widest text-gray-500 m-0">Kategori</p>
              <p class="text-sm font-black uppercase text-black m-0 mt-1">{book.category}</p>
            </div>
            <div class="neo-border-2 border-black bg-neo-bg px-4 py-3">
              <p class="text-[10px] font-black uppercase tracking-widest text-gray-500 m-0">Total Pinjam</p>
              <p class="text-sm font-black uppercase text-black m-0 mt-1">{book.borrowedCount} kali</p>
            </div>
            <div class="neo-border-2 border-black bg-neo-bg px-4 py-3">
              <p class="text-[10px] font-black uppercase tracking-widest text-gray-500 m-0">Harga</p>
              <p class="text-sm font-black uppercase text-black m-0 mt-1">{formatCurrency(book.price)}</p>
            </div>
          </div>
        </Card>

        <!-- Description Box -->
        <Card color="yellow" class="gap-4!">
          <div class="flex items-center gap-2">
            <span class="inline-block w-3 h-6 bg-black"></span>
            <h2 class="font-black uppercase text-base tracking-wider m-0 text-gray-900">
              Deskripsi Buku
            </h2>
          </div>
          <p class="font-bold text-sm md:text-base text-gray-800 leading-7 m-0">
            {book.description}
          </p>
        </Card>

        <!-- Actions -->
        <Card color="bg" class="gap-4!">
          <div class="flex flex-col gap-1">
            <div>
              <h2 class="font-black uppercase text-base tracking-wider m-0 text-gray-900">
                Peminjaman
              </h2>
              <p class="font-bold text-sm text-gray-700 m-0 mt-1">
                {alreadyBorrowed
                  ? 'Anda sedang meminjam buku ini.'
                  : book.isAvailable
                    ? `Bayar ${formatCurrency(book.price)} untuk meminjam selama ${DEFAULT_BORROW_DAYS} hari.`
                    : 'Buku belum tersedia untuk dipinjam.'}
              </p>
              {#if book.isAvailable && !alreadyBorrowed}
                <p class="font-bold text-xs text-gray-500 m-0 mt-1">
                  Estimasi deadline pengembalian: {estimatedDueDate}
                </p>
              {/if}
            </div>
          </div>

          {#if book.isAvailable && !alreadyBorrowed}
            <div class="neo-border border-black bg-white px-4 py-3">
              <p class="text-[10px] font-black uppercase tracking-widest text-gray-500 m-0">Total Bayar</p>
              <p class="text-xl font-black text-black m-0">{formatCurrency(book.price)}</p>
            </div>
          {/if}

          <div class="flex justify-end">
            <Button
              onclick={openPaymentPage}
              color="green"
              disabled={!book.isAvailable || alreadyBorrowed}
              class="py-3.5! px-8! text-sm! w-full sm:w-auto"
            >
              {alreadyBorrowed ? 'Sedang Dipinjam' : book.isAvailable ? 'Lanjut ke Pembayaran' : 'Persediaan Habis'}
            </Button>
          </div>
        </Card>

      </div>

    </div>
  {/if}

</div>
