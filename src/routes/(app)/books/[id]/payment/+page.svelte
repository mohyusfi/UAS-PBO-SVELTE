<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { library } from '$lib/store.svelte';
  import Card from '$lib/components/Card.svelte';
  import Button from '$lib/components/Button.svelte';
  import { DEFAULT_BORROW_DAYS, addDaysToISODate, todayISO } from '$lib/models/BorrowRecord';
  import type { PaymentMethod } from '$lib/types';

  let isLoaded = $state(false);
  let selectedPaymentMethod = $state<PaymentMethod>('ewallet');
  let isSubmitting = $state(false);

  let bookId = $derived($page.params.id);
  let book = $derived(library.books.find((item) => item.id === bookId));
  let estimatedDueDate = $derived(addDaysToISODate(todayISO(), DEFAULT_BORROW_DAYS));

  const paymentMethods: Array<{ value: PaymentMethod; label: string; description: string }> = [
    { value: 'ewallet', label: 'E-Wallet', description: 'Pembayaran digital instan' },
    { value: 'transfer', label: 'Transfer', description: 'Transfer bank manual' },
    { value: 'cash', label: 'Cash', description: 'Bayar tunai di perpustakaan' }
  ];

  let alreadyBorrowed = $derived.by(() => {
    if (!library.currentUser || !library.currentUser.canBorrow()) return false;
    return library.borrowRecords.some(
      (record) =>
        record.bookId === bookId &&
        record.customerEmail &&
        record.customerEmail.toLowerCase() === library.currentUser!.email.toLowerCase() &&
        record.isBorrowed
    );
  });

  onMount(() => {
    if (!library.currentUser) {
      goto('/login');
      return;
    }

    if (!library.currentUser.canBorrow()) {
      alert('Admin tidak dapat meminjam buku. Silakan gunakan akun customer.');
      goto('/books');
      return;
    }

    isLoaded = true;
  });

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  }

  async function handlePayment() {
    if (!book || !library.currentUser || isSubmitting) return;

    if (alreadyBorrowed) {
      alert('Anda sedang meminjam buku ini.');
      await goto('/history');
      return;
    }

    isSubmitting = true;
    const result = library.borrowBook(book.id, library.currentUser.email, selectedPaymentMethod);
    isSubmitting = false;

    if (result.success) {
      alert(
        `Pembayaran ${formatCurrency(result.payment?.amount ?? 0)} berhasil. ` +
        `Buku dipinjam sampai ${result.record?.dueDate}.`
      );
      await goto('/history');
      return;
    }

    alert(result.error ?? 'Pembayaran gagal diproses.');
  }
</script>

