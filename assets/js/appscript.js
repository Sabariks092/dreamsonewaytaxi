/**
 * GOOGLE APPS SCRIPT (SERVER-SIDE)
 * 
 * 1. Open Google Sheets.
 * 2. Go to Extensions > Apps Script.
 * 3. Delete any existing code and paste this.
 * 4. Update the ADMIN_EMAIL below.
 * 5. Click "Deploy" > "New Deployment" > "Web App".
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy the Web App URL and paste it into assets/js/form-handler.js.
 */

// 1. CONFIGURATION
const ADMIN_EMAIL = "errorstudio2020@gmail.com"; 
const SHEET_NAME = "Sheet1";

/**
 * Main function that handles form submissions
 */
function doPost(e) {
  try {
    Logger.log("--- New Submission Received ---");
    
    // Extract parameters from form-encoded data
    const params = e.parameter;
    Logger.log("Data received: " + JSON.stringify(params));

    // A. Append to Sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      // Add Headers if new sheet
      sheet.appendRow([
        "Timestamp", "Full Name", "Email", "Mobile", 
        "Pickup", "Dropoff", "Passengers", "Taxi Type", 
        "Date", "Trip Type"
      ]);
    }
    
    sheet.appendRow([
      new Date(),
      params.fullName || "N/A",
      params.email || "N/A",
      params.mobile || "N/A",
      params.pickup || "N/A",
      params.dropoff || "N/A",
      params.passengers || "N/A",
      params.taxiType || "N/A",
      params.date || "N/A",
      params.tripType || "N/A"
    ]);
    Logger.log("✅ Successfully appended to sheet");

    // B. Send Admin Email
    try {
      sendAdminNotification(params);
      Logger.log("✅ Admin notification sent");
    } catch (err) {
      Logger.log("❌ Admin Email Error: " + err.toString());
    }

    // C. Send User Confirmation Email
    if (params.email && params.email !== "N/A") {
      try {
        sendUserConfirmation(params);
        Logger.log("✅ User confirmation sent");
      } catch (err) {
        Logger.log("❌ User Email Error: " + err.toString());
      }
    }

    // Return success response (even if email fails)
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);

  } catch (error) {
    Logger.log("FATAL ERROR: " + error.toString());
    return ContentService.createTextOutput("Error: " + error.toString()).setMimeType(ContentService.MimeType.TEXT);
  }
}

function sendAdminNotification(data) {
  const subject = "🚖 New Taxi Booking from " + (data.fullName || "Customer");
  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 12px; background-color: #fff; max-width: 600px;">
      <h2 style="color: #F93800; border-bottom: 3px solid #F93800; padding-bottom: 10px; margin-top: 0;">New Booking Details</h2>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 5px 0;"><strong>👤 Name:</strong> ${data.fullName}</p>
        <p style="margin: 5px 0;"><strong>📧 Email:</strong> ${data.email}</p>
        <p style="margin: 5px 0;"><strong>📱 Mobile:</strong> ${data.mobile}</p>
      </div>
      
      <h3 style="color: #333; margin-bottom: 10px;">Trip Information:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>📍 Pickup:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.pickup}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>🏁 Dropoff:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.dropoff}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>👥 Passengers:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.passengers}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>🚗 Taxi Type:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.taxiType}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>📅 Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.date}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>🔁 Trip Type:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.tripType}</td></tr>
      </table>
      
      <div style="margin-top: 25px; text-align: center; color: #888; font-size: 12px;">
        <p>This is an automated notification from your website.</p>
      </div>
    </div>
  `;
  GmailApp.sendEmail(ADMIN_EMAIL, subject, "New taxi booking received.", { htmlBody: htmlBody });
}

function sendUserConfirmation(data) {
  const subject = "✅ Your Taxi Booking is Confirmed!";
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 40px; background-color: #141414; color: white; border-radius: 20px; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #F93800; letter-spacing: 2px; margin-bottom: 10px;">CITYRIDE</h1>
      <p style="font-size: 18px; margin-bottom: 5px;">Hi <strong>${data.fullName}</strong>,</p>
      <p style="font-size: 16px; color: #ccc;">Thank you for choosing Cityride! We have received your booking.</p>
      
      <div style="margin: 30px auto; padding: 20px; background: #222; border-left: 4px solid #F93800; text-align: left; border-radius: 8px;">
        <p style="margin: 5px 0;"><strong>From:</strong> ${data.pickup}</p>
        <p style="margin: 5px 0;"><strong>To:</strong> ${data.dropoff}</p>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${data.date}</p>
        <p style="margin: 5px 0;"><strong>Vehicle:</strong> ${data.taxiType}</p>
      </div>
      
      <p style="font-size: 14px; color: #aaa;">Our driver will contact you at <strong>${data.mobile}</strong> shortly to confirm the arrival time.</p>
      
      <div style="margin-top: 40px; border-top: 1px solid #333; padding-top: 20px;">
        <p style="font-weight: bold; color: #F93800; margin-bottom: 0;">Safe Travels,</p>
        <p style="margin-top: 5px;">Team Cityride</p>
      </div>
    </div>
  `;
  GmailApp.sendEmail(data.email, subject, "Thank you for your booking.", { htmlBody: htmlBody });
}

/**
 * 🚨 IMPORTANT: RUN THIS ONCE MANUALLY
 * Click 'Run' next to this function in the toolbar to authorize Gmail & Sheets.
 */
function runOnceToAuthorize() {
  const email = Session.getActiveUser().getEmail();
  GmailApp.sendEmail(email, "Authorization Successful", "Your script is now authorized to send emails and access sheets.");
  Logger.log("Authorization successful!");
}
