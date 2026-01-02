interface SpeedSliderProps {
  value: number;
  onChange?: (value: number) => void;
}

export function SpeedSlider({ value = 1.0, onChange }: SpeedSliderProps) {
  // Convert value (0.8-1.2) to percentage (0-100)
  const percentage = ((value - 0.8) / 0.4) * 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    onChange?.(newValue);
  };

  return (
    <div className="w-full px-[11px] py-2">
      <div className="relative w-full h-[44px] flex items-center">
        {/* Track background */}
        <div className="absolute w-full h-4 flex">
          {/* Active (purple) portion */}
          <div
            className="h-full bg-primary rounded-l-[16px]"
            style={{ width: `${percentage}%` }}
          />
          {/* Handle */}
          <div className="w-1 h-[44px] bg-primary rounded-sm -my-[14px]" />
          {/* Inactive (light purple) portion */}
          <div
            className="h-full bg-primary-container rounded-r-[16px] flex-1"
          />
        </div>
        {/* Dot at the end */}
        <div className="absolute right-0 w-2 h-2 bg-primary-container rounded-full" />

        {/* Hidden range input for interaction */}
        <input
          type="range"
          min="0.8"
          max="1.2"
          step="0.01"
          value={value}
          onChange={handleChange}
          className="absolute w-full h-full opacity-0 cursor-pointer z-10"
          aria-label="Velocidad de reproducción"
        />
      </div>
    </div>
  );
}
