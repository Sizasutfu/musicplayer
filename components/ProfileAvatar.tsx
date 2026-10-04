// components/ProfileAvatar.tsx
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { getInitials } from '../lib/profile';

type Props = {
  name: string;
  color: string;
  uri?: string;
  size?: number;
  fontSize?: number;
};

export default function ProfileAvatar({
  name,
  color,
  uri,
  size = 44,
  fontSize,
}: Props) {
  const computedFontSize = fontSize ?? Math.round(size * 0.4);

  // When a photo is set, render it. `color` becomes the background
  // so the circle still looks solid while the image loads.
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        }}
        resizeMode="cover"
      />
    );
  }

  const initials = getInitials(name);

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          { fontSize: computedFontSize, lineHeight: computedFontSize * 1.1 },
        ]}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});