import { FlashMode } from '../types/camera';

/**
 * Utility functions for managing flash modes
 */

/**
 * Cycle through flash modes: off -> on -> auto -> off
 */
export function getNextFlashMode(currentMode: FlashMode): FlashMode {
  switch (currentMode) {
    case 'off':
      return 'on';
    case 'on':
      return 'auto';
    case 'auto':
      return 'off';
    default:
      return 'off';
  }
}

/**
 * Get the icon name for flash mode
 */
export function getFlashIconName(mode: FlashMode): string {
  switch (mode) {
    case 'off':
      return 'flash-off';
    case 'on':
      return 'flash';
    case 'auto':
      return 'flash-outline';
    default:
      return 'flash-off';
  }
}

/**
 * Check if flash should be used based on mode and camera facing
 */
export function shouldUseFlash(
  flashMode: FlashMode,
  cameraFacing: 'front' | 'back'
): boolean {
  // For auto mode, we decide based on context (could be enhanced with light sensor)
  // For now, auto mode uses flash for rear camera only
  if (flashMode === 'off') return false;
  if (flashMode === 'on') return true;
  if (flashMode === 'auto') {
    // Auto mode: use flash for rear camera, but not for front (front uses screen flash if on)
    return cameraFacing === 'back';
  }
  return false;
}

/**
 * Check if screen flash should be used (front camera only)
 */
export function shouldUseScreenFlash(
  flashMode: FlashMode,
  cameraFacing: 'front' | 'back'
): boolean {
  if (cameraFacing !== 'front') return false;
  
  // For front camera, use screen flash when mode is 'on' or 'auto'
  return flashMode === 'on' || flashMode === 'auto';
}

/**
 * Map iOS lens identifier to our CameraLens type
 * Handles various formats: "builtInUltraWideCamera", "Back Ultra Wide Camera", etc.
 */
export function mapLensIdentifier(lensId: string): 'standard' | 'ultra-wide' | 'telephoto' | null {
  const id = lensId.toLowerCase();
  // Check for ultra-wide variants (handles "ultra wide", "ultra-wide", "ultrawide")
  if ((id.includes('ultra') && id.includes('wide')) || id.includes('ultrawide')) {
    return 'ultra-wide';
  }
  // Check for telephoto variants
  if (id.includes('telephoto')) {
    return 'telephoto';
  }
  // Standard/wide angle camera (default)
  // Includes: "Back Camera", "builtInWideAngleCamera", "Back Dual Camera", etc.
  // But exclude ultra-wide (already handled above)
  if ((id.includes('wide') && !id.includes('ultra')) || id.includes('standard') || 
      id.includes('back camera') || id.includes('dual') || id === 'back' || 
      id === 'front' || id.includes('triple')) {
    return 'standard';
  }
  return null;
}

/**
 * Map our CameraLens type to iOS lens identifier
 */
export function lensToIdentifier(lens: 'standard' | 'ultra-wide' | 'telephoto', facing: 'front' | 'back'): string {
  if (facing === 'front') {
    switch (lens) {
      case 'ultra-wide':
        return 'builtInUltraWideCamera'; // Front ultra-wide uses same identifier format
      case 'standard':
      default:
        return 'front';
    }
  }
  
  switch (lens) {
    case 'ultra-wide':
      return 'builtInUltraWideCamera';
    case 'telephoto':
      return 'builtInTelephotoCamera';
    case 'standard':
    default:
      return 'builtInWideAngleCamera';
  }
}

