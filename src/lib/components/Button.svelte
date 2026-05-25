<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
    onclick?: (e: MouseEvent) => void;
    type?: 'button' | 'submit' | 'reset';
    color?: 'yellow' | 'pink' | 'green' | 'blue' | 'purple' | 'white';
    class?: string;
    disabled?: boolean;
    [key: string]: any;
  }

  let {
    children,
    onclick,
    type = 'button',
    color = 'yellow',
    class: className = '',
    disabled = false,
    ...rest
  }: Props = $props();

  const colorClasses = {
    yellow: 'bg-neo-yellow hover:bg-[#FFE000]',
    pink: 'bg-neo-pink hover:bg-[#FF6580]',
    green: 'bg-neo-green hover:bg-[#2ae068]',
    blue: 'bg-neo-blue hover:bg-[#1bb0f0]',
    purple: 'bg-neo-purple hover:bg-[#9794FF]',
    white: 'bg-white hover:bg-gray-100'
  };
</script>

<button
  {type}
  {disabled}
  {onclick}
  class="
    neo-border neo-shadow neo-interactive font-black uppercase px-6 py-3 text-sm tracking-wider
    cursor-pointer flex items-center justify-center gap-2 select-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-sm
    disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
    {colorClasses[color]} {className}
  "
  {...rest}
>
  {@render children()}
</button>
