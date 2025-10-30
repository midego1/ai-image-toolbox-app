# Professional Headshots AI Tool - Implementation Guide

## Overview

This guide outlines how to implement the **Professional Headshots** tool following the same design patterns and architecture as other AI tools in the app (Remove Background, Remove Object, Replace Background, Virtual Try-On).

## Current Status

✅ **Ready to Implement:**
- Architecture pattern established (BaseProcessor, ImageProcessingService)
- Multi-image support available (for background replacement)
- UI patterns defined (ImagePreviewScreen pattern)
- Navigation flow standardized
- Face enhancement models available on Replicate

❌ **Still Needed:**
- Edit mode definition in `src/constants/editModes.ts`
- Type definition in `src/types/editModes.ts`
- Processor implementation (`ProfessionalHeadshotProcessor`)
- UI in `ImagePreviewScreen` for style/background selection
- Registration in `ImageProcessingService`
- Navigation routing in `EditModeSelectionScreen.tsx`

---

## Architecture Overview

### Design Pattern Consistency

All AI tools follow this structure:

```
EditModeSelection
    ↓
ImageSelection (select photo or take new one)
    ↓
ImagePreview (shows image + style/background selection)
    ↓
Processing (shows loading state with progress)
    ↓
Result (shows before/after professional headshot)
```

### Processor Pattern

All processors extend `BaseProcessor` and implement:

```typescript
async process(imageUri: string, config?: EditModeConfig): Promise<TransformResponse>
```

For Professional Headshots, we need:
- `imageUri`: Source photo (person image)
- `config.headshotStyle`: 'corporate' | 'creative' | 'casual' | 'executive'
- `config.backgroundStyle`: 'office' | 'studio' | 'outdoor' | 'neutral' | 'custom'
- `config.backgroundImageUri`: Optional custom background image
- `config.lightingStyle`: 'professional' | 'soft' | 'dramatic' | 'natural'

---

## Technical Implementation Approaches

### Option A: Single-Step with Nano Banana (Recommended ✅)

**Why This Works:**
- **Proven in your codebase**: Nano Banana already handles complex tasks like Virtual Try-On, Replace Background, Remove Object
- **Cost-effective**: 1 credit instead of 3 credits (67% savings)
- **Faster**: One API call (~15-30 seconds vs ~45-90 seconds)
- **Simpler**: Follows your existing architecture pattern
- **Quality**: With detailed prompts (like Virtual Try-On uses), can achieve professional results

**Implementation:**
- Use `google/nano-banana` with a comprehensive professional headshot prompt
- Single API call handles: face enhancement + background replacement + lighting + color grading
- Can optionally use multi-image input for custom background (like Replace Background does)

**Pros:**
- ✅ Lower cost (1 credit vs 3 credits)
- ✅ Faster processing
- ✅ Simpler codebase (reuses AIService.transformImage)
- ✅ Already proven with similar features
- ✅ Easy to upgrade to multi-step later if needed

**Cons:**
- ⚠️ Requires well-crafted prompt (but you already have this pattern)
- ⚠️ May need iteration to perfect quality (but same for multi-step)

**Recommended Approach:** **Use this as primary implementation** - can add multi-step upgrade path later

### Option B: Multi-Step Processing (Future Upgrade Path)

**3-Step Process:**
1. **Face Enhancement** - `tencentarc/gfpgan` for specialized face restoration
2. **Background Replacement** - Use existing ReplaceBackgroundProcessor
3. **Lighting Adjustment** - Nano Banana for final polish

**Use Case:** Upgrade path if single-step doesn't meet quality bar, or for "Ultra Quality" premium tier

**Pros:**
- Best possible quality
- Specialized face enhancement model
- Fine-grained control

**Cons:**
- 3x cost (3 credits)
- 3x processing time
- More complex implementation

**Recommended Approach:** Add later as "Ultra Quality" option if needed

---

## Recommended Implementation: Single-Step Nano Banana

