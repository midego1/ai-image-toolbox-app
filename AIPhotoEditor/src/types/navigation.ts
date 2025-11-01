import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp as RNRouteProp } from '@react-navigation/native';
import { Genre } from '../constants/Genres';
import { EditMode, EditModeConfig } from './editModes';
import { WorkflowConfig, WorkflowStepResult } from './workflow';

export type RootStackParamList = {
  MainTabs: undefined;
  Home: undefined;
  EditModeSelection: undefined;
  LanguageSelection: undefined;
  Subscription: undefined;
  Camera: { editMode?: EditMode };
  ImageSelection: { editMode: EditMode };
  ImagePreview: { imageUri: string; editMode: EditMode };
  PostCaptureFeatureSelection: { imageUri: string };
  GenreSelection: { imageUri?: string; editMode?: EditMode };
  VirtualTryOnSelection: { editMode: EditMode; personImageUri?: string };
  Processing: {
    imageUri: string;
    editMode: EditMode;
    config?: EditModeConfig;
    creationId?: string;
    workflow?: WorkflowConfig;
    workflowStepIndex?: number;
  };
  Result: {
    originalImage: string;
    transformedImage: string;
    editMode: EditMode;
    config?: EditModeConfig;
    fromHistory?: boolean;
    createdAt?: number;
    creationId?: string;
    workflowResults?: WorkflowStepResult[];
  };
};

export type TabParamList = {
  Features: undefined;
  History: undefined;
  Settings: undefined;
};

export type SettingsStackParamList = {
  SettingsMain: undefined;
  AppearanceSettings: undefined;
  Statistics: undefined;
  LanguageSelection: undefined;
  Subscription: undefined;
  ApiKeysSettings: undefined;
  RevenueCatPackagesTest: undefined;
  ResultScreenMockup: undefined;
  PixelArtGamerBeta: { imageUri?: string; fromToolMockup?: boolean; config?: any };
  WorkflowBeta: undefined;
  Processing: {
    imageUri: string;
    editMode: EditMode;
    config?: EditModeConfig;
    creationId?: string;
    workflow?: WorkflowConfig;
    workflowStepIndex?: number;
  };
  Result: {
    originalImage: string;
    transformedImage: string;
    editMode: EditMode;
    config?: EditModeConfig;
    fromHistory?: boolean;
    createdAt?: number;
    creationId?: string;
    workflowResults?: WorkflowStepResult[];
  };
};

export type NavigationProp<T extends keyof RootStackParamList> = NativeStackNavigationProp<RootStackParamList, T>;

export type SettingsNavigationProp<T extends keyof SettingsStackParamList> = NativeStackNavigationProp<SettingsStackParamList, T>;

export type RouteProp<T extends keyof RootStackParamList> = RNRouteProp<RootStackParamList, T>;

export { Genre };

