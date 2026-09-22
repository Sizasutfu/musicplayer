// components/ProfileAvatar.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getInitials } from '../lib/profile';

type Props = {
  name: string;
  color: string;
  size?: number;
  fontSize?: number;
};

export default function ProfileAvatar({
  name,
  color,
  size = 44,
  fontSize,
}: Props) {
  const initials = getInitials(name);
  const computedFontSize = fontSize ?? Math.round(size * 0.4);

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