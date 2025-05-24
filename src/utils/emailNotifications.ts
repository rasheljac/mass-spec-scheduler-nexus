
import { supabase } from "../integrations/supabase/client";
import { shouldSendEmail } from "./emailPreferences";

export interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  htmlContent?: string;
  templateType?: string;
  variables?: Record<string, string>;
}

export const sendEmail = async (notification: EmailNotification & { emailType?: 'notification' | 'reminder' }): Promise<boolean> => {
  // Check if user has opted in for this type of email
  if (notification.emailType && !shouldSendEmail(notification.emailType)) {
    console.log(`Email sending skipped - user has opted out of ${notification.emailType} emails`);
    return false;
  }

  try {
    console.log("Sending email notification:", notification);
    
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: notification.to,
        subject: notification.subject,
        htmlContent: notification.htmlContent || `<p>${notification.body.replace(/\n/g, '<br>')}</p>`,
        templateType: notification.templateType || null,
        variables: notification.variables || {}
      }
    });

    if (error) {
      console.error("Email sending error:", error);
      throw error;
    }

    console.log(`Email sent successfully to ${notification.to}`);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
};

export const createBookingNotification = (
  userEmail: string, 
  userName: string,
  instrumentName: string, 
  startDate: string, 
  endDate: string
): EmailNotification => {
  return {
    to: userEmail,
    subject: `Booking Confirmation: ${instrumentName}`,
    body: `
Dear ${userName},

Your booking for ${instrumentName} has been confirmed.
Date and Time: ${new Date(startDate).toLocaleString()} - ${new Date(endDate).toLocaleString()}

Thank you for using the Lab Management System.

Best regards,
Lab Management Team
    `,
    templateType: "booking_confirmation",
    variables: {
      userName,
      instrumentName,
      startDate: new Date(startDate).toLocaleString(),
      endDate: new Date(endDate).toLocaleString(),
      status: "confirmed"
    }
  };
};

export const createStatusUpdateNotification = (
  userEmail: string, 
  userName: string,
  instrumentName: string, 
  status: string
): EmailNotification => {
  return {
    to: userEmail,
    subject: `Booking Status Update: ${instrumentName}`,
    body: `
Dear ${userName},

Your booking for ${instrumentName} has been updated.
New status: ${status}

Thank you for using the Lab Management System.

Best regards,
Lab Management Team
    `,
    templateType: "booking_update",
    variables: {
      userName,
      instrumentName,
      startDate: new Date().toLocaleString(),
      endDate: new Date().toLocaleString(),
      status
    }
  };
};

export const createDelayNotification = (
  userEmail: string, 
  userName: string,
  instrumentName: string, 
  delayMinutes: number
): EmailNotification => {
  return {
    to: userEmail,
    subject: `Booking Delay Notification: ${instrumentName}`,
    body: `
Dear ${userName},

Your booking for ${instrumentName} has been delayed by ${delayMinutes} minutes.
Please adjust your schedule accordingly.

Thank you for your understanding.

Best regards,
Lab Management Team
    `,
    variables: {
      userName,
      instrumentName,
      delayMinutes: delayMinutes.toString(),
      startDate: new Date().toLocaleString(),
      endDate: new Date().toLocaleString()
    }
  };
};
