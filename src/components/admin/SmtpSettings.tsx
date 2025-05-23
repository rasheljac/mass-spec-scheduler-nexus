
import React, { useEffect, useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { useSmtpSettings } from "../../hooks/useSmtpSettings";

const SmtpSettings: React.FC = () => {
  const { smtpSettings, isLoading, loadSmtpSettings, saveSmtpSettings } = useSmtpSettings();
  const [formData, setFormData] = useState({
    host: "",
    port: 587,
    username: "",
    password: "",
    fromEmail: "",
    fromName: "Lab Management System",
    useTls: true
  });

  useEffect(() => {
    loadSmtpSettings();
  }, [loadSmtpSettings]);

  useEffect(() => {
    if (smtpSettings) {
      setFormData({
        host: smtpSettings.host,
        port: smtpSettings.port,
        username: smtpSettings.username,
        password: smtpSettings.password,
        fromEmail: smtpSettings.fromEmail,
        fromName: smtpSettings.fromName,
        useTls: smtpSettings.useTls
      });
    }
  }, [smtpSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveSmtpSettings(formData);
    } catch (error) {
      console.error("Error saving SMTP settings:", error);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">SMTP Email Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure your SMTP server settings for sending email notifications.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="host">SMTP Host</Label>
              <Input
                id="host"
                value={formData.host}
                onChange={(e) => handleInputChange("host", e.target.value)}
                placeholder="smtp.gmail.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">SMTP Port</Label>
              <Input
                id="port"
                type="number"
                value={formData.port}
                onChange={(e) => handleInputChange("port", parseInt(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromEmail">From Email</Label>
              <Input
                id="fromEmail"
                type="email"
                value={formData.fromEmail}
                onChange={(e) => handleInputChange("fromEmail", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromName">From Name</Label>
              <Input
                id="fromName"
                value={formData.fromName}
                onChange={(e) => handleInputChange("fromName", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="useTls"
              checked={formData.useTls}
              onCheckedChange={(checked) => handleInputChange("useTls", checked)}
            />
            <Label htmlFor="useTls">Use TLS/SSL</Label>
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save SMTP Settings"}
          </Button>
        </form>
      </div>
    </Card>
  );
};

export default SmtpSettings;
