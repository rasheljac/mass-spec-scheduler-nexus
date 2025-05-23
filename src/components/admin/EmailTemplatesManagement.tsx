
import React, { useEffect, useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useEmailTemplates } from "../../hooks/useEmailTemplates";

const EmailTemplatesManagement: React.FC = () => {
  const { emailTemplates, isLoading, loadEmailTemplates, saveEmailTemplate } = useEmailTemplates();
  const [activeTemplate, setActiveTemplate] = useState("booking_confirmation");
  const [formData, setFormData] = useState({
    subject: "",
    htmlContent: ""
  });

  useEffect(() => {
    loadEmailTemplates();
  }, [loadEmailTemplates]);

  useEffect(() => {
    const template = emailTemplates.find(t => t.templateType === activeTemplate);
    if (template) {
      setFormData({
        subject: template.subject,
        htmlContent: template.htmlContent
      });
    }
  }, [emailTemplates, activeTemplate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveEmailTemplate({
        templateType: activeTemplate,
        subject: formData.subject,
        htmlContent: formData.htmlContent
      });
    } catch (error) {
      console.error("Error saving email template:", error);
    }
  };

  const availableVariables = {
    booking_confirmation: ["{{userName}}", "{{instrumentName}}", "{{startDate}}", "{{endDate}}", "{{status}}"],
    booking_update: ["{{userName}}", "{{instrumentName}}", "{{startDate}}", "{{endDate}}", "{{status}}"]
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Email Templates</h3>
          <p className="text-sm text-muted-foreground">
            Customize the HTML templates used for email notifications.
          </p>
        </div>

        <Tabs value={activeTemplate} onValueChange={setActiveTemplate}>
          <TabsList>
            <TabsTrigger value="booking_confirmation">Booking Confirmation</TabsTrigger>
            <TabsTrigger value="booking_update">Booking Update</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTemplate} className="mt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Email subject with variables like {{instrumentName}}"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="htmlContent">HTML Content</Label>
                <Textarea
                  id="htmlContent"
                  value={formData.htmlContent}
                  onChange={(e) => setFormData(prev => ({ ...prev, htmlContent: e.target.value }))}
                  placeholder="HTML email template content"
                  className="min-h-[300px] font-mono text-sm"
                  required
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Available Variables:</h4>
                <div className="flex flex-wrap gap-2">
                  {availableVariables[activeTemplate as keyof typeof availableVariables]?.map(variable => (
                    <span key={variable} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {variable}
                    </span>
                  ))}
                </div>
              </div>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Template"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};

export default EmailTemplatesManagement;
