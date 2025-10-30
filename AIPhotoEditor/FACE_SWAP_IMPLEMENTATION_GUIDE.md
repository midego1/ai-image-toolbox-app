# Face Swap AI Tool - Implementation Guide

## Overview

This guide outlines how to implement the **Face Swap** tool following the same design patterns and architecture as other AI tools in the app (Remove Background, Remove Object, Replace Background, Virtual Try-On).

## Current Status

✅ **Ready to Implement:**
- Architecture pattern established (BaseProcessor, ImageProcessingService)
- Multi-image support available (for source + target faces)
- UI patterns defined (ImagePreviewScreen pattern)
- Navigation flow standardized

❌ **Still Needed:**
- Edit mode definition in `src/constants/editModes.ts`
- Type definition in `src/types/editModes.ts`
- Processor implementation (`FaceSwapProcessor`)
- UI in `ImagePreviewScreen` for face selection
- Registration in `ImageProcessingService`
- Navigation routing in `EditModeSelectionScreen.tsx`

---

## Architecture Overview

### Design Pattern Consistency

All AI tools follow this structure:

```
EditModeSelection
    ↓
ImageSelection (select source photo with face to swap FROM)
    ↓
FaceSelection (select target photo with face to swap TO)
    ↓
ImagePreview (shows both images + preview, optional adjustments)
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

For face swap, we need:
- `imageUri`: Source image (photo containing face to swap FROM)
- `config.targetImageUri`: Target image (photo containing face to swap TO)

---

## Technical Implementation Approaches

### Option A: Replicate Face Swap Models (Recommended)

Several specialized face swap models are available on Replicate:

1. **`logerzhu/face-swap`** - Popular face swap model
2. **`yan-ops/face_swap`** - Another option
3. **`lucataco/faceswap`** - Simple face swap
4. **`fofr/face-swap`** - Face swapping model

**Pros:**
- Specialized for face swapping
- Better quality results
- Handles face detection automatically
- Faster than general models

**Cons:**
- May require specific API versions
- Model-specific parameters to learn

**Recommended Model:** Start with `fofr/face-swap` or `lucataco/faceswap`

**Example API Call:**
```typescript
{
  version: '<model_version_id>',
  input: {
    target_image: base64SourceImage,
    swap_image: base64TargetImage,
    // Optional: face_index, enable_smooth_mask, etc.
  }
}
```

### Option B: Use nano-banana (Multi-Image Prompt)

Similar to Virtual Try-On, use `google/nano-banana` with multi-image composition:

**Pros:**
- Already integrated in your codebase
- Known to work well
- Flexible prompt control

**Cons:**
- Not specialized for face swap
- May not preserve facial features as accurately
- More prompt engineering needed

**Example:**
```typescript
const prompt = `Swap the face from image 2 onto the person in image 1. 
Preserve the expressions, lighting, and natural look of the original photo. 
The face from image 2 should seamlessly blend into image 1, matching 
skin tone and facial features while maintaining the original person's pose and expression.`;

AIService.transformImages({
  imageUris: [sourceImageUri, targetFaceImageUri],
  prompt: prompt
});
```

### Option C: Hybrid Approach

1. Detect faces in both images (optional pre-processing)
2. Use specialized face swap model
3. Optional post-processing for blending

**Pros:**
- Best quality results
- Can add face detection validation

**Cons:**
- More complex
- Multiple API calls potentially

---

## Implementation Steps

### 1. Add Edit Mode Definition

**File:** `src/constants/editModes.ts`

Add to `EditMode` enum:
```typescript
FACE_SWAP = 'face_swap',
```

Add to `EDIT_MODES` object:
```typescript
[EditMode.FACE_SWAP]: {
  id: EditMode.FACE_SWAP,
  name: 'Face Swap',
  description: 'Swap faces between photos',
  icon: '👤',
  category: EditModeCategory.EDIT,
  isPremium: true,
  requiresConfig: true,
  requiresSubscription: true, // Subscription-only (sensitive feature)
  creditCost: 1,
},
```

### 2. Create FaceSwapProcessor

**File:** `src/services/processors/faceSwapProcessor.ts`

**Template Implementation:**

```typescript
import { BaseProcessor } from './baseProcessor';
import { TransformResponse, MultiImageTransformParams } from '../aiService';
import { AIService } from '../aiService';
import { EditModeConfig } from '../../types/editModes';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Face Swap Processor
 * Swaps faces between two images
 */
