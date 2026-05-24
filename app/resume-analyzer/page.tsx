import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Route: /resume-analyzer
export default function ResumeAnalyzerPage() {
  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          Resume Analyzer
        </h1>
        <Badge variant="secondary">Coming soon</Badge>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Upload or paste your resume</CardTitle>
          <CardDescription>
            AI feedback and keyword suggestions will run here once you connect
            an API.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Input placeholder="Job title you're applying for" />
          <Textarea placeholder="Paste resume text here..." rows={8} />
          <Button type="button" disabled>
            Analyze resume
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
