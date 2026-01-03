import { useNavigate } from 'react-router-dom';
import { Headphones, Search, BookOpen, Sparkles, Plus } from 'lucide-react';

export function TabBar() {
  const navigate = useNavigate();

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed tab bar */}
      <div className="h-[83px]" />

      {/* Fixed tab bar - centered on desktop */}
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] bg-white z-50"
        style={{ boxShadow: '0px -0.5px 0px rgba(0, 0, 0, 0.1)' }}
      >
        <div className="flex justify-around items-center h-[49px] px-4">
          {/* Sparkles - Decorative */}
          <button className="w-12 h-12 flex items-center justify-center opacity-40 cursor-default" disabled>
            <Sparkles size={24} className="text-black" />
          </button>

          {/* Search - Decorative */}
          <button className="w-12 h-12 flex items-center justify-center opacity-40 cursor-default" disabled>
            <Search size={24} className="text-black" />
          </button>

          {/* Headphones - Functional (Home) */}
          <button
            className="w-12 h-12 flex items-center justify-center opacity-100 cursor-pointer"
            onClick={() => navigate('/')}
            aria-label="Inicio"
          >
            <Headphones size={24} className="text-black" />
          </button>

          {/* Book - Decorative */}
          <button className="w-12 h-12 flex items-center justify-center opacity-40 cursor-default" disabled>
            <BookOpen size={24} className="text-black" />
          </button>

          {/* Plus - Decorative */}
          <button className="w-12 h-12 flex items-center justify-center opacity-40 cursor-default" disabled>
            <Plus size={24} className="text-black" />
          </button>
        </div>

        {/* Home indicator */}
        <div className="flex justify-center pb-2 safe-bottom">
          <div className="w-[134px] h-[5px] bg-black rounded-[100px]" />
        </div>
      </nav>
    </>
  );
}
