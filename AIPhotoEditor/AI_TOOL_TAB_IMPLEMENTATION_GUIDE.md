# AI Tool Tab Implementation Guide

## Overview

This guide shows you how to add a tabbed interface to your AI tool screens, allowing users to access:
- **Guide Tab**: Step-by-step instructions on how to use the tool
- **Examples Tab**: Visual examples showing before/after results
- **Info Tab**: Technical details and "What This Does" / "How It Works" information

## Components Created

### 1. `TabView` Component (`src/components/TabView.tsx`)
A reusable tabbed interface component that matches your app's design system.

**Features:**
- Smooth animated tab indicator
- Customizable tabs with icons and badges
- Scrollable or fixed content areas
- Theme-aware styling
- Haptic feedback on tab press

### 2. `ToolGuideTab` Component (`src/components/ToolGuideTab.tsx`)
A content component for displaying step-by-step guides.

**Features:**
- Numbered steps with icons
- Pro tips section
- Custom content support

### 3. `ToolExamplesTab` Component (`src/components/ToolExamplesTab.tsx`)
A content component for displaying visual examples.

**Features:**
- Before/after image comparisons
- Single image examples
- Tags for categorization
- Tap to view full-size

## Implementation Example

Here's how to integrate tabs into an AI tool screen (like `PixelArtGamerScreen`):

### Step 1: Import the Components

```typescript
import { TabView, Tab } from '../components/TabView';
import { ToolGuideTab, GuideStep } from '../components/ToolGuideTab';
import { ToolExamplesTab, Example } from '../components/ToolExamplesTab';
```

### Step 2: Replace AIToolInfoCard with TabView

**Before:**
```typescript
<AIToolInfoCard
  icon="game-controller-outline"
  whatDescription="Transform your photo..."
  howDescription="Our AI analyzes..."
  howItems={[...]}
/>
```

**After:**
```typescript
<TabView
  tabs={[
    { id: 'guide', label: 'Guide', icon: 'book-outline' },
    { id: 'examples', label: 'Examples', icon: 'images-outline' },
    { id: 'info', label: 'Info', icon: 'information-circle-outline' },
  ]}
  containerStyle={{ marginHorizontal: spacing.base, marginTop: spacing.lg }}
>
  {/* Guide Tab */}
  <ToolGuideTab
    title="How to Create Pixel Art"
    description="Follow these steps to transform your photo into retro 16-bit game art."
    steps={[
      {
        number: 1,
        title: 'Select Your Photo',
        description: 'Choose a photo from your library or take a new one with the camera.',
        icon: 'camera-outline',
      },
      {
        number: 2,
        title: 'Choose Game Style',
        description: 'Pick from RPG, Platformer, Fighter, Adventure, Arcade, or Indie styles.',
        icon: 'game-controller-outline',
      },
      {
        number: 3,
        title: 'Set Bit Depth',
        description: 'Select 8-bit for classic retro look or 16-bit for more detail.',
        icon: 'grid-outline',
      },
      {
        number: 4,
        title: 'Configure Background',
        description: 'Choose transparent, solid color, gaming scene, or gradient background.',
        icon: 'color-palette-outline',
      },
      {
        number: 5,
        title: 'Generate & Save',
        description: 'Tap "Create Pixel Art Sprite" and wait for AI processing. Save your result!',
        icon: 'checkmark-circle-outline',
      },
    ]}
    tips={[
      'Portrait photos work best for character sprites',
      'Use 16-bit for photos with lots of detail',
      'Transparent backgrounds are great for game integration',
      'RPG style works well for fantasy-themed photos',
    ]}
  />

  {/* Examples Tab */}
  <ToolExamplesTab
    title="Pixel Art Examples"
    examples={[
      {
        id: '1',
        title: 'RPG Character Portrait',
        description: '16-bit RPG style with transparent background',
        beforeImage: 'https://example.com/before1.jpg',
        afterImage: 'https://example.com/after1.jpg',
        tags: ['16-bit', 'RPG', 'Transparent'],
      },
      {
        id: '2',
        title: 'Arcade Style',
        description: '8-bit arcade game character',
        beforeImage: 'https://example.com/before2.jpg',
        afterImage: 'https://example.com/after2.jpg',
        tags: ['8-bit', 'Arcade'],
      },
      // Add more examples...
    ]}
    onExamplePress={(example) => {
      // Handle example tap - e.g., show full-size image
      console.log('Example pressed:', example);
    }}
  />

  {/* Info Tab */}
  <View style={{ padding: spacing.base }}>
    <AIToolInfoCard
      icon="game-controller-outline"
      whatDescription="Transform your photo into a retro 16-bit video game sprite in the style of classic RPG games like Final Fantasy. The sprite will accurately represent you or your subject with authentic pixel art styling, blocky features, and adventure game aesthetics."
      howDescription="Our AI analyzes your reference photo and creates a pixelated character sprite in classic 16-bit RPG style, preserving facial features, clothing, and distinctive characteristics while applying authentic pixel art techniques and retro game aesthetics."
      howItems={[
        { text: 'Accurate representation of your photo' },
        { text: 'Authentic 16-bit pixel art style' },
        { text: 'Classic RPG character presentation' },
      ]}
      expandableWhat={false}
      expandableHow={false}
    />
  </View>
</TabView>
```

