import { OptionsSchema } from './OptionsUsed';
import { EditMode } from '../constants/editModes';

/**
 * Helper function to format labels (capitalize first letter)
 */
const formatLabel = (value?: string, fallback: string = ''): string => {
  const v = (value || fallback).toString();
  return v.length ? v.charAt(0).toUpperCase() + v.slice(1) : '';
};

/**
 * Format pixel art background style
 */
const formatBackgroundStyle = (style?: string): string => {
  if (!style) return '';
  const styleMap: Record<string, string> = {
    'scene': 'Game Scene',
    'color': 'Color',
    'gradient': 'Gradient',
    'transparent': 'Transparent',
    'solid': 'Solid',
  };
  return styleMap[style] || formatLabel(style);
};

/**
 * Format style preset names (e.g., "van_gogh" -> "Van Gogh")
 */
const formatStylePreset = (presetId?: string): string => {
  if (!presetId) return '';
  const presetMap: Record<string, string> = {
    'van_gogh': 'Van Gogh',
    'picasso': 'Picasso',
    'monet': 'Monet',
    'watercolor': 'Watercolor',
    'oil_painting': 'Oil Painting',
    'sketch': 'Sketch',
  };
  return presetMap[presetId] || formatLabel(presetId);
};

/**
 * Get options schema for a specific edit mode
 */
export const getOptionsSchema = (editMode: EditMode): OptionsSchema | null => {
  switch (editMode) {
    case EditMode.PIXEL_ART_GAMER:
      return {
        fields: [
          {
            key: 'bitDepth',
            label: 'Bit Depth',
            icon: 'grid-outline',
            formatValue: (v) => v === '8-bit' ? '8-bit (NES)' : '16-bit (SNES)',
            formatPreview: (v) => v === '8-bit' ? '8-bit' : '16-bit',
          },
          {
            key: 'gameStyle',
            label: 'Game Style',
            icon: 'game-controller-outline',
            formatValue: formatLabel,
            formatPreview: formatLabel,
          },
          {
            key: 'backgroundStyle',
            label: 'Background',
            icon: 'image-outline',
            formatValue: formatBackgroundStyle,
            formatPreview: formatBackgroundStyle,
            nestedFields: [
              {
                key: 'sceneType',
                label: 'Type',
                icon: 'grid-outline',
                formatValue: formatLabel,
                showCondition: (config) => config.backgroundStyle === 'scene',
              },
              {
                key: 'gradientType',
                label: 'Gradient',
                icon: 'color-palette-outline',
                formatValue: formatLabel,
                showCondition: (config) => config.backgroundStyle === 'gradient',
              },
            ],
            nestedCondition: (config) => {
              const bgStyle = config.backgroundStyle;
              return bgStyle === 'scene' || bgStyle === 'gradient';
            },
          },
        ],
      };

    case EditMode.TRANSFORM:
      return {
        fields: [
          {
            key: 'stylePreset',
            label: 'Style',
            icon: 'brush-outline',
            formatValue: formatStylePreset,
            formatPreview: formatStylePreset,
          },
          {
            key: 'intensity',
            label: 'Intensity',
            icon: 'options-outline',
            formatValue: (v) => v != null ? `${Math.round(v * 100)}%` : '',
            formatPreview: (v) => v != null ? `${Math.round(v * 100)}%` : '',
            showInPreview: false,
          },
        ],
      };

    case EditMode.REPLACE_BACKGROUND:
      return {
        fields: [
          {
            key: 'backgroundType',
            label: 'Background Type',
            icon: 'image-outline',
            formatValue: formatLabel,
            formatPreview: formatLabel,
          },
          {
            key: 'backgroundText',
            label: 'Custom Text',
            icon: 'text-outline',
            formatValue: (v) => v || '',
            formatPreview: (v) => v || '',
            showInPreview: false,
          },
        ],
      };

    case EditMode.STYLE_TRANSFER:
      return {
        fields: [
          {
            key: 'stylePreset',
            label: 'Style',
            icon: 'brush-outline',
            formatValue: formatStylePreset,
            formatPreview: formatStylePreset,
          },
          {
            key: 'styleImageUri',
            label: 'Style Source',
            icon: 'image-outline',
            formatValue: (v, config) => v && !config.stylePreset ? 'Custom Image' : '',
            formatPreview: () => '',
            showInPreview: false,
          },
          {
            key: 'styleStrength',
            label: 'Style Strength',
            icon: 'pulse-outline',
            formatValue: (v) => {
              if (v == null) return '';
              const strength = v > 0.75 ? 'Strong' : v > 0.5 ? 'Moderate' : v > 0.25 ? 'Subtle' : 'Light';
              return `${strength} (${Math.round(v * 100)}%)`;
            },
            formatPreview: (v) => v != null ? `${Math.round(v * 100)}%` : '',
            showInPreview: false,
          },
        ],
      };

    case EditMode.FILTERS:
      return {
        fields: [
          {
            key: 'filterPreset',
            label: 'Filter',
            icon: 'color-filter-outline',
            formatValue: formatLabel,
            formatPreview: formatLabel,
          },
          {
            key: 'intensity',
            label: 'Intensity',
            icon: 'options-outline',
            formatValue: (v) => v != null ? `${Math.round(v * 100)}%` : '',
            formatPreview: (v) => v != null ? `${Math.round(v * 100)}%` : '',
            showInPreview: false,
          },
        ],
      };

    case EditMode.ENHANCE:
      return {
        fields: [
          {
            key: 'enhancementType',
            label: 'Enhancement',
            icon: 'sparkles-outline',
            formatValue: formatLabel,
            formatPreview: formatLabel,
          },
          {
            key: 'strength',
            label: 'Strength',
            icon: 'options-outline',
            formatValue: (v) => v != null ? `${Math.round(v * 100)}%` : '',
            formatPreview: (v) => v != null ? `${Math.round(v * 100)}%` : '',
            showInPreview: false,
          },
        ],
      };

    case EditMode.PROFESSIONAL_HEADSHOTS:
      return {
        fields: [
          {
            key: 'style',
            label: 'Style',
            icon: 'shirt-outline',
            formatValue: formatLabel,
            formatPreview: formatLabel,
          },
          {
            key: 'backgroundType',
            label: 'Background',
            icon: 'image-outline',
            formatValue: formatLabel,
            formatPreview: formatLabel,
          },
        ],
      };

    case EditMode.POP_FIGURE:
      return {
        fields: [
          {
            key: 'includeBox',
            label: 'Box Included',
            icon: 'cube-outline',
            formatValue: (v) => v ? 'Yes' : 'No',
            formatPreview: (v) => v ? 'With Box' : 'Without Box',
          },
          {
            key: 'backgroundType',
            label: 'Background',
            icon: 'image-outline',
            formatValue: formatLabel,
            formatPreview: formatLabel,
            showInPreview: false,
          },
        ],
      };

    default:
      return null;
  }
};

