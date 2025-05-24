
import { useState, useCallback } from "react";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";

export interface EmailTemplate {
  id: string;
  templateType: string;
  subject: string;
  htmlContent: string;
  createdAt: string;
  updatedAt: string;
}

export const useEmailTemplates = () => {
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadEmailTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('template_type');

      if (error) {
        throw error;
      }

      if (data) {
        const templates: EmailTemplate[] = data.map(template => ({
          id: template.id,
          templateType: template.template_type,
          subject: template.subject,
          htmlContent: template.html_content,
          createdAt: template.created_at,
          updatedAt: template.updated_at
        }));
        setEmailTemplates(templates);
      }
    } catch (error) {
      console.error("Error loading email templates:", error);
      toast.error("Failed to load email templates");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveEmailTemplate = async (template: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">) => {
    try {
      setIsLoading(true);
      
      const templateData = {
        template_type: template.templateType,
        subject: template.subject,
        html_content: template.htmlContent
      };

      console.log("Saving email template:", templateData);

      const { error } = await supabase
        .from('email_templates')
        .upsert(templateData, { 
          onConflict: 'template_type',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      await loadEmailTemplates();
      toast.success("Email template saved successfully");
    } catch (error) {
      console.error("Error saving email template:", error);
      toast.error("Failed to save email template: " + (error as Error).message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    emailTemplates,
    isLoading,
    loadEmailTemplates,
    saveEmailTemplate
  };
};
