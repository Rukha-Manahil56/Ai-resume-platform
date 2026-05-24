import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Route: /mock-interview
export default function MockInterviewPage() {
  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Mock Interview</h1>
        <Badge variant="secondary">Coming soon</Badge>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Choose an interview style</CardTitle>
          <CardDescription>
            Tabs let users switch between question types. You will load real
            questions here later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="behavioral">
            <TabsList>
              <TabsTrigger value="behavioral">Behavioral</TabsTrigger>
              <TabsTrigger value="technical">Technical</TabsTrigger>
              <TabsTrigger value="role">Role-specific</TabsTrigger>
            </TabsList>
            <TabsContent
              value="behavioral"
              className="text-sm text-muted-foreground"
            >
              Behavioral questions will appear here.
            </TabsContent>
            <TabsContent
              value="technical"
              className="text-sm text-muted-foreground"
            >
              Technical questions will appear here.
            </TabsContent>
            <TabsContent value="role" className="text-sm text-muted-foreground">
              Role-specific questions will appear here.
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
