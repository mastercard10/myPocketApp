import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Tabs } from 'expo-router';
import React from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        /*  tabBarStyle: {
            backgroundColor: Colors[colorScheme ?? 'light'].background,
          },*/
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
          borderTopWidth: 2,
          height: '8%', // Augmentez ou diminuez cette valeur selon vos besoins
          bottom: '3%', // Ajuster l'espacement interne
        //  paddingTop: 10,
          elevation: 0,
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 3,
              },
              shadowOpacity: 0.27,
              shadowRadius: 4.65,
        },
        tabBarLabelStyle: {
          fontSize: 14, // Taille de la police
          marginTop: 5, // Espace entre l'icône et le texte
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Transactions",
          tabBarIcon: ({ color, size }) => (
            <Icon name="list" size={size} color={color} />
          ),
        }}
      />

    <Tabs.Screen
            name="planifications"
            options={{
              title: "Planifications",
              tabBarIcon: ({ color, size }) => (
                <Icon name="trending-up" size={size} color={color} />
              ),
            }}
          />
        </Tabs>
  );
}