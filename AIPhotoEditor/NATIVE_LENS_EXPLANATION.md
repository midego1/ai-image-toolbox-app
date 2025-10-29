# Using Native Camera Lenses (No Digital Zoom)

## How Native Lenses Work in expo-camera

In expo-camera, there are **two separate mechanisms** for zoom:

1. **`selectedLens`** - Switches between **physical camera lenses** (native/optical zoom)
2. **`zoom`** - Applies **digital zoom** by cropping/enlarging the current lens view

### Key Principle: **Never use both together**

When you use `selectedLens` to switch to a native physical lens, you should **always set `zoom={0}`** to avoid digital zoom.

## Why 0.5x Works But 1x and 2x Don't

### ✅ **0.5x (Ultra-Wide) - Works Correctly**
- Switches to `builtInUltraWideCamera` (physical lens)
- Sets `zoom={0}` (no digital zoom)
- Result: **Pure native 0.5x optical zoom** ✅

### ⚠️ **1x (Standard/Wide) - May Behave Differently**
- Switches to `builtInWideAngleCamera` (physical lens)
- Sets `zoom={0}` (no digital zoom)
- **Issue**: The "standard" lens might not be exactly 1x by default on some devices
- It's a native lens, but the actual zoom factor may vary slightly

### ❌ **2x (Telephoto) - Uses Digital Zoom**
- Switches to `builtInTelephotoCamera` (physical lens)
- Sets `zoom={0}` (intended for no digital zoom)
- **Problem**: Most telephoto lenses are **natively 2.5x to 3x**, not 2x
- When you want "2x", the camera may be:
  - Either digitally zooming OUT from 3x to 2x (cropping)
  - Or digitally zooming from the standard lens to achieve 2x
  
## The Solution: Pure Native Lens Usage

### Current Implementation (Correct Approach)

```typescript
const handleZoomPress = (zoom: number) => {
  if (zoom === 0.5 && availableLenses.includes('ultra-wide')) {
    setSelectedLens('ultra-wide');
    setZoomLevel(0); // ✅ Native lens, no digital zoom
  } else if (zoom === 1) {
    setSelectedLens('standard');
    setZoomLevel(0); // ✅ Native lens, no digital zoom
  } else if (zoom === 2 && availableLenses.includes('telephoto')) {
    setSelectedLens('telephoto');
    setZoomLevel(0); // ✅ Native lens - but telephoto is naturally 2.5x-3x
  }
};
```

### CameraView Props

```tsx
<CameraView 
  zoom={zoomLevel}  // Always 0 when using native lenses
  selectedLens={availableLensIdentifiers[selectedLens] || undefined}
  // When selectedLens is set, zoom should be 0
  // zoom prop is only for digital zoom on current lens
/>
```

## Understanding the Difference

| Method | What It Does | Quality | Use Case |
|--------|--------------|---------|----------|
| **`selectedLens`** | Switches physical camera lens | **Optical quality** ✅ | Use different lenses (ultra-wide, wide, telephoto) |
| **`zoom` prop** | Digitally zooms current lens | **Digital crop** ❌ | Zoom within current lens (reduces quality) |

## Best Practices

1. **Always set `zoom={0}` when using `selectedLens`**
   - This ensures pure optical zoom, no digital cropping

2. **Accept native lens zoom factors**
   - Ultra-wide: ~0.5x (works perfectly)
   - Wide: ~1x (varies by device)
   - Telephoto: ~2.5x-3x (NOT exactly 2x!)
   
3. **Don't force exact zoom values**
   - If telephoto is naturally 3x, accept 3x
   - Don't use digital zoom to force it to 2x
   - Label buttons accurately (show actual native zoom if possible)

4. **Only use `zoom` prop for smooth zoom within a lens**
   - Example: Pinch-to-zoom from 1x to 1.5x on standard lens
   - But never combine with `selectedLens` changes

## Why Telephoto Shows "Digital Zoom"

The telephoto lens on most devices (iPhone, etc.) is **natively 2.5x to 3x**. When you:
- Select telephoto lens (`selectedLens="builtInTelephotoCamera"`)
- Set `zoom={0}`

You get the **native telephoto view** (2.5x-3x), not 2x. The camera might then crop/digitally zoom to show "2x" if that's what's requested, which is why it feels like digital zoom.

## Recommendation

If you want pure native lenses with NO digital zoom:
- ✅ Keep `zoom={0}` always (already implemented)
- ✅ Accept that telephoto is naturally 2.5x-3x
- ✅ Update UI to show actual native zoom factors if possible
- ✅ Don't try to force telephoto to exactly 2x using digital zoom


