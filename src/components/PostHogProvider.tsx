export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  // Disabled until the live project key is restored. The current key spams 404/401s.
  return <>{children}</>;
}
