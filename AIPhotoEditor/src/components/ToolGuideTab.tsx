import React from 'react';
import { View, Text, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { useTheme } from '../theme';
import { spacing as baseSpacing } from '../theme/spacing';

export interface ToolGuideTabProps {
  title?: string;
  content?: string | React.ReactNode; // Simple text content or custom React node
  images?: Array<{ source: ImageSourcePropType | { uri: string }; caption?: string }>;
  customContent?: React.ReactNode;
}

export const ToolGuideTab: React.FC<ToolGuideTabProps> = ({
  title,
  content,
  images = [],
  customContent,
}) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;

  return (
    <View style={styles.container}>
      {title && (
        <Text
          style={[
            styles.title,
            {
              color: colors.text,
              fontSize: typography.scaled.base,
              fontWeight: typography.weight.bold,
              marginBottom: spacing.md,
              paddingHorizontal: spacing.base,
              paddingTop: spacing.base,
            },
          ]}
        >
          {title}
        </Text>
      )}

      {/* Text Content */}
      {content && (
        <View style={{ marginBottom: spacing.md, paddingHorizontal: spacing.base, paddingTop: title ? 0 : spacing.base }}>
          {typeof content === 'string' ? (
            <View>
              {content.split('\n').map((line, index, array) => {
                const trimmed = line.trim();
                const isEmpty = trimmed.length === 0;
                const prevLine = index > 0 ? array[index - 1]?.trim() : '';
                const isParagraphBreak = isEmpty && prevLine.length > 0;
                
                if (isParagraphBreak) {
                  // This empty line represents a paragraph break (was \n\n)
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

      {/* Images */}
      {images.length > 0 && (
        <View style={[styles.imagesContainer, { paddingHorizontal: spacing.base }]}>
          {images.map((image, index) => (
            <View key={index} style={[styles.imageWrapper, { marginBottom: spacing.md }]}>
              <Image
                source={image.source}
                style={styles.image}
                resizeMode="cover"
              />
              {image.caption && (
                <Text
                  style={[
                    styles.caption,
                    {
                      color: colors.textTertiary,
                      fontSize: typography.scaled.xs,
                      marginTop: spacing.xs,
                    },
                  ]}
                >
                  {image.caption}
                </Text>
              )}
            </View>
          ))}
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
  imageWrapper: {
    // Wrapper for each image
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  caption: {
    textAlign: 'center',
    // Dynamic styles applied inline
  },
});

