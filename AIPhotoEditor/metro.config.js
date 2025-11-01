const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

const config = getDefaultConfig(__dirname);

/**
 * Find tslib module location
 * Handles cases where tslib might be in root node_modules or nested
 */
function findTslib() {
  const rootPath = path.resolve(__dirname, 'node_modules/tslib');
  if (fs.existsSync(rootPath)) {
    return rootPath;
  }
  
  // Check nested location (e.g., in @supabase packages)
  const supabasePath = path.resolve(__dirname, 'node_modules/@supabase/auth-js/node_modules/tslib');
  if (fs.existsSync(supabasePath)) {
    return supabasePath;
  }
  
  // Fallback: try to resolve using Node's module resolution
  try {
    const resolved = require.resolve('tslib');
    return path.dirname(resolved);
  } catch (e) {
    // Last resort: return root path
    return rootPath;
  }
}

const defaultResolver = config.resolver.resolveRequest;

config.resolver = {
  ...config.resolver,
  assetExts: [
    ...(config.resolver.assetExts || []),
    // Ensure all image formats (including uppercase) are treated as assets
    'PNG', 'JPG', 'JPEG', 'GIF', 'WEBP', 'SVG', 'BMP', 'ICO',
  ],
  sourceExts: (config.resolver.sourceExts || []).filter((ext) => {
    const lowerExt = ext.toLowerCase();
    // Filter out image extensions from source extensions
    return !['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(lowerExt);
  }),
  resolveRequest: (context, moduleName, platform) => {
    // Explicitly resolve tslib to avoid bundling issues
    if (moduleName === 'tslib') {
      const tslibPath = findTslib();
      const possiblePaths = [
        path.join(tslibPath, 'tslib.js'),
        path.join(tslibPath, 'index.js'),
      ];
      
      for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
          return {
            filePath: filePath,
            type: 'sourceFile',
          };
        }
      }
    }
    
    // Check if the module name is an image file (with any case extension)
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico'];
    const moduleLower = moduleName.toLowerCase();
    if (imageExtensions.some(ext => moduleLower.endsWith(ext))) {
      // Let Metro's default asset resolver handle image files
      // Return null to fall through to default resolver
    }
    
    // Fall back to default resolver for other modules
    if (defaultResolver) {
      return defaultResolver(context, moduleName, platform);
    }
    
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
