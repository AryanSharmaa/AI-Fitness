import { Tabs } from 'expo-router'
import { Platform, View, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View className="items-center justify-center pt-1">
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      <Text
        className={`text-xs mt-0.5 ${focused ? 'text-orange-500 font-semibold' : 'text-zinc-400'}`}
        style={{ fontSize: 10 }}
      >
        {label}
      </Text>
    </View>
  )
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#f4f4f5',
          borderTopWidth: 1,
          height: 60 + (Platform.OS === 'ios' ? insets.bottom : 0),
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="food"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🥗" label="Food" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="💪" label="Workout" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🤖" label="Coach" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profile" focused={focused} />,
        }}
      />
    </Tabs>
  )
}