export class FaceSwapProcessor extends BaseProcessor {
  private static REPLICATE_API_KEY_STORAGE = 'replicate_api_key';
  private static REPLICATE_API_KEY_FALLBACK = 'YOUR_REPLICATE_API_KEY';
  
  // Option 1: Use specialized face swap model
  private static FACE_SWAP_MODEL = 'fofr/face-swap';
  private static FACE_SWAP_MODEL_VERSION = '<version_id>'; // Get from Replicate
  
  // Option 2: Use nano-banana (fallback)
  private static NANO_BANANA_MODEL = 'google/nano-banana';
  private static NANO_BANANA_VERSION = '2c8a3b5b81554aa195bde461e2caa6afacd69a66c48a64fb0e650c9789f8b8a0';

  private async getReplicateApiKey(): Promise<string> {
    try {
      const storedKey = await SecureStore.getItemAsync(FaceSwapProcessor.REPLICATE_API_KEY_STORAGE);
      if (storedKey) return storedKey;
    } catch (error) {
      console.warn('Could not retrieve Replicate API key from secure storage');
    }
    return FaceSwapProcessor.REPLICATE_API_KEY_FALLBACK;
  }

  /**
   * Process face swap
   * Config options:
   * - targetImageUri: string (required: image containing face to swap TO)
   * - useSpecializedModel: boolean (optional: use face swap model vs. nano-banana)
   */
  async process(imageUri: string, config?: EditModeConfig): Promise<TransformResponse> {
    if (!this.validateImageUri(imageUri)) {
      return this.createErrorResponse('Invalid source image URI provided');
    }

    const targetImageUri = config?.targetImageUri as string | undefined;
    
    if (!targetImageUri || !this.validateImageUri(targetImageUri)) {
      return this.createErrorResponse('Please select a target image with the face you want to swap to');
    }

    const useSpecializedModel = (config?.useSpecializedModel as boolean) ?? true;

    try {
      const apiKey = await this.getReplicateApiKey();
      
      if (!apiKey || apiKey === FaceSwapProcessor.REPLICATE_API_KEY_FALLBACK) {
        return this.createErrorResponse(
          'Replicate API key not configured. Please set your API key.'
        );
      }

      if (useSpecializedModel) {
        return await this.processWithFaceSwapModel(imageUri, targetImageUri, apiKey);
      } else {
        return await this.processWithNanoBanana(imageUri, targetImageUri);
      }
    } catch (error: any) {
      console.error('FaceSwapProcessor error:', error);
      return this.createErrorResponse(
        error.message || 'Failed to swap faces'
      );
    }
  }

  /**
   * Process using specialized face swap model
   */
  private async processWithFaceSwapModel(
    sourceImageUri: string,
    targetImageUri: string,
    apiKey: string
  ): Promise<TransformResponse> {
    // Convert images to base64
    const [sourceBase64, targetBase64] = await Promise.all([
      this.convertImageToBase64(sourceImageUri),
      this.convertImageToBase64(targetImageUri)
    ]);

    const sourceDataUri = `data:image/jpeg;base64,${sourceBase64}`;
    const targetDataUri = `data:image/jpeg;base64,${targetBase64}`;

    // API call format depends on specific model
    // Example for fofr/face-swap:
    const requestBody = {
      version: FaceSwapProcessor.FACE_SWAP_MODEL_VERSION,
      input: {
        target_image: sourceDataUri, // Image to swap INTO
        swap_image: targetDataUri,    // Face to swap FROM
      }
    };

    // Follow same polling pattern as other processors
    const predictionResponse = await axios.post(
      'https://api.replicate.com/v1/predictions',
      requestBody,
      {
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      }
    );

    const predictionId = predictionResponse.data.id;
    return await this.pollPrediction(predictionId, apiKey);
  }

