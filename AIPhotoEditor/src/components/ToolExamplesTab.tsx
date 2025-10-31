import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { spacing as baseSpacing } from '../theme/spacing';
import { ZoomableImage } from './ZoomableImage';
import { haptic } from '../utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface Example {
  id: string;
  title: string;
  description?: string;
  beforeImage?: string;
  afterImage?: string;
  image?: string; // Single image if before/after not available
  tags?: string[];
}

export interface ToolExamplesTabProps {
  title?: string;
  examples?: Example[];
  onExamplePress?: (example: Example) => void;
  customContent?: React.ReactNode;
}

export const ToolExamplesTab: React.FC<ToolExamplesTabProps> = ({
  title = 'Examples',
  examples = [],
  onExamplePress,
  customContent,
}) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  const handleImagePress = (uri: string, example: Example) => {
    haptic.light();
    setSelectedImageUri(uri);
    setShowImageModal(true);
    onExamplePress?.(example);
  };

  const renderExampleImage = (example: Example, index: number) => {
    const hasBeforeAfter = example.beforeImage && example.afterImage;
    const imageUri = example.image || example.afterImage || example.beforeImage;

    if (!imageUri) return null;

    if (hasBeforeAfter && example.beforeImage && example.afterImage) {
      return (
        <View key={example.id || index} style={{ marginBottom: spacing.md }}>
          <TouchableOpacity
            onPress={() => handleImagePress(example.beforeImage!, example)}
            activeOpacity={0.9}
            style={styles.imageCard}
          >
            <Image
              source={{ uri: example.beforeImage }}
              style={styles.exampleImage}
              resizeMode="cover"
            />
            <View style={[styles.imageOverlay, { backgroundColor: colors.surface + 'E6' }]}>
              <Text style={[styles.imageLabel, { color: colors.text, fontSize: typography.scaled.sm, fontWeight: typography.weight.medium }]}>
                Before
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => handleImagePress(example.afterImage!, example)}
            activeOpacity={0.9}
            style={[styles.imageCard, { marginTop: spacing.sm }]}
          >
            <Image
              source={{ uri: example.afterImage }}
              style={styles.exampleImage}
              resizeMode="cover"
            />
            <View style={[styles.imageOverlay, { backgroundColor: colors.surface + 'E6' }]}>
              <Text style={[styles.imageLabel, { color: colors.text, fontSize: typography.scaled.sm, fontWeight: typography.weight.medium }]}>
                After
              </Text>
            </View>
          </TouchableOpacity>
          
          {example.title && (
            <View style={styles.imageInfo}>
              <Text style={[styles.imageTitle, { color: colors.text, fontSize: typography.scaled.sm, fontWeight: typography.weight.semibold }]}>
                {example.title}
              </Text>
              {example.description && (
                <Text style={[styles.imageDescription, { color: colors.textSecondary, fontSize: typography.scaled.xs, marginTop: spacing.xs / 2 }]}>
                  {example.description}
                </Text>
              )}
            </View>
          )}
        </View>
      );
    }

    return (
      <TouchableOpacity
        key={example.id || index}
        onPress={() => handleImagePress(imageUri, example)}
        activeOpacity={0.9}
        style={[styles.imageCard, { marginBottom: spacing.md }]}
      >
        <Image
          source={{ uri: imageUri }}
          style={styles.exampleImage}
          resizeMode="cover"
        />
        {(example.title || example.description) && (
          <View style={[styles.imageInfo, { backgroundColor: colors.surface }]}>
            {example.title && (
              <Text style={[styles.imageTitle, { color: colors.text, fontSize: typography.scaled.sm, fontWeight: typography.weight.semibold }]}>
                {example.title}
              </Text>
            )}
            {example.description && (
              <Text style={[styles.imageDescription, { color: colors.textSecondary, fontSize: typography.scaled.xs, marginTop: spacing.xs / 2 }]}>
                {example.description}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

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

      {examples.length === 0 && !customContent && (
        <View style={[styles.emptyState, { backgroundColor: colors.backgroundSecondary, marginHorizontal: spacing.base, marginTop: spacing.base }]}>
          <Ionicons name="images-outline" size={48} color={colors.textTertiary} />
          <Text
            style={[
              styles.emptyStateText,
              {
                color: colors.textSecondary,
                fontSize: typography.scaled.sm,
                marginTop: spacing.sm,
              },
            ]}
          >
            No examples available yet
          </Text>
        </View>
      )}

      {examples.length > 0 && (
        <ScrollView
          style={styles.examplesScrollView}
          contentContainerStyle={[styles.examplesList, { paddingHorizontal: spacing.base, paddingTop: title ? 0 : spacing.base, paddingBottom: spacing.base }]}
          showsVerticalScrollIndicator={false}
        >
          {examples.map((example, index) => renderExampleImage(example, index))}
        </ScrollView>
      )}

      {customContent && <View style={{ marginTop: spacing.md, paddingHorizontal: spacing.base, paddingBottom: spacing.base }}>{customContent}</View>}

      {/* Image Preview Modal with ZoomableImage */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          haptic.light();
          setShowImageModal(false);
          setSelectedImageUri(null);
        }}
        statusBarTranslucent
      >
        {selectedImageUri && (
          <ZoomableImage
            uri={selectedImageUri}
            onClose={() => {
              haptic.light();
              setShowImageModal(false);
              setSelectedImageUri(null);
            }}
          />
        )}
      </Modal>
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
  examplesScrollView: {
    flex: 1,
  },
  examplesList: {
    // Container for examples
  },
  imageCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  exampleImage: {
    width: '100%',
    height: 280,
    borderRadius: 16,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: baseSpacing.sm,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  imageLabel: {
    // Dynamic styles applied inline
  },
  imageInfo: {
    padding: baseSpacing.base,
    paddingTop: baseSpacing.sm,
  },
  imageTitle: {
    // Dynamic styles applied inline
  },
  imageDescription: {
    // Dynamic styles applied inline
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: baseSpacing.xl,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyStateText: {
    // Dynamic styles applied inline
  },
});

