import React from "react";
import { View, Text, StyleSheet, Image, ScrollView, Dimensions } from "react-native";

import SnellenImage from "./snellen.png";

const MAX_FONT_SIZE = 200;
const IMAGE_DIMENSIONS = {
    width: 2236,
    height: 6138,
};

const styles = (chartScale) => StyleSheet.create({
    container: {
        
    },

});

const SnellenChart = ({ chartScale }) => {
    const windowWidth = Dimensions.get('window').width;
    const windowHeight = Dimensions.get('window').height;
    const imageWidth = windowWidth * 0.5 * chartScale;
    const imageHeight = imageWidth * IMAGE_DIMENSIONS.height / IMAGE_DIMENSIONS.width;
    return (
        <ScrollView
            style={{
                textAlign: "center",
                width: windowWidth,
                height: windowHeight,
            }}
            contentContainerStyle={{
                justifyContent: "flex-start"
            }}
        >
            <Image
                source={SnellenImage}
                style={{
                    marginTop: 100,
                    marginLeft: "auto",
                    marginRight: "auto",
                    width: imageWidth,
                    height: imageHeight,
                }}
                width={imageWidth}
                height={imageHeight}
                resizeMode="contain"
            
            />
            {/* <Text style={styles.line1}>
                E
            </Text>
            <Text>
                FP
            </Text>
            <Text>
                TOZ
            </Text>
            <Text>
                LPED
            </Text>
            <Text>
                PECFD
            </Text>
            <Text>
                EDFCZP
            </Text>
            <Text>
                FELOPZD
            </Text>
            <Text>
                DEFPOTEC
            </Text>
            <Text>
                LEFODPCT
            </Text>
            <Text>
                FDPLTCEO
            </Text>
            <Text>
                PEZOLCFTD
            </Text> */}
        </ScrollView>
    )
};

export default SnellenChart;
