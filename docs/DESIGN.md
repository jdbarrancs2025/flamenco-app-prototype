# Design Document

## 1. Design System

### 1.1 Typography

```css
/* Font Family */
font-family: 'Inter', sans-serif;

/* Title - Screen headers */
font-weight: 600;
font-size: 20px;
line-height: 140%;
letter-spacing: -0.02em;

/* Card Title */
font-weight: 600;
font-size: 28px;
line-height: 120%;
letter-spacing: -0.02em;

/* Body/Track Name */
font-weight: 500;
font-size: 14px;
line-height: 140%;

/* Caption/Subtitle */
font-weight: 500;
font-size: 12px;
line-height: 150%;

/* Pill Text */
font-weight: 500;
font-size: 14px;
line-height: 140%;
```

### 1.2 Colors

```css
/* Primary */
--color-primary: #6750A4;           /* Purple - slider, active track */
--color-primary-container: #E8DEF8; /* Light purple - slider inactive */

/* Neutral */
--color-black: #000000;
--color-white: #FFFFFF;
--color-gray-text: #828282;
--color-gray-border: #E0E0E0;
--color-gray-bg: #F6F6F6;

/* Surface */
--color-surface: #FFFFFF;
--color-on-surface: #1D1B20;

/* Pill Active */
--color-pill-active-bg: rgba(0, 0, 0, 0.9);
--color-pill-active-text: #FFFFFF;

/* Pill Inactive */
--color-pill-inactive-bg: #F6F6F6;
--color-pill-inactive-text: #000000;
```

### 1.3 Spacing & Sizing

```css
/* Base unit: 4px */
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 12px;
--spacing-lg: 16px;
--spacing-xl: 24px;

/* Border Radius */
--radius-sm: 8px;     /* Cards, lists */
--radius-full: 20px;  /* Pills */
--radius-slider: 16px;/* Slider ends */

/* Mobile Viewport */
--viewport-width: 375px;
--viewport-height: 812px;
```

## 2. Screens

### 2.1 Home Screen (Menú de Inicio)

```
┌─────────────────────────────────┐
│  ≡        Menú de Inicio        │  Header
├─────────────────────────────────┤
│ [Mixer] [Plantillas] [Progreso] │  Pills (only Mixer active)
│           • • •                 │
├─────────────────────────────────┤
│ ┌─────────┐  ┌─────────┐        │
│ │  SxB    │  │ Bulerías│        │  Playlist Cards
│ │ Tablao  │  │  Fiesta │        │
│ └─────────┘  └─────────┘        │
│                                 │
│                                 │
│                                 │  (Empty space)
│                                 │
│                                 │
├─────────────────────────────────┤
│  ✧   Q   🎧   📖   +           │  Tab Bar (only 🎧 functional)
└─────────────────────────────────┘
```

**Elements:**
- Header with hamburger menu (decorative) and title
- Pills navigation (only "Mixer" is functional)
- 2 Playlist cards (clickable → navigate to player)
- Tab bar (only headphones icon is functional → returns home)

### 2.2 Player Screen (Reproductor)

```
┌─────────────────────────────────┐
│  ≡       Nivel Intermedio       │  Header
├─────────────────────────────────┤
│ [Mixer] [Plantillas] [Progreso] │  Pills
│           • • •                 │
├─────────────────────────────────┤
│ ████████████░░░░░░░░░░░░░░░░░○ │  Speed Slider (0.8x - 1.2x)
├─────────────────────────────────┤
│   🗑    ∿    ▶    ⤨    ⟳       │  Controls
│                  ╲              │  (shuffle has line through)
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ Reproductor: Tablao, SxB    │ │  Playlist container
│ │                             │ │
│ │ Track Name (active)    ∿    │ │  Track list (scrollable)
│ │ X compases                  │ │
│ │                             │ │
│ │ Track Name                  │ │
│ │ X compases                  │ │
│ │         ...                 │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│  ✧   Q   🎧   📖   +           │  Tab Bar
└─────────────────────────────────┘
```

**Elements:**
- Header with title "Nivel Intermedio"
- Pills (same as home, only Mixer active)
- Speed slider (purple gradient)
- Control buttons: Delete | Mute Guitar | Play/Pause | Shuffle (disabled) | Repeat
- Track list container with title "Reproductor: [Playlist Name]"
- Scrollable track list
- Tab bar

## 3. Components

### 3.1 Header

```css
.header {
  position: relative;
  width: 100%;
  height: 56px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header__menu-icon {
  position: absolute;
  left: 16px;
  /* 3 horizontal lines */
}

.header__title {
  font-weight: 600;
  font-size: 20px;
  line-height: 140%;
  text-align: center;
  letter-spacing: -0.02em;
  color: #000000;
}
```

### 3.2 Pills Navigation

```css
.pills {
  display: flex;
  flex-direction: row;
  gap: 12px;
  padding: 0 16px;
}

.pill {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 6px 14px;
  border-radius: 20px;
  font-weight: 500;
  font-size: 14px;
  line-height: 140%;
}

.pill--active {
  background: rgba(0, 0, 0, 0.9);
  color: #FFFFFF;
}

.pill--inactive {
  background: #F6F6F6;
  color: #000000;
}
```

