
// Simple mock SMTP notification system
// In a real application, this would connect to an SMTP server or use an email service API

export interface EmailNotification {
  to: string;
  subject: string;
  body: string;
}

export const sendEmail = async (notification: EmailNotification): Promise<boolean> => {
  // In a real application, this would send an actual email
  // For this demo, we'll just log the notification
  console.log("Sending email notification:", notification);
  
  // Simulate a successful email send
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Email sent successfully to ${notification.to}`);
      resolve(true);
    }, 500);
  });
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
    `
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
    `
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
    `
  };
};