{#if isLoaded}
  <div class="max-w-6xl mx-auto py-6">
    <div class="mb-8">
      <a
        href="/books/{bookId}"
        class="
          inline-flex items-center gap-2 neo-border bg-white hover:bg-neo-bg px-4 py-2 font-black uppercase text-xs tracking-wider neo-shadow-sm
          active:translate-x-px active:translate-y-px active:shadow-none transition-all
        "
      >
        <span aria-hidden="true">←</span>
        Kembali ke Detail
      </a>
    </div>

    {#if !book}
      <Card color="pink" class="text-center py-12">
        <h1 class="text-2xl font-black uppercase tracking-wider text-black m-0 mb-4">
          Buku Tidak Ditemukan
        </h1>
        <p class="font-bold text-sm text-gray-700 m-0">
          Buku dengan ID "{bookId}" tidak tersedia untuk pembayaran.
        </p>
      </Card>
    {:else}
      <div class="mb-10">
        <span class="bg-black text-white px-3 py-1 font-black text-xs uppercase tracking-widest inline-block select-none mb-1">
          Pembayaran Peminjaman
        </span>
        <h1 class="text-3xl md:text-5xl font-black uppercase tracking-tight text-gray-900 m-0">
          Bayar Buku
        </h1>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-[minmax(260px,360px)_1fr] gap-8 items-start">
        <aside class="lg:sticky lg:top-24">
          <div
            class="
              neo-border border-black w-full aspect-3/4 flex flex-col justify-between p-6 text-center relative select-none neo-shadow-lg
              {book.category === 'Fiksi' ? 'bg-neo-pink' : book.category === 'Filsafat' ? 'bg-neo-purple' : book.category === 'Pengembangan Diri' ? 'bg-neo-green' : 'bg-neo-yellow'}
            "
          >
            <div class="flex justify-between items-start gap-3">
              <span class="bg-black text-white px-2 py-0.5 text-xs font-black uppercase tracking-widest neo-border border-black">
                {book.category}
              </span>
              <span class="bg-white text-black px-2 py-0.5 text-xs font-black uppercase neo-border border-black">
                {book.stock} stok
              </span>
            </div>

            <div>
              <div class="text-7xl leading-none mb-4">📖</div>
              <h2 class="font-black text-2xl text-black leading-tight uppercase tracking-wide m-0">
                {book.title}
              </h2>
              <p class="text-xs font-black text-black/75 mt-3 mb-0 uppercase tracking-wider">
                {book.author}
              </p>
            </div>

            <div class="neo-border-2 border-black bg-white px-3 py-2 text-left">
              <p class="text-[10px] font-black uppercase text-gray-500 m-0">Harga Pinjam</p>
              <p class="text-xl font-black text-black m-0">{formatCurrency(book.price)}</p>
            </div>
          </div>
        </aside>

        <div class="flex flex-col gap-6">
          <Card color="white" class="gap-5!">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="neo-border-2 border-black bg-neo-bg px-4 py-3">
                <p class="text-[10px] font-black uppercase tracking-widest text-gray-500 m-0">Durasi</p>
                <p class="text-sm font-black uppercase text-black m-0 mt-1">{DEFAULT_BORROW_DAYS} hari</p>
              </div>
              <div class="neo-border-2 border-black bg-neo-bg px-4 py-3">
                <p class="text-[10px] font-black uppercase tracking-widest text-gray-500 m-0">Deadline</p>
                <p class="text-sm font-black uppercase text-black m-0 mt-1">{estimatedDueDate}</p>
              </div>
              <div class="neo-border-2 border-black bg-neo-bg px-4 py-3">
                <p class="text-[10px] font-black uppercase tracking-widest text-gray-500 m-0">Total</p>
                <p class="text-sm font-black uppercase text-black m-0 mt-1">{formatCurrency(book.price)}</p>
              </div>
            </div>
          </Card>

          <Card color="bg" class="gap-5!">
            <div>
              <h2 class="font-black uppercase text-base tracking-wider m-0 text-gray-900">
                Metode Pembayaran
              </h2>
              <p class="font-bold text-sm text-gray-700 m-0 mt-1">
                Pilih satu metode untuk menyelesaikan peminjaman buku.
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              {#each paymentMethods as method (method.value)}
                <label
                  class="
                    neo-border border-black px-4 py-3 cursor-pointer transition-all
                    {selectedPaymentMethod === method.value ? 'bg-neo-green neo-shadow-sm translate-x-0.5 translate-y-0.5' : 'bg-white neo-shadow-sm hover:bg-neo-bg'}
                  "
                >
                  <input
                    type="radio"
                    bind:group={selectedPaymentMethod}
                    value={method.value}
                    class="sr-only"
                  />
                  <span class="block font-black uppercase text-sm text-black">{method.label}</span>
                  <span class="block font-bold text-xs text-gray-600 mt-1">{method.description}</span>
                </label>
              {/each}
            </div>

            {#if alreadyBorrowed}
              <div class="neo-border border-black bg-neo-pink px-4 py-3">
                <p class="font-black uppercase text-sm text-black m-0">Anda sedang meminjam buku ini.</p>
              </div>
            {:else if !book.isAvailable}
              <div class="neo-border border-black bg-neo-pink px-4 py-3">
                <p class="font-black uppercase text-sm text-black m-0">Stok buku sedang habis.</p>
              </div>
            {/if}

            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p class="text-[10px] font-black uppercase tracking-widest text-gray-500 m-0">Total Bayar</p>
                <p class="text-3xl font-black text-black m-0">{formatCurrency(book.price)}</p>
              </div>

              <Button
                onclick={handlePayment}
                color="green"
                disabled={alreadyBorrowed || !book.isAvailable || isSubmitting}
                class="py-3.5! px-8! text-sm! w-full sm:w-auto"
              >
                {isSubmitting ? 'Memproses' : 'Bayar & Pinjam'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    {/if}
  </div>
{/if}
