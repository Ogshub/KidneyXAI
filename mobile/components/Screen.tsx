import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { theme } from '../constants/theme';

interface ScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scrollable?: boolean;
  safeArea?: boolean;
  padded?: boolean;
}

export const Screen = ({
  children,
  style,
  scrollable = false,
  safeArea = true,
  padded = true,
}: ScreenProps) => {
  const insets = useSafeAreaInsets();

  const baseStyle: ViewStyle = {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: padded ? theme.spacing.md : 0,
  };

  const Wrapper = safeArea ? SafeAreaView : View;
  const wrapperStyle = safeArea ? { flex: 1, backgroundColor: theme.colors.background } : baseStyle;

  if (scrollable) {
    return (
      <Wrapper style={wrapperStyle}>
        <KeyboardAwareScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[baseStyle, style, !safeArea && { paddingTop: insets.top, paddingBottom: insets.bottom }]}
          enableOnAndroid={true}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </KeyboardAwareScrollView>
      </Wrapper>
    );
  }

  return (
    <Wrapper style={[wrapperStyle, !scrollable && !safeArea && baseStyle, style]}>
      {children}
    </Wrapper>
  );
};