  /**
   * Process using nano-banana (fallback/general approach)
   */
  private async processWithNanoBanana(
    sourceImageUri: string,
    targetImageUri: string
  ): Promise<TransformResponse> {
    const prompt = this.buildFaceSwapPrompt();
    
    const params: MultiImageTransformParams = {
      imageUris: [sourceImageUri, targetImageUri],
      prompt: prompt,
    };

    return await AIService.transformImages(params);
  }

  /**
   * Build optimized prompt for face swap using nano-banana
   */
  private buildFaceSwapPrompt(): string {
    return `Swap the face from image 2 onto the person in image 1. 
    The face swap should be seamless and natural, preserving:
    - The original person's expression and pose from image 1
    - The facial features from image 2
    - Natural skin tone matching and blending
    - Lighting consistency with image 1
    - Realistic hair and edge blending
    The result should look as if the person in image 2 was naturally photographed in the pose from image 1.`;
  }

  /**
   * Convert image URI to base64
   */
  private async convertImageToBase64(imageUri: string): Promise<string> {
    if (imageUri.startsWith('data:')) {
      const parts = imageUri.split(',');
      if (parts.length < 2 || !parts[1]) {
        throw new Error('Invalid data URI format');
      }
      return parts[1];
    } else if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
      // Remote URL - download first
      const tempUri = `${FileSystem.cacheDirectory}temp_faceswap_${Date.now()}.jpg`;
      const downloadResult = await FileSystem.downloadAsync(imageUri, tempUri);
      
      if (!downloadResult.uri) {
        throw new Error('Failed to download image from URL');
      }
      
      const base64 = await FileSystem.readAsStringAsync(downloadResult.uri, {
        encoding: 'base64'
      });
      
      // Clean up
      try {
        await FileSystem.deleteAsync(tempUri, { idempotent: true });
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      return base64;
    } else {
      // Local file
      return await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64'
      });
    }
  }

  /**
   * Poll for prediction result (same pattern as ObjectRemovalProcessor)
   */
  private async pollPrediction(predictionId: string, apiKey: string): Promise<TransformResponse> {
    let attempts = 0;
    const maxAttempts = 60;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await axios.get(
        `https://api.replicate.com/v1/predictions/${predictionId}`,
        {
          headers: {
            'Authorization': `Token ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const status = statusResponse.data.status;
      
      if (status === 'succeeded') {
        const output = statusResponse.data.output;
        const imageUrl = Array.isArray(output) ? output[0] : output;
        
        return this.createSuccessResponse(imageUrl);
      } else if (status === 'failed' || status === 'canceled') {
        return this.createErrorResponse(
          statusResponse.data.error || 'Face swap failed'
        );
      }
      
      attempts++;
    }

    return this.createErrorResponse('Face swap timed out');
  }
}
```

### 3. Register Processor in ImageProcessingService

**File:** `src/services/imageProcessingService.ts`

Add import:
```typescript
import { FaceSwapProcessor } from './processors/faceSwapProcessor';
```

Add to `initializeProcessors()`:
```typescript
this.processors.set(EditMode.FACE_SWAP, new FaceSwapProcessor());
```

### 4. Update Navigation Flow

**Option A: Two-Step Image Selection (Recommended)**

1. **ImageSelectionScreen** → Select source photo (face FROM)
2. **FaceSelectionScreen** (new) → Select target photo (face TO)
3. **ImagePreviewScreen** → Preview and confirm
4. **ProcessingScreen** → Process
5. **ResultScreen** → Show result

**Option B: Single Image Selection with Later Target Selection**

1. **ImageSelectionScreen** → Select source photo
2. **ImagePreviewScreen** → Select target photo from UI
3. **ProcessingScreen** → Process
4. **ResultScreen** → Show result

**Recommended: Option B** (simpler, less navigation)

### 5. Update ImagePreviewScreen UI

**File:** `src/screens/ImagePreviewScreen.tsx`

**Add to state:**
```typescript
const isFaceSwapMode = editMode === EditMode.FACE_SWAP;
const [targetImageUri, setTargetImageUri] = useState<string | null>(null);
const [showTargetImagePicker, setShowTargetImagePicker] = useState(false);
```

**Update handleProcess:**
```typescript
const handleProcess = () => {
  if (isFaceSwapMode && !targetImageUri) {
    Alert.alert('Missing Image', 'Please select a target image with the face you want to swap to');
    return;
  }

  // ... existing validation for other modes ...

  const config: EditModeConfig = {};
  if (isFaceSwapMode) {
    config.targetImageUri = targetImageUri;
  }

  // ... navigate to Processing ...
};
```

**Add UI section for target image selection:**
```typescript
{isFaceSwapMode && (
  <View style={{ marginHorizontal: spacing.base, marginTop: spacing.base }}>
    <View style={[styles.modernCard, {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Select Target Face
      </Text>
      <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
        Choose a photo with the face you want to swap onto the source image
      </Text>
      
      {targetImageUri ? (
        <View style={styles.targetImagePreview}>
          <Image
            source={{ uri: targetImageUri }}
            style={styles.targetImageThumbnail}
            resizeMode="cover"
          />
          <TouchableOpacity
            onPress={() => setTargetImageUri(null)}
            style={styles.removeButton}
          >
            <Ionicons name="close-circle" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => {
            // Open image picker
            setShowTargetImagePicker(true);
          }}
          style={[styles.selectImageButton, {
            backgroundColor: colors.background,
            borderColor: colors.border,
            borderWidth: 2,
            borderStyle: 'dashed',
          }]}
        >
          <Ionicons name="add-circle-outline" size={32} color={colors.primary} />
          <Text style={{ color: colors.text, marginTop: spacing.xs }}>
            Select target face image
          </Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
)}
```

**Add dual image preview:**
```typescript
{isFaceSwapMode && targetImageUri && (
  <View style={styles.dualPreviewContainer}>
    <View style={styles.previewPair}>
      <Text style={styles.previewLabel}>Source</Text>
      <Image source={{ uri: imageUri }} style={styles.previewImage} />
    </View>
    <Ionicons name="arrow-forward" size={24} color={colors.primary} />
    <View style={styles.previewPair}>
      <Text style={styles.previewLabel}>Target Face</Text>
      <Image source={{ uri: targetImageUri }} style={styles.previewImage} />
    </View>
  </View>
)}
```

**Update information card:**
```typescript
{isFaceSwapMode && (
  <View style={[styles.modernCard, { ... }]}>
    <View style={{ padding: spacing.base }}>
      <View style={styles.explanationHeader}>
        <Ionicons name="swap-horizontal-outline" size={22} color={colors.primary} />
        <Text style={[styles.explanationTitle, { ... }]}>
          What This Does
        </Text>
      </View>
      <Text style={[styles.explanationText, { ... }]}>
        Swap faces between two photos while preserving expressions, 
        lighting, and natural appearance. Perfect for fun photo 
        transformations while maintaining realistic results.
      </Text>
      
      <View style={{ marginTop: spacing.md }}>
        <View style={styles.checkItem}>
          <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
          <Text style={[styles.checkText, { ... }]}>
            Automatic face detection and alignment
          </Text>
        </View>
        <View style={styles.checkItem}>
          <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
          <Text style={[styles.checkText, { ... }]}>
            Natural skin tone and lighting matching
          </Text>
        </View>
        <View style={styles.checkItem}>
          <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
          <Text style={[styles.checkText, { ... }]}>
            Preserves expressions and poses
          </Text>
        </View>
      </View>
    </View>

    {/* How It Works */}
    <View style={[styles.divider, { backgroundColor: colors.border }]} />
    
    <View style={{ padding: spacing.base }}>
      <Text style={[styles.explanationTitle, { ... }]}>
        How It Works
      </Text>
      <Text style={[styles.explanationText, { ... }]}>
        1. We detect faces in both images automatically{'\n'}
        2. Extract facial features from the target image{'\n'}
        3. Blend features onto the source image{'\n'}
        4. Adjust lighting, skin tone, and edges for natural results
      </Text>
    </View>
  </View>
)}
```

### 6. Update Button Text & Validation

```typescript
<Button
  title={isFaceSwapMode ? 'Swap Faces' : '...'}
  onPress={handleProcess}
  disabled={
    (isFaceSwapMode && !targetImageUri) ||
    // ... other mode validations
  }
/>
```

---

## Model Selection & Configuration

### Research Required Models

Before implementing, research these Replicate models:

1. **`fofr/face-swap`**
   - Check latest version ID
   - Review input parameters
   - Test API response format

2. **`lucataco/faceswap`**
   - Alternative option
   - Compare quality vs. fofr

3. **`yan-ops/face_swap`**
   - Another alternative

### Testing Approach

1. **Start with nano-banana** (already integrated)
   - Quick to implement
   - Validate overall flow
   - Test UI/UX

2. **Then test specialized models**
   - Compare quality
   - Choose best option
   - Update processor

---

## UI/UX Patterns to Follow

### Image Selection Flow

Similar to Virtual Try-On selection:
- Clear labels: "Source Photo" and "Target Face"
- Preview thumbnails side-by-side
- Easy to swap/replace selected images
- Visual indicators (arrows, labels)

### Dual Preview Layout

```
┌─────────────┐         ┌─────────────┐
│   Source    │   →    │  Target     │
│   Image     │        │   Face      │
└─────────────┘         └─────────────┘
```

### Information Card

- Clear explanation of face swapping
- Feature highlights (face detection, natural blending)
- Simple "How It Works" steps
- Similar styling to other AI tools

### Process Button

- Text: "Swap Faces"
- Disabled until both images selected
- Timing badge: "Usually takes 10-15 seconds"

---

## Ethical Considerations & Safety

### Important: Face Swap Ethics

Face swapping has significant ethical implications:

1. **Misuse Prevention:**
   - Consider adding disclaimers/warnings
   - May want age verification for sensitive features
   - Consider watermarking deepfake results

2. **Consent & Privacy:**
   - Remind users to have consent from people in photos
   - Consider terms of service updates
   - Add privacy warnings

3. **Detection & Labeling:**
   - Consider adding metadata indicating AI-generated
   - Optional: Watermark for deepfake detection

4. **Access Control:**
   - Mark as `requiresSubscription: true` (already planned)
   - Consider additional verification
   - May want logging/audit trail

### Implementation Suggestions

1. **Disclaimer Modal** (first-time use):
   ```typescript
   Alert.alert(
     'Face Swap Disclaimer',
     'Face swapping should only be used with consent. Misuse of this feature may violate terms of service and applicable laws.',
     [{ text: 'I Understand', onPress: () => proceed() }]
   );
   ```

2. **Terms of Service Update:**
   - Add section about face swap usage
   - Prohibit creating misleading content
   - Prohibit non-consensual use

3. **Optional Watermark:**
   - Add subtle watermark to results
   - Enable deepfake detection tools

---

## Configuration Options

The `config` object should support:

```typescript
{
  targetImageUri: string;           // Required: image with target face
  useSpecializedModel?: boolean;    // Optional: use face swap model vs. nano-banana
  faceIndex?: number;                // Optional: if multiple faces detected
  enableSmoothMask?: boolean;        // Optional: smoother blending
  blendAmount?: number;              // Optional: blending intensity (0-1)
}
```

---

## Error Handling

Handle these cases:

1. **No target image:**
   ```typescript
   'Please select a target image with the face you want to swap to'
   ```

2. **No face detected in source:**
   ```typescript
   'No face detected in source image. Please try a different photo.'
   ```

3. **No face detected in target:**
   ```typescript
   'No face detected in target image. Please select a photo with a clear face.'
   ```

4. **Multiple faces (may need user selection):**
   ```typescript
   'Multiple faces detected. We will use the most prominent face.'
   ```

5. **Face swap failed:**
   ```typescript
   'Face swap failed. Please ensure both images have clear, visible faces.'
   ```

---

## Testing Checklist

- [ ] Processor handles both image URIs correctly
- [ ] Processor validates inputs correctly
- [ ] UI shows correct mode (isFaceSwapMode)
- [ ] Image picker works for target image
- [ ] Dual preview displays correctly
- [ ] Button disabled until both images selected
- [ ] Button enabled with both images
- [ ] Information card displays correctly
- [ ] Navigation flows correctly
- [ ] Error messages display properly
- [ ] Subscription check works (premium feature)
- [ ] Face swap produces reasonable results
- [ ] Works with different face orientations
- [ ] Works with different lighting conditions
- [ ] Edge cases handled (no face, multiple faces)

---

## API Considerations

### Cost Implications

- Face swap models: ~1 credit per swap (typical)
- nano-banana fallback: 1 credit per swap
- Consider caching face detections if user tries multiple swaps

### Rate Limiting

- Same pattern as other processors
- Handle 429 errors gracefully
- Timeout: 60 attempts × 2 seconds = 2 minutes max

### Model Selection Priority

1. **Primary:** Test `fofr/face-swap` or `lucataco/faceswap`
2. **Fallback:** `google/nano-banana` (already integrated)
3. **Future:** Consider custom face detection + specialized models

---

## Alternative Approaches

### Option: Face Detection Pre-Processing

Use face detection API before swapping:
- Validate faces exist
- Select specific face if multiple
- Crop/prepare faces optimally

### Option: Client-Side Face Detection

Use React Native face detection library:
- Validate before upload
- Better UX (show detected faces)
- Offload detection from API

### Option: Real-Time Face Swap

For future consideration:
- Camera live preview
- Real-time face swapping
- More complex but engaging

---

## Next Steps

1. **Research and test Replicate face swap models**
   - Find best model with good API docs
   - Test API calls and responses
   - Compare quality

2. **Add edit mode definition**
   - Update `EditMode` enum
   - Add to `EDIT_MODES` object

3. **Create processor file**
   - Start with nano-banana (quick validation)
   - Then implement specialized model

4. **Register processor** in `ImageProcessingService`

5. **Update ImagePreviewScreen** UI and logic

6. **Add navigation routing** if needed

7. **Test end-to-end flow**

8. **Handle edge cases** (errors, timeouts, subscription checks)

9. **Add ethical safeguards** (disclaimers, warnings)

10. **Update Terms of Service** (important for face swap)

---

## Design Consistency Checklist

Following the same patterns as other AI tools:

✅ Same hero/preview image layout (adapted for dual preview)  
✅ Same input/selection UI patterns  
✅ Same information card structure  
✅ Same process button position and styling  
✅ Same full-screen image modal  
✅ Same timing badge  
✅ Same navigation flow  
✅ Same error handling patterns  
✅ Same subscription gating  

---

## Security & Privacy Notes

- Face swap results may be considered biometric data in some jurisdictions
- Consider data retention policies
- Ensure compliance with privacy regulations
- May need explicit user consent/acknowledgment
- Consider export restrictions for deepfake technology

---

## References

- Similar implementation: `VirtualTryOnProcessor` (multi-image handling)
- UI patterns: `ImagePreviewScreen` (remove object/replace background)
- API patterns: `ObjectRemovalProcessor` (polling, error handling)
- Base architecture: `BaseProcessor`, `ImageProcessingService`

---

## Model Research Links

- Replicate Face Swap Models: https://replicate.com/explore?query=face+swap
- fofr/face-swap: https://replicate.com/fofr/face-swap
- lucataco/faceswap: https://replicate.com/lucataco/faceswap

---

**Status:** Ready for implementation. Follow the established patterns and test thoroughly, especially around ethical considerations and error handling.

