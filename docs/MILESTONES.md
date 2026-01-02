# Development Milestones

## Overview

| Milestone | Duration | Payment | Focus |
|-----------|----------|---------|-------|
| 1 | Week 1 | $276 USD | Base structure & UI |
| 2 | Week 2 | $391 USD | Audio logic & controls |
| 3 | Week 3 | $276 USD | Stabilization & delivery |
| **Total** | **3 weeks** | **$943 USD** | |

---

## Milestone 1: Base Structure (Week 1)

### Deliverables

1. **Project Setup**
   - [ ] Vite + React + TypeScript initialized
   - [ ] Folder structure created
   - [ ] Basic routing configured
   - [ ] PWA manifest.json added

2. **Responsive Web App**
   - [ ] Mobile-first layout
   - [ ] Works on iOS Safari
   - [ ] Works on Android Chrome
   - [ ] Basic desktop view (centered, max-width)

3. **Navigation per Figma**
   - [ ] Home screen
   - [ ] Playlist/Player screen
   - [ ] Navigation between screens works
   - [ ] Header component
   - [ ] Tab bar component (only headphones icon functional)
   - [ ] Pills component (only Mixer active)

4. **Player Visible & Integrated**
   - [ ] Speed slider (visual only, can be non-functional)
   - [ ] Control buttons layout (trash, mute, play, shuffle, repeat)
   - [ ] Track list container
   - [ ] Scrollable track list

5. **Playlist Structure**
   - [ ] Playlist data defined in code
   - [ ] Both playlists accessible
   - [ ] Track data with all metadata
   - [ ] Playlist cards on home screen

### Acceptance Criteria

- [ ] User can navigate from Home to Playlist 1
- [ ] User can navigate from Home to Playlist 2
- [ ] User can return to Home via headphones icon
- [ ] All screens match Figma design
- [ ] Responsive on mobile devices
- [ ] No console errors

### Technical Notes

- Focus on getting the visual structure right
- Audio can be placeholder or non-functional
- Concentrate on CSS matching Figma exactly

---

## Milestone 2: Audio Logic & Controls (Week 2)

### Deliverables

1. **Audio Playback**
   - [ ] Web Audio API integration
   - [ ] Audio files load correctly
   - [ ] Single track plays
   - [ ] Dual track sync (for mutable tracks)
   - [ ] Playback without glitches

2. **Player Controls**
   - [ ] Play/Pause toggle
   - [ ] Track selection from list
   - [ ] Auto-advance to next track
   - [ ] Track end detection

3. **Drag & Drop Reordering**
   - [ ] Grab area visible on tracks
   - [ ] Drag animation
   - [ ] Drop to new position
   - [ ] Order updates after drop

4. **Loop Single Track**
   - [ ] Repeat button toggles loop mode
   - [ ] Visual indication when active
   - [ ] Track loops correctly

5. **Guitar Mute**
   - [ ] Mute icon on mutable tracks
   - [ ] Click toggles mute state
   - [ ] Mute applies in real-time
   - [ ] Visual indication when muted
   - [ ] Mute button in controls area
   - [ ] Mute state persists during playback
   - [ ] Mute state persists on playlist loop

6. **Speed Control (Tempo)**
   - [ ] Slider functional
   - [ ] Range 0.8x to 1.2x
   - [ ] Real-time speed change
   - [ ] Both tracks change speed together
   - [ ] No audio glitches on change

### Acceptance Criteria

- [ ] User can play/pause audio
- [ ] User can select any track to play
- [ ] Playlist auto-advances through all tracks
- [ ] User can reorder tracks via drag & drop
- [ ] User can loop a single track
- [ ] User can mute guitar on mutable tracks
- [ ] Mute state persists correctly
- [ ] User can change playback speed
- [ ] Speed change doesn't break sync
- [ ] Works on iOS Safari
- [ ] Works on Android Chrome

### Technical Notes

- This is the most complex milestone
- Test audio sync thoroughly
- Test on real mobile devices, not just simulators
- Speed change is the trickiest part

---

## Milestone 3: Stabilization & Final Delivery (Week 3)

