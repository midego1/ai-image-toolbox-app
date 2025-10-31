/**
 * EXAMPLE: How to integrate TabView into an AI tool screen
 * 
 * This shows how to replace or complement AIToolInfoCard with a tabbed interface
 * containing Guide, Examples, and Info tabs.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TabView, Tab } from './TabView';
import { ToolGuideTab, GuideStep } from './ToolGuideTab';
import { ToolExamplesTab, Example } from './ToolExamplesTab';
import { AIToolInfoCard } from './AIToolInfoCard';
import { useTheme } from '../theme';
import { spacing as baseSpacing } from '../theme/spacing';

/**
 * Example: TabView integration for Pixel Art Gamer tool
 * Replace the AIToolInfoCard section in PixelArtGamerScreen with this
 */
export const PixelArtGamerTabSection = () => {
  const { theme } = useTheme();
  const { spacing } = theme;

  // Define guide steps
  const guideSteps: GuideStep[] = [
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
  ];

  // Define examples (you would use real image URIs)
  const examples: Example[] = [
    {
      id: '1',
      title: 'RPG Character Portrait',
      description: '16-bit RPG style with transparent background',
      beforeImage: 'https://example.com/before1.jpg', // Replace with real URIs
      afterImage: 'https://example.com/after1.jpg',
      tags: ['16-bit', 'RPG', 'Transparent'],
    },
    {
      id: '2',
      title: 'Arcade Style Character',
      description: '8-bit arcade game character with neon background',
      beforeImage: 'https://example.com/before2.jpg',
      afterImage: 'https://example.com/after2.jpg',
      tags: ['8-bit', 'Arcade'],
    },
    // Add more examples as needed
  ];

  return (
    <View style={{ marginHorizontal: spacing.base, marginTop: spacing.lg }}>
      <TabView
        tabs={[
          { id: 'guide', label: 'Guide', icon: 'book-outline' },
          { id: 'examples', label: 'Examples', icon: 'images-outline' },
          { id: 'info', label: 'Info', icon: 'information-circle-outline' },
        ]}
        defaultTab="guide"
      >
        {/* Tab 1: Guide */}
        <ToolGuideTab
          title="How to Create Pixel Art"
          description="Follow these steps to transform your photo into retro 16-bit game art."
          steps={guideSteps}
          tips={[
            'Portrait photos work best for character sprites',
            'Use 16-bit for photos with lots of detail',
            'Transparent backgrounds are great for game integration',
            'RPG style works well for fantasy-themed photos',
          ]}
        />

        {/* Tab 2: Examples */}
        <ToolExamplesTab
          title="Pixel Art Examples"
          examples={examples}
          onExamplePress={(example) => {
            // Handle example tap - could show full-size image modal
            console.log('Example pressed:', example.title);
          }}
        />

        {/* Tab 3: Info */}
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
    </View>
  );
};

/**
 * Usage in your screen:
 * 
 * Replace this section in PixelArtGamerScreen.tsx:
 * 
 * // OLD:
 * <AIToolInfoCard
 *   icon="game-controller-outline"
 *   whatDescription="..."
 *   howDescription="..."
 *   howItems={[...]}
 * />
 * 
 * // NEW:
 * <PixelArtGamerTabSection />
 * 
 * OR inline:
 * <TabView tabs={[...]} defaultTab="guide">
 *   <ToolGuideTab ... />
 *   <ToolExamplesTab ... />
 *   <View><AIToolInfoCard ... /></View>
 * </TabView>
 */

