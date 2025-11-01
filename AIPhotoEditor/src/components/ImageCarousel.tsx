import React, { useRef, useState } from 'react';
import { View, FlatList, ImageSourcePropType, Dimensions, StyleSheet, Text, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useTheme } from '../theme';
import { ZoomableImage } from './ZoomableImage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ImageCarouselProps {
  images: Array<{
    source: ImageSourcePropType | { uri: string };
    caption?: string;
    step?: string;
  }>;
  imageHeight?: number;
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  imageHeight = 240
}) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const CARD_PADDING = spacing.base;
  const CARD_WIDTH = SCREEN_WIDTH - (CARD_PADDING * 2);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  const renderItem = ({ item }: { item: typeof images[0] }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={[styles.card, { paddingHorizontal: CARD_PADDING }]}>
        {/* Image Container */}
        <View style={[styles.imageContainer, { height: imageHeight }]}>
          {/* Step Badge Overlay */}
          {item.step && (
            <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.stepText, { color: colors.background }]}>
                {item.step}
              </Text>
            </View>
          )}

          {/* Image */}
          <ZoomableImage
            source={item.source}
            thumbnailResizeMode="contain"
            thumbnailStyle={styles.image}
          />
        </View>

        {/* Caption */}
        {item.caption && (
          <Text
            style={[
              styles.caption,
              {
                color: colors.textSecondary,
                fontSize: typography.scaled.sm,
              },
            ]}
            numberOfLines={2}
          >
            {item.caption}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Carousel */}
      <FlatList
        ref={flatListRef}
        data={images}
        renderItem={renderItem}
        keyExtractor={(_, index) => `carousel-image-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="center"
        bounces={false}
      />

      {/* Pagination Dots */}
      {images.length > 1 && (
        <View style={[styles.pagination, { marginTop: spacing.sm }]}>
          {images.map((_, index) => {
            const isActive = activeIndex === index;
            return (
              <View
                key={`dot-${index}`}
                style={[
                  styles.dot,
                  {
                    backgroundColor: isActive ? colors.primary : colors.border,
                    width: isActive ? 24 : 8,
                    opacity: isActive ? 1 : 0.5,
                  },
                ]}
              />
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  slide: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  stepBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  stepText: {
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  caption: {
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    transition: 'all 0.3s ease',
  },
});
