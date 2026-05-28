<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { library } from '$lib/store.svelte';
  import Card from '$lib/components/Card.svelte';
  import Button from '$lib/components/Button.svelte';

  let isLoaded = $state(false);
  let searchQuery = $state('');

  onMount(() => {
    if (!library.currentUser) {
      goto('/login');
      return;
    }

    isLoaded = true;
  });

  let visibleRecords = $derived.by(() => {
    if (!library.currentUser) return [];

    const records = library.currentUser.canManageBooks()
      ? library.borrowRecords
      : library.borrowRecords.filter(
          (record) =>
            record.customerEmail && record.customerEmail.toLowerCase() === library.currentUser!.email.toLowerCase()
        );

    if (searchQuery.trim() === '') return records;

    const q = searchQuery.toLowerCase();
    return records.filter(
      (record) =>
        (record.customerName && record.customerName.toLowerCase().includes(q)) ||
        (record.customerEmail && record.customerEmail.toLowerCase().includes(q)) ||
        (record.bookTitle && record.bookTitle.toLowerCase().includes(q)) ||
        (record.borrowDate && record.borrowDate.toLowerCase().includes(q)) ||
        (record.returnDate ?? '').toLowerCase().includes(q) ||
        (record.dueDate && record.dueDate.toLowerCase().includes(q)) ||
        (record.paymentMethod && record.paymentMethod.toLowerCase().includes(q)) ||
        (record.paymentStatus && record.paymentStatus.toLowerCase().includes(q)) ||
        (record.fineStatus && record.fineStatus.toLowerCase().includes(q)) ||
        (record.status && record.status.toLowerCase().includes(q))
    );
  });

  let borrowedCount = $derived(visibleRecords.filter((record) => record.isBorrowed).length);
  let returnedCount = $derived(visibleRecords.filter((record) => !record.isBorrowed).length);
  let overdueCount = $derived(visibleRecords.filter((record) => record.isOverdue).length);
  let totalPaid = $derived(
    visibleRecords
      .filter((record) => record.paymentStatus === 'paid')
      .reduce((total, record) => total + record.borrowPrice, 0)
  );
  let unpaidFine = $derived(
    visibleRecords
      .filter((record) => record.status === 'returned' && record.fineStatus === 'unpaid')
      .reduce((total, record) => total + record.fineAmount, 0)
  );
  let isAdminView = $derived(library.currentUser?.canManageBooks() === true);

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  }

  function formatPaymentMethod(method: string): string {
    const labels: Record<string, string> = {
      cash: 'Cash',
      transfer: 'Transfer',
      ewallet: 'E-Wallet'
    };
    return labels[method] ?? method;
  }

  function handlePayFine(recordId: string) {
    const success = library.payFine(recordId);
    alert(success ? 'Denda berhasil dibayar.' : 'Denda tidak dapat diproses.');
  }
</script>

