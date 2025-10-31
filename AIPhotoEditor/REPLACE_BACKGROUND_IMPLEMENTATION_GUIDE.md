# Replace Background AI Tool - Implementation Guide

## Overview

This guide outlines how to implement the **Replace Background** tool following the same design patterns and architecture as the Remove Background and Remove Object tools.

## Current Status

✅ **Already Configured:**
- Edit mode defined in `src/constants/editModes.ts` (marked as premium, subscription-only, requiresConfig)
- Navigation routing already includes REPLACE_BACKGROUND in `EditModeSelectionScreen.tsx`
- Type system supports it in `src/types/editModes.ts`

❌ **Still Needed:**
- Processor implementation (`ReplaceBackgroundProcessor`)
- UI in `ImagePreviewScreen` for background selection
- Registration in `ImageProcessingService`

---

## Architecture Overview

### Design Pattern Consistency

All AI tools follow this structure:

```
EditModeSelection
    ↓
ImageSelection (for tools that work on existing images)
    ↓
ImagePreview (shows image + collects config)
    ↓
Processing (shows loading state)
    ↓
Result (shows before/after)
```

### Processor Pattern

All processors extend `BaseProcessor` and implement:

```typescript
async process(imageUri: string, config?: EditModeConfig): Promise<TransformResponse>
```

---

## Implementation Steps

### 1. Create ReplaceBackgroundProcessor

**File:** `src/services/processors/replaceBackgroundProcessor.ts`

**Key Decisions:**

#### Option A: Two-Step Approach (Recommended)
1. First remove background (using rembg model like Remove Background)
2. Then composite subject onto new background (using nano-banana with multi-image)

**Pros:** More reliable, better subject extraction
**Cons:** Two API calls, higher cost

#### Option B: Single-Step Approach
Use nano-banana with image + prompt describing the new background

**Pros:** One API call, faster
**Cons:** May not extract subject as cleanly

#### Option C: Background Image Selection
Use multi-image transform: [original_image, background_image] → composite result

**Pros:** User can select any background image
**Cons:** Requires background image selection UI

**Recommended: Option A** for best quality, or **Option C** for flexibility.

**Implementation Template:**

```typescript
import { BaseProcessor } from './baseProcessor';
import { TransformResponse } from '../aiService';
import { AIService } from '../aiService';
import { EditModeConfig } from '../../types/editModes';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Replace Background Processor
 * Two-step: Remove background, then composite onto new background
 */
export class ReplaceBackgroundProcessor extends BaseProcessor {
  private static REPLICATE_API_KEY_STORAGE = 'replicate_api_key';
  private static REPLICATE_API_KEY_FALLBACK = 'YOUR_REPLICATE_API_KEY';
  private static REMBG_MODEL = 'cjwbw/rembg';
  
  private async getReplicateApiKey(): Promise<string> {
    // Same pattern as BackgroundRemovalProcessor
  }

  /**
   * Process background replacement
   * Config options:
   * - backgroundPrompt: string (text description of desired background)
   * - backgroundImageUri: string (optional: image to use as background)
   */
  async process(imageUri: string, config?: EditModeConfig): Promise<TransformResponse> {
    // Step 1: Remove background (similar to BackgroundRemovalProcessor)
    // Step 2: Composite subject onto new background using nano-banana
    
    const backgroundPrompt = config?.backgroundPrompt as string | undefined;
    const backgroundImageUri = config?.backgroundImageUri as string | undefined;
    
    if (!backgroundPrompt && !backgroundImageUri) {
      return this.createErrorResponse(
        'Please provide a background description or select a background image'
      );
    }
    
    // Implementation follows same pattern as other processors
  }
}
```

### 2. Register Processor in ImageProcessingService

**File:** `src/services/imageProcessingService.ts`

Add to `initializeProcessors()`:

```typescript
import { ReplaceBackgroundProcessor } from './processors/replaceBackgroundProcessor';

private static initializeProcessors(): void {
  if (this.processors.size === 0) {
    // ... existing processors ...
    this.processors.set(EditMode.REPLACE_BACKGROUND, new ReplaceBackgroundProcessor());
  }
}
```

### 3. Update ImagePreviewScreen UI

**File:** `src/screens/ImagePreviewScreen.tsx`

Add handling for `EditMode.REPLACE_BACKGROUND` similar to Remove Background/Remove Object:

**Add to state:**
```typescript
const isReplaceBackgroundMode = editMode === EditMode.REPLACE_BACKGROUND;
const [backgroundPrompt, setBackgroundPrompt] = useState('');
const [backgroundImageUri, setBackgroundImageUri] = useState<string | null>(null);
const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
```

