<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { library } from '$lib/store.svelte';
  import Card from '$lib/components/Card.svelte';

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
        (record.status && record.status.toLowerCase().includes(q))
    );
  });

  let borrowedCount = $derived(visibleRecords.filter((record) => record.isBorrowed).length);
  let returnedCount = $derived(visibleRecords.filter((record) => !record.isBorrowed).length);
  let isAdminView = $derived(library.currentUser?.canManageBooks() === true);
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

  <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
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
      <table class="w-full text-left border-collapse min-w-[760px]">
        <thead>
          <tr class="bg-[#1a1a1a] text-white border-b-4 border-black">
            {#if isAdminView}
              <th class="p-4 font-black uppercase text-xs tracking-wider">Nama Peminjam</th>
            {/if}
            <th class="p-4 font-black uppercase text-xs tracking-wider">Judul Buku</th>
            <th class="p-4 font-black uppercase text-xs tracking-wider">Tanggal Pinjam</th>
            <th class="p-4 font-black uppercase text-xs tracking-wider">Tanggal Kembali</th>
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
              <td class="p-4 font-mono text-xs text-gray-500">{record.returnDate || '-'}</td>
              <td class="p-4 text-right">
                <span class="
                  neo-border-2 border-black px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider
                  {record.isBorrowed ? 'bg-neo-pink text-black' : 'bg-neo-green text-black'}
                ">
                  {record.isBorrowed ? 'Dipinjam' : 'Dikembalikan'}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
{/if}
