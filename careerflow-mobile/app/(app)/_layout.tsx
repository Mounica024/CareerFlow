import { Stack, Redirect } from 'expo-router';
import { useProfile } from '@/context/ProfileContext';

export default function AppLayout() {
  const { needsSetup } = useProfile();

  if (needsSetup) {
    return <Redirect href="/profile" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
