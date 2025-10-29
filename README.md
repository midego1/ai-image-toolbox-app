# AI Photo Editor

A powerful, AI-driven photo editing application built with React Native and Expo. Transform your photos with advanced AI models, remove backgrounds, apply creative styles, and enhance images with professional-grade tools.

![AI Photo Editor](AIPhotoEditor/assets/images/featured/200x_after.jpg)

## 📱 Features

### Core Editing Modes

- **🎨 Transform** - Transform photos with AI-powered style transfers using various genres (Art Deco, Cyberpunk, Wild West, Vintage, Medieval, and more)
- **✂️ Remove Background** - AI-powered background removal for clean, professional results
- **✨ Enhance** - Upscale and improve image quality using AI
- **🌈 Filters** - Apply creative color grading and visual effects
- **🗑️ Remove Object** - Remove unwanted objects from photos (Premium)
- **🖼️ Replace Background** - Change backgrounds with AI-generated scenes (Premium)
- **👤 Face Enhance** - Improve facial quality and details (Premium)
- **🖌️ Style Transfer** - Apply artistic styles to your photos (Premium)
- **📝 Text Overlay** - Add customizable text to images (Premium)
- **📐 Crop & Rotate** - Basic editing tools for composition

### Additional Features

- **📸 Built-in Camera** - Capture photos directly within the app with professional controls
- **🎯 Quick Camera Mode** - Fast access to camera for quick captures
- **🖼️ Image Selection** - Choose from your photo library or take new photos
- **🌓 Dark Mode Support** - Beautiful light and dark themes with automatic system detection
- **🌍 Multi-language Support** - Localized interface (extensible)
- **💎 Premium Subscription** - Unlock advanced features with subscription management
- **⚡ Real-time Processing** - Live preview and progress tracking for AI operations

## 🛠️ Tech Stack

### Core Framework
- **React Native** (0.81.5) - Cross-platform mobile framework
- **Expo** (~54.0.20) - Development platform and tooling
- **TypeScript** (5.9.2) - Type-safe development

### Navigation & UI
- **React Navigation** (v7) - Navigation library with native stack and bottom tabs
- **React Native Reanimated** (4.1.3) - Smooth animations
- **React Native Safe Area Context** - Safe area handling
- **React Native SVG** - Vector graphics support

### Camera & Media
- **Expo Camera** (17.0.8) - Camera access and controls
- **Expo Image Picker** (17.0.8) - Image selection from gallery
- **Expo Media Library** (18.2.0) - Media library access
- **Expo Image Manipulator** (14.0.7) - Image processing

### AI & Backend
- **Replicate API** - AI model integration (Gemini 2.5 Flash via nano-banana)
- **Axios** (1.13.1) - HTTP client for API requests

### Storage & Security
- **Expo Secure Store** (15.0.7) - Secure key-value storage for API keys
- **AsyncStorage** (1.24.0) - Async key-value storage
- **Expo SQLite** (16.0.8) - Local database

### UI Components & Theming
- **Expo Linear Gradient** - Gradient backgrounds
- **Expo Blur** - Blur effects
- **Expo Haptics** - Tactile feedback
- **Expo Vector Icons** - Icon library
- **React Native Vector Icons** - Additional icons

### Development Tools
- **TypeScript** - Static type checking
- **React Native Dotenv** - Environment variable management

## 📁 Project Structure

