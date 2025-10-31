import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput, Modal, ScrollView, Dimensions, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';

const { width } = Dimensions.get('window');

interface ColorPickerProps {
  visible: boolean;
  initialColor?: string;
  onColorSelect: (color: string) => void;
  onClose: () => void;
}

// Predefined color palette
const COLOR_PALETTE = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#FFC0CB', '#A52A2A', '#808080', '#000080', '#008000',
  '#800000', '#FFD700', '#4B0082', '#FF6347', '#40E0D0',
];

const ColorPicker: React.FC<ColorPickerProps> = ({
  visible,
  initialColor = '#FFFFFF',
  onColorSelect,
  onClose,
}) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [hexInput, setHexInput] = useState(initialColor.replace('#', '').toUpperCase());

  // Sync state when initialColor changes or modal opens
  useEffect(() => {
    if (visible) {
      const color = initialColor || '#FFFFFF';
      setSelectedColor(color);
      setHexInput(color.replace('#', '').toUpperCase());
    }
  }, [visible, initialColor]);

  const handleColorSelect = useCallback((color: string) => {
    haptic.light();
    setSelectedColor(color);
    setHexInput(color.replace('#', '').toUpperCase());
  }, []);

  const handleHexInputChange = useCallback((text: string) => {
    // Remove # and any invalid characters, convert to uppercase
    const cleaned = text.replace(/[^0-9A-Fa-f]/g, '').toUpperCase().slice(0, 6);
    setHexInput(cleaned);
    
    if (cleaned.length === 6) {
      const newColor = `#${cleaned}`;
      setSelectedColor(newColor);
    }
  }, []);

  const handleConfirm = useCallback(() => {
    haptic.medium();
    // Allow 'transparent' as a valid selection
    const finalColor = selectedColor === 'transparent' 
      ? 'transparent' 
      : (hexInput.length === 6 ? `#${hexInput}` : selectedColor);
    onColorSelect(finalColor);
    onClose();
  }, [hexInput, selectedColor, onColorSelect, onClose]);

  const isValidHex = selectedColor === 'transparent' || (hexInput.length === 6 && /^[0-9A-F]{6}$/i.test(hexInput));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <SafeAreaView style={styles.modalContent} edges={['bottom']}>
          <View style={[styles.container, { backgroundColor: colors.surface }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Text style={[styles.headerTitle, { color: colors.text, fontSize: typography.scaled.lg, fontWeight: typography.weight.bold }]}>
                Select Color
              </Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Color Preview */}
              <View style={styles.previewSection}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: typography.scaled.sm }]}>
                  Preview
                </Text>
                <View style={[
                  styles.colorPreview, 
                  { 
                    backgroundColor: selectedColor === 'transparent' 
                      ? 'transparent' 
                      : (isValidHex && selectedColor !== 'transparent' ? `#${hexInput}` : selectedColor),
                    borderWidth: selectedColor === 'transparent' ? 1 : 0,
                    borderColor: colors.border,
                    borderStyle: selectedColor === 'transparent' ? 'dashed' : 'solid',
                  }
                ]} />
              </View>

              {/* Hex Input */}
              <View style={styles.hexSection}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: typography.scaled.sm }]}>
                  Hex Color Code
                </Text>
                <View style={[styles.hexInputContainer, { backgroundColor: colors.backgroundSecondary, borderColor: isValidHex ? colors.primary : colors.border }]}>
                  <Text style={[styles.hexPrefix, { color: colors.text, fontSize: typography.scaled.base }]}>#</Text>
                  <TextInput
                    style={[styles.hexInput, { color: colors.text, fontSize: typography.scaled.base }]}
                    value={hexInput}
                    onChangeText={handleHexInputChange}
                    placeholder="FFFFFF"
                    placeholderTextColor={colors.textSecondary}
                    maxLength={6}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Color Palette */}
              <View style={styles.paletteSection}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: typography.scaled.sm }]}>
                  Quick Colors
                </Text>
                <View style={styles.paletteGrid}>
                  {/* Transparent Option */}
                  <TouchableOpacity
                    style={[
                      styles.colorSwatch,
                      {
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: selectedColor === 'transparent' ? colors.primary : colors.border,
                        borderWidth: selectedColor === 'transparent' ? 3 : 1,
                        borderStyle: 'dashed',
                      },
                    ]}
                    onPress={() => handleColorSelect('transparent')}
                    activeOpacity={0.7}
                  >
                    {selectedColor === 'transparent' && (
                      <Ionicons name="checkmark" size={16} color={colors.primary} />
                    )}
                    <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: '500' }}>None</Text>
                  </TouchableOpacity>
                  {COLOR_PALETTE.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorSwatch,
                        {
                          backgroundColor: color,
                          borderColor: selectedColor === color ? colors.primary : colors.border,
                          borderWidth: selectedColor === color ? 3 : 1,
                        },
                      ]}
                      onPress={() => handleColorSelect(color)}
                      activeOpacity={0.7}
                    >
                      {selectedColor === color && (
                        <Ionicons name="checkmark" size={16} color={color === '#FFFFFF' || color === '#FFFF00' || color === '#FFD700' ? '#000000' : '#FFFFFF'} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
                ]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, { color: colors.text, fontSize: typography.scaled.base }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  {
                    backgroundColor: isValidHex ? colors.primary : colors.textDisabled,
                  },
                ]}
                onPress={handleConfirm}
                activeOpacity={0.8}
                disabled={!isValidHex}
              >
                <Text style={[styles.buttonText, { color: '#FFFFFF', fontSize: typography.scaled.base, fontWeight: typography.weight.semibold }]}>
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    justifyContent: 'flex-end',
    position: 'relative',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '95%',
    minHeight: '75%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  previewSection: {
    gap: 12,
  },
  sectionLabel: {
    fontWeight: '600',
  },
  colorPreview: {
    width: '100%',
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  hexSection: {
    gap: 12,
  },
  hexInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  hexPrefix: {
    fontWeight: '600',
    marginRight: 8,
  },
  hexInput: {
    flex: 1,
    fontWeight: '600',
    letterSpacing: 1,
  },
  paletteSection: {
    gap: 12,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorSwatch: {
    width: (width - 64) / 5, // 5 columns with padding
    height: (width - 64) / 5,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '500',
  },
});

export default ColorPicker;

