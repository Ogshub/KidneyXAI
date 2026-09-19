import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets, Edge } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { theme } from '../constants/theme';

interface ScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scrollable?: boolean;
  safeArea?: boolean;
  padded?: boolean;
  edges?: readonly Edge[];
}

export const Screen = ({
  children,
  style,
  scrollable = false,
  safeArea = true,
  padded = true,
  edges,
}: ScreenProps) => {
  const insets = useSafeAreaInsets();

  const wrapperStyle: ViewStyle = {
    flex: 1,
    backgroundColor: theme.colors.background,
  };

  const contentPadding: ViewStyle = {
    flexGrow: 1,
    paddingHorizontal: padded ? theme.spacing.md : 0,
    ...(!safeArea ? { paddingTop: insets.top, paddingBottom: insets.bottom } : null),
  };

  if (scrollable) {
    const ScrollWrapper = safeArea ? SafeAreaView : View;
    return (
      <ScrollWrapper
        style={wrapperStyle}
        {...(safeArea ? { edges: edges ?? ['top', 'right', 'bottom', 'left'] } : {})}
      >
        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[contentPadding, style]}
          enableOnAndroid
          extraScrollHeight={80}
          keyboardShouldPersistTaps="handled"
          keyboardOpeningTime={0}
        >
          {children}
        </KeyboardAwareScrollView>
      </ScrollWrapper>
    );
  }

  if (safeArea) {
    return (
      <SafeAreaView style={wrapperStyle} edges={edges ?? ['top', 'right', 'bottom', 'left']}>
        <View style={[{ flex: 1 }, style]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[wrapperStyle, { paddingHorizontal: padded ? theme.spacing.md : 0 }, style]}>
      {children}
    </View>
  );
};
