
import { useState, useCallback } from "react";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";

export interface SmtpSettings {
  id: string;
  host: string;
  port: number;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  useTls: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useSmtpSettings = () => {
  const [smtpSettings, setSmtpSettings] = useState<SmtpSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadSmtpSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('smtp_settings')
        .select('*')
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        const settings: SmtpSettings = {
          id: data.id,
          host: data.host,
          port: data.port,
          username: data.username,
          password: data.password,
          fromEmail: data.from_email,
          fromName: data.from_name,
          useTls: data.use_tls,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
        setSmtpSettings(settings);
      }
    } catch (error) {
      console.error("Error loading SMTP settings:", error);
      toast.error("Failed to load SMTP settings");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSmtpSettings = async (settings: Omit<SmtpSettings, "id" | "createdAt" | "updatedAt">) => {
    try {
      setIsLoading(true);
      
      const settingsData = {
        host: settings.host,
        port: settings.port,
        username: settings.username,
        password: settings.password,
        from_email: settings.fromEmail,
        from_name: settings.fromName,
        use_tls: settings.useTls,
        updated_at: new Date().toISOString()
      };

      // Use upsert to either insert or update
      const { data, error } = await supabase
        .from('smtp_settings')
        .upsert(settingsData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) throw error;

      await loadSmtpSettings();
      toast.success("SMTP settings saved successfully");
    } catch (error) {
      console.error("Error saving SMTP settings:", error);
      toast.error("Failed to save SMTP settings");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestEmail = async (testEmail: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: testEmail,
          subject: 'Test Email from Lab Management System',
          htmlContent: `
            <h1>Test Email</h1>
            <p>This is a test email to verify your SMTP configuration.</p>
            <p>If you received this email, your SMTP settings are working correctly!</p>
            <p>Sent at: ${new Date().toLocaleString()}</p>
          `,
          templateType: null,
          variables: {}
        }
      });

      if (error) throw error;

      toast.success("Test email sent successfully!");
      return true;
    } catch (error) {
      console.error("Error sending test email:", error);
      toast.error("Failed to send test email");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    smtpSettings,
    isLoading,
    loadSmtpSettings,
    saveSmtpSettings,
    sendTestEmail
  };
};
