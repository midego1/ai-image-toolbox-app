import { OptionsSchema } from './OptionsUsed';
import { EditMode } from '../constants/editModes';
import { getGenreById } from '../constants/Genres';

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
 * Format genre/transform style names (e.g., "cyberpunk" -> "Cyberpunk")
 */
const formatGenre = (genreId?: string): string => {
  if (!genreId) return '';
  const genre = getGenreById(genreId);
  return genre ? genre.name : formatLabel(genreId);
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
            key: 'genre',
            label: 'Style',
            icon: 'brush-outline',
            formatValue: formatGenre,
            formatPreview: formatGenre,
          },
          {
            key: 'intensity',
            label: 'Intensity',
            icon: 'options-outline',
            formatValue: (v) => v != null ? `${Math.round(v * 100)}%` : '',
            formatPreview: (v) => v != null ? `${Math.round(v * 100)}%` : '',
            showInPreview: true, // Show intensity in preview if set
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
            label: 'Prompt',
            icon: 'text-outline',
            formatValue: (v) => v || '',
            formatPreview: (v) => v ? `"${v.substring(0, 30)}${v.length > 30 ? '...' : ''}"` : '',
            showInPreview: true, // Now shows custom prompt in preview
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
            formatPreview: (v, config) => v && !config.stylePreset ? 'Custom' : '',
            showInPreview: true, // Show when using custom image
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
            formatPreview: (v) => {
              if (v == null) return '';
              const strength = v > 0.75 ? 'Strong' : v > 0.5 ? 'Moderate' : v > 0.25 ? 'Subtle' : 'Light';
              return strength;
            },
            showInPreview: true, // Show strength in preview
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
            showInPreview: true, // Show intensity in preview
          },
        ],
      };

    case EditMode.ENHANCE:
      return {
        fields: [
          {
            key: 'outscale',
            label: 'Upscale Factor',
            icon: 'resize-outline',
            formatValue: (v) => {
              const scale = v != null ? Number(v) : 4;
              return `${scale}x Upscale`;
            },
            formatPreview: (v) => {
              const scale = v != null ? Number(v) : 4;
              return `${scale}x`;
            },
            showInPreview: true,
          },
          {
            key: 'faceEnhance',
            label: 'Face Enhancement',
            icon: 'person-outline',
            formatValue: (v) => v ? 'Enabled' : 'Disabled',
            formatPreview: (v) => v ? 'Face+' : '',
            showInPreview: true, // Show when enabled
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
            showInPreview: true, // Now shows in preview
          },
        ],
      };

    case EditMode.GHIBLIFY:
      return {
        fields: [],
      };

    default:
      return null;
  }
};

