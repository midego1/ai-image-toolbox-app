import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FeaturesScreen from '../screens/FeaturesScreen';
import GenreSelectionScreen from '../screens/GenreSelectionScreen';
import ImageSelectionScreen from '../screens/ImageSelectionScreen';
import ImagePreviewScreen from '../screens/ImagePreviewScreen';
import PostCaptureFeatureSelectionScreen from '../screens/PostCaptureFeatureSelectionScreen';
import VirtualTryOnSelectionScreen from '../screens/VirtualTryOnSelectionScreen';
import ProcessingScreen from '../screens/ProcessingScreen';
import ResultScreen from '../screens/ResultScreen';
import QuickCameraScreen from '../screens/QuickCameraScreen';
import RemoveBackgroundScreen from '../screens/RemoveBackgroundScreen';
import ReplaceBackgroundScreen from '../screens/ReplaceBackgroundScreen';
import RemoveObjectScreen from '../screens/RemoveObjectScreen';
import ProfessionalHeadshotsScreen from '../screens/ProfessionalHeadshotsScreen';

// Local stack for the Features tab so we can push screens
// while keeping the bottom tab bar visible.
type FeaturesStackParamList = {
  FeaturesMain: undefined;
  GenreSelection: { imageUri?: string; editMode?: any };
  ImageSelection: { editMode?: any };
  ImagePreview: { imageUri: string; editMode: any };
  PostCaptureFeatureSelection: { imageUri: string };
  VirtualTryOnSelection: { editMode: any; personImageUri?: string };
  Processing: { imageUri: string; editMode: any; config?: any };
  Result: { originalImage: string; transformedImage: string; editMode: any; config?: any; fromHistory?: boolean };
  QuickCameraLocal: { editMode?: any; preselectedGenreId?: string; onPhoto?: (uri: string) => void };
  RemoveBackground: { imageUri?: string };
  ReplaceBackground: { imageUri?: string };
  RemoveObject: { imageUri?: string };
  ProfessionalHeadshots: { imageUri?: string };
};

const Stack = createNativeStackNavigator<any>();

export const FeaturesStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="FeaturesMain">
      <Stack.Screen name="FeaturesMain" component={FeaturesScreen} />
      <Stack.Screen name="GenreSelection" component={GenreSelectionScreen} />
      <Stack.Screen name="RemoveBackground" component={RemoveBackgroundScreen} />
      <Stack.Screen name="ReplaceBackground" component={ReplaceBackgroundScreen} />
      <Stack.Screen name="RemoveObject" component={RemoveObjectScreen} />
      <Stack.Screen name="ProfessionalHeadshots" component={ProfessionalHeadshotsScreen} />
      <Stack.Screen name="ImageSelection" component={ImageSelectionScreen} />
      <Stack.Screen name="ImagePreview" component={ImagePreviewScreen} />
      <Stack.Screen name="PostCaptureFeatureSelection" component={PostCaptureFeatureSelectionScreen} />
      <Stack.Screen name="VirtualTryOnSelection" component={VirtualTryOnSelectionScreen} />
      <Stack.Screen name="Processing" component={ProcessingScreen} />
      <Stack.Screen name="Result" component={ResultScreen} />
      <Stack.Screen name="QuickCameraLocal" component={QuickCameraScreen} />
    </Stack.Navigator>
  );
};

export default FeaturesStackNavigator;


