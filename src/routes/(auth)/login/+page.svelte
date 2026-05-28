<script lang="ts">
  import { library } from '$lib/store';
  import { loginSchema, registerSchema, type LoginFields, type RegisterFields } from '$lib/schema';
  import { goto } from '$app/navigation';
  import Card from '$lib/components/Card.svelte';
  import Button from '$lib/components/Button.svelte';
  import Input from '$lib/components/Input.svelte';

  let activeTab = $state<'login' | 'register'>('login');
  
  let username = $state('');
  let email = $state('');
  let password = $state('');
  
  let validationErrors = $state<Record<string, string>>({});
  let formErrorMsg = $state('');

  function handleTabChange(tab: 'login' | 'register') {
    activeTab = tab;
    username = '';
    email = '';
    password = '';
    validationErrors = {};
    formErrorMsg = '';
  }

  function handleLogin(e: SubmitEvent) {
    e.preventDefault();
    validationErrors = {};
    formErrorMsg = '';

    const fields: LoginFields = { email, password };
    const result = loginSchema.safeParse(fields);
    if (!result.success) {
      const formatted = result.error.format();
      validationErrors = {
        email: formatted.email?._errors[0] || '',
        password: formatted.password?._errors[0] || ''
      };
      return;
    }

    const authResult = library.login(email, password);
    if (authResult.success) {
      if (library.currentUser?.canManageBooks()) {
        goto('/admin');
      } else {
        goto('/');
      }
    } else {
      formErrorMsg = authResult.error || 'Autentikasi gagal!';
    }
  }

  function handleRegister(e: SubmitEvent) {
    e.preventDefault();
    validationErrors = {};
    formErrorMsg = '';

    const fields: RegisterFields = { username, email, password };
    const result = registerSchema.safeParse(fields);
    if (!result.success) {
      const formatted = result.error.format();
      validationErrors = {
        username: formatted.username?._errors[0] || '',
        email: formatted.email?._errors[0] || '',
        password: formatted.password?._errors[0] || ''
      };
      return;
    }

    const regResult = library.registerCustomer(username, email, password);
    if (regResult.success) {
      alert('Registrasi berhasil! Anda telah masuk secara otomatis.');
      goto('/');
    } else {
      formErrorMsg = regResult.error || 'Registrasi gagal!';
    }
  }
</script>

<div class="flex items-center justify-center min-h-screen p-4">
  <div class="w-full max-w-lg">

    <div class="text-center mb-8">
      <div class="bg-neo-yellow neo-border px-4 py-2 font-black text-2xl uppercase tracking-wider neo-shadow inline-block mb-3">
        Tadikamesra-LIB
      </div>
      <p class="font-black text-xs uppercase tracking-widest text-gray-500">
        Perpustakaan Kelompok 6
      </p>
    </div>

    <div class="flex border-b-4 border-black mb-0">
      <button
        onclick={() => handleTabChange('login')}
        class="
          flex-1 py-3 font-black uppercase text-sm tracking-wider neo-border border-b-0 mr-2 transition-all cursor-pointer text-center
          {activeTab === 'login' ? 'bg-neo-yellow -translate-y-1 relative z-10' : 'bg-neo-bg hover:bg-white'}
        "
      >
        Masuk
      </button>
      
      <button
        onclick={() => handleTabChange('register')}
        class="
          flex-1 py-3 font-black uppercase text-sm tracking-wider neo-border border-b-0 transition-all cursor-pointer text-center
          {activeTab === 'register' ? 'bg-neo-pink -translate-y-1 relative z-10' : 'bg-neo-bg hover:bg-white'}
        "
      >
        Daftar Baru
      </button>
    </div>

    <Card color="white" class="neo-shadow-lg rounded-t-none!">
      
      {#if activeTab === 'login'}
        <div class="text-center mb-6">
          <h1 class="text-3xl font-black uppercase tracking-wider text-gray-900 m-0">
            MASUK PERPUSTAKAAN 
          </h1>
          <p class="font-bold text-xs text-gray-600 mt-2">
            Masukkan email dan password Anda untuk mengakses perpustakaan.
          </p>
        </div>

        {#if formErrorMsg}
          <div class="bg-red-100 text-neo-pink neo-border border-neo-pink px-4 py-3 font-black text-xs uppercase tracking-wide mb-4 neo-shadow-sm">
            ⚠️ {formErrorMsg}
          </div>
        {/if}

        <form onsubmit={handleLogin} class="flex flex-col gap-4">
          <Input
            id="loginEmail"
            type="email"
            label="Alamat Email"
            placeholder="nama@email.com"
            bind:value={email}
            required={true}
            error={validationErrors.email}
          />

          <Input
            id="loginPassword"
            type="password"
            label="Password"
            placeholder="••••••"
            bind:value={password}
            required={true}
            error={validationErrors.password}
          />

          <Button type="submit" color="yellow" class="w-full mt-4">
            Masuk ke Aplikasi
          </Button>
        </form>

      {:else}
        <div class="text-center mb-6">
          <h1 class="text-3xl font-black uppercase tracking-wider text-gray-900 m-0">
            REGISTRASI CUSTOMER 
          </h1>
          <p class="font-bold text-xs text-gray-600 mt-2">
            Buat akun baru untuk mulai meminjam koleksi buku perpustakaan.
          </p>
        </div>

        {#if formErrorMsg}
          <div class="bg-red-100 text-neo-pink neo-border border-neo-pink px-4 py-3 font-black text-xs uppercase tracking-wide mb-4 neo-shadow-sm">
            ⚠️ {formErrorMsg}
          </div>
        {/if}

        <form onsubmit={handleRegister} class="flex flex-col gap-4">
          <Input
            id="regUsername"
            label="Nama Lengkap / Username"
            placeholder="Masukkan nama Anda..."
            bind:value={username}
            required={true}
            error={validationErrors.username}
          />

          <Input
            id="regEmail"
            type="email"
            label="Alamat Email"
            placeholder="nama@email.com"
            bind:value={email}
            required={true}
            error={validationErrors.email}
          />

          <Input
            id="regPassword"
            type="password"
            label="Password (min. 6 karakter)"
            placeholder="••••••"
            bind:value={password}
            required={true}
            error={validationErrors.password}
          />

          <Button type="submit" color="pink" class="w-full mt-4">
            Daftar & Masuk Otomatis
          </Button>
        </form>
      {/if}

    </Card>
  </div>
</div>
