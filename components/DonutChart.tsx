import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface DonutChartProps {
  progress: number; // 0 to 1
  size: number;
  strokeWidth: number;
  color: string;
  backgroundColor: string;
}

export default function DonutChart({ 
  progress, 
  size, 
  strokeWidth, 
  color, 
  backgroundColor
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {/* Black border circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius + 2}
          stroke="#000000"
          strokeWidth={2}
          fill="transparent"
        />
        {/* Background circle - bright green */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#00ff00" // Bright green like in the image
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
        />
        {/* Progress circle - bright red */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#ff0000" // Bright red like in the image
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
    </View>
  );
} 