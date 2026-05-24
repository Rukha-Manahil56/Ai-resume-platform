import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PlaceholderPageProps = {
  title: string;
  description: string;
};

/**
 * Reusable layout for pages that are not built yet.
 * Shows a title, short description, and a Card so you can see shadcn/ui in action.
 */
export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <Badge variant="secondary">Coming soon</Badge>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This is a placeholder page. You will add forms, AI features, and
            charts here as you build out the platform.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