{#if isLoaded}
  <div class="mb-10 flex flex-col md:flex-row md:items-start justify-between gap-4">
    <div>
      <span class="bg-black text-white px-3 py-1 font-black text-xs uppercase tracking-widest inline-block select-none mb-1">
        {isAdminView ? 'Semua Transaksi User' : 'Riwayat Pribadi'}
      </span>
      <h1 class="text-3xl md:text-5xl font-black uppercase tracking-tight text-gray-900 m-0">
        Riwayat Peminjaman
      </h1>
      <p class="font-bold text-sm text-gray-600 mt-2 mb-0">
        {isAdminView
          ? 'Admin dapat melihat semua riwayat peminjaman user.'
          : `Menampilkan riwayat milik ${library.currentUser?.username}.`}
      </p>
    </div>

    <a
      href="/books"
      class="neo-border neo-shadow bg-white hover:bg-neo-bg px-5 py-3 font-black uppercase text-xs tracking-wider transition-all"
    >
      Katalog Buku
    </a>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
    <Card color="yellow">
      <h4 class="text-xs font-black uppercase tracking-widest text-gray-500 m-0">Total Riwayat</h4>
      <p class="text-4xl font-black text-black m-0 mt-2">{visibleRecords.length}</p>
    </Card>
    <Card color="pink">
      <h4 class="text-xs font-black uppercase tracking-widest text-gray-500 m-0">Sedang Dipinjam</h4>
      <p class="text-4xl font-black text-black m-0 mt-2">{borrowedCount}</p>
    </Card>
    <Card color="green">
      <h4 class="text-xs font-black uppercase tracking-widest text-gray-500 m-0">Sudah Kembali</h4>
      <p class="text-4xl font-black text-black m-0 mt-2">{returnedCount}</p>
    </Card>
    <Card color="white">
      <h4 class="text-xs font-black uppercase tracking-widest text-gray-500 m-0">Overdue</h4>
      <p class="text-4xl font-black text-black m-0 mt-2">{overdueCount}</p>
    </Card>
    <Card color="blue">
      <h4 class="text-xs font-black uppercase tracking-widest text-gray-500 m-0">Bayar / Denda</h4>
      <p class="text-xl font-black text-black m-0 mt-2">{formatCurrency(totalPaid)}</p>
      <p class="text-xs font-black text-gray-600 m-0 mt-1">Denda: {formatCurrency(unpaidFine)}</p>
    </Card>
  </div>

  <div class="mb-6 max-w-md">
    <label for="historySearch" class="font-black text-sm uppercase tracking-wide block mb-2">
      Cari Riwayat
    </label>
    <input
      id="historySearch"
      bind:value={searchQuery}
      placeholder="Cari buku, user, tanggal, atau status..."
      class="w-full px-4 py-3 neo-border neo-shadow-sm font-semibold bg-white text-gray-900 focus:outline-none border-black focus:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all"
    />
  </div>

  {#if visibleRecords.length === 0}
    <Card color="white" class="text-center py-12">
      <p class="font-black text-lg text-gray-500 uppercase tracking-wide m-0">
        Belum ada riwayat peminjaman.
      </p>
    </Card>
  {:else}
    <div class="overflow-x-auto neo-border neo-shadow bg-white rounded-none">
      <table class="w-full text-left border-collapse min-w-[1120px]">
        <thead>
          <tr class="bg-[#1a1a1a] text-white border-b-4 border-black">
            {#if isAdminView}
              <th class="p-4 font-black uppercase text-xs tracking-wider">Nama Peminjam</th>
            {/if}
            <th class="p-4 font-black uppercase text-xs tracking-wider">Judul Buku</th>
            <th class="p-4 font-black uppercase text-xs tracking-wider">Tanggal Pinjam</th>
            <th class="p-4 font-black uppercase text-xs tracking-wider">Deadline</th>
            <th class="p-4 font-black uppercase text-xs tracking-wider">Tanggal Kembali</th>
            <th class="p-4 font-black uppercase text-xs tracking-wider">Pembayaran</th>
            <th class="p-4 font-black uppercase text-xs tracking-wider">Denda</th>
            <th class="p-4 font-black uppercase text-xs tracking-wider text-right">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-black/10">
          {#each visibleRecords as record (record.id)}
            <tr class="hover:bg-neo-bg/20">
              {#if isAdminView}
                <td class="p-4">
                  <div class="font-black text-sm text-gray-900">{record.customerName}</div>
                  <div class="text-xs font-bold text-gray-500 mt-0.5">{record.customerEmail}</div>
                </td>
              {/if}
              <td class="p-4 font-bold text-sm text-gray-800">{record.bookTitle}</td>
              <td class="p-4 font-mono text-xs text-gray-500">{record.borrowDate}</td>
              <td class="p-4 font-mono text-xs text-gray-500">{record.dueDate}</td>
              <td class="p-4 font-mono text-xs text-gray-500">{record.returnDate || '-'}</td>
              <td class="p-4">
                <div class="font-black text-sm text-gray-900">{formatCurrency(record.borrowPrice)}</div>
                <div class="text-xs font-bold text-gray-500 mt-0.5">
                  {formatPaymentMethod(record.paymentMethod)} - {record.paymentStatus}
                </div>
                {#if record.paidAt}
                  <div class="text-xs font-mono text-gray-400 mt-0.5">{record.paidAt}</div>
                {/if}
              </td>
              <td class="p-4">
                <div class="font-black text-sm text-gray-900">{formatCurrency(record.fineAmount)}</div>
                <div class="text-xs font-bold text-gray-500 mt-0.5">
                  {record.lateDays} hari - {record.fineStatus}
                </div>
                {#if record.status === 'returned' && record.fineStatus === 'unpaid'}
                  <Button onclick={() => handlePayFine(record.id)} color="green" class="px-3! py-1.5! text-xs! shadow-sm! mt-2">
                    {isAdminView ? 'Tandai Lunas' : 'Bayar Denda'}
                  </Button>
                {/if}
              </td>
              <td class="p-4 text-right">
                <span class="
                  neo-border-2 border-black px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider
                  {record.status === 'returned' ? 'bg-neo-green text-black' : record.status === 'overdue' ? 'bg-neo-pink text-black' : 'bg-neo-yellow text-black'}
                ">
                  {record.status === 'returned' ? 'Dikembalikan' : record.status === 'overdue' ? 'Overdue' : 'Dipinjam'}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
{/if}
