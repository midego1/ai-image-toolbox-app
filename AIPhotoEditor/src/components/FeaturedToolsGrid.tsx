import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { ImageSourcePropType } from 'react-native';
import { useTheme } from '../theme';
import { FeatureImageCard } from './FeatureImageCard';
import { EditMode, EditModeCategory, getEditMode } from '../constants/editModes';

interface FeaturedTool {
  id: string;
  name: string;
  editMode: EditMode;
  screen: string;
  imageSource: ImageSourcePropType | null;
}

interface FeaturedToolsGridProps {
  onToolPress: (tool: FeaturedTool) => void;
  isPremium: boolean;
}

// Image loaders
const getPopFigureImageSource = () => {
  try {
    return require('../../assets/images/pop-figure/modelcard_popfigure.jpg');
  } catch {
    return null;
  }
};

const getPixelArtImageSource = () => {
  try {
    return require('../../assets/images/pixel-art/modelcard_pixelart.jpg');
  } catch {
    return null;
  }
};

const getRemoveBackgroundImageSource = () => {
  try {
    return require('../../assets/images/remove-background/modelcard_removebg.png');
  } catch {
    return null;
  }
};

const getReplaceBackgroundImageSource = () => {
  try {
    return require('../../assets/images/replace-background/modelcard_replacebg.jpg');
  } catch {
    return null;
  }
};

const getStyleTransferImageSource = () => {
  try {
    return require('../../assets/images/style-transfer/modelcard_styletransfer.jpg');
  } catch {
    return null;
  }
};

const getVirtualTryOnImageSource = () => {
  try {
    return require('../../assets/images/virtual-try-on/modelcard_virtualtryon.jpg');
  } catch {
    return null;
  }
};

const getUpscaleImageSource = () => {
  try {
    return require('../../assets/images/upscale/modelcard_upscale.png');
  } catch {
    return null;
  }
};

const getTransformImageSource = () => {
  try {
    return require('../../assets/images/transform/modelcard_transform.jpg');
  } catch {
    return null;
  }
};

const getGhiblifyImageSource = () => {
  try {
    return require('../../assets/images/ghiblify/modelcard_ghiblify.jpg');
  } catch {
    return null;
  }
};

export const FeaturedToolsGrid: React.FC<FeaturedToolsGridProps> = ({ onToolPress, isPremium }) => {
  const { theme } = useTheme();
  const { spacing } = theme;

  const popFigureImageSource = useMemo(() => getPopFigureImageSource(), []);
  const pixelArtImageSource = useMemo(() => getPixelArtImageSource(), []);
  const removeBackgroundImageSource = useMemo(() => getRemoveBackgroundImageSource(), []);
  const replaceBackgroundImageSource = useMemo(() => getReplaceBackgroundImageSource(), []);
  const styleTransferImageSource = useMemo(() => getStyleTransferImageSource(), []);
  const virtualTryOnImageSource = useMemo(() => getVirtualTryOnImageSource(), []);
  const upscaleImageSource = useMemo(() => getUpscaleImageSource(), []);
  const transformImageSource = useMemo(() => getTransformImageSource(), []);
  const ghiblifyImageSource = useMemo(() => getGhiblifyImageSource(), []);

  // Organize featured tools by category to match the categorization
  const featuredToolsByCategory: Record<string, FeaturedTool[]> = {
    [EditModeCategory.TRANSFORM]: [
      {
        id: 'transform',
        name: 'Transform',
        editMode: EditMode.TRANSFORM,
        screen: 'GenreSelection',
        imageSource: transformImageSource,
      },
      {
        id: 'ghiblify',
        name: 'Ghiblify',
        editMode: EditMode.GHIBLIFY,
        screen: 'Ghiblify',
        imageSource: ghiblifyImageSource,
      },
      {
        id: 'pop-figure',
        name: 'Pop Figure',
        editMode: EditMode.POP_FIGURE,
        screen: 'PopFigure',
        imageSource: popFigureImageSource,
      },
      {
        id: 'pixel-art',
        name: 'Pixel Art',
        editMode: EditMode.PIXEL_ART_GAMER,
        screen: 'PixelArtGamer',
        imageSource: pixelArtImageSource,
      },
    ],
    [EditModeCategory.EDIT]: [
      {
        id: 'remove-bg',
        name: 'Remove Background',
        editMode: EditMode.REMOVE_BACKGROUND,
        screen: 'RemoveBackground',
        imageSource: removeBackgroundImageSource,
      },
      {
        id: 'replace-bg',
        name: 'Replace Background',
        editMode: EditMode.REPLACE_BACKGROUND,
        screen: 'ReplaceBackground',
        imageSource: replaceBackgroundImageSource,
      },
      {
        id: 'virtual-try-on',
        name: 'Virtual Try-On',
        editMode: EditMode.VIRTUAL_TRY_ON,
        screen: 'VirtualTryOnSelection',
        imageSource: virtualTryOnImageSource,
      },
    ],
    [EditModeCategory.ENHANCE]: [
      {
        id: 'enhance',
        name: 'Upscale',
        editMode: EditMode.ENHANCE,
        screen: 'Upscale',
        imageSource: upscaleImageSource,
      },
    ],
    [EditModeCategory.STYLIZE]: [
      {
        id: 'style-transfer',
        name: 'Style Transfer',
        editMode: EditMode.STYLE_TRANSFER,
        screen: 'StyleTransfer',
        imageSource: styleTransferImageSource,
      },
    ],
  };

  const categoryOrder = [
    EditModeCategory.TRANSFORM,
    EditModeCategory.EDIT,
    EditModeCategory.ENHANCE,
    EditModeCategory.STYLIZE,
  ];

  // Flatten all tools into a single array for grid view (no categories)
  const allTools = useMemo(() => {
    return categoryOrder.flatMap(category => {
      const tools = featuredToolsByCategory[category];
      return tools || [];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transformImageSource, ghiblifyImageSource, popFigureImageSource, pixelArtImageSource, removeBackgroundImageSource, replaceBackgroundImageSource, virtualTryOnImageSource, upscaleImageSource, styleTransferImageSource]);

  return (
    <View style={[styles.container, { marginHorizontal: spacing.base, marginBottom: spacing.lg }]}>
      <View style={styles.grid}>
        {allTools.map((tool, index) => {
          // Group tools into rows of 2
          if (index % 2 === 0) {
            const rowTools = allTools.slice(index, index + 2);
            return (
              <View key={`row-${index}`} style={styles.row}>
                {rowTools.map((t) => {
                  const mode = getEditMode(t.editMode);
                  return (
                    <FeatureImageCard
                      key={t.id}
                      imageSource={t.imageSource}
                      name={t.name}
                      editMode={t.editMode}
                      isPremium={isPremium}
                      onPress={() => onToolPress(t)}
                    />
                  );
                })}
                {/* Fill empty space if odd number of tools */}
                {rowTools.length === 1 && <View style={styles.emptyCard} />}
              </View>
            );
          }
          return null;
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  grid: {
    paddingHorizontal: 0,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  emptyCard: {
    flex: 1,
  },
});

