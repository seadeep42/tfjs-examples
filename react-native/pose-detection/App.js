import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, Dimensions, Platform } from 'react-native';

import _ from "lodash";
import { Camera } from 'expo-camera';
import * as tf from '@tensorflow/tfjs';
import * as faceDetection from "@tensorflow-models/face-detection";
import {
  cameraWithTensors,
} from '@tensorflow/tfjs-react-native';
import SnellenChart from './snellen_chart';

const TensorCamera = cameraWithTensors(Camera);

const IS_ANDROID = Platform.OS === 'android';
const IS_IOS = Platform.OS === 'ios';

const CAM_PREVIEW_WIDTH = Dimensions.get('window').width;
const CAM_PREVIEW_HEIGHT = CAM_PREVIEW_WIDTH / (IS_IOS ? 9 / 16 : 3 / 4);

const IPD_WEIGHED_LAG = 4;

const OUTPUT_TENSOR_WIDTH = 400;
const OUTPUT_TENSOR_HEIGHT = OUTPUT_TENSOR_WIDTH / (IS_IOS ? 9 / 16 : 3 / 4);

export default function App() {
  const cameraRef = useRef(null);
  const [tfReady, setTfReady] = useState(false);
  const [model, setModel] = useState();
  // const [points, setPoints] = useState({
  //   left_x: "",
  //   left_y: "",
  //   right_x: "",
  //   right_y: "",
  // });
  const [ipd, setIpd] = useState(80); // Weighed raw output from the Tensorflow x values difference
  const [imageIpd, setImageIpd] = useState(80); // Can go from 70 to 100
  const rafId = useRef(null);

  useEffect(() => {
    async function prepare() {
      rafId.current = null;
      await Camera.requestCameraPermissionsAsync();
      await tf.ready();

      const modelType = faceDetection.SupportedModels.MediaPipeFaceDetector;
      const detectorConfig = {
        runtime: 'tfjs', // 'mediapipe'
        maxFaces: 1,
      }
      const detector = await faceDetection.createDetector(modelType, detectorConfig);
      setModel(detector);
      setTfReady(true);
    }

    prepare();
  }, []);

  useEffect(() => {
    return () => {
      if (rafId.current != null && rafId.current !== 0) {
        cancelAnimationFrame(rafId.current);
        rafId.current = 0;
      }
    };
  }, []);

  const handleCameraStream = async (
    images,
    updatePreview,
    gl
  ) => {
    const loop = async () => {
      // Get the tensor and run pose detection.
      const imageTensor = images.next().value;

      const startTs = Date.now();
      const faces = await model?.estimateFaces(
        imageTensor,
        undefined,
        Date.now()
      );
      const latency = Date.now() - startTs;
      if (faces != null && faces.length > 0){
        const { keypoints } = faces[0];
        const { x: left_x, y: left_y, score: left_score } = keypoints[0];
        const { x: right_x, y: right_y, score: right_score } = keypoints[1];
        // setPoints({ left_x, left_y, right_x, right_y });
        const newIpd = (ipd * IPD_WEIGHED_LAG + Math.abs(right_x - left_x)) / (IPD_WEIGHED_LAG + 1);
        setIpd(newIpd);
        // if(Math.abs(newIpd - imageIpd) > 3) {
          setImageIpd(_.toInteger(newIpd));
        // }
      }

      tf.dispose([imageTensor]);
      if (rafId.current === 0) {
        return;
      }
      gl.endFrameEXP(); 
      rafId.current = requestAnimationFrame(loop);
    };

    loop();
  };

  const boundedIpd = Math.max(Math.min(imageIpd, 100), 70);

  const chartScale = 2 - 1.5 * (boundedIpd - 70) / (100 - 70);
  // 100 corresponds to 0.5 and 70 corresponds to 2

  if (!tfReady) {
    return (
      <View style={styles.loadingMsg}>
        <Text>Loading...</Text>
      </View>
    );
  } else {
    return (
      <React.Fragment>
        <View style={styles.containerPortrait}>
          <TensorCamera
            ref={cameraRef}
            style={styles.camera}
            autorender={false}
            type={Camera.Constants.Type.front}
            // tensor related props
            resizeWidth={OUTPUT_TENSOR_WIDTH}
            resizeHeight={OUTPUT_TENSOR_HEIGHT}
            resizeDepth={3}
            rotation={0}
            onReady={handleCameraStream}
          />
        </View>
        <View style={styles.overlay}>
          {/* <Text>
            Eye positions: {_.round(points.left_x, 2)}//{ _.round(points.right_x) }---{_.round(points.left_y)}//{ _.round(points.right_y) } 
          </Text> */}
          {/* <Text>
            IPD: { imageIpd } 
          </Text> */}
          <SnellenChart chartScale={chartScale} />
        </View>
      </React.Fragment>
    );
  }
}

const styles = StyleSheet.create({
  containerPortrait: {
    position: 'relative',
    width: CAM_PREVIEW_WIDTH,
    height: CAM_PREVIEW_HEIGHT,
    marginTop: Dimensions.get('window').height / 2 - CAM_PREVIEW_HEIGHT / 2,
  },
  loadingMsg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  camera: {
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  overlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "#ffffff",
    zIndex: 100,
    // alignItems: 'center',
    // justifyContent: 'center',
  }
});
