import React, { useMemo } from 'react';
import { View, StyleSheet, Image, ImageSourcePropType, Text } from 'react-native';
import { useTheme } from '../theme';
import { Card } from './Card';
import { EditMode, EditModeCategory, getEditMode } from '../constants/editModes';

interface FeaturedTool {
  id: string;
  name: string;
  editMode: EditMode;
  screen: string;
  imageSource: ImageSourcePropType | null;
}

interface FeaturedToolsListProps {
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

export const FeaturedToolsList: React.FC<FeaturedToolsListProps> = ({ onToolPress, isPremium }) => {
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

  const categoryNames: Record<string, string> = {
    [EditModeCategory.TRANSFORM]: '🎨 TRANSFORM',
    [EditModeCategory.EDIT]: '✏️ EDIT',
    [EditModeCategory.ENHANCE]: '✨ UPSCALE',
    [EditModeCategory.STYLIZE]: '🖌️ STYLIZE',
  };

  return (
    <View style={[styles.container, { marginHorizontal: spacing.base, marginBottom: spacing.lg }]}>
      {categoryOrder.map((category) => {
        const tools = featuredToolsByCategory[category];
        if (!tools || tools.length === 0) return null;

        return (
          <View key={category} style={styles.categoryGroup}>
            <Text style={[styles.categoryHeader, { color: theme.colors.text, marginBottom: spacing.sm }]}>
              {categoryNames[category]}
            </Text>
            <View style={styles.listContainer}>
              {tools.map((tool, index) => {
                const mode = getEditMode(tool.editMode);
                const isLocked = mode?.isPremium && !isPremium;
                
                return (
                  <Card
                    key={tool.id}
                    icon={
                      tool.imageSource ? (
                        <View style={styles.iconImageContainer}>
                          <Image
                            source={tool.imageSource}
                            style={styles.iconImage}
                            resizeMode="cover"
                          />
                        </View>
                      ) : (
                        '🎨'
                      )
                    }
                    title={tool.name}
                    subtitle={mode?.description || ''}
                    showPremiumBadge={mode?.isPremium}
                    rightIcon={isLocked ? 'lock' : undefined}
                    showChevron={false}
                    disabled={isLocked}
                    onPress={() => onToolPress(tool)}
                    iconColor={theme.colors.primary}
                    isFirstInGroup={index === 0}
                    isLastInGroup={index === tools.length - 1}
                    showSeparator={index < tools.length - 1}
                  />
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  categoryGroup: {
    marginBottom: 24,
  },
  categoryHeader: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 16,
  },
  listContainer: {
    paddingHorizontal: 0,
  },
  iconImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
  },
  iconImage: {
    width: '100%',
    height: '100%',
  },
});

