# Remove Background Page - ASCII Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      SAFE AREA VIEW                          │
│                  (backgroundSecondary)                       │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    HEADER                            │    │
│  │  [←]  Remove Background                             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              IMAGE PREVIEW SECTION                    │    │
│  │  ┌──────┐  ┌────────────────────────────────────┐   │    │
│  │  │      │  │  Your Photo                         │   │    │
│  │  │ [📷] │  │  Tap to view larger • Ready to      │   │    │
│  │  │      │  │  process                            │   │    │
│  │  │ [⚪] │  │                                     │   │    │
│  │  └──────┘  └────────────────────────────────────┘   │    │
│  │   80x80                                               │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │            EXPLANATION CARD #1                        │    │
│  │  ┌─────────────────────────────────────────────────┐ │    │
│  │  │ [✂️] Remove Background                          │ │    │
│  │  │                                                 │ │    │
│  │  │ Automatically detect and remove the            │ │    │
│  │  │ background from your photo, keeping the main   │ │    │
│  │  │ subject intact. Perfect for creating clean,    │ │    │
│  │  │ professional images ready for use in designs,   │ │    │
│  │  │ social media posts, or presentations.           │ │    │
│  │  │                                                 │ │    │
│  │  │ The result will have a transparent background, │ │    │
│  │  │ making it easy to place your subject on any     │ │    │
│  │  │ background or use in various design            │ │    │
│  │  │ compositions.                                   │ │    │
│  │  └─────────────────────────────────────────────────┘ │    │
│  │  Border: colors.border                                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │            EXPLANATION CARD #2                        │    │
│  │  ┌─────────────────────────────────────────────────┐ │    │
│  │  │ [✨] About the Model                             │ │    │
│  │  │                                                 │ │    │
│  │  │ This feature uses a state-of-the-art deep       │ │    │
│  │  │ learning model powered by advanced neural       │ │    │
│  │  │ networks. The AI analyzes your image using      │ │    │
│  │  │ semantic segmentation to distinguish between    │ │    │
│  │  │ the main subject and background elements.       │ │    │
│  │  │                                                 │ │    │
│  │  │ The model automatically detects edges, fine     │ │    │
│  │  │ details, and complex shapes like hair or        │ │    │
│  │  │ transparent objects, creating a precise mask    │ │    │
│  │  │ around your subject for professional-quality    │ │    │
│  │  │ results.                                        │ │    │
│  │  └─────────────────────────────────────────────────┘ │    │
│  │  Border: colors.primary + '40' (tinted)               │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│                                                               │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │            PROCESS BUTTON                            │    │
│  │  ┌─────────────────────────────────────────────────┐ │    │
│  │  │    [ Process Remove Background ]                │ │    │
│  │  └─────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  FULL-SCREEN MODAL                           │
│              (when image preview is tapped)                   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                                                       │    │
│  │              [   LARGE IMAGE PREVIEW   ]             │    │
│  │                                                       │    │
│  │              (Centered, with padding)                 │    │
│  │                                                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│                                                       ┌─────┐ │
│                                                       │ 💡  │ │
│                                                       │ Tap │ │
│                                                       │anywh│ │
│                                                       │ere  │ │
│                                                       │close│ │
│                                                       └─────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Component Structure

### Main Screen
- **SafeAreaView** - Container with `backgroundSecondary`
- **Header** - Back button + "Remove Background" title
- **Image Preview** - Thumbnail (80x80) with expand icon + text info
- **Card 1** - "Remove Background" explanation (cut icon)
- **Card 2** - "About the Model" explanation (sparkles icon)
- **Process Button** - Primary action button at bottom

### Modal (Overlay)
- **Full-screen dark overlay** - 96% black opacity
- **Centered image** - Large preview with rounded corners
- **Hint bubble** - Bottom hint to tap anywhere to close

## Visual Differences

### Card 1 (Remove Background)
- Icon: ✂️ `cut-outline`
- Border: `colors.border` (standard)
- Content: Feature benefits and use cases

### Card 2 (About the Model)
- Icon: ✨ `sparkles-outline`
- Border: `colors.primary + '40'` (tinted/accented)
- Content: Technical explanation of how it works