Following your existing architecture (like Virtual Try-On and Replace Background), we'll use a single comprehensive prompt with Nano Banana.

### Single API Call Approach

**Model:** `google/nano-banana` (same as your other features)

**Prompt Strategy:**
Similar to Virtual Try-On's detailed step-by-step instructions, we'll create a comprehensive prompt that handles:
1. Face enhancement (reduce blemishes, improve clarity)
2. Background replacement (professional styles)
3. Lighting adjustment (professional portrait lighting)
4. Color grading (corporate/creative/casual styles)

**Implementation Pattern:**
- Single `AIService.transformImage()` call (like Remove Object, Replace Background text mode)
- Optional multi-image mode for custom backgrounds (like Replace Background image mode)
- Detailed prompt with preservation instructions (like Virtual Try-On uses)

---

## Implementation Steps

### 1. Add Edit Mode to Types

**File:** `src/types/editModes.ts`

```typescript
export enum EditMode {
  TRANSFORM = 'transform',
  REMOVE_BACKGROUND = 'remove_background',
  ENHANCE = 'enhance',
  FILTERS = 'filters',
  REMOVE_OBJECT = 'remove_object',
  REPLACE_BACKGROUND = 'replace_background',
  FACE_ENHANCE = 'face_enhance',
  STYLE_TRANSFER = 'style_transfer',
  TEXT_OVERLAY = 'text_overlay',
  CROP_ROTATE = 'crop_rotate',
  VIRTUAL_TRY_ON = 'virtual_try_on',
  PROFESSIONAL_HEADSHOTS = 'professional_headshots', // ← ADD THIS
}
```

### 2. Add Edit Mode Definition

**File:** `src/constants/editModes.ts`

```typescript
export const EDIT_MODES: Record<EditMode, EditModeData> = {
  // ... existing modes ...
  
  [EditMode.PROFESSIONAL_HEADSHOTS]: {
    id: EditMode.PROFESSIONAL_HEADSHOTS,
    name: 'Professional Headshots',
    description: 'Create LinkedIn-quality professional portraits',
    icon: '💼',
    category: EditModeCategory.ENHANCE,
    isPremium: true,
    requiresConfig: true,
    requiresSubscription: true, // Subscription-only
    creditCost: 1, // 1 credit for single-step Nano Banana processing
  },
};
```

Also add to the appropriate category arrays:

```typescript
// For EditModeSelectionScreen - should use image selection
const imageSelectionModes: EditMode[] = [
  // ... existing modes ...
  EditMode.PROFESSIONAL_HEADSHOTS, // ← ADD THIS
];
```

### 3. Create ProfessionalHeadshotProcessor

**File:** `src/services/processors/professionalHeadshotProcessor.ts`

