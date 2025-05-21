
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BookingStatistics } from '../types';

export const exportAnalyticsToPDF = (statistics: BookingStatistics, title: string = 'Analytics Report') => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Title
  doc.setFontSize(20);
  doc.text(title, pageWidth / 2, 15, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 22, { align: 'center' });
  
  // Total bookings
  doc.setFontSize(14);
  doc.text('Booking Overview', 14, 35);
  
  doc.setFontSize(11);
  doc.text(`Total Bookings: ${statistics.totalBookings}`, 14, 45);
  
  // Instrument usage table
  doc.setFontSize(14);
  doc.text('Instrument Usage', 14, 60);
  
  autoTable(doc, {
    startY: 65,
    head: [['Instrument', 'Bookings', 'Usage Hours']],
    body: statistics.instrumentUsage.map(item => [
      item.instrumentName,
      item.bookingCount,
      item.totalHours.toFixed(1)
    ]),
  });
  
  // User bookings table
  const finalY = (doc as any).lastAutoTable.finalY || 65;
  doc.setFontSize(14);
  doc.text('User Bookings', 14, finalY + 15);
  
  autoTable(doc, {
    startY: finalY + 20,
    head: [['User', 'Bookings', 'Usage Hours']],
    body: statistics.userBookings.map(item => [
      item.userName,
      item.bookingCount,
      item.totalHours.toFixed(1)
    ]),
  });
  
  // Weekly usage
  const finalY2 = (doc as any).lastAutoTable.finalY || (finalY + 20);
  doc.setFontSize(14);
  doc.text('Weekly Usage', 14, finalY2 + 15);
  
  autoTable(doc, {
    startY: finalY2 + 20,
    head: [['Week', 'Bookings']],
    body: statistics.weeklyUsage.map(item => [
      item.week,
      item.bookingCount
    ]),
  });
  
  // Save the PDF
  doc.save('analytics-report.pdf');
};
