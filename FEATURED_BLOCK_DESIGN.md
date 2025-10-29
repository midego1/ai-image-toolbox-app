# Featured Block Design - Features Page

## Before (Current Layout)

```
┌─────────────────────────────────────┐
│         Features (Header)           │
├─────────────────────────────────────┤
│                                     │
│   [✨ Upgrade to Pro Banner]        │
│                                     │
│   🎨 TRANSFORM                      │
│   ┌─────────────────────────────┐   │
│   │ 🎨 Transform              → │   │
│   ├─────────────────────────────┤   │
│   │ ✂️ Remove Background      → │   │
│   └─────────────────────────────┘   │
│                                     │
│   ✏️ EDIT                           │
│   ┌─────────────────────────────┐   │
│   │ 🗑️ Remove Object [PRO]    🔒│   │
│   └─────────────────────────────┘   │
│                                     │
│   ... (more categories)             │
│                                     │
└─────────────────────────────────────┘
```

## After (With Featured Block)

```
┌─────────────────────────────────────┐
│         Features (Header)           │
├─────────────────────────────────────┤
│                                     │
│   ┌─────────────────────────────┐   │
│   │  ⭐ FEATURED TRANSFORMATION  │   │
│   ├─────────────────────────────┤   │
│   │                             │   │
│   │     [AI Transform Preview]  │   │
│   │     Before → After          │   │
│   │                             │   │
│   │  Transform Your Photos      │   │
│   │  with AI Magic              │   │
│   │                             │   │
│   │  [🎨 Try Transform Now]     │   │
│   │                             │   │
│   └─────────────────────────────┘   │
│                                     │
│   [✨ Upgrade to Pro Banner]        │
│                                     │
│   🎨 TRANSFORM                      │
│   ┌─────────────────────────────┐   │
│   │ 🎨 Transform              → │   │
│   ├─────────────────────────────┤   │
│   │ ✂️ Remove Background      → │   │
│   └─────────────────────────────┘   │
│                                     │
│   ... (rest of categories)          │
│                                     │
└─────────────────────────────────────┘
```

## Design Options

### Option 1: Hero Banner Style (Recommended)
- Large, eye-catching card at the top
- Shows a visual example (before/after images)
- Gradient background or accent color
- Prominent CTA button

### Option 2: Minimalist Highlight
- Subtle highlighted card
- Icon + description
- Quick action button
- Cleaner, less prominent

### Option 3: Rotating Featured Features
- Carousel/swiper of multiple featured items
- Users can swipe through examples
- Each shows a different transformation
- More engaging but more complex

## Implementation Recommendations

1. **Position**: Place directly after MainHeader, before the subscription banner ✅
2. **Content**: Feature your most popular/impressive transformation ✅
3. **Visual**: Include before/after images or a compelling preview ✅
4. **CTA**: Make it actionable - tap to try the featured feature ✅
5. **Styling**: Use gradient or accent background to distinguish it ✅
6. **Responsive**: Ensure it looks good on all screen sizes ✅

## Implementation Details

### Component Created: `FeaturedBlock.tsx`

The component includes:
- **Gradient Background**: Subtle gradient from primary color to surface
- **Featured Badge**: "⭐ FEATURED" label at the top
- **Icon & Title**: Large icon with feature name and description
- **Before/After Preview**: Visual representation with placeholder icons showing transformation
- **CTA Button**: Prominent action button to try the featured feature

### Integration

The `FeaturedBlock` component has been integrated into `FeaturesScreen.tsx`:
- Positioned at the top of the ScrollView (after header, before subscription banner)
- Features the first item from `PHASE1_FEATURES` (Transform mode)
- On press, navigates to Camera screen with the featured edit mode pre-selected
- Fully theme-aware and responsive

### Component Structure

```
<FeaturedBlock>
  <LinearGradient>
    <FeaturedLabel> ⭐ FEATURED </FeaturedLabel>
    <IconTitleRow>
      <IconContainer />
      <TitleContainer />
    </IconTitleRow>
    <PreviewContainer>
      <BeforeAfterRow>
        <PreviewBox> Before 📷 </PreviewBox>
        <Arrow> → </Arrow>
        <PreviewBox> After ✨ </PreviewBox>
      </BeforeAfterRow>
    </PreviewContainer>
    <CTAButton> Try [Feature] Now </CTAButton>
  </LinearGradient>
</FeaturedBlock>
```

### Customization Options

To change the featured feature, simply pass a different `editMode` prop:
```tsx
<FeaturedBlock
  editMode={EditMode.REMOVE_BACKGROUND}  // Change this
  onPress={handlePress}
/>
```