**Update handleProcess:**
```typescript
const handleProcess = () => {
  if (isRemoveObjectMode && !removalPrompt.trim()) {
    Alert.alert('Missing Prompt', 'Please describe what you want to remove');
    return;
  }
  
  if (isReplaceBackgroundMode && !backgroundPrompt.trim() && !backgroundImageUri) {
    Alert.alert('Missing Background', 'Please describe or select a background');
    return;
  }

  const config: EditModeConfig = {};
  if (isRemoveObjectMode) {
    config.prompt = removalPrompt.trim();
    config.removalPrompt = removalPrompt.trim();
  } else if (isReplaceBackgroundMode) {
    if (backgroundImageUri) {
      config.backgroundImageUri = backgroundImageUri;
    }
    if (backgroundPrompt.trim()) {
      config.backgroundPrompt = backgroundPrompt.trim();
    }
  }

  // ... navigate to Processing
};
```

**Update render logic:**
```typescript
// In the hero image section, add condition:
{(isRemoveBackgroundMode || isRemoveObjectMode || isReplaceBackgroundMode) && (
  // ... hero image preview ...
)}

// Add background input section after prompt input (if Remove Object mode):
{isReplaceBackgroundMode && (
  <View style={{ marginHorizontal: spacing.base, marginTop: spacing.base }}>
    <View style={[styles.promptContainer, {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    }]}>
      <Text style={[styles.promptLabel, { ... }]}>
        Describe the new background
      </Text>
      <TextInput
        style={[styles.promptInput, { ... }]}
        value={backgroundPrompt}
        onChangeText={setBackgroundPrompt}
        placeholder="e.g., beach sunset, office, forest, blue sky..."
        placeholderTextColor={colors.textSecondary}
        multiline={false}
      />
      
      {/* OR divider */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: spacing.sm }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        <Text style={{ marginHorizontal: spacing.sm, color: colors.textSecondary }}>OR</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      </View>
      
      {/* Select background image button */}
      <TouchableOpacity
        onPress={() => {
          // Open image picker for background
          setShowBackgroundPicker(true);
        }}
        style={[styles.selectImageButton, {
          backgroundColor: colors.background,
          borderColor: colors.border,
        }]}
      >
        <Ionicons name="image-outline" size={20} color={colors.primary} />
        <Text style={{ color: colors.text, marginLeft: spacing.xs }}>
          Select background image
        </Text>
      </TouchableOpacity>
    </View>
  </View>
)}
```

**Update information card:**
```typescript
{isReplaceBackgroundMode && (
  <View style={[styles.modernCard, { ... }]}>
    {/* What This Does */}
    <View style={{ padding: spacing.base }}>
      <View style={styles.explanationHeader}>
        <Ionicons name="images-outline" size={22} color={colors.primary} />
        <Text style={[styles.explanationTitle, { ... }]}>
          What This Does
        </Text>
      </View>
      <Text style={[styles.explanationText, { ... }]}>
        Replace the background of your photo while keeping your subject intact.
        Choose from AI-generated backgrounds or upload your own background image
        for a seamless composite.
      </Text>
      
      <View style={{ marginTop: spacing.md }}>
        <View style={styles.checkItem}>
          <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
          <Text style={[styles.checkText, { ... }]}>
            Smart subject detection and preservation
          </Text>
        </View>
        <View style={styles.checkItem}>
          <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
          <Text style={[styles.checkText, { ... }]}>
            Natural lighting and shadow matching
          </Text>
        </View>
        <View style={styles.checkItem}>
          <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
          <Text style={[styles.checkText, { ... }]}>
            Works with complex edges (hair, transparency)
          </Text>
        </View>
      </View>
    </View>

    {/* How It Works */}
    <View style={[styles.divider, { backgroundColor: colors.border }]} />
    
    <View style={{ padding: spacing.base }}>
      {/* Expandable technical details */}
    </View>
  </View>
)}
```

**Update button text:**
```typescript
<Button
  title={isRemoveObjectMode 
    ? `Remove Object` 
    : isReplaceBackgroundMode
    ? `Replace Background`
    : `Remove Background`
  }
  onPress={handleProcess}
  disabled={
    (isRemoveObjectMode && !removalPrompt.trim()) ||
    (isReplaceBackgroundMode && !backgroundPrompt.trim() && !backgroundImageUri)
  }
/>
```

### 4. Process Button Text & Validation

The button should say "Replace Background" and be disabled until either:
- `backgroundPrompt` has text, OR
- `backgroundImageUri` is set

### 5. Update Information Card Content

**What This Does:**
- Explain background replacement
- Highlight subject preservation
- Mention AI-generated vs. custom backgrounds

**How It Works:**
- Two-step process (extract subject, composite)
- Neural network explanation
- Edge detection details

---

## Technical Implementation Details

### Two-Step Process Flow

1. **Remove Background Step:**
   - Use `cjwbw/rembg` model (same as Remove Background tool)
   - Get transparent PNG with subject isolated
   - Store temporarily or pass directly to next step

