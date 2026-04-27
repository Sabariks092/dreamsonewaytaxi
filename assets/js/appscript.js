

const ADMIN_EMAIL = "dreamsholidaytrips@gmail.com";

function doPost(e) {
  try {
    const params = e.parameter;
    const action = params.action; // 'enquiry' or 'booking'

    if (action === 'enquiry') {
      sendAdminEnquiry(params);
      return ContentService.createTextOutput("Enquiry Sent").setMimeType(ContentService.MimeType.TEXT);
    } 
    
    if (action === 'booking') {
      sendAdminBooking(params);
      if (params.email && params.email !== "N/A") {
        sendCustomerConfirmation(params);
      }
      return ContentService.createTextOutput("Booking Sent").setMimeType(ContentService.MimeType.TEXT);
    }

    return ContentService.createTextOutput("Invalid Action").setMimeType(ContentService.MimeType.TEXT);

  } catch (error) {
    return ContentService.createTextOutput("Error: " + error.toString()).setMimeType(ContentService.MimeType.TEXT);
  }
}

function sendAdminEnquiry(data) {
  const subject = "🔴 NEW ENQUIRY RECEIVED: " + (data.fullName || "Customer");
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #ff0000; color: #ffffff; padding: 20px; text-align: center;">
        <h2 style="margin: 0; text-transform: uppercase;">New Enquiry Received</h2>
        <p style="margin: 5px 0 0;">Customer is checking prices</p>
      </div>
      <div style="padding: 20px; background-color: #fcfcfc;">
        <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px;">Customer Details</h3>
        <p><strong>👤 Name:</strong> ${data.fullName}</p>
        <p><strong>📧 Email:</strong> ${data.email}</p>
        <p><strong>📱 Mobile:</strong> ${data.mobile}</p>
        
        <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-top: 25px;">Trip Details</h3>
        <p><strong>📍 Pickup:</strong> ${data.pickup}</p>
        <p><strong>🏁 Dropoff:</strong> ${data.dropoff}</p>
        <p><strong>📅 Date:</strong> ${data.date}</p>
        <p><strong>👥 Passengers:</strong> ${data.passengers}</p>
        <p><strong>🔁 Trip Type:</strong> ${data.tripType}</p>
      </div>
      <div style="padding: 15px; background-color: #f0f0f0; text-align: center; font-size: 11px; color: #888;">
        Sent via Dreamsonewaytaxi.com
      </div>
    </div>
  `;
  GmailApp.sendEmail(ADMIN_EMAIL, subject, "New enquiry received.", { htmlBody: htmlBody });
}

function sendAdminBooking(data) {
  const subject = "🟢 BOOKING CONFIRMED: " + (data.fullName || "Customer");
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #008000; color: #ffffff; padding: 20px; text-align: center;">
        <h2 style="margin: 0; text-transform: uppercase;">Booking Confirmed</h2>
        <p style="margin: 5px 0 0;">Final booking details received</p>
      </div>
      <div style="padding: 20px; background-color: #fcfcfc;">
        <div style="background-color: #fff; border: 1px solid #e0e0e0; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
           <span style="color: #008000; font-weight: bold; font-size: 18px;">Total Fare: ₹${data.estimatedAmount}</span>
           <br><small>Includes Driver Beta & Est. Distance: ${data.distance}</small>
        </div>
        
        <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px;">Customer & Vehicle</h3>
        <p><strong>👤 Name:</strong> ${data.fullName}</p>
        <p><strong>📱 Mobile:</strong> ${data.mobile}</p>
        <p><strong>🚗 Taxi Selected:</strong> ${data.taxiType}</p>

        <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-top: 25px;">Trip Summary</h3>
        <p><strong>📍 Pickup:</strong> ${data.pickup}</p>
        <p><strong>🏁 Dropoff:</strong> ${data.dropoff}</p>
        <p><strong>📅 Date:</strong> ${data.date}</p>
        <p><strong>🔁 Trip Type:</strong> ${data.tripType}</p>
      </div>
      <div style="padding: 15px; background-color: #f0f0f0; text-align: center; font-size: 11px; color: #888;">
         Booking confirmation from Dreamsonewaytaxi.com
      </div>
    </div>
  `;
  GmailApp.sendEmail(ADMIN_EMAIL, subject, "Confirmed taxi booking received.", { htmlBody: htmlBody });
}

function sendCustomerConfirmation(data) {
  const subject = "✅ Booking Confirmed - Dreamsonewaytaxi";
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #141414; color: #ffffff; padding: 30px; text-align: center;">
        <h1 style="color: #F93800; margin: 0; letter-spacing: 3px;">DREAMS</h1>
        <p style="margin: 5px 0 0; font-size: 18px;">Thank You for Choosing Us!</p>
      </div>
      <div style="padding: 30px;">
        <p>Dear <strong>${data.fullName}</strong>,</p>
        <p>We are excited to confirm your taxi booking. Our driver will contact you at <strong>${data.mobile}</strong> shortly to coordinate the pickup.</p>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 10px; margin: 25px 0;">
          <h4 style="margin: 0 0 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px; color: #333;">Booking Summary</h4>
          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <tr><td style="padding: 5px 0; color: #666;">Vehicle:</td><td style="padding: 5px 0; font-weight: bold;">${data.taxiType}</td></tr>
            <tr><td style="padding: 5px 0; color: #666;">Pickup:</td><td style="padding: 5px 0; font-weight: bold;">${data.pickup}</td></tr>
            <tr><td style="padding: 5px 0; color: #666;">Dropoff:</td><td style="padding: 5px 0; font-weight: bold;">${data.dropoff}</td></tr>
            <tr><td style="padding: 5px 0; color: #666;">Date:</td><td style="padding: 5px 0; font-weight: bold;">${data.date}</td></tr>
            <tr><td style="padding: 5px 0; color: #666;">Estimated Amount:</td><td style="padding: 5px 0; font-weight: bold; color: #F93800; font-size: 16px;">₹${data.estimatedAmount}</td></tr>
          </table>
        </div>
        
        <p style="font-size: 13px; color: #777; text-align: center;">If you have any questions, call us at <strong>+91 72002 21121</strong>.</p>
      </div>
      <div style="padding: 20px; background-color: #141414; color: #888; text-align: center; font-size: 12px;">
        &copy; 2026 Dreamsonewaytaxi. All rights reserved.
      </div>
    </div>
  `;
  GmailApp.sendEmail(data.email, subject, "Thank you for your booking.", { htmlBody: htmlBody });
}
