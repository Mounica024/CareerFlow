import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/context/AuthContext';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';

function AuthGate() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0f4c75" />
      </View>
    );
  }

  if (!session) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
      </Stack>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <AuthGate />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
});
