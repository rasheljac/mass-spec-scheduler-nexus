
import React, { useEffect, useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Mail, Eye } from "lucide-react";
import { useEmailTemplates } from "../../hooks/useEmailTemplates";
import { supabase } from "../../integrations/supabase/client";
import { toast } from "sonner";

const EmailTemplatesManagement: React.FC = () => {
  const { emailTemplates, isLoading, loadEmailTemplates, saveEmailTemplate } = useEmailTemplates();
  const [activeTemplate, setActiveTemplate] = useState("booking_confirmation");
  const [formData, setFormData] = useState({
    subject: "",
    htmlContent: ""
  });
  const [testEmail, setTestEmail] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

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
    } else {
      // Set default HTML templates if none exist
      if (activeTemplate === "booking_confirmation") {
        setFormData({
          subject: "Booking Confirmation: {{instrumentName}}",
          htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Booking Confirmation</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .booking-details { background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .footer { background-color: #e5e7eb; padding: 15px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Booking Confirmation</h1>
  </div>
  <div class="content">
    <p>Dear {{userName}},</p>
    <p>Your booking has been confirmed:</p>
    <div class="booking-details">
      <h3>Booking Details</h3>
      <ul>
        <li><strong>Instrument:</strong> {{instrumentName}}</li>
        <li><strong>Start Date:</strong> {{startDate}}</li>
        <li><strong>End Date:</strong> {{endDate}}</li>
        <li><strong>Status:</strong> {{status}}</li>
      </ul>
    </div>
    <p>Thank you for using the Lab Management System.</p>
  </div>
  <div class="footer">
    <p>Lab Management System | Automated Email</p>
  </div>
</body>
</html>`
        });
      } else if (activeTemplate === "booking_update") {
        setFormData({
          subject: "Booking Update: {{instrumentName}}",
          htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Booking Update</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background-color: #059669; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .booking-details { background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .footer { background-color: #e5e7eb; padding: 15px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Booking Update</h1>
  </div>
  <div class="content">
    <p>Dear {{userName}},</p>
    <p>Your booking has been updated:</p>
    <div class="booking-details">
      <h3>Updated Booking Details</h3>
      <ul>
        <li><strong>Instrument:</strong> {{instrumentName}}</li>
        <li><strong>Start Date:</strong> {{startDate}}</li>
        <li><strong>End Date:</strong> {{endDate}}</li>
        <li><strong>New Status:</strong> {{status}}</li>
      </ul>
    </div>
    <p>Thank you for using the Lab Management System.</p>
  </div>
  <div class="footer">
    <p>Lab Management System | Automated Email</p>
  </div>
</body>
</html>`
        });
      }
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

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      toast.error("Please enter a test email address");
      return;
    }
    
    setIsSendingTest(true);
    
    // Replace template variables with sample data for testing
    let testSubject = formData.subject;
    let testContent = formData.htmlContent;
    
    const sampleData = {
      "{{userName}}": "John Doe",
      "{{instrumentName}}": "Sample Instrument XR-1000",
      "{{startDate}}": new Date().toLocaleDateString(),
      "{{endDate}}": new Date(Date.now() + 86400000).toLocaleDateString(),
      "{{status}}": "confirmed"
    };

    Object.entries(sampleData).forEach(([key, value]) => {
      testSubject = testSubject.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
      testContent = testContent.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: testEmail,
          subject: testSubject,
          htmlContent: testContent,
          templateType: null,
          variables: {}
        }
      });

      if (error) throw error;

      toast.success("Test email sent successfully!");
    } catch (error) {
      console.error("Error sending test email:", error);
      toast.error("Failed to send test email");
    }
    
    setIsSendingTest(false);
  };

  const getPreviewContent = () => {
    let previewContent = formData.htmlContent;
    const sampleData = {
      "{{userName}}": "John Doe",
      "{{instrumentName}}": "Sample Instrument XR-1000",
      "{{startDate}}": new Date().toLocaleDateString(),
      "{{endDate}}": new Date(Date.now() + 86400000).toLocaleDateString(),
      "{{status}}": "confirmed"
    };

    Object.entries(sampleData).forEach(([key, value]) => {
      previewContent = previewContent.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    return previewContent;
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="htmlContent">HTML Content</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {showPreview ? "Hide Preview" : "Show Preview"}
                  </Button>
                </div>
                <Textarea
                  id="htmlContent"
                  value={formData.htmlContent}
                  onChange={(e) => setFormData(prev => ({ ...prev, htmlContent: e.target.value }))}
                  placeholder="HTML email template content"
                  className="min-h-[400px] font-mono text-sm"
                  required
                />
              </div>

              {showPreview && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Live Preview (with sample data):</h4>
                  <div 
                    className="border rounded p-4 bg-white"
                    dangerouslySetInnerHTML={{ __html: getPreviewContent() }}
                  />
                </div>
              )}

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

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Template"}
                </Button>
              </div>
            </form>

            <div className="border-t pt-6 mt-6">
              <h4 className="text-md font-semibold mb-4">Test Email Template</h4>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="testTemplateEmail">Test Email Address</Label>
                  <Input
                    id="testTemplateEmail"
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                  />
                </div>
                <Button 
                  onClick={handleSendTestEmail}
                  disabled={!testEmail || isSendingTest}
                  variant="outline"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {isSendingTest ? "Sending..." : "Send Test Template"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                This will send the current template with sample data to test the formatting.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};

export default EmailTemplatesManagement;
