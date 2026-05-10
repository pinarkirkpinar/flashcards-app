import { Stack } from 'expo-router';

export default function SetLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        animation: 'none', 
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ animation: 'none' }}
      />
      <Stack.Screen 
        name="known" 
        options={{ animation: 'none' }}
      />
      <Stack.Screen 
        name="unknown" 
        options={{ animation: 'none' }}
      />
      <Stack.Screen 
        name="stats" 
        options={{ animation: 'none' }}
      />
    </Stack>
  );
}