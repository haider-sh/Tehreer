import React from 'react';
import { Text, TextProps, StyleSheet, I18nManager } from 'react-native';
import { Fonts } from '../../constants/fonts';
import { Colors, FontSize } from '../../constants/theme';

// Force RTL for Urdu text rendering
I18nManager.allowRTL(true);

interface UrduTextProps extends TextProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  children: React.ReactNode;
}

export function UrduText({ size = 'md', color, style, children, ...props }: UrduTextProps) {
  const fontSize = {
    sm: FontSize.urduSm,
    md: FontSize.urduMd,
    lg: FontSize.urduLg,
    xl: FontSize.urduXl,
  }[size];

  return (
    <Text
      style={[
        styles.base,
        { fontSize, color: color ?? Colors.textPrimary },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: Fonts.urdu,
    writingDirection: 'rtl',
    textAlign: 'right',
    lineHeight: 38, // Nastaliq glyphs are tall; generous line height is critical
  },
});