### 3.3 Playlist Card

```css
.playlist-card {
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 8px;
  width: 171px;
  height: 92px;
  background: #FFFFFF;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  cursor: pointer;
}

.playlist-card__title {
  font-weight: 600;
  font-size: 28px;
  line-height: 120%;
  letter-spacing: -0.02em;
  color: #000000;
}

.playlist-card__subtitle {
  font-weight: 500;
  font-size: 12px;
  line-height: 150%;
  color: #828282;
}
```

### 3.4 Speed Slider

```css
.speed-slider {
  display: flex;
  align-items: center;
  width: 100%;
  height: 44px;
  padding: 0 11px;
}

.speed-slider__track {
  flex: 1;
  height: 16px;
  display: flex;
}

.speed-slider__active {
  background: #6750A4;
  border-radius: 16px 2px 2px 16px;
}

.speed-slider__handle {
  width: 4px;
  height: 44px;
  background: #6750A4;
  border-radius: 2px;
}

.speed-slider__inactive {
  background: #E8DEF8;
  border-radius: 2px 16px 16px 2px;
}
```

### 3.5 Player Controls

```css
.player-controls {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0 30px;
  height: 64px;
}

.player-controls__button {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
}

.player-controls__play {
  width: 61px;
  height: 64px;
}

/* Shuffle button with strikethrough */
.player-controls__shuffle--disabled {
  position: relative;
}

.player-controls__shuffle--disabled::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 1px;
  background: #000000;
  transform: rotate(-45deg);
}
```

### 3.6 Track List

```css
.track-list {
  background: #FFFFFF;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  margin: 0 22px;
  overflow: hidden;
}

.track-list__header {
  padding: 16px;
  font-weight: 600;
  font-size: 14px;
  line-height: 140%;
  color: #000000;
}

.track-list__items {
  max-height: 400px;
  overflow-y: auto;
  padding: 0 16px;
}
```

### 3.7 Track Item

```css
.track-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  gap: 12px;
  border-radius: 8px;
}

.track-item__info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.track-item__name {
  font-weight: 500;
  font-size: 14px;
  line-height: 140%;
  color: #000000;
}

.track-item__name--active {
  color: #6750A4;
}

.track-item__compases {
  font-weight: 400;
  font-size: 12px;
  line-height: 150%;
  color: #828282;
}

.track-item__mute-icon {
  width: 34px;
  height: 19px;
  /* Waveform icon */
}
```

### 3.8 Tab Bar

```css
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 83px;
  background: #FFFFFF;
  box-shadow: 0px -0.5px 0px rgba(0, 0, 0, 0.1);
}

.tab-bar__tabs {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 49px;
  padding: 0 16px;
}

.tab-bar__item {
  width: 48px;
  height: 48px;
  opacity: 0.5;
  cursor: default; /* Not clickable */
}

.tab-bar__item--active {
  opacity: 1;
  cursor: pointer;
}

.tab-bar__home-indicator {
  width: 134px;
  height: 5px;
  background: #000000;
  border-radius: 100px;
  margin: 8px auto;
}
```

## 4. Icons Required

| Icon | Usage | Notes |
|------|-------|-------|
| Menu (hamburger) | Header | 3 horizontal lines |
| Headphones | Tab bar | Home button (functional) |
| Search | Tab bar | Decorative |
| Book | Tab bar | Decorative |
| Stars | Tab bar | Decorative |
| Plus | Tab bar | Decorative |
| More (ellipsis) | Pills area | 3 dots |
| Trash | Player controls | Delete track |
| Waveform | Player controls & track item | Mute guitar |
| Play | Player controls | Triangle |
| Pause | Player controls | Two vertical bars |
| Shuffle | Player controls | Crossed arrows with line through |
| Repeat | Player controls | Loop arrows |

## 5. Interactions

### 5.1 Playlist Card → Player
- Tap card → Navigate to playlist player view
- No animation required

### 5.2 Play/Pause
- Tap → Toggle playback state
- Icon changes between play/pause

### 5.3 Track Selection
- Tap track → Start playing that track
- Active track name turns purple (#6750A4)

### 5.4 Guitar Mute
- Tap waveform icon (in controls or on track) → Toggle mute
- Visual indication when muted (e.g., icon style change)

### 5.5 Speed Slider
- Drag handle → Adjust playback speed
- Real-time audio speed change

### 5.6 Track Reorder (Drag & Drop)
- Long press/drag track → Reorder
- Minimal animation on drop
- Order applies after drop completes

### 5.7 Delete Track
- Select track + tap trash → Remove from list
- Track disappears from list
- Resets on page refresh

### 5.8 Loop Toggle
- Tap repeat icon → Toggle single track loop
- Visual indication when active

## 6. Responsive Behavior

- **Mobile (< 768px)**: Primary design, follow Figma exactly
- **Desktop (≥ 768px)**: Center content, max-width ~500px, maintain mobile layout

```css
@media (min-width: 768px) {
  .app-container {
    max-width: 500px;
    margin: 0 auto;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
    min-height: 100vh;
  }
}
```
