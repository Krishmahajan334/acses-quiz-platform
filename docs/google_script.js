/**
 * ACSES Technical Quiz - Google Sheets & Email Webhook
 * 
 * INSTRUCTIONS:
 * 1. Create a new Google Sheet.
 * 2. Name the first tab "Results" and add headers in Row 1: 
 *    Name | PRN | Email | Mobile | Score | Status | Coupon Code | Date
 * 3. Go to Extensions > Apps Script.
 * 4. Paste this entire file into the code editor, replacing any existing code.
 * 5. Click "Deploy" > "New deployment".
 * 6. Select type "Web app".
 * 7. Set "Execute as" to "Me".
 * 8. Set "Who has access" to "Anyone".
 * 9. Click Deploy, authorize the permissions, and copy the "Web app URL".
 * 10. Paste the Web app URL into your quiz platform's .env file as GOOGLE_SCRIPT_WEB_URL.
 */

function doPost(e) {
  try {
    // Parse the incoming JSON payload
    var data = JSON.parse(e.postData.contents);
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Results");
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ "error": "Sheet named 'Results' not found." }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Append the row to Google Sheets
    var row = [
      data.name,
      data.prn || "N/A",
      data.email,
      data.mobile,
      data.scorePercent + "%",
      data.status,
      data.couponCode || "N/A",
      new Date().toLocaleString()
    ];
    
    sheet.appendRow(row);
    
    // If they passed and have a coupon, send the email!
    if (data.status === "COMPLETED" && data.couponCode && data.email) {
      sendCouponEmail(data.name, data.email, data.couponCode);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ "success": true, "message": "Row added and email checked." }))
                         .setMimeType(ContentService.MimeType.JSON);
                         
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "error": error.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

function sendCouponEmail(name, emailAddress, couponCode) {
  var subject = "🎉 Congratulations! Your ACSES Technical Quiz Coupon";
  
  var htmlBody = `
    <div style="font-family: Arial, sans-serif; max-w-xl; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
      <h2 style="color: #2563eb;">ACSES Technical Quiz 2026</h2>
      <p>Hi <b>${name}</b>,</p>
      <p>Congratulations on passing the technical quiz! As promised, here is your exclusive reward coupon.</p>
      
      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #1e3a8a;">${couponCode}</span>
      </div>
      
      <p>Show this code at the ACSES event desk to claim your reward.</p>
      <br>
      <p>Best regards,<br><b>The ACSES Core Team</b></p>
    </div>
  `;
  
  MailApp.sendEmail({
    to: emailAddress,
    subject: subject,
    htmlBody: htmlBody
  });
}
