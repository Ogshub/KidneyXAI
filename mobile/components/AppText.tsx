import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

interface AppTextProps extends TextProps {
  weight?: 'regular' | 'medium' | 'bold';
  size?: keyof typeof theme.typography.sizes;
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export const AppText = ({
  children,
  style,
  weight = 'regular',
  size = 'base',
  color = theme.colors.text,
  align = 'auto',
  ...props
}: AppTextProps) => {
  return (
    <Text
      style={[
        {
          fontFamily: theme.typography.fontFamily[weight],
          fontSize: theme.typography.sizes[size],
          color,
          textAlign: align,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};
