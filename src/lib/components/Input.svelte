<script lang="ts">
  interface Props {
    label?: string;
    id: string;
    type?: string;
    value: string | number;
    placeholder?: string;
    error?: string;
    required?: boolean;
    class?: string;
    [key: string]: any;
  }

  let {
    label,
    id,
    type = 'text',
    value = $bindable(),
    placeholder = '',
    error = '',
    required = false,
    class: className = '',
    ...rest
  }: Props = $props();
</script>

<div class="flex flex-col gap-2 w-full {className}">
  {#if label}
    <label for={id} class="font-black text-sm uppercase tracking-wide flex gap-1 items-center">
      {label}
      {#if required}
        <span class="text-neo-pink">*</span>
      {/if}
    </label>
  {/if}
  
  <input
    {id}
    {type}
    bind:value
    {placeholder}
    {required}
    class="
      w-full px-4 py-3 neo-border neo-shadow-sm font-semibold bg-white text-gray-900 focus:outline-none focus:bg-[#FFF] focus:-translate-x-px focus:-translate-y-px focus:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all
      {error ? 'border-neo-pink bg-red-50' : 'border-black'}
    "
    {...rest}
  />
  
  {#if error}
    <span class="text-xs font-black uppercase text-neo-pink bg-red-100 neo-border border-neo-pink px-2 py-1 mt-1 inline-block self-start neo-shadow-sm">
      ⚠️ {error}
    </span>
  {/if}
</div>
