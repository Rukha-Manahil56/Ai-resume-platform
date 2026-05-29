import { redirect } from "next/navigation";

/* The "/" route inside the app group now lives at /dashboard */
export default function AppIndexPage() {
  redirect("/dashboard");
}
