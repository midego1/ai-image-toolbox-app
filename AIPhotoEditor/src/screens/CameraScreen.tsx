import React from 'react';
import QuickCameraScreen from './QuickCameraScreen';

// CameraScreen is now just a wrapper that uses QuickCameraScreen
// This ensures we only have one camera implementation used everywhere
const CameraScreen = () => {
  return <QuickCameraScreen />;
};

export default CameraScreen;
