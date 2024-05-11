import React, { useEffect, useRef, useState } from 'react';
import { Alert, SafeAreaView, Text, View, Button } from 'react-native';
import { Camera } from 'expo-camera';
import tailwind from 'tailwind-rn';
import Toast from 'react-native-toast-message';


const App = () => {
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [isTakingPictures, setIsTakingPictures] = useState(false);
  // Initialize the camera type to back camera
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back);
  const cameraRef = useRef(null);
  const takingPicturesIntervalRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    if (isTakingPictures) {
      startTakingPictures();
    } else {
      stopTakingPictures();
    }

    return () => stopTakingPictures(); // Cleanup on component unmount
  }, [isTakingPictures]);

  const startTakingPictures = () => {
    takingPicturesIntervalRef.current = setInterval(async () => {
      if (cameraRef.current) {
        try {
          const data = await cameraRef.current.takePictureAsync();
          processImage(data.uri); // Assume processImage is a function that processes the image and checks for "offside"
        } catch (error) {
          console.error(`Error taking picture: ${error}`);
        }
      }
    }, 3000); // Take a picture every 5 seconds
  };

  const stopTakingPictures = () => {
    if (takingPicturesIntervalRef.current) {
      clearInterval(takingPicturesIntervalRef.current);
      takingPicturesIntervalRef.current = null;
    }
  };


  const toggleCameraType = () => {
    setCameraType((currentType) =>
      currentType === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back
    );
  };

  const processImage = async (uri) => {
    // Your existing logic or a dummy implementation for now
    const result = await processImageLogic(uri); // Assume this function checks something
    if (result === "offside") {
      // Triggering a Toast Message instead of an Alert
      Toast.show({
        type: 'error',
        position: 'bottom',
        text1: 'Offside Detected',
        text2: 'An offside condition has been detected and capturing has been stopped.',
        visibilityTime: 4000,
        autoHide: true,
        bottomOffset: 40,
      });
      setIsTakingPictures(false); // Stop taking pictures
    }
  };

  const processImageLogic = async (uri) => {
    console.log(uri)
  }

  if (hasCameraPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <SafeAreaView style={tailwind('flex-1')}>
    <View style={tailwind('flex-1')}>
      <Camera style={tailwind('flex-1')} type={cameraType} ref={cameraRef}></Camera>
      <View style={tailwind('flex-row justify-around p-4')}>
        <Button style={tailwind('bg-blue-400 p-4')} title={isTakingPictures ? "Stop" : "Start"} onPress={() => setIsTakingPictures(!isTakingPictures)} />
        <Button style={tailwind('bg-blue-400 p-4')} title="Flip Camera" onPress={toggleCameraType} />
      </View>
    </View>
    <Toast ref={(ref) => Toast.setRef(ref)} />
    <View style={tailwind('h-20 bg-gray-800 flex-row items-center justify-around')}>
      <Text style={tailwind('text-white p-4 text-xl font-bold')}>Offside Detector</Text>
    </View>
  </SafeAreaView>

  );
};

export default App;