2. **Composite Step:**
   - If `backgroundImageUri` provided: Use multi-image transform with [subject, background]
   - If `backgroundPrompt` provided: Use single-image transform with enhanced prompt
   - Use `google/nano-banana` model

### Prompt Enhancement for Text-Based Backgrounds

If using text prompts, enhance them:

```typescript
// In processor
private enhanceBackgroundPrompt(prompt: string): string {
  return `Replace the background with: ${prompt}. Keep the main subject (person/object) exactly as shown, with natural shadows and lighting. The background should be realistic and match the subject's perspective and lighting.`;
}
```

### Multi-Image Composition (If Using Background Image)

```typescript
// If backgroundImageUri is provided
const params: MultiImageTransformParams = {
  imageUris: [subjectImageUri, backgroundImageUri],
  prompt: `Place the subject from image 1 onto the background from image 2. Match lighting, shadows, and perspective naturally. The subject should appear integrated into the background scene.`,
};

const result = await AIService.transformImages(params);
```

---

## UI/UX Patterns to Follow

### Hero Image Preview
- Large centered image (same as Remove Background/Remove Object)
- Tap to expand modal (full-screen dark overlay)
- Quick badges: "Instant", "AI-powered", "Professional"

### Input Section
- Label: "Describe the new background"
- Placeholder: "e.g., beach sunset, office, forest, blue sky..."
- OR divider with "Select background image" option
- Image picker button (if selecting background image)

### Information Card
- Two sections: "What This Does" and "How It Works"
- Checkmark list of key features
- Expandable technical details
- Same styling as Remove Background card

### Process Button
- Primary action button
- Disabled state until valid input
- Timing info badge below: "Usually takes 10-15 seconds"

---

## Configuration Options

The `config` object should support:

```typescript
{
  backgroundPrompt?: string;        // Text description of background
  backgroundImageUri?: string;       // URI of background image to use
  preserveLighting?: boolean;       // Optional: match original lighting
  blendMode?: 'natural' | 'seamless'; // Optional: compositing style
}
```

---

## Error Handling

Handle these cases:

1. **No background input:**
   ```typescript
   'Please provide a background description or select a background image'
   ```

2. **Invalid background image:**
   ```typescript
   'Invalid background image. Please select a valid image file.'
   ```

3. **Background removal failed:**
   ```typescript
   'Failed to extract subject. Please try a different image.'
   ```

4. **Compositing failed:**
   ```typescript
   'Failed to composite images. Please try again.'
   ```

---

## Testing Checklist

- [ ] Processor handles text prompts
- [ ] Processor handles image backgrounds
- [ ] Processor validates inputs correctly
- [ ] UI shows correct mode (isReplaceBackgroundMode)
- [ ] Input field appears and works
- [ ] Button disabled until valid input
- [ ] Button enabled with text prompt
- [ ] Button enabled with image selection
- [ ] Information card displays correctly
- [ ] Hero image preview works
- [ ] Full-screen modal works
- [ ] Navigation flows correctly
- [ ] Error messages display properly
- [ ] Subscription check works (premium feature)

---

## API Considerations

### Cost Implications
- Two-step process = 2 API calls per request
- Consider caching subject extraction if user tries multiple backgrounds
- Credit cost: Already set to 1 in `editModes.ts`

### Rate Limiting
- Same pattern as other processors (handle 429 errors)
- Timeout handling (60 attempts × 2 seconds = 2 minutes max)

### Model Selection
- **Step 1 (Extract):** `cjwbw/rembg` (proven, fast, cheap)
- **Step 2 (Composite):** `google/nano-banana` (works well with multi-image)

---

## Alternative Approaches

### Option: Single-Step with Mask
- Use a model that supports mask input
- Faster (one API call) but may need custom model

### Option: Client-Side Compositing
- Remove background on server
- Composite on device (more control, but complex)

### Option: Background Presets
- Offer preset backgrounds users can select
- Faster UX, limited flexibility

---

## Next Steps

1. **Choose implementation approach** (two-step recommended)
2. **Create processor file** (`replaceBackgroundProcessor.ts`)
3. **Register processor** in `ImageProcessingService`
4. **Update ImagePreviewScreen** UI and logic
5. **Test end-to-end flow**
6. **Handle edge cases** (errors, timeouts, subscription checks)

---

## Design Consistency Checklist

Following the same patterns as Remove Background and Remove Object:

✅ Same hero image preview layout  
✅ Same input field styling (when using prompts)  
✅ Same information card structure  
✅ Same process button position and styling  
✅ Same full-screen image modal  
✅ Same timing badge  
✅ Same navigation flow  
✅ Same error handling patterns  
✅ Same subscription gating  

---

## Notes

- Replace Background is already marked as `requiresConfig: true` and `requiresSubscription: true` in `editModes.ts`
- The edit mode is already included in the navigation flow (`EditModeSelectionScreen.tsx`)
- Only the processor implementation and UI updates are needed
- Consider adding background presets/gallery in future iterations for better UX


