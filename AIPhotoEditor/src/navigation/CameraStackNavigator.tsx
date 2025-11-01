import React, { useEffect, useRef } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import QuickCameraScreen from '../screens/QuickCameraScreen';
import ImageSelectionScreen from '../screens/ImageSelectionScreen';
import ImagePreviewScreen from '../screens/ImagePreviewScreen';
import PostCaptureFeatureSelectionScreen from '../screens/PostCaptureFeatureSelectionScreen';
import GenreSelectionScreen from '../screens/GenreSelectionScreen';
import VirtualTryOnSelectionScreen from '../screens/VirtualTryOnSelectionScreen';
import ProcessingScreen from '../screens/ProcessingScreen';
import ResultScreen from '../screens/ResultScreen';
import StyleTransferScreen from '../screens/StyleTransferScreen';
import GhiblifyScreen from '../screens/GhiblifyScreen';

type CameraStackParamList = {
  QuickCameraMain: { editMode?: any; preselectedGenreId?: string; onPhoto?: (uri: string) => void } | undefined;
  ImageSelection: { editMode?: any };
  ImagePreview: { imageUri: string; editMode: any };
  PostCaptureFeatureSelection: { imageUri: string };
  GenreSelection: { imageUri?: string; editMode?: any };
  VirtualTryOnSelection: { editMode: any; personImageUri?: string };
  StyleTransfer: { imageUri?: string };
  Ghiblify: { imageUri?: string };
  Processing: { imageUri: string; editMode: any; config?: any };
  Result: { originalImage: string; transformedImage: string; editMode: any; config?: any; fromHistory?: boolean };
};

const Stack = createNativeStackNavigator<CameraStackParamList>();

// Wrapper to handle params from tab navigation
const CameraStackContent = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const lastParamsRef = useRef<any>(null);

  // Forward params from tab to QuickCameraMain when tab receives params
  useFocusEffect(
    React.useCallback(() => {
      const tabParams = (route.params as any) || {};
      if (tabParams.editMode && JSON.stringify(tabParams) !== JSON.stringify(lastParamsRef.current)) {
        lastParamsRef.current = tabParams;
        // Navigate to QuickCameraMain with the params
        navigation.navigate('QuickCameraMain', tabParams);
      }
    }, [route.params, navigation])
  );

  return (
    <Stack.Navigator 
      screenOptions={{ headerShown: false }} 
      initialRouteName="QuickCameraMain"
    >
      <Stack.Screen name="QuickCameraMain" component={QuickCameraScreen} />
      <Stack.Screen name="ImageSelection" component={ImageSelectionScreen} />
      <Stack.Screen name="ImagePreview" component={ImagePreviewScreen} />
      <Stack.Screen name="PostCaptureFeatureSelection" component={PostCaptureFeatureSelectionScreen} />
      <Stack.Screen name="GenreSelection" component={GenreSelectionScreen} />
      <Stack.Screen name="VirtualTryOnSelection" component={VirtualTryOnSelectionScreen} />
      <Stack.Screen name="StyleTransfer" component={StyleTransferScreen} />
      <Stack.Screen name="Ghiblify" component={GhiblifyScreen} />
      <Stack.Screen name="Processing" component={ProcessingScreen} />
      <Stack.Screen name="Result" component={ResultScreen} />
    </Stack.Navigator>
  );
};

export const CameraStackNavigator = CameraStackContent;

export default CameraStackNavigator;



