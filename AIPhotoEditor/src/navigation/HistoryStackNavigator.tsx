import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HistoryScreen from '../screens/HistoryScreen';
import ResultScreen from '../screens/ResultScreen';

type HistoryStackParamList = {
  HistoryMain: undefined;
  Result: {
    originalImage: string;
    transformedImage: string;
    editMode: any;
    config?: any;
    fromHistory?: boolean;
    createdAt?: number;
  };
};

const Stack = createNativeStackNavigator<HistoryStackParamList>();

export const HistoryStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="HistoryMain">
      <Stack.Screen name="HistoryMain" component={HistoryScreen} />
      <Stack.Screen name="Result" component={ResultScreen} />
    </Stack.Navigator>
  );
};

export default HistoryStackNavigator;



