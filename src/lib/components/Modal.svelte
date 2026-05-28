<script lang="ts">
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';

  interface Props {
    isOpen: boolean;
    title: string;
    onclose: () => void;
    children: Snippet;
    color?: 'yellow' | 'pink' | 'green' | 'blue' | 'purple' | 'white';
    class?: string;
  }

  let {
    isOpen,
    title,
    onclose,
    children,
    color = 'white',
    class: className = ''
  }: Props = $props();

  const colorClasses = {
    yellow: 'bg-neo-yellow',
    pink: 'bg-neo-pink',
    green: 'bg-neo-green',
    blue: 'bg-neo-blue',
    purple: 'bg-neo-purple',
    white: 'bg-white'
  };

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen) {
      onclose();
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  });
</script>

{#if isOpen}
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
  >
    <button
      type="button"
      onclick={onclose}
      class="absolute inset-0 h-full w-full cursor-default"
      aria-label="Close modal"
    ></button>

    <div
      class="
        w-full max-w-lg neo-border neo-shadow-lg rounded-none overflow-hidden relative z-10 my-8
        {colorClasses[color]} {className}
      "
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      <div class="flex items-center justify-between p-4 bg-[#1a1a1a] text-white neo-border-b border-black">
        <h3 class="font-black uppercase tracking-wider text-base md:text-lg m-0 select-none">
          {title}
        </h3>
        <button
          onclick={onclose}
          class="
            bg-neo-pink text-black neo-border-2 border-black w-8 h-8 flex items-center justify-center font-black rounded-none cursor-pointer
            hover:bg-red-500 active:translate-x-1px active:translate-y-1px
          "
          aria-label="Close modal"
        >
          ✕
        </button>
      </div>

      <div class="p-6 overflow-y-auto max-h-[75vh]">
        {@render children()}
      </div>
    </div>
  </div>
{/if}

<style>
  .animate-fade-in {
    animation: fadeIn 0.15s ease-out;
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>