### Deliverables

1. **Bug Fixes**
   - [ ] All reported bugs fixed
   - [ ] Edge cases handled
   - [ ] Error states handled gracefully

2. **Visual Adjustments**
   - [ ] Final Figma alignment check
   - [ ] Pixel-perfect where possible
   - [ ] Consistent spacing
   - [ ] All icons correct

3. **Track Deletion**
   - [ ] Trash button deletes selected/current track
   - [ ] Track removed from list
   - [ ] Playback continues correctly
   - [ ] Reset on refresh/playlist change

4. **Playlist Behavior**
   - [ ] Playlist loops at end
   - [ ] Mute states preserved on loop
   - [ ] Deletion states reset correctly

5. **PWA**
   - [ ] manifest.json complete
   - [ ] "Add to Home Screen" works on iOS
   - [ ] "Add to Home Screen" works on Android
   - [ ] App icons provided

6. **Final Deliverables**
   - [ ] Source code complete
   - [ ] GitHub repository access
   - [ ] Deployed to Vercel (or similar)
   - [ ] Functional URL provided
   - [ ] Basic deployment instructions

### Acceptance Criteria

- [ ] All Milestone 1 & 2 criteria still pass
- [ ] Track deletion works correctly
- [ ] No critical bugs
- [ ] Playlist loops correctly
- [ ] PWA installable
- [ ] Interface matches Figma exactly
- [ ] Code is clean and maintainable
- [ ] Deployed and accessible

### Technical Notes

- Focus on polish and stability
- Test complete user flows
- Document any quirks or limitations

---

## Development Order Recommendation

### Week 1 Priority Order

1. Project setup & folder structure
2. Routing (Home ↔ Playlist)
3. Home screen UI
4. Playlist/Player screen layout
5. Track list component
6. Tab bar & Header
7. Responsive adjustments

### Week 2 Priority Order

1. **Audio engine first** (this is critical path)
2. Basic play/pause
3. Dual-track sync
4. Speed control
5. Guitar mute
6. Track selection
7. Auto-advance
8. Loop
9. Drag & drop

### Week 3 Priority Order

1. Track deletion
2. Bug fixes from testing
3. Visual polish
4. PWA setup
5. Deployment
6. Documentation

---

## Risk Mitigation

### High Risk: Audio Sync

**Mitigation**: Start audio engine development on Day 1 of Week 2. If issues arise, there's buffer time.

### Medium Risk: iOS Safari

**Mitigation**: Test on real iOS device early. Don't rely only on Chrome DevTools mobile simulation.

### Medium Risk: Drag & Drop

**Mitigation**: Use a library like `@dnd-kit/core` or `react-beautiful-dnd` instead of building from scratch.

### Low Risk: Visual Matching

**Mitigation**: CSS is provided from Figma. Apply systematically.

---

## Testing Checklist (Before Each Milestone Submission)

### Milestone 1

```
[ ] Home screen displays correctly
[ ] Both playlist cards visible
[ ] Click card → navigates to player
[ ] Player screen displays correctly
[ ] Track list visible
[ ] Controls visible
[ ] Click headphones → returns home
[ ] Mobile responsive
[ ] No console errors
```

### Milestone 2

```
[ ] All Milestone 1 checks pass
[ ] Audio plays
[ ] Play/Pause works
[ ] Track selection works
[ ] Auto-advance works
[ ] Speed slider works (test 0.8x, 1.0x, 1.2x)
[ ] Guitar mute works
[ ] Mute persists on loop
[ ] Drag & drop reorder works
[ ] Loop single track works
[ ] Test on iOS Safari (real device)
[ ] Test on Android Chrome (real device)
```

### Milestone 3

```
[ ] All Milestone 1 & 2 checks pass
[ ] Track deletion works
[ ] Deletion resets on refresh
[ ] Deletion resets on playlist change
[ ] Playlist loops correctly
[ ] PWA installable on iOS
[ ] PWA installable on Android
[ ] Deployed URL works
[ ] Code pushed to repo
[ ] README with instructions
```
