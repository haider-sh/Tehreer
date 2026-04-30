import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
      {/* The (tabs) group appears as a single stack screen */}
      <Stack.Screen name="(tabs)" />
      {/* Reader slides in over the tabs */}
      <Stack.Screen name="reader/[id]" />
    </Stack>
  );
}
