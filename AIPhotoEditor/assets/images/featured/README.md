# Featured Images

Place your before and after images here for the FeaturedBlock component.

## Required Files:

1. **before.jpg** (or .png) - The "before" image showing the original photo
2. **after.jpg** (or .png) - The "after" image showing the transformed/edited photo

## Supported Formats:
- JPEG (.jpg, .jpeg)
- PNG (.png)

## Usage:

The images are automatically loaded in `FeaturesScreen.tsx` using:
```typescript
beforeImage={require('../../assets/images/featured/before.jpg')}
afterImage={require('../../assets/images/featured/after.jpg')}
```

## Tips:
- Recommended size: Square images (e.g., 400x400px or 800x800px) work best
- The component will automatically resize and crop images to fit
- Keep file sizes reasonable for app bundle size (under 500KB each recommended)

