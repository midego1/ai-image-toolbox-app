import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FeaturesScreen from '../screens/FeaturesScreen';
import GenreSelectionScreen from '../screens/GenreSelectionScreen';

// Local stack for the Features tab so we can push screens
// while keeping the bottom tab bar visible.
type FeaturesStackParamList = {
  FeaturesMain: undefined;
  GenreSelection: { imageUri?: string; editMode?: any };
};

const Stack = createNativeStackNavigator<FeaturesStackParamList>();

export const FeaturesStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="FeaturesMain">
      <Stack.Screen name="FeaturesMain" component={FeaturesScreen} />
      <Stack.Screen name="GenreSelection" component={GenreSelectionScreen} />
    </Stack.Navigator>
  );
};

export default FeaturesStackNavigator;


