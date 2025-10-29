# Front-Facing Camera Flash Implementation Guide

## Overview

Since front-facing cameras don't have physical flash, we implement a **screen flash** feature that:
1. Temporarily maximizes screen brightness
2. Displays a white overlay during photo capture
3. Provides adequate lighting for selfies in low-light conditions

## Implementation Approach

### Method 1: Using the Custom Hook (Recommended)

The `useScreenFlash` hook provides a clean, reusable solution.

### Method 2: Manual Implementation

For more control, you can manually manage brightness and overlay.

---

## Step 1: Install Dependencies (Optional but Recommended)

For the best experience, install `expo-brightness`:

```bash
npx expo install expo-brightness
```

**Note:** The utility will work without this package, but will only show a white overlay without adjusting brightness.

---

## Step 2: Integration into CameraScreen

Here's how to modify your `CameraScreen.tsx`:

### Import the Hook

```typescript
import { useScreenFlash } from '../utils/screenFlash';
```

### Add Hook to Component

```typescript
const CameraScreen = () => {
  // ... existing code ...
  const [facing, setFacing] = useState<CameraType>('back');
  const { triggerFlash, FlashOverlay } = useScreenFlash({
    flashDuration: 150, // Adjust as needed
  });
  
  // ... rest of component ...
}
```

### Modify takePicture Function

Update your `takePicture` function to trigger flash when using front camera:

```typescript
const takePicture = async () => {
  if (cameraRef.current) {
    try {
      haptic.medium();
      
      // Trigger flash for front-facing camera
      if (facing === 'front') {
        await triggerFlash();
      }
      
      // Small delay to ensure flash is visible during capture
      if (facing === 'front') {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: true
      });
      
      if (photo?.uri) {
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          photo.uri,
          [],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        haptic.success();
        handleImageSelected(manipulatedImage.uri);
      }
    } catch (error) {
      haptic.error();
      Alert.alert('Error', 'Failed to take picture');
    }
  }
};
```

### Add Flash Overlay to JSX

Add the `FlashOverlay` component to your camera view:

```typescript
return (
  <View style={[styles.container, { backgroundColor: colors.background }]}>
    <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        {/* ... existing UI ... */}
      </SafeAreaView>
      
      {/* Add Flash Overlay */}
      <FlashOverlay />
    </CameraView>
  </View>
);
```

---

## Step 3: Complete Example

Here's a complete modified `takePicture` function with better timing:

```typescript
const takePicture = async () => {
  if (cameraRef.current) {
    try {
      haptic.medium();
      
      let flashPromise: Promise<void> | null = null;
      
      // Start flash BEFORE capturing if front camera
      if (facing === 'front') {
        flashPromise = triggerFlash();
        // Give flash a moment to start before capture
        await new Promise(resolve => setTimeout(resolve, 30));
      }
      
      // Capture photo while flash is active
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: true
      });
      
      // Ensure flash completes
      if (flashPromise) {
        await flashPromise;
      }
      
      if (photo?.uri) {
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          photo.uri,
          [],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        haptic.success();
        handleImageSelected(manipulatedImage.uri);
      }
    } catch (error) {
      haptic.error();
      Alert.alert('Error', 'Failed to take picture');
    }
  }
};
```

---

## Alternative: Flash Toggle Button (Optional)

You might want to add a flash toggle button that shows flash state:

```typescript
const [flashEnabled, setFlashEnabled] = useState(true); // Default enabled

// In your bottomBar, add flash button:
<IconButton
  name={flashEnabled ? "flash" : "flash-off"}
  onPress={() => setFlashEnabled(!flashEnabled)}
  size={26}
  color="#FFFFFF"
  backgroundColor="rgba(0, 0, 0, 0.5)"
  style={styles.cameraControl}
/>

// Modify takePicture to check flashEnabled:
if (facing === 'front' && flashEnabled) {
  await triggerFlash();
}
```

---

## Customization Options

### Adjust Flash Duration

```typescript
const { triggerFlash, FlashOverlay } = useScreenFlash({
  flashDuration: 200, // Longer flash (default: 150ms)
  brightnessRestoreDelay: 150, // Delay before restoring brightness
});
```

### Color Temperature Adjustment

For warmer, more natural light, modify the overlay color in `screenFlash.ts`:

```typescript
// Instead of pure white (#FFFFFF), use a warm white:
backgroundColor: '#FFF9E6', // Warm white
// or
backgroundColor: '#F5F5DC', // Beige white
```

---

## Platform Considerations

### iOS
- Screen brightness control works well
- White overlay provides good lighting
- Consider using a slightly warmer color temperature

### Android
- Brightness control may require special permissions on some devices
- Screen flash is very effective
- Test on various Android versions/devices

---

## Performance Tips

1. **Battery Impact**: Screen flash uses battery, but the brief duration minimizes impact
2. **Timing**: Start flash slightly before capture (~30ms) for best results
3. **User Experience**: Add visual feedback (button state) if implementing toggle
4. **Fallback**: If brightness control fails, overlay-only still provides some benefit

---

## Testing Checklist

- [ ] Front camera flash triggers correctly
- [ ] Brightness restores to original value
- [ ] Flash overlay appears and disappears smoothly
- [ ] Back camera is unaffected (no flash triggered)
- [ ] Works in various lighting conditions
- [ ] No performance issues or battery drain
- [ ] Flash timing aligns with photo capture

---

## Troubleshooting

### Flash not bright enough
- Ensure `expo-brightness` is installed
- Check device brightness permissions
- Increase flash duration

### Brightness not restoring
- Check console for errors
- Verify `expo-brightness` installation
- The utility has fallback logic to restore default brightness

### Timing issues
- Adjust the delay before capture (try 20-50ms)
- Modify `flashDuration` in hook options
- Ensure flash starts before `takePictureAsync` is called

---

## Additional Enhancements (Future)

1. **Adaptive Flash**: Adjust intensity based on ambient light
2. **Flash Mode Toggle**: Auto/On/Off options
3. **Color Temperature Presets**: Cool/Warm/Natural options
4. **Flash Preview**: Show flash effect in preview before capture

