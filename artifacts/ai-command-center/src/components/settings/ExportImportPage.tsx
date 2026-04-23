import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, UploadCloud } from "lucide-react";

export function ExportImportPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Management</h1>
        <p className="text-muted-foreground mt-1">Export your workspace config or import from another instance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Export Configuration</CardTitle>
            <CardDescription>Download a full backup of your agents, MCPs, and settings as JSON.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" variant="outline">
              <Download className="w-4 h-4 mr-2" /> Export Settings
            </Button>
            <Button className="w-full" variant="outline">
              <Download className="w-4 h-4 mr-2" /> Export Full Workspace
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Import Data</CardTitle>
            <CardDescription>Restore a workspace from a JSON backup file.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center text-muted-foreground hover:bg-muted/50 hover:border-muted-foreground/50 transition-colors cursor-pointer">
              <UploadCloud className="w-8 h-8 mb-3 text-muted-foreground/50" />
              <p className="text-sm font-medium text-foreground">Click to upload or drag and drop</p>
              <p className="text-xs mt-1">JSON files only</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