```typescript
import { BaseProcessor } from './baseProcessor';
import { TransformResponse } from '../aiService';
import { EditModeConfig } from '../../types/editModes';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';
import { AIService } from '../aiService';

/**
 * Professional Headshot Processor
 * Multi-step process: Face Enhancement → Background Replacement → Lighting Adjustment
 */
export class ProfessionalHeadshotProcessor extends BaseProcessor {
  // Uses AIService which handles API key management internally

  /**
   * Process professional headshot
   * Config options:
   * - headshotStyle: 'corporate' | 'creative' | 'casual' | 'executive'
   * - backgroundStyle: 'office' | 'studio' | 'outdoor' | 'neutral' | 'custom'
   * - backgroundImageUri: string (optional, for custom background)
   * - lightingStyle: 'professional' | 'soft' | 'dramatic' | 'natural'
   */
  async process(imageUri: string, config?: EditModeConfig): Promise<TransformResponse> {
    if (!this.validateImageUri(imageUri)) {
      return this.createErrorResponse('Invalid image URI provided');
    }

    const headshotStyle = (config?.headshotStyle as string) || 'corporate';
    const backgroundStyle = (config?.backgroundStyle as string) || 'neutral';
    const backgroundImageUri = config?.backgroundImageUri as string | undefined;
    const lightingStyle = (config?.lightingStyle as string) || 'professional';

    try {
      console.log('[ProfessionalHeadshotProcessor] Starting processing');
      console.log('[ProfessionalHeadshotProcessor] Style:', headshotStyle);
      console.log('[ProfessionalHeadshotProcessor] Background:', backgroundStyle);

      // If custom background provided, use multi-image mode (like Replace Background)
      if (backgroundImageUri && this.validateImageUri(backgroundImageUri)) {
        const prompt = this.buildHeadshotPromptWithCustomBackground(
          headshotStyle,
          lightingStyle
        );
        return await AIService.transformImages({
          imageUris: [imageUri, backgroundImageUri],
          prompt,
        });
      }

      // Single image mode with text-based background
      const prompt = this.buildHeadshotPrompt(
        headshotStyle,
        backgroundStyle,
        lightingStyle
      );
      return await AIService.transformImage(imageUri, prompt);
    } catch (error: any) {
      console.error('ProfessionalHeadshotProcessor error:', error);
      return this.createErrorResponse(
        error.message || 'Failed to process professional headshot'
      );
    }
  }

  // Note: No need for imageToBase64, getLatestModelVersion, or pollPrediction helpers
  // These are handled by AIService.transformImage() and AIService.transformImages()

  /**
   * Build comprehensive professional headshot prompt (single image mode)
   * Similar structure to Virtual Try-On's detailed step-by-step approach
   */
  private buildHeadshotPrompt(
    headshotStyle: string,
    backgroundStyle: string,
    lightingStyle: string
  ): string {
    const styleInstructions: Record<string, string> = {
      corporate: 'Corporate professional portrait style: polished appearance, subtle rim lighting, even skin tones, professional color grading suitable for LinkedIn and business profiles',
      creative: 'Creative professional portrait style: dynamic lighting with depth, vibrant but natural colors, artistic color grading, engaging professional appearance',
      casual: 'Casual professional portrait style: natural soft lighting, warm tones, relaxed professional appearance, approachable and friendly',
      executive: 'Executive portrait style: sophisticated lighting with depth, refined color grading, authoritative yet approachable, high-end professional appearance',
    };

    const backgroundPrompts: Record<string, string> = {
      office: 'modern professional office background with neutral colors, subtle blurred bokeh effect, clean corporate environment, professional setting',
      studio: 'professional photography studio background with neutral gray or white, even soft lighting, clean minimal environment, portrait photography setting',
      outdoor: 'professional outdoor portrait background with natural setting, subtle depth and perspective, blurred natural background, outdoor professional photography',
      neutral: 'neutral professional background with solid color or subtle gradient, clean minimal environment, portrait photography background',
    };

    const lightingInstructions: Record<string, string> = {
      professional: 'Professional studio lighting with subtle rim light around face, even skin illumination, professional color balance, polished appearance',
      soft: 'Soft diffused lighting with gentle highlights on face, smooth natural skin tones, warm professional color grading',
      dramatic: 'Dramatic professional lighting with depth and contrast, well-defined facial features, professional color grading with subtle dramatic flair',
      natural: 'Natural-looking professional lighting that mimics studio daylight, authentic appearance, minimal but professional color grading',
    };

    const styleInstruction = styleInstructions[headshotStyle] || styleInstructions.corporate;
    const backgroundPrompt = backgroundPrompts[backgroundStyle] || backgroundPrompts.neutral;
    const lightingInstruction = lightingInstructions[lightingStyle] || lightingInstructions.professional;

    return `Transform this image into a high-quality professional headshot suitable for LinkedIn, resumes, and business profiles.

STEP 1 - PRESERVE THE PERSON:
The person in the image must remain completely unchanged:
- Their face, facial features, identity, and expression stay exactly the same
- Their body pose, stance, and position remain as shown
- Their clothing and appearance are preserved
- Their hair, hairstyle, and hair color look identical
- Maintain natural skin texture - no over-smoothing or plastic appearance

