import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp as RNRouteProp } from '@react-navigation/native';
import { Genre } from '../constants/Genres';
import { EditMode, EditModeConfig } from './editModes';

export type RootStackParamList = {
  MainTabs: undefined;
  Home: undefined;
  EditModeSelection: undefined;
  Settings: undefined;
  AppearanceSettings: undefined;
  LanguageSelection: undefined;
  Subscription: undefined;
  Camera: { editMode?: EditMode };
  ImageSelection: { editMode: EditMode };
  ImagePreview: { imageUri: string; editMode: EditMode };
  GenreSelection: { imageUri: string; editMode?: EditMode };
  Processing: { imageUri: string; editMode: EditMode; config?: EditModeConfig };
  Result: { originalImage: string; transformedImage: string; editMode: EditMode };
};

export type TabParamList = {
  Features: undefined;
  Camera: undefined;
  Settings: undefined;
};

export type NavigationProp<T extends keyof RootStackParamList> = NativeStackNavigationProp<RootStackParamList, T>;

export type RouteProp<T extends keyof RootStackParamList> = RNRouteProp<RootStackParamList, T>;

export { Genre };

