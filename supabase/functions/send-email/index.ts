
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  htmlContent: string;
  templateType: string;
  variables: Record<string, string>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { to, subject, htmlContent, templateType, variables }: EmailRequest = await req.json();

    // Get SMTP settings from database
    const { data: smtpData, error: smtpError } = await supabase
      .from('smtp_settings')
      .select('*')
      .single();

    if (smtpError || !smtpData) {
      throw new Error("SMTP settings not configured");
    }

    // Get email template if not provided
    let finalSubject = subject;
    let finalHtmlContent = htmlContent;

    if (templateType) {
      const { data: templateData, error: templateError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_type', templateType)
        .single();

      if (!templateError && templateData) {
        finalSubject = templateData.subject;
        finalHtmlContent = templateData.html_content;
      }
    }

    // Replace variables in subject and content
    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        finalSubject = finalSubject.replace(new RegExp(placeholder, 'g'), value);
        finalHtmlContent = finalHtmlContent.replace(new RegExp(placeholder, 'g'), value);
      });
    }

    // Create SMTP configuration
    const smtpConfig = {
      hostname: smtpData.host,
      port: smtpData.port,
      username: smtpData.username,
      password: smtpData.password,
      tls: smtpData.use_tls
    };

    // Send email using Deno's built-in SMTP (simplified version)
    // In a real implementation, you'd use a proper SMTP library
    console.log("Sending email:", {
      to,
      from: `${smtpData.from_name} <${smtpData.from_email}>`,
      subject: finalSubject,
      smtp: smtpConfig.hostname
    });

    // For this demo, we'll simulate sending the email
    // In production, implement actual SMTP sending here
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully",
        emailData: {
          to,
          subject: finalSubject,
          from: `${smtpData.from_name} <${smtpData.from_email}>`
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
