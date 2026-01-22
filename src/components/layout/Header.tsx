import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSidebar } from '@/contexts/SidebarContext';
import { ZIndex } from '@/constants/styles';
import { HeaderConstants } from '@/constants/layout';

export function Header() {
  const insets = useSafeAreaInsets();
  const { toggleSidebar } = useSidebar();

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: ZIndex.header,
        backgroundColor: 'rgba(30, 30, 30, 0.9)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        paddingTop: insets.top,
      }}
    >
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity
          onPress={toggleSidebar}
          activeOpacity={0.7}
          className="w-10 h-10 items-center justify-center rounded-lg bg-black/50"
        >
          <Text className="text-white text-xl">☰</Text>
        </TouchableOpacity>
        <Text className="font-serif italic text-xl text-white">Bud.</Text>
        <View className="w-10" />
      </View>
    </View>
  );
}

