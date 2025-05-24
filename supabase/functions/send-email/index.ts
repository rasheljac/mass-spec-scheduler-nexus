
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
  templateType: string | null;
  variables: Record<string, string>;
}

// Simple SMTP client implementation
async function sendSMTPEmail(
  host: string,
  port: number,
  username: string,
  password: string,
  useTls: boolean,
  fromEmail: string,
  fromName: string,
  to: string,
  subject: string,
  htmlContent: string
) {
  try {
    console.log(`Connecting to SMTP server: ${host}:${port}`);
    
    // Connect to SMTP server
    const conn = await Deno.connect({
      hostname: host,
      port: port,
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Helper function to read response
    async function readResponse(): Promise<string> {
      const buffer = new Uint8Array(1024);
      const n = await conn.read(buffer);
      if (n === null) throw new Error("Connection closed");
      return decoder.decode(buffer.subarray(0, n));
    }

    // Helper function to send command
    async function sendCommand(command: string): Promise<string> {
      console.log(`> ${command}`);
      await conn.write(encoder.encode(command + "\r\n"));
      const response = await readResponse();
      console.log(`< ${response.trim()}`);
      return response;
    }

    // SMTP handshake
    await readResponse(); // Read initial greeting
    await sendCommand(`EHLO ${host}`);
    
    if (useTls && port !== 465) {
      await sendCommand("STARTTLS");
      // Note: This is a simplified implementation. In production, you'd need proper TLS handling
    }

    // Authenticate
    const authString = btoa(`\0${username}\0${password}`);
    await sendCommand("AUTH PLAIN " + authString);

    // Send email
    await sendCommand(`MAIL FROM:<${fromEmail}>`);
    await sendCommand(`RCPT TO:<${to}>`);
    await sendCommand("DATA");

    const emailContent = [
      `From: ${fromName} <${fromEmail}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: text/html; charset=UTF-8`,
      ``,
      htmlContent,
      `.`
    ].join("\r\n");

    await conn.write(encoder.encode(emailContent + "\r\n"));
    const dataResponse = await readResponse();
    
    await sendCommand("QUIT");
    conn.close();

    console.log("Email sent successfully via SMTP");
    return true;
  } catch (error) {
    console.error("SMTP Error:", error);
    throw new Error(`SMTP sending failed: ${error.message}`);
  }
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

    console.log("Attempting to send email via SMTP...");

    // Actually send the email using SMTP
    await sendSMTPEmail(
      smtpData.host,
      smtpData.port,
      smtpData.username,
      smtpData.password,
      smtpData.use_tls,
      smtpData.from_email,
      smtpData.from_name,
      to,
      finalSubject,
      finalHtmlContent
    );

    console.log("Email sent successfully");

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
