<script lang="ts">
  import { library } from '$lib/store.svelte';
  import Card from '$lib/components/Card.svelte';
  import Button from '$lib/components/Button.svelte';

  const members = [
    {
      name: 'MOH. YUSFI LAKHAFIDUN',
      role: 'FULL STACK VIBE CODER',
      desc: 'Bertanggung jawab atas arsitektur Svelte 5, state management reaktif, dan integrasi validasi data menggunakan Zod.',
      color: 'yellow' as const,
      avatar: '👨‍💻'
    },
    {
      name: 'AKSAN MAULANA RAHIM',
      role: 'LAPORAN',
      desc: 'Merancang Laporan sesuai standar mengikuti projek yang ada.',
      color: 'pink' as const,
      avatar: '🎨'
    },
    {
      name: 'EBEH',
      role: 'Data Persistence Engineer',
      desc: 'Mengoptimalkan sinkronisasi data localstorage browser dan penataan struktur tipe data TypeScript.',
      color: 'green' as const,
      avatar: '💾'
    }
    
  ];

  // Polymorphism: getDisplayInfo() beda output per tipe User
  let welcomeText = $derived(
    library.currentUser ? library.currentUser.getDisplayInfo() : 'Selamat Datang'
  );
</script>

<!-- Hero Section -->
<section class="neo-border bg-neo-yellow p-8 md:p-12 neo-shadow-lg mb-12 flex flex-col gap-4 relative overflow-hidden text-black">
  <div class="absolute right-0 top-0 text-9xl opacity-10 select-none pointer-events-none">📚</div>
  <span class="bg-black text-white px-3 py-1 font-black text-xs uppercase tracking-widest self-start select-none">
    {welcomeText}
  </span>
  <h1 class="text-4xl md:text-5xl font-black uppercase tracking-tight leading-none m-0">
    Tadikamesra LIBRARY 
  </h1>
  <p class="font-black text-base md:text-lg max-w-2xl text-gray-800 leading-relaxed m-0">
    Sistem perpustakaan modern bergaya Neo Brutalism. Jelajahi koleksi buku, pinjam secara instan, dan kembalikan tepat waktu!
  </p>

  <div class="flex items-center gap-3 flex-wrap mt-2">
    <a href="/books">
      <Button color="pink">
        Jelajahi Katalog Buku
      </Button>
    </a>
  </div>
</section>

<!-- About Us Section -->
<section class="neo-border bg-neo-purple p-8 md:p-12 neo-shadow-lg mb-12 flex flex-col gap-4 relative overflow-hidden text-black">
  <div class="absolute right-0 top-0 text-9xl opacity-10 select-none pointer-events-none">✨</div>
  <span class="bg-black text-white px-3 py-1 font-black text-xs uppercase tracking-widest self-start select-none">
    Tentang Kami
  </span>
  <h2 class="text-3xl md:text-5xl font-black uppercase tracking-tight leading-none m-0">
    KELOMPOK 6 
  </h2>
  <p class="font-black text-base md:text-lg max-w-2xl leading-relaxed m-0 text-gray-900">
    Kami adalah tim pengembang di balik pembuatan aplikasi NEO-LIB, sistem perpustakaan modern dengan arsitektur reaktif dan desain Neo Brutalism yang premium.
  </p>
</section>

<!-- Visi & Misi -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
  <Card color="white" class="flex flex-col gap-3">
    <div class="flex items-center gap-2">
      <span class="inline-block w-3 h-6 bg-neo-yellow neo-border border-black"></span>
      <h3 class="font-black uppercase text-lg m-0">Visi Kami</h3>
    </div>
    <p class="font-bold text-sm text-gray-700 leading-relaxed m-0">
      Menghadirkan antarmuka web perpustakaan konvensional ke tingkat estetika modern yang premium, berani beda, dan memiliki performa reaktivitas instan di sisi client.
    </p>
  </Card>

  <Card color="white" class="flex flex-col g
  ap-3">
    <div class="flex items-center gap-2">
      <span class="inline-block w-3 h-6 bg-neo-pink neo-border border-black"></span>
      <h3 class="font-black uppercase text-lg m-0">Misi Teknis</h3>
    </div>
    <p class="font-bold text-sm text-gray-700 leading-relaxed m-0">
      Mengimplementasikan teknologi terbaru Svelte 5 (Runes), TypeScript yang aman, Tailwind CSS v4 yang andal, serta LocalStorage browser untuk persistensi data mandiri.
    </p>
  </Card>
</div>

<!-- Team Members -->
<section class="mb-12">
  <div class="flex items-center gap-2 mb-6">
    <span class="inline-block w-4 h-8 bg-neo-green neo-border border-black"></span>
    <h2 class="text-2xl font-black uppercase tracking-wider m-0">Tim Kelompok 6 👥</h2>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    {#each members as member}
      <Card interactive={true} color={member.color} class="h-full flex flex-col gap-4">
        <div class="w-16 h-16 rounded-none neo-border bg-white flex items-center justify-center text-3xl neo-shadow-sm select-none">
          {member.avatar}
        </div>
        <div>
          <h3 class="font-black text-xl text-gray-900 m-0 uppercase tracking-wide leading-tight">{member.name}</h3>
          <span class="bg-black text-white px-2 py-0.5 mt-2 inline-block text-[10px] font-black uppercase tracking-wider neo-border-2 border-black">
            {member.role}
          </span>
        </div>
        <p class="font-bold text-xs text-gray-800 leading-normal m-0 mt-2">
          {member.desc}
        </p>
      </Card>
    {/each}
  </div>
</section>

<!-- CTA -->
<Card color="yellow" class="text-center p-8 flex flex-col items-center gap-4">
  <h3 class="font-black text-xl uppercase tracking-wider m-0">Ingin Mencoba Meminjam Buku?</h3>
  <p class="font-bold text-sm text-gray-800 m-0 max-w-lg">
    Semua data katalog buku dapat Anda kelola secara mandiri. Klik tombol di bawah untuk menjelajahi koleksi perpustakaan.
  </p>
  <a href="/books">
    <Button color="white" class="px-6! py-3!">
      📚 Lihat Daftar Buku
    </Button>
  </a>
</Card>
