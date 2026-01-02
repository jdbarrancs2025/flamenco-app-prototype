import { Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="relative w-full h-14 px-4 flex items-center justify-center bg-white">
      <button
        className="absolute left-4 p-2 -ml-2"
        aria-label="Menú"
      >
        <Menu size={24} strokeWidth={2} className="text-black" />
      </button>
      <h1 className="font-semibold text-xl leading-[140%] tracking-[-0.02em] text-black text-center">
        {title}
      </h1>
    </header>
  );
}