```
AIPhotoEditor/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Header.tsx
│   │   └── ...
│   ├── screens/             # Screen components
│   │   ├── HomeScreen.tsx
│   │   ├── CameraScreen.tsx
│   │   ├── ProcessingScreen.tsx
│   │   └── ...
│   ├── services/            # Business logic & API services
│   │   ├── aiService.ts      # Replicate API integration
│   │   ├── imageProcessingService.ts
│   │   ├── subscriptionService.ts
│   │   └── processors/       # Image processing processors
│   ├── navigation/          # Navigation configuration
│   │   └── BottomTabNavigator.tsx
│   ├── theme/               # Theming system
│   │   ├── ThemeProvider.tsx
│   │   ├── colors.ts
│   │   └── typography.ts
│   ├── constants/           # App constants
│   │   ├── editModes.ts      # Edit mode definitions
│   │   └── Genres.ts         # Style genres
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utility functions
│       ├── haptics.ts
│       └── flashMode.ts
├── android/                 # Android native code
├── ios/                     # iOS native code
├── assets/                  # Images and media
├── App.tsx                  # Root component
├── app.json                 # Expo configuration
└── package.json             # Dependencies
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/midego1/ai-image-toolbox-app.git
   cd ai-image-toolbox-app/AIPhotoEditor
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure API Keys**

   The app requires a Replicate API key for AI features. Configure it in one of two ways:

   **Option A: Development (app.json)**
   ```json
   {
     "expo": {
       "extra": {
         "replicateApiKey": "your-replicate-api-key-here"
       }
     }
   }
   ```

   **Option B: Production (EAS Secrets)**
   ```bash
   eas secret:create --scope project --name REPLICATE_API_KEY --value your-key
   ```

   > ⚠️ **Security Note**: Never commit real API keys to git. The `.gitignore` is configured to exclude sensitive files.

4. **Start the development server**
   ```bash
   npm start
   # or
   expo start
   ```

5. **Run on a device/simulator**
   - **iOS**: Press `i` in the terminal or `npm run ios`
   - **Android**: Press `a` in the terminal or `npm run android`
   - **Web**: Press `w` in the terminal or `npm run web`

## ⚙️ Configuration

### API Keys

API keys are securely stored using Expo Secure Store. The app supports:
- Development: Keys can be configured in `app.json` (for local testing)
- Production: Keys should be managed through EAS Secrets

### Themes

The app supports both light and dark themes with automatic system detection. Theme configuration is managed in `src/theme/ThemeProvider.tsx`.

### Edit Modes

Edit modes are defined in `src/constants/editModes.ts`. You can:
- Add new edit modes
- Configure premium features
- Customize categories

### Genres/Styles

Style genres (for Transform mode) are defined in `src/constants/Genres.ts`. Each genre includes:
- Name and description
- AI prompt template
- Visual icon

## 🏗️ Architecture

### State Management

The app uses React hooks and Context API for state management:
- **Theme Context** - Theme and appearance settings
- **Navigation State** - Managed by React Navigation
- **Subscription State** - Handled by SubscriptionService
- **Local Storage** - SecureStore for sensitive data, AsyncStorage for app state

### Service Layer

The app follows a service-oriented architecture:

- **AIService** - Handles all Replicate API interactions
  - Image transformation
  - Prediction polling
  - Error handling

- **ImageProcessingService** - Manages local image operations
  - Image manipulation
  - Format conversion
  - Quality optimization

- **SubscriptionService** - Manages subscription state
  - Premium status checking
  - Subscription validation

### Navigation Flow

```
MainTabs (Bottom Navigator)
├── Home → EditModeSelection → [Camera/ImageSelection] → GenreSelection → Processing → Result
├── Features (Browse all edit modes)
├── Inbox
└── Settings → AppearanceSettings / LanguageSelection / Subscription
```

## 📱 Platform Support

- **iOS**: iOS 13.0+
- **Android**: Android 6.0+ (API level 23+)
- **Web**: Experimental support via Expo Web

## 🔒 Security

- API keys stored in Expo Secure Store (encrypted)
- No sensitive data in version control
- Environment variables excluded via `.gitignore`
- Secure HTTPS connections for all API calls

## 🧪 Development

### Running Tests

```bash
# Start Expo development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web
```

### Code Structure

- **Components**: Reusable UI components in `src/components/`
- **Screens**: Full-screen views in `src/screens/`
- **Services**: Business logic and API calls in `src/services/`
- **Types**: TypeScript definitions in `src/types/`
- **Utils**: Helper functions in `src/utils/`

### Adding New Features

1. **New Edit Mode**:
   - Add to `src/constants/editModes.ts`
   - Create processor in `src/services/processors/`
   - Add UI in `EditModeSelectionScreen`

2. **New Style Genre**:
   - Add to `src/constants/Genres.ts`
   - Configure prompt template
   - Add icon representation

## 📄 License

This project is private and proprietary.

## 🤝 Contributing

This is a private project. Please contact the maintainer for contribution guidelines.

## 📞 Support

For issues, questions, or feature requests, please open an issue on GitHub.

## 🙏 Acknowledgments

- **Replicate** - AI model hosting and inference
- **Expo** - Development platform and tooling
- **React Native Community** - Excellent libraries and tools

---

**Built with ❤️ using React Native and Expo**

