# Product Requirements Document (PRD)

## 1. Project Objective

Develop a functional responsive web prototype that simulates the main behavior of a flamenco music study mobile app. The prototype will be used for:

- Product validation
- Functional demonstration
- User testing

**This is NOT a final product.**

## 2. Scope

### 2.1 In Scope

- Responsive web app (mobile-first)
- 2 predefined playlists with audio tracks
- Audio player with synchronized dual-track playback
- Real-time guitar mute functionality
- Speed control (0.8x - 1.2x)
- Drag & drop track reordering
- Track deletion (temporary, per session)
- Loop single track
- PWA support ("Add to Home Screen")

### 2.2 Out of Scope (Explicitly Excluded)

- Native iOS/Android app
- Payment system
- User authentication/login
- Complex/scalable backend
- Advanced analytics
- Artificial intelligence
- Offline mode
- App store publication

## 3. Playlists & Tracks

### Playlist 1: Tablao, Soleá por Bulería (SxB)

| # | Track Name | Compases | Guitar Mute |
|---|------------|----------|-------------|
| 1 | Base Soléa por Bulerías x2 | 2 | ❌ |
| 2 | Salida de Cante Soleá por Bulería | 5 | ✅ |
| 3 | Base Soleá por Bulerías | 1 | ❌ |
| 4 | Dios te había dado sabiduría | 7 | ✅ |
| 5 | Falseta 1 Soleá por Bulería | 3 | ❌ |
| 6 | Cuando tú me eches de menos | 12 | ✅ |
| 7 | Base Soleá por Bulerías | 1 | ❌ |
| 8 | A pasar fatiga doble | 6 | ✅ |
| 9 | Cierre Final Guitarra Soleá por Bulería | 1 | ❌ |

### Playlist 2: Fiesta, Bulerías

| # | Track Name | Compases | Guitar Mute |
|---|------------|----------|-------------|
| 1 | Compases Base por Bulerías | 2 | ❌ |
| 2 | Águilas que vais volando + Sitio dónde te hablé | 24 | ✅ |
| 3 | Base por Bulerías | 1 | ❌ |
| 4 | Tiro piedras por la calle + Coletilla final | 17 | ✅ |
| 5 | Cierre Guitarra Bulerías | 1 | ❌ |

### Mutable Tracks Summary (6 total)

These tracks have separate guitar audio files:

1. Salida de Cante Soleá por Bulería
2. Dios te había dado sabiduría
3. Cuando tú me eches de menos
4. A pasar fatiga doble
5. Águilas que vais volando + Sitio dónde te hablé
6. Tiro piedras por la calle + Coletilla final

## 4. Functional Requirements

### 4.1 Audio Player

| Feature | Requirement |
|---------|-------------|
| Play/Pause | Start and stop playback |
| Track change | Manual selection from list |
| Auto-advance | Automatically play next track when current ends |
| Delete track | Remove from playlist (temporary, session only) |
| Reorder tracks | Drag & drop to change order |
| Loop track | Repeat current track continuously |
| Mute guitar | Toggle guitar audio on/off in real-time |
| Speed control | Slider from 0.8x to 1.2x, real-time change |

### 4.2 Mute Guitar Behavior

- Mute icon (waveform) visible only on mutable tracks
- Mute state persists during playback session
- If a track was muted, it remains muted when playlist loops
- User can mute multiple tracks simultaneously
- Mute button disabled/hidden on non-mutable tracks

### 4.3 Speed Control

- Slider control (not buttons)
- Range: approximately 0.8x to 1.2x
- Gradual change without audio cuts
- Real-time adjustment (no need to pause)
- Speed change applies to all tracks equally
- Must maintain sync between guitar and cante/palmas tracks

### 4.4 Track Deletion

- Trash button removes track from current playlist view
- Deletion is temporary (not persistent)
- Playlist resets to default when:
  - User refreshes page
  - User changes to different playlist
  - User returns to home menu

### 4.5 Playlist Loop

- When playlist reaches end, it loops back to first track
- Loop continues until user:
  - Pauses playback
  - Changes playlist
  - Leaves the browser

### 4.6 Navigation

- Simple navigation between screens per Figma design
- No complex animations
- Priority: fluidity and stability
- Only functional navigation elements:
  - Playlist cards (home → player)
  - Headphones icon (anywhere → home)
  - Hamburger menu icon (decorative in prototype)

## 5. Non-Functional Requirements

### 5.1 Performance

- Fast initial load
- No audio blocking or freezing
- No playback errors
- Perfect sync between dual audio tracks
- Basic player functions must work without errors

### 5.2 Responsiveness

- Mobile-first design
- Desktop version functional but no advanced adaptation
- Must work on iOS Safari and Android Chrome

### 5.3 Code Quality

- Clean, readable code
- Stable functionality
- Demonstrable prototype
- No visible temporary hacks

## 6. Deliverables

1. Complete source code
2. GitHub/GitLab repository access
3. Functional prototype URL (deployed)
4. Basic deployment instructions

## 7. Acceptance Criteria

The prototype is considered complete when ALL of the following are true:

- [ ] All described functionalities work correctly
- [ ] Interface matches Figma design faithfully
- [ ] Prototype is usable on mobile and desktop without playback issues
- [ ] No critical errors that prevent normal use
- [ ] Client can access prototype via functional URL
- [ ] Complete source code delivered
