<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
    color?: 'yellow' | 'pink' | 'green' | 'blue' | 'purple' | 'white' | 'bg';
    interactive?: boolean;
    class?: string;
    onclick?: () => void;
  }

  let {
    children,
    color = 'white',
    interactive = false,
    class: className = '',
    onclick
  }: Props = $props();

  const colorClasses = {
    yellow: 'bg-neo-yellow',
    pink: 'bg-neo-pink',
    green: 'bg-neo-green',
    blue: 'bg-neo-blue',
    purple: 'bg-neo-purple',
    white: 'bg-white',
    bg: 'bg-neo-bg'
  };
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  {onclick}
  class="
    neo-border p-6 neo-shadow rounded-none text-gray-900 flex flex-col gap-4
    {colorClasses[color]}
    {interactive ? 'neo-interactive cursor-pointer hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-lg' : ''}
    {className}
  "
>
  {@render children()}
</div>
