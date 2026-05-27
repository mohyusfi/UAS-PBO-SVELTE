<script lang="ts">
  import { onMount } from 'svelte';
  import { library } from '$lib/store.svelte';
  import { bookSchema, type BookFields } from '$lib/schema';
  import { goto } from '$app/navigation';
  import Card from '$lib/components/Card.svelte';
  import Button from '$lib/components/Button.svelte';
  import Input from '$lib/components/Input.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import type { Book } from '$lib/models';

  // Protecting route
  let isLoaded = $state(false);

  onMount(() => {
    if (!library.currentUser || !library.currentUser.canManageBooks()) {
      goto('/login');
    } else {
      isLoaded = true;
    }
  });

  let isBookModalOpen = $state(false);
  let modalMode = $state<'add' | 'edit'>('add');
  let selectedBookId = $state<string | null>(null);

  // Form Fields
  let title = $state('');
  let author = $state('');
  let isbn = $state('');
  let description = $state('');
  let category = $state('Fiksi');
  let coverUrl = $state('');
  let stock = $state<number>(1);

  // Validation errors
  let validationErrors = $state<Record<string, string>>({});

  // Search in Admin
  let adminSearchQuery = $state('');

  // Derived filter books for admin
  let filteredAdminBooks = $derived.by(() => {
    let result = library.books;
    if (adminSearchQuery.trim() !== '') {
      const q = adminSearchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          (b.title && b.title.toLowerCase().includes(q)) ||
          (b.author && b.author.toLowerCase().includes(q)) ||
          (b.isbn && b.isbn.toLowerCase().includes(q)) ||
          (b.category && b.category.toLowerCase().includes(q))
      );
    }
    return result;
  });

  // Open Modal to Add
  function openAddModal() {
    modalMode = 'add';
    selectedBookId = null;
    title = '';
    author = '';
    isbn = '';
    description = '';
    category = 'Fiksi';
    coverUrl = '';
    stock = 1;
    validationErrors = {};
    isBookModalOpen = true;
  }

  // Open Modal to Edit
  function openEditModal(book: Book) {
    modalMode = 'edit';
    selectedBookId = book.id;
    title = book.title;
    author = book.author;
    isbn = book.isbn;
    description = book.description;
    category = book.category;
    coverUrl = book.coverUrl;
    stock = book.stock;
    validationErrors = {};
    isBookModalOpen = true;
  }

  // Handle Submit Form (Add or Edit)
  function handleBookSubmit(e: SubmitEvent) {
    e.preventDefault();
    validationErrors = {};

    const formData: BookFields = {
      title,
      author,
      isbn,
      description,
      category,
      coverUrl,
      stock: Number(stock)
    };

    // Validate using Zod
    const result = bookSchema.safeParse(formData);
    if (!result.success) {
      const formatted = result.error.format();
      validationErrors = {
        title: formatted.title?._errors[0] || '',
        author: formatted.author?._errors[0] || '',
        isbn: formatted.isbn?._errors[0] || '',
        description: formatted.description?._errors[0] || '',
        category: formatted.category?._errors[0] || '',
        coverUrl: formatted.coverUrl?._errors[0] || '',
        stock: formatted.stock?._errors[0] || ''
      };
      return;
    }

    if (modalMode === 'add') {
      library.addBook(formData);
      alert('Buku baru berhasil ditambahkan!');
    } else if (modalMode === 'edit' && selectedBookId) {
      library.updateBook(selectedBookId, formData);
      alert('Detail buku berhasil diperbarui!');
    }

    isBookModalOpen = false;
  }

  // Handle Delete Book
  function handleDeleteBook(id: string, name: string) {
    if (confirm(`Apakah Anda yakin ingin menghapus buku "${name}" dari perpustakaan?`)) {
      library.deleteBook(id);
      alert('Buku berhasil dihapus!');
    }
  }

  // Statistics calculations
  let totalBooks = $derived(library.books.length);
  let totalBorrowed = $derived(library.borrowRecords.filter(r => r.status === 'borrowed').length);
  let totalStock = $derived(library.books.reduce((acc, b) => acc + b.stock, 0));
  let totalHistory = $derived(library.borrowRecords.length);
