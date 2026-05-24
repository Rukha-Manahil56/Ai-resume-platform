/**
 * Login uses a full-screen layout without the app sidebar.
 */
export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