STEP 2 - FACE ENHANCEMENT:
Enhance the face quality while preserving identity:
- Reduce minor blemishes and imperfections naturally
- Improve facial clarity and sharpness
- Enhance skin tone uniformity while keeping it natural
- Brighten eyes subtly for a professional look
- Ensure facial features remain authentic and recognizable

STEP 3 - BACKGROUND REPLACEMENT:
Replace the background with: ${backgroundPrompt}

Background requirements:
- Keep the person's edges clean, especially around hair and semi-transparent areas
- Match lighting and shadows to the new professional background
- Ensure seamless integration - looks like person was photographed in this setting
- Maintain professional appearance suitable for business use

STEP 4 - LIGHTING & COLOR GRADING:
Apply professional portrait lighting and color grading:
- ${lightingInstruction}
- ${styleInstruction}
- Enhance facial features with subtle rim lighting for depth
- Apply professional color grading appropriate for corporate/business use
- Adjust white balance for professional appearance
- Add subtle depth and dimension through lighting
- Ensure consistent professional lighting throughout

FINAL OUTPUT REQUIREMENTS:
- LinkedIn-quality professional headshot
- Looks like taken by professional photographer in studio or professional setting
- High resolution and sharp
- Professional color grading and polished appearance
- Suitable for business profiles, resumes, and corporate use
- No visible artifacts, distortions, or unnatural effects
- Photorealistic and professional throughout

The result must show a professional headshot where the person looks exactly the same, but with enhanced quality, professional background, and polished lighting suitable for business use.`;
  }

  /**
   * Build prompt for custom background (multi-image mode)
   */
  private buildHeadshotPromptWithCustomBackground(
    headshotStyle: string,
    lightingStyle: string
  ): string {
    const styleInstructions: Record<string, string> = {
      corporate: 'Corporate professional portrait style: polished appearance, subtle rim lighting, even skin tones, professional color grading',
      creative: 'Creative professional portrait style: dynamic lighting with depth, vibrant but natural colors, artistic color grading',
      casual: 'Casual professional portrait style: natural soft lighting, warm tones, relaxed professional appearance',
      executive: 'Executive portrait style: sophisticated lighting with depth, refined color grading, high-end professional appearance',
    };

    const lightingInstructions: Record<string, string> = {
      professional: 'Professional studio lighting with subtle rim light, even skin illumination, professional color balance',
      soft: 'Soft diffused lighting with gentle highlights, smooth skin tones, warm color grading',
      dramatic: 'Dramatic lighting with depth and contrast, defined features, professional color grading',
      natural: 'Natural-looking professional lighting, authentic appearance, minimal color grading',
    };

    const styleInstruction = styleInstructions[headshotStyle] || styleInstructions.corporate;
    const lightingInstruction = lightingInstructions[lightingStyle] || lightingInstructions.professional;

    return `Transform image 1 into a professional headshot by placing the person onto the professional background from image 2.

STEP 1 - PRESERVE THE PERSON FROM IMAGE 1:
- Face, identity, expression, and features stay exactly the same
- Body pose and stance remain unchanged
- Clothing and appearance preserved
- Hair, hairstyle, and hair color look identical
- Natural skin texture preserved (no over-smoothing)

STEP 2 - FACE ENHANCEMENT:
While preserving identity:
- Reduce minor blemishes naturally
- Improve facial clarity
- Enhance skin tone uniformity
- Brighten eyes subtly

STEP 3 - BACKGROUND INTEGRATION:
Place the person from image 1 onto the background from image 2:
- Clean edges around person, especially hair
- Match lighting and shadows to background in image 2
- Seamless integration - looks like photographed in this setting
- Professional appearance

STEP 4 - LIGHTING & COLOR GRADING:
- ${lightingInstruction}
- ${styleInstruction}
- Subtle rim lighting for depth
- Professional color grading
- Consistent professional lighting

FINAL OUTPUT: LinkedIn-quality professional headshot with person from image 1 on background from image 2, with enhanced face quality and professional lighting.`;
  }
}
```

