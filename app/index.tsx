import { Redirect } from 'expo-router';

// App opens directly to the library — no login gate.
export default function Index() {
  return <Redirect href="/(app)/library" />;
}