</script>

{#if isLoaded}
  <!-- Title Header -->
  <div class="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <span class="bg-black text-white px-3 py-1 font-black text-xs uppercase tracking-widest inline-block select-none mb-1">
        Dashboard Pengelola
      </span>
      <h1 class="text-3xl md:text-5xl font-black uppercase tracking-tight text-gray-900 m-0">
        KONTROL UTAMA ADMIN 
      </h1>
    </div>
    
    <div class="flex flex-wrap gap-3 self-start md:self-auto">
      <a
        href="/history"
        class="neo-border neo-shadow bg-white hover:bg-neo-bg px-5 py-3 font-black uppercase text-sm tracking-wider transition-all"
      >
        📜 Lihat Riwayat
      </a>
      <Button onclick={openAddModal} color="green">
        ➕ Tambah Buku Baru
      </Button>
    </div>

  </div>

  <!-- Stats Grid -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
    <Card color="yellow">
      <h4 class="text-xs font-black uppercase tracking-widest text-gray-500 m-0">Total Judul Buku</h4>
      <p class="text-4xl font-black text-black m-0 mt-2">{totalBooks}</p>
    </Card>
    <Card color="pink">
      <h4 class="text-xs font-black uppercase tracking-widest text-gray-500 m-0">Sedang Dipinjam</h4>
      <p class="text-4xl font-black text-black m-0 mt-2">{totalBorrowed} buku</p>
    </Card>
    <Card color="green">
      <h4 class="text-xs font-black uppercase tracking-widest text-gray-500 m-0">Total Unit Stok</h4>
      <p class="text-4xl font-black text-black m-0 mt-2">{totalStock} unit</p>
    </Card>
    <Card color="purple">
      <h4 class="text-xs font-black uppercase tracking-widest text-gray-500 m-0">Riwayat Transaksi</h4>
      <p class="text-4xl font-black text-black m-0 mt-2">{totalHistory} log</p>
    </Card>
  </div>

  <div class="mb-6 max-w-md">
    <Input
      id="adminSearch"
      placeholder="Cari katalog buku (judul, penulis, ISBN)..."
      bind:value={adminSearchQuery}
    />
  </div>

  {#if filteredAdminBooks.length === 0}
    <Card color="white" class="text-center py-12">
      <p class="font-black text-lg text-gray-500 uppercase tracking-wide m-0">
        Katalog kosong atau pencarian tidak ditemukan.
      </p>
    </Card>
  {:else}
    <div class="overflow-x-auto neo-border neo-shadow bg-white rounded-none">
      <table class="w-full text-left border-collapse min-w-175">
        <thead>
          <tr class="bg-[#1a1a1a] text-white border-b-4 border-black">
            <th class="p-4 font-black uppercase text-xs tracking-wider">Judul / Penulis</th>
            <th class="p-4 font-black uppercase text-xs tracking-wider">ISBN</th>
            <th class="p-4 font-black uppercase text-xs tracking-wider">Kategori</th>
            <th class="p-4 font-black uppercase text-xs tracking-wider text-center">Stok</th>
            <th class="p-4 font-black uppercase text-xs tracking-wider text-center">Total Pinjam</th>
            <th class="p-4 font-black uppercase text-xs tracking-wider text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-black/10">
          {#each filteredAdminBooks as book (book.id)}
            <tr class="hover:bg-neo-bg/20">
              <td class="p-4">
                <div class="font-black text-sm text-gray-900">{book.title}</div>
                <div class="text-xs font-bold text-gray-500 mt-0.5">Oleh: {book.author}</div>
              </td>
              <td class="p-4 font-mono text-xs text-gray-600">{book.isbn}</td>
              <td class="p-4">
                <span class="neo-border-2 border-black bg-neo-purple/20 px-2 py-0.5 text-[10px] font-black uppercase">
                  {book.category}
                </span>
              </td>
              <td class="p-4 text-center">
                <span class="neo-border-2 border-black px-2 py-0.5 text-xs font-black uppercase {book.stock > 0 ? 'bg-neo-green/30' : 'bg-neo-pink/30'}">
                  {book.stock}
                </span>
              </td>
              <td class="p-4 text-center font-bold text-sm">{book.borrowedCount}x</td>
              <td class="p-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <Button onclick={() => openEditModal(book)} color="blue" class="px-3! py-1.5! text-xs! shadow-sm!">
                    Edit
                  </Button>
                  <Button onclick={() => handleDeleteBook(book.id, book.title)} color="pink" class="px-3! py-1.5! text-xs! shadow-sm!">
                    Hapus
                  </Button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  <Modal
    isOpen={isBookModalOpen}
    title={modalMode === 'add' ? 'Tambah Buku Baru 📖' : 'Edit Detail Buku ✏️'}
    onclose={() => isBookModalOpen = false}
    color="yellow"
  >
    <form onsubmit={handleBookSubmit} class="flex flex-col gap-4">
      <Input
        id="bookTitle"
        label="Judul Buku"
        placeholder="Masukkan judul buku..."
        bind:value={title}
        required={true}
        error={validationErrors.title}
      />

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          id="bookAuthor"
          label="Penulis"
          placeholder="Nama penulis..."
          bind:value={author}
          required={true}
          error={validationErrors.author}
        />
        <Input
          id="bookIsbn"
          label="ISBN"
          placeholder="E.g. 9781234567..."
          bind:value={isbn}
          required={true}
          error={validationErrors.isbn}
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Category Selector -->
        <div class="flex flex-col gap-2 w-full">
          <label for="bookCategory" class="font-black text-sm uppercase tracking-wide">
            Kategori <span class="text-neo-pink">*</span>
          </label>
          <select
            id="bookCategory"
            bind:value={category}
            class="w-full px-4 py-3 neo-border neo-shadow-sm font-semibold bg-white text-gray-900 focus:outline-none border-black"
          >
            <option value="Fiksi">Fiksi</option>
            <option value="Filsafat">Filsafat</option>
            <option value="Pengembangan Diri">Pengembangan Diri</option>
            <option value="Sains / Teknologi">Sains / Teknologi</option>
            <option value="Sejarah">Sejarah</option>
          </select>
        </div>

        <Input
          id="bookStock"
          type="number"
          label="Jumlah Stok"
          placeholder="1"
          bind:value={stock}
          required={true}
          error={validationErrors.stock}
        />
      </div>

      <!-- Description textarea -->
      <div class="flex flex-col gap-2 w-full">
        <label for="bookDesc" class="font-black text-sm uppercase tracking-wide">
          Deskripsi Singkat <span class="text-neo-pink">*</span>
        </label>
        <textarea
          id="bookDesc"
          bind:value={description}
          rows="3"
          placeholder="Tulis penjelasan singkat mengenai buku ini..."
          required={true}
          class="
            w-full px-4 py-3 neo-border neo-shadow-sm font-semibold bg-white text-gray-900 focus:outline-none border-black focus:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all
            {validationErrors.description ? 'border-neo-pink bg-red-50' : ''}
          "
        ></textarea>
        {#if validationErrors.description}
          <span class="text-xs font-black uppercase text-neo-pink bg-red-100 neo-border border-neo-pink px-2 py-1 mt-1 inline-block self-start neo-shadow-sm">
            ⚠️ {validationErrors.description}
          </span>
        {/if}
      </div>

      <!-- Optional Cover Url -->
      <Input
        id="bookCover"
        label="URL Cover Gambar (Opsional)"
        placeholder="Https://domain.com/image.jpg (kosongkan jika tidak ada)"
        bind:value={coverUrl}
        error={validationErrors.coverUrl}
      />

      <div class="flex justify-end gap-3 mt-6">
        <Button onclick={() => isBookModalOpen = false} color="white" class="px-4! py-2! text-xs!">
          Batal
        </Button>
        <Button type="submit" color="green" class="px-4! py-2! text-xs!">
          {modalMode === 'add' ? 'Simpan Buku' : 'Perbarui Buku'}
        </Button>
      </div>
    </form>
  </Modal>
{/if}
