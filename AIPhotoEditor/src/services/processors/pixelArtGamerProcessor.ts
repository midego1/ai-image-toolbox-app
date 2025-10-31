import { BaseProcessor } from './baseProcessor';
import { AIService, TransformResponse } from '../aiService';
import { EditModeConfig } from '../../types/editModes';

/**
 * Pixel Art Gamer Processor
 * Converts photos into retro 8-bit or 16-bit video game sprites
 * Uses Nano Banana for pixel art transformation
 */
export class PixelArtGamerProcessor extends BaseProcessor {
  /**
   * Process image into pixel art sprite
   * Config options:
   * - bitDepth: '8-bit' | '16-bit' (default: '16-bit')
   * - gameStyle: 'rpg' | 'platformer' | 'arcade' | 'fighter' | 'adventure' | 'indie' (default: 'rpg')
   * - backgroundStyle: 'transparent' | 'solid' | 'scene' | 'gradient' (default: 'transparent')
   */
  async process(imageUri: string, config?: EditModeConfig): Promise<TransformResponse> {
    if (!this.validateImageUri(imageUri)) {
      return this.createErrorResponse('Invalid image URI provided');
    }

    try {
      console.log('[PixelArtGamerProcessor] Starting pixel art transformation');
      
      const bitDepth = (config?.bitDepth as string) || '16-bit';
      const gameStyle = (config?.gameStyle as string) || 'rpg';
      const backgroundStyle = (config?.backgroundStyle as string) || 'transparent';
      const transparentColor = (config?.transparentColor as string) || '#FFFFFF';
      const sceneType = (config?.sceneType as string) || 'gaming';
      const gradientType = (config?.gradientType as string) || 'sunset';
      
      console.log('[PixelArtGamerProcessor] Bit depth:', bitDepth);
      console.log('[PixelArtGamerProcessor] Game style:', gameStyle);
      console.log('[PixelArtGamerProcessor] Background style:', backgroundStyle);
      console.log('[PixelArtGamerProcessor] Transparent color:', transparentColor);
      console.log('[PixelArtGamerProcessor] Scene type:', sceneType);
      console.log('[PixelArtGamerProcessor] Gradient type:', gradientType);
      
      // Allow custom prompt override, but provide default
      const customPrompt = config?.prompt as string | undefined;
      const prompt = customPrompt || this.buildPixelArtPrompt(bitDepth, gameStyle, backgroundStyle, transparentColor, sceneType, gradientType);
      
      return await AIService.transformImage(imageUri, prompt);
    } catch (error: any) {
      console.error('PixelArtGamerProcessor error:', error);
      return this.createErrorResponse(
        error.message || 'Failed to create pixel art sprite'
      );
    }
  }

