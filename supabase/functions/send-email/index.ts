
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  htmlContent: string;
  templateType: string | null;
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

    console.log("Email request received:", { to, subject, templateType });

    // Get SMTP settings from database
    const { data: smtpData, error: smtpError } = await supabase
      .from('smtp_settings')
      .select('*')
      .maybeSingle();

    if (smtpError) {
      console.error("SMTP settings error:", smtpError);
      throw new Error("Failed to load SMTP settings: " + smtpError.message);
    }

    if (!smtpData) {
      throw new Error("SMTP settings not configured. Please configure SMTP settings in the admin panel.");
    }

    console.log("SMTP settings loaded:", { host: smtpData.host, port: smtpData.port, username: smtpData.username });

    // Get email template if specified
    let finalSubject = subject;
    let finalHtmlContent = htmlContent;

    if (templateType) {
      const { data: templateData, error: templateError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_type', templateType)
        .maybeSingle();

      if (!templateError && templateData) {
        finalSubject = templateData.subject;
        finalHtmlContent = templateData.html_content;
        console.log("Template loaded:", templateType);
      }
    }

    // Replace variables in subject and content
    if (variables && Object.keys(variables).length > 0) {
      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        finalSubject = finalSubject.replace(new RegExp(placeholder, 'g'), value);
        finalHtmlContent = finalHtmlContent.replace(new RegExp(placeholder, 'g'), value);
      });
    }

    // Initialize SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: smtpData.host,
        port: smtpData.port,
        tls: smtpData.use_tls,
        auth: {
          username: smtpData.username,
          password: smtpData.password,
        },
      },
    });

    console.log("Connecting to SMTP server...");

    // Connect to SMTP server
    await client.connect();

    console.log("Connected to SMTP server, sending email...");

    // Send email
    await client.send({
      from: `${smtpData.from_name} <${smtpData.from_email}>`,
      to: to,
      subject: finalSubject,
      content: "auto",
      html: finalHtmlContent,
    });

    console.log("Email sent successfully");

    // Close connection
    await client.close();

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
      JSON.stringify({ 
        error: error.message || "Failed to send email",
        details: error.toString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
