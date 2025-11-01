import React from 'react';
import { View, Text, StyleSheet, Image, ImageSourcePropType, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { useTheme } from '../theme';
import { spacing as baseSpacing } from '../theme/spacing';
import { ImageCarousel } from './ImageCarousel';
import { ZoomableImage } from './ZoomableImage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface ToolGuideTabProps {
  title?: string;
  content?: string | React.ReactNode; // Simple text content or custom React node
  images?: Array<{ source: ImageSourcePropType | { uri: string }; caption?: string; step?: string }>;
  customContent?: React.ReactNode;
  carouselMode?: boolean; // If true, display images as swipeable carousel
  imageHeight?: number; // Custom height for carousel images
}

export const ToolGuideTab: React.FC<ToolGuideTabProps> = ({
  title,
  content,
  images = [],
  customContent,
  carouselMode = false,
  imageHeight = 240,
}) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;

  return (
    <View style={styles.container}>
      {/* Images - Show carousel at the top when in carousel mode */}
      {images.length > 0 && (
        carouselMode ? (
          <View style={{ marginBottom: spacing.md }}>
            <ImageCarousel images={images} imageHeight={imageHeight} />
          </View>
        ) : (
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
            {images.map((image, index) => (
              <React.Fragment key={index}>
                <View style={[styles.imageContainer, { height: 300 }]}>
                  <ZoomableImage
                    source={image.source}
                    thumbnailResizeMode="contain"
                    thumbnailStyle={styles.image}
                  />
                </View>
                {image.caption && (
                  <Text
                    style={[
                      styles.caption,
                      {
                        color: colors.textTertiary,
                        fontSize: typography.scaled.xs,
                        marginTop: spacing.md,
                        marginBottom: spacing.xl,
                      },
                    ]}
                  >
                    {image.caption}
                  </Text>
                )}
              </React.Fragment>
            ))}
          </View>
        )
      )}

      {title && (
        <Text
          style={[
            styles.title,
            {
              color: colors.text,
              fontSize: typography.scaled.xl,
              fontWeight: typography.weight.bold,
              marginBottom: spacing.lg,
              paddingHorizontal: spacing.xl,
              letterSpacing: 0.3,
            },
          ]}
        >
          {title}
        </Text>
      )}

      {/* Text Content */}
      {content && (
        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }}>
          {typeof content === 'string' ? (
            <View>
              {content.split('\n').map((line, index, array) => {
                const trimmed = line.trim();
                const isEmpty = trimmed.length === 0;
                const prevLine = index > 0 ? array[index - 1]?.trim() : '';
                const isParagraphBreak = isEmpty && prevLine.length > 0;

                if (isParagraphBreak) {
                  return <View key={`spacer-${index}`} style={{ height: spacing.md }} />;
                }

                if (isEmpty) {
                  return null;
                }

                return (
                  <Text
                    key={index}
                    style={[
                      styles.content,
                      {
                        color: colors.textSecondary,
                        fontSize: typography.scaled.sm,
                        lineHeight: 24,
                        letterSpacing: 0.1,
                      },
                    ]}
                  >
                    {trimmed}
                  </Text>
                );
              })}
            </View>
          ) : (
            content
          )}
        </View>
      )}

      {/* Custom Content */}
      {customContent && <View style={{ marginTop: spacing.md, paddingHorizontal: spacing.base, paddingBottom: spacing.base }}>{customContent}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: baseSpacing.base,
  },
  title: {
    // Dynamic styles applied inline
  },
  content: {
    // Dynamic styles applied inline
  },
  imagesContainer: {
    // Container for images
  },
  imageContainer: {
    overflow: 'hidden',
    borderRadius: 20,
  },
  imageWrapper: {
    // No longer used
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 20,
  },
  caption: {
    textAlign: 'center',
    // Dynamic styles applied inline
  },
});