### 4. Register Processor

**File:** `src/services/imageProcessingService.ts`

```typescript
import { ProfessionalHeadshotProcessor } from './processors/professionalHeadshotProcessor';

// In initializeProcessors():
this.processors.set(EditMode.PROFESSIONAL_HEADSHOTS, new ProfessionalHeadshotProcessor());
```

### 5. Update ImagePreviewScreen UI

**File:** `src/screens/ImagePreviewScreen.tsx`

Add UI controls for Professional Headshots mode:

```typescript
const isProfessionalHeadshotsMode = editMode === EditMode.PROFESSIONAL_HEADSHOTS;

// Add state
const [headshotStyle, setHeadshotStyle] = useState<'corporate' | 'creative' | 'casual' | 'executive'>('corporate');
const [backgroundStyle, setBackgroundStyle] = useState<'office' | 'studio' | 'outdoor' | 'neutral'>('neutral');
const [lightingStyle, setLightingStyle] = useState<'professional' | 'soft' | 'dramatic' | 'natural'>('professional');

// Update handleProcess for professional headshots
if (isProfessionalHeadshotsMode) {
  navParams.config = {
    headshotStyle,
    backgroundStyle,
    lightingStyle,
  };
}
```

Add UI components for style selection (similar to Replace Background prompt input).

### 6. Update Navigation

**File:** `src/screens/EditModeSelectionScreen.tsx`

The mode should already work if added to `imageSelectionModes` array in step 2.

### 7. Update Processing Screen (Optional)

**File:** `src/screens/ProcessingScreen.tsx`

Show single-step processing (simpler than multi-step):

```typescript
if (editMode === EditMode.PROFESSIONAL_HEADSHOTS) {
  // Show single-step progress
  // "Creating professional headshot..."
  // Can show: "Enhancing face... Applying background... Polishing lighting..." as visual progress
}
```

---

## Testing Checklist

- [ ] Processor handles all style combinations correctly
- [ ] Face enhancement produces high-quality results
- [ ] Background replacement works for all styles
- [ ] Custom background (multi-image) works
- [ ] Lighting adjustment creates professional results
- [ ] Error handling for each step
- [ ] Credit consumption is correct (1 credit)
- [ ] Subscription check works
- [ ] UI flows correctly from selection → preview → processing → result
- [ ] Results are saved to history

---

## Future Enhancements

1. **Batch Processing** - Process multiple photos at once (premium)
2. **Style Presets Library** - Pre-defined combinations
3. **Aspect Ratio Options** - Square, 4:3, 16:9 for different platforms
4. **Export Formats** - PNG with transparency, high-res JPEG
5. **LinkedIn Optimization** - Automatic sizing for LinkedIn profiles
6. **Compare Mode** - Side-by-side before/after with original
7. **Save Presets** - Save favorite style combinations

---

## Credit Cost & Pricing

- **Credit Cost**: 1 credit (single-step Nano Banana processing)
- **Subscription Tier**: Premium only (requires subscription)
- **Business Value**: High-value feature, targets professionals
- **Expected Usage**: 2-4 headshots per user per month (recurring)
- **Cost Efficiency**: 67% cheaper than multi-step approach (1 credit vs 3 credits)

---

## Success Metrics

- **Usage Rate**: % of premium users who try headshots
- **Repeat Usage**: Headshots per premium user per month
- **Quality Satisfaction**: User ratings/reviews for headshot feature
- **Conversion**: % of free users who upgrade specifically for headshots

---

## Notes

- Consider adding a "Fast Mode" that uses 2-step or 1-step processing for lower cost
- Test extensively with various face types, lighting conditions, and photo qualities
- Monitor API costs - face enhancement models can be expensive
- Consider caching common background styles as pre-generated assets

---

**Implementation Time Estimate**: 3-5 days (much simpler with single-step)
**Complexity**: Medium (similar to Replace Background or Remove Object)
**Priority**: High (premium revenue driver)

