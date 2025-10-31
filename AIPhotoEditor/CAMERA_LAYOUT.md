# Camera Screen Layout (ASCII Diagram)

```
┌─────────────────────────────────────────────────────────────┐
│                         CAMERA VIEW                          │
│                  (Full screen - tappable for focus)          │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    TOP BAR                            │   │
│  │                                                         │   │
│  │  [←]  ← Back (only when navigated from feature)      │   │
│  │          [⚡] ← Flash Toggle (top right)              │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│                                                               │
│                  CAMERA PREVIEW AREA                          │
│                                                               │
│                        (tap to focus)                         │
│                                                               │
│                                                               │
│                                                               │
│                                                               │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              ZOOM/LENS BUTTONS (if available)          │   │
│  │                                                         │   │
│  │         [0.5x]  [ 1x ]  [ 2x ]                        │   │
│  │         (UW)    (Std)   (Tele)                        │   │
│  │         ↑ Active: Gold color                           │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  BOTTOM BAR                            │   │
│  │                                                         │   │
│  │  [📷]          [  ●  ]          [⟲]                   │   │
│  │  ↑              ↑                ↑                     │   │
│  │ Library      Shutter         Switch                    │   │
│  │ Button        Button         Camera                    │   │
│  │ (60x60)       (80x80)          (26px)                   │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│            ↓ 15% bottom padding (dynamic) ↓                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘

```

## Component Layout Details:

### Top Bar
- **Left side**: Back button (`chevron-back`) - Only visible when navigated from a feature
- **Right side**: Flash toggle button (`flash-off`/`flash`/`flash-outline`)
  - Gold color when active

### Zoom/Lens Buttons (Above Shutter)
- Only shown when multiple lenses are available
- Physical lenses only:
  - **0.5x** = Ultra-wide (if available)
  - **1x** = Standard
  - **2x** = Telephoto (if available)
- Active button highlighted in gold (#FFD700)
- Circular buttons with rounded corners (borderRadius: 25)
- Spacing above shutter button

### Bottom Bar
- **Left**: Library button
  - Shows latest photo thumbnail (60x60) if available
  - Or images icon placeholder
  - Opens image picker on tap
  
- **Center**: Shutter button
  - Large circular button (80x80)
  - Outer ring with inner circle
  - Captures photo
  
- **Right**: Switch camera button
  - Toggles between front and back camera
  - Icon: `camera-reverse`

### Interactive Features
- **Tap-to-focus**: Tap anywhere on camera view to focus
- **Screen flash**: White overlay flashes for front camera when flash is on/auto
- **Haptic feedback**: All button presses provide haptic feedback

### Modal (After Capture)
- Feature selector modal appears after taking a photo or selecting from library
- Only shown when accessed from Camera tab (no editMode in route)
- When accessed from feature (with editMode), goes directly to processing



