import React from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Home, MessageSquare, Compass, History, User } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';
import type { NavigationProp, RootStackParamList } from '@/types/navigation';
import { Typography, IconSize, ZIndex } from '@/constants/styles';
import { SidebarConstants, SCREEN } from '@/constants/layout';

export function Sidebar() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { user } = useAuth();
  const { isOpen, closeSidebar } = useSidebar();
  const slideAnim = React.useRef(new Animated.Value(-SidebarConstants.width)).current;

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : -SidebarConstants.width,
      duration: SidebarConstants.slideDuration,
      useNativeDriver: true,
    }).start();
  }, [isOpen, slideAnim]);

  const handleNavigate = (routeName: keyof RootStackParamList) => {
    navigation.navigate(routeName as any);
    closeSidebar();
  };

  const currentRoute = route.name;
  const userName = user?.user_metadata?.name || 'Usuário';

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={closeSidebar}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: SCREEN.width,
            height: SCREEN.height,
            backgroundColor: `rgba(0, 0, 0, ${SidebarConstants.overlayOpacity})`,
            zIndex: ZIndex.overlay,
          }}
        />
      )}

      {/* Sidebar */}
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: SidebarConstants.width,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          borderRightWidth: 1,
          borderRightColor: 'rgba(255, 255, 255, 0.1)',
          zIndex: ZIndex.sidebar,
          transform: [{ translateX: slideAnim }],
        }}
      >
        <View className="flex-1 flex-col">
          {/* Header */}
          <View className="p-4 border-b border-white/10">
            <TouchableOpacity onPress={closeSidebar} activeOpacity={0.7}>
              <Text 
                className="font-serif italic text-2xl text-white" 
                style={{ fontSize: Typography['2xl'] }}
              >
                Bud.
              </Text>
            </TouchableOpacity>
          </View>

          {/* Navigation Items */}
          <View className="px-3 py-4 space-y-2">
            <TouchableOpacity
              onPress={() => handleNavigate('Home')}
              activeOpacity={0.7}
              className={cn(
                'w-full flex-row items-center gap-3 px-3 py-3 rounded-lg',
                currentRoute === 'Home'
                  ? 'bg-white/10'
                  : 'bg-transparent',
              )}
            >
              <Home 
                size={IconSize.md} 
                color={currentRoute === 'Home' ? '#ffffff' : '#9ca3af'} 
              />
              <Text
                className={cn(
                  'text-base font-medium',
                  currentRoute === 'Home' ? 'text-white' : 'text-muted-foreground',
                )}
                style={{ fontSize: Typography.base }}
              >
                Home
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleNavigate('Chat')}
              activeOpacity={0.7}
              className={cn(
                'w-full flex-row items-center gap-3 px-3 py-3 rounded-lg',
                currentRoute === 'Chat'
                  ? 'bg-white/10'
                  : 'bg-transparent',
              )}
            >
              <MessageSquare 
                size={IconSize.md} 
                color={currentRoute === 'Chat' ? '#ffffff' : '#9ca3af'} 
              />
              <Text
                className={cn(
                  'text-base font-medium',
                  currentRoute === 'Chat' ? 'text-white' : 'text-muted-foreground',
                )}
                style={{ fontSize: Typography.base }}
              >
                Chat
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleNavigate('Explore')}
              activeOpacity={0.7}
              className={cn(
                'w-full flex-row items-center gap-3 px-3 py-3 rounded-lg',
                currentRoute === 'Explore'
                  ? 'bg-white/10'
                  : 'bg-transparent',
              )}
            >
              <Compass 
                size={IconSize.md} 
                color={currentRoute === 'Explore' ? '#ffffff' : '#9ca3af'} 
              />
              <Text
                className={cn(
                  'text-base font-medium',
                  currentRoute === 'Explore' ? 'text-white' : 'text-muted-foreground',
                )}
                style={{ fontSize: Typography.base }}
              >
                Explorar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleNavigate('History')}
              activeOpacity={0.7}
              className={cn(
                'w-full flex-row items-center gap-3 px-3 py-3 rounded-lg',
                currentRoute === 'History'
                  ? 'bg-white/10'
                  : 'bg-transparent',
              )}
            >
              <History 
                size={IconSize.md} 
                color={currentRoute === 'History' ? '#ffffff' : '#9ca3af'} 
              />
              <Text
                className={cn(
                  'text-base font-medium',
                  currentRoute === 'History' ? 'text-white' : 'text-muted-foreground',
                )}
                style={{ fontSize: Typography.base }}
              >
                Histórico
              </Text>
            </TouchableOpacity>
          </View>

          {/* User Section */}
          <View className="mt-auto p-3 border-t border-white/10">
            <TouchableOpacity
              onPress={() => {
                handleNavigate('Settings');
              }}
              activeOpacity={0.7}
              className="flex-row items-center gap-3 p-2 rounded-lg"
            >
              <View className="w-8 h-8 rounded-full bg-accent items-center justify-center">
                <User size={IconSize.sm} color="#000000" />
              </View>
              <View className="flex-1 min-w-0">
                <Text 
                  className="text-base font-medium text-white truncate" 
                  style={{ fontSize: Typography.base }}
                >
                  {userName}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </>
  );
}