  /**
   * Build optimized Pixel Art Gamer prompt for Nano Banana
   * Streamlined structure based on successful FunkoPop/PopFigure patterns
   * Supports expanded game styles and background customization
   */
  private buildPixelArtPrompt(bitDepth: string, gameStyle: string, backgroundStyle: string, transparentColor?: string, sceneType?: string, gradientType?: string): string {
    // Game reference helps Nano Banana understand the aesthetic
    const gameReferences: Record<string, string> = {
      rpg: 'classic RPG games like Final Fantasy VI, Chrono Trigger, or Dragon Quest',
      platformer: 'classic platformer games like Super Mario World, Sonic the Hedgehog 2, or Mega Man X',
      arcade: 'classic arcade games like Pac-Man, Space Invaders, or Galaga',
      fighter: 'fighting games like Street Fighter II, Mortal Kombat 2, or Killer Instinct',
      adventure: 'adventure games like The Legend of Zelda: A Link to the Past, Metroid, or Castlevania',
      indie: 'modern indie pixel art games like Hollow Knight, Celeste, or Shovel Knight',
    };
    const gameReference = gameReferences[gameStyle] || gameReferences.rpg;

    const bitStyle = bitDepth === '8-bit'
      ? `- Strict pixel grid with visible blocky pixels (NES/Atari style)
- Limited color palette (8-16 colors, characteristic 8-bit palette)
- Low resolution aesthetic (64x64 to 128x128 sprite scale)
- Harsh pixelation with no anti-aliasing
- Strong color contrast for visibility
- Simple dithering patterns for gradients`
      : `- Higher resolution pixel art (16x16 to 32x32 sprite scale, upscaled for display)
- Expanded color palette (32-64 colors, characteristic 16-bit palette)
- Smooth pixel placement with strategic anti-aliasing
- Detailed pixel art with refined edges
- Rich color gradients using dithering techniques
- Classic SNES/Genesis 16-bit game aesthetic`;

    const gameStyleInstructions: Record<string, string> = {
      rpg: `- Final Fantasy / Dragon Quest style character sprite
- Adventure gear visible (swords, shields, armor, capes if present in reference)
- Character portrait style with expressive features
- Fantasy/adventure theme aesthetic
- Full-body or upper-body sprite depending on reference
- Classic RPG character presentation`,
      platformer: `- Classic side-scrolling platformer sprite style
- Side profile view typical of platformers
- Action-oriented pose suitable for platform games
- Classic platformer character design
- Dynamic movement-ready stance`,
      arcade: `- Classic arcade game character sprite style
- Vibrant colors and bold design
- Action-oriented presentation
- Arcade game aesthetic
- Simple but recognizable design`,
      fighter: `- Fighting game character sprite style (Street Fighter / Mortal Kombat)
- Combat-ready stance with expressive pose
- Detailed character design suitable for close-up viewing
- Dynamic action presentation
- Character portrait or full-body sprite style`,
      adventure: `- Adventure game character sprite style (Zelda / Metroid)
- Explorer/adventurer aesthetic with gear
- Side or front view depending on reference
- Classic adventure game character design
- Heroic presentation suitable for adventure games`,
      indie: `- Modern indie pixel art game style (Hollow Knight / Celeste)
- Refined pixel art with modern aesthetics
- Clean, polished pixel art technique
- Contemporary indie game character design
- High-quality modern pixel art presentation`,
    };
    const gameStyleInstruction = gameStyleInstructions[gameStyle] || gameStyleInstructions.rpg;

    return `Transform this reference photo into a pixelated character sprite from ${gameReference}, rendered in ${bitDepth} style.

PRESERVE THE SUBJECT FROM REFERENCE:
- Facial features, expression, and identity match the reference photo exactly
- Hair color, style, and texture identical to reference
- Clothing colors, patterns, logos match the reference photo precisely
- Body pose and distinctive accessories preserved accurately
- All recognizable characteristics from reference maintained

APPLY ${bitDepth.toUpperCase()} PIXEL ART STYLIZATION:
${bitStyle}
- Manual pixel placement aesthetic (hand-crafted look, not filtered)
- No blur or smooth gradients (except strategic dithering)
- Sharp, crisp edges with intentional pixelation
- Characteristic pixel art shading techniques
- Clear separation between color regions
- Proper pixel density for sprite scale

CHARACTER PRESENTATION (${gameStyle}):
${gameStyleInstruction}

BACKGROUND STYLING:
${this.getBackgroundInstruction(backgroundStyle, bitDepth, transparentColor, sceneType, gradientType)}

PIXEL ART QUALITY:
- Authentic pixel art rendering with professional technique
- Centered character presentation
- High resolution for modern displays while maintaining pixel art aesthetic
- No photographic artifacts or realism
- Looks like it came from a classic ${bitDepth} ${gameStyle} video game

FINAL OUTPUT:
A faithful ${bitDepth} pixel art sprite that accurately represents the subject from the reference photo, with all distinctive features, clothing, and characteristics preserved in authentic ${gameReference} style.`;
  }

  /**
   * Get background instruction based on selected style
   */
  private getBackgroundInstruction(backgroundStyle: string, bitDepth: string, transparentColor?: string, sceneType?: string, gradientType?: string): string {
    const sceneDescriptions: Record<string, string> = {
      gaming: 'gaming arcade or game room scene with pixel art game elements, consoles, controllers, or game-themed environment',
      fantasy: 'fantasy RPG world scene with castles, forests, dungeons, magical elements, or medieval game environment',
      cyberpunk: 'cyberpunk or futuristic game scene with neon lights, cityscapes, technological elements, or sci-fi game environment',
      nature: 'natural game world scene with forests, mountains, fields, or outdoor pixel art game environment',
    };

    const gradientDescriptions: Record<string, string> = {
      sunset: 'warm sunset gradient with orange, red, and pink tones transitioning smoothly',
      ocean: 'ocean gradient with blue and teal tones creating a water-like appearance',
      forest: 'forest gradient with green tones transitioning from light to dark like foliage',
      neon: 'neon gradient with vibrant purple, pink, and cyan tones with electric feel',
    };

    const backgroundInstructions: Record<string, string> = {
      transparent: `- Solid color background in color ${transparentColor || '#FFFFFF'} - perfect for sprite sheets and game development
- Background should be a solid ${transparentColor || 'white'} color
- Clean separation between character and background
- Classic sprite presentation style with ${transparentColor || 'white'} background`,
      solid: `- Solid color background typical of classic game sprites
- Use vibrant, game-appropriate color (prefer dark or bright solid color)
- Clean separation between character and background
- Classic sprite presentation style`,
      scene: `- Pixel art game scene background: ${sceneDescriptions[sceneType || 'gaming'] || sceneDescriptions.gaming}
- Background should match the game style (${bitDepth} pixel art)
- Character integrated into the scene naturally
- Atmospheric game world presentation with detailed pixel art environment
- Background elements in pixel art style matching the scene type`,
      gradient: `- Smooth gradient background in pixel art style: ${gradientDescriptions[gradientType || 'sunset'] || gradientDescriptions.sunset}
- Color gradient appropriate for ${bitDepth} game aesthetic
- Use dithering for smooth color transitions if needed
- Professional gradient presentation matching the gradient type
- Character clearly stands out from background`,
    };
    return backgroundInstructions[backgroundStyle] || backgroundInstructions.transparent;
  }
}