### Step 3: Adjust ScrollView Padding

Since the TabView contains scrollable content, you may want to adjust the main ScrollView's `contentContainerStyle`:

```typescript
<ScrollView
  contentContainerStyle={[
    styles.scrollContent,
    localImageUri 
      ? { paddingBottom: 140 + insets.bottom } 
      : { paddingBottom: insets.bottom + spacing.base },
  ]}
>
  {/* ... existing content ... */}
  
  {/* TabView replaces AIToolInfoCard */}
  <TabView ... />
</ScrollView>
```

## Customization Options

### TabView Props

```typescript
interface TabViewProps {
  tabs: Tab[];                    // Array of tab definitions
  children: React.ReactNode[];    // Tab content (one per tab)
  defaultTab?: string;            // Initial active tab ID
  containerStyle?: any;          // Custom container styles
  showIcons?: boolean;            // Show/hide tab icons (default: true)
  scrollable?: boolean;          // Make content scrollable (default: true)
}
```

### ToolGuideTab Props

```typescript
interface ToolGuideTabProps {
  title?: string;                // Section title
  description?: string;           // Overview description
  steps?: GuideStep[];           // Step-by-step instructions
  tips?: string[];               // Pro tips array
  customContent?: React.ReactNode; // Custom content
}
```

### ToolExamplesTab Props

```typescript
interface ToolExamplesTabProps {
  title?: string;                // Section title
  examples?: Example[];          // Array of examples
  onExamplePress?: (example: Example) => void; // Tap handler
  customContent?: React.ReactNode; // Custom content
}
```

## Design Considerations

### Tab Content Height
The TabView has a `maxHeight: 600` by default for scrollable content. Adjust this in `TabView.tsx` based on your needs:

```typescript
scrollContent: {
  flex: 1,
  maxHeight: 600, // Adjust this value
}
```

### Integration with Existing Layout
The TabView is designed to replace or complement the `AIToolInfoCard`. Consider:
- Place it after the configuration options
- Keep it before the action button (ActionButtonBar)
- Ensure proper spacing with other sections

### Content Strategy

**Guide Tab:**
- Keep steps concise (3-7 steps ideal)
- Use descriptive icons
- Include practical tips
- Focus on user actions

**Examples Tab:**
- Use high-quality before/after images
- Include diverse examples showing different styles/options
- Add descriptive tags
- Consider showing tool-specific variations

**Info Tab:**
- Reuse existing AIToolInfoCard content
- Or create custom informational content
- Include technical details if relevant

## Benefits

1. **Better UX**: Organized information is easier to discover
2. **Progressive Disclosure**: Users can access details when needed
3. **Visual Learning**: Examples help users understand tool capabilities
4. **Consistency**: Same pattern across all AI tools
5. **Flexibility**: Easy to customize per tool

## Migration Path

For existing screens:
1. Keep current AIToolInfoCard implementation
2. Add TabView below it as additional content
3. Move AIToolInfoCard content to "Info" tab
4. Add Guide and Examples tabs with new content
5. Remove standalone AIToolInfoCard once tabs are populated

## Example: Complete Integration

See `PixelArtGamerScreen.tsx` example with tabs integrated (after implementation).

## Next Steps

1. **Add Examples**: Create example images for each tool
2. **Write Guides**: Create step-by-step guides for each tool
3. **Test**: Ensure tabs work smoothly with scrolling and navigation
4. **Iterate**: Gather user feedback and refine content

## Troubleshooting

**Tabs not showing:**
- Ensure `tabs.length === children.length`
- Check that TabView is inside ScrollView with proper styling

**Indicator not animating:**
- Verify `tabContainerWidth` is being set (check onLayout)
- Ensure tab container has proper width

**Content not scrolling:**
- Set `scrollable={true}` on TabView
- Check `maxHeight` in styles is appropriate

