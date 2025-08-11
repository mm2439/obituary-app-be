const nodemailer = require('nodemailer');
const supabaseService = require('./supabaseService');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Send email with template
  async sendEmail(to, subject, htmlContent, attachments = []) {
    try {
      const mailOptions = {
        from: `"Memorial Platform" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html: htmlContent,
        attachments
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  // Get email template
  getEmailTemplate(type, data) {
    const baseTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #ddd; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .obituary-info { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Memorial Platform</h1>
          </div>
          <div class="content">
            {{CONTENT}}
          </div>
          <div class="footer">
            <p>This email was sent from our Memorial Platform</p>
            <p>If you no longer wish to receive these emails, you can unsubscribe in your account settings.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    let content = '';

    switch (type) {
      case 'obituary_approved':
        content = `
          <h2>Your obituary has been approved</h2>
          <div class="obituary-info">
            <h3>${data.obituaryName} ${data.obituarySirName}</h3>
            <p>Your obituary has been reviewed and approved by our team. It is now live on our platform.</p>
          </div>
          <a href="${data.obituaryUrl}" class="button">View Memorial Page</a>
          <p>Thank you for using our platform to honor the memory of your loved one.</p>
        `;
        break;

      case 'new_condolence':
        content = `
          <h2>New condolence message</h2>
          <div class="obituary-info">
            <h3>${data.obituaryName} ${data.obituarySirName}</h3>
            <p><strong>${data.condolenceName}</strong> left a condolence message:</p>
            <blockquote style="border-left: 4px solid #667eea; padding-left: 20px; margin: 20px 0; font-style: italic;">
              "${data.condolenceMessage}"
            </blockquote>
          </div>
          <a href="${data.obituaryUrl}" class="button">View Memorial Page</a>
        `;
        break;

      case 'new_photo':
        content = `
          <h2>New photo shared</h2>
          <div class="obituary-info">
            <h3>${data.obituaryName} ${data.obituarySirName}</h3>
            <p><strong>${data.uploaderName}</strong> shared a new photo on the memorial page.</p>
          </div>
          <a href="${data.obituaryUrl}" class="button">View Memorial Page</a>
        `;
        break;

      case 'candle_lit':
        content = `
          <h2>Someone lit a candle</h2>
          <div class="obituary-info">
            <h3>${data.obituaryName} ${data.obituarySirName}</h3>
            <p>A candle was lit in memory of your loved one.</p>
            <p>Total candles lit: <strong>${data.totalCandles}</strong></p>
          </div>
          <a href="${data.obituaryUrl}" class="button">View Memorial Page</a>
        `;
        break;

      case 'gift_received':
        content = `
          <h2>You received a gift</h2>
          <div class="obituary-info">
            <h3>Gift from ${data.senderName}</h3>
            <p>You received a <strong>${data.giftType}</strong> for the memorial of ${data.obituaryName} ${data.obituarySirName}.</p>
            ${data.message ? `<p><em>"${data.message}"</em></p>` : ''}
          </div>
          <a href="${data.giftUrl}" class="button">View Gift</a>
        `;
        break;

      case 'keeper_assigned':
        content = `
          <h2>You've been assigned as a keeper</h2>
          <div class="obituary-info">
            <h3>${data.obituaryName} ${data.obituarySirName}</h3>
            <p>You have been assigned as a keeper for this memorial page. As a keeper, you can help manage and moderate the memorial content.</p>
          </div>
          <a href="${data.obituaryUrl}" class="button">Manage Memorial</a>
        `;
        break;

      case 'welcome':
        content = `
          <h2>Welcome to Memorial Platform</h2>
          <p>Thank you for joining our memorial community. Our platform helps you honor and remember your loved ones.</p>
          <h3>What you can do:</h3>
          <ul>
            <li>Create memorial pages for your loved ones</li>
            <li>Share photos and memories</li>
            <li>Light virtual candles</li>
            <li>Leave condolence messages</li>
            <li>Connect with others who are grieving</li>
          </ul>
          <a href="${data.platformUrl}" class="button">Explore Platform</a>
        `;
        break;

      case 'password_reset':
        content = `
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password. Click the button below to create a new password.</p>
          <a href="${data.resetUrl}" class="button">Reset Password</a>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request this password reset, please ignore this email.</p>
        `;
        break;

      default:
        content = `
          <h2>Notification</h2>
          <p>${data.message || 'You have a new notification from Memorial Platform.'}</p>
        `;
    }

    return baseTemplate.replace('{{CONTENT}}', content);
  }

  // Send obituary approval notification
  async sendObituaryApprovalEmail(userEmail, obituaryData) {
    const subject = `Your obituary for ${obituaryData.name} ${obituaryData.sirName} has been approved`;
    const htmlContent = this.getEmailTemplate('obituary_approved', {
      obituaryName: obituaryData.name,
      obituarySirName: obituaryData.sirName,
      obituaryUrl: `${process.env.FRONTEND_URL}/memory/${obituaryData.slugKey}`
    });

    return await this.sendEmail(userEmail, subject, htmlContent);
  }

  // Send new condolence notification
  async sendNewCondolenceEmail(userEmail, obituaryData, condolenceData) {
    const subject = `New condolence for ${obituaryData.name} ${obituaryData.sirName}`;
    const htmlContent = this.getEmailTemplate('new_condolence', {
      obituaryName: obituaryData.name,
      obituarySirName: obituaryData.sirName,
      condolenceName: condolenceData.name,
      condolenceMessage: condolenceData.message,
      obituaryUrl: `${process.env.FRONTEND_URL}/memory/${obituaryData.slugKey}`
    });

    return await this.sendEmail(userEmail, subject, htmlContent);
  }

  // Send new photo notification
  async sendNewPhotoEmail(userEmail, obituaryData, uploaderName) {
    const subject = `New photo shared for ${obituaryData.name} ${obituaryData.sirName}`;
    const htmlContent = this.getEmailTemplate('new_photo', {
      obituaryName: obituaryData.name,
      obituarySirName: obituaryData.sirName,
      uploaderName,
      obituaryUrl: `${process.env.FRONTEND_URL}/memory/${obituaryData.slugKey}`
    });

    return await this.sendEmail(userEmail, subject, htmlContent);
  }

  // Send candle lit notification
  async sendCandleLitEmail(userEmail, obituaryData, totalCandles) {
    const subject = `A candle was lit for ${obituaryData.name} ${obituaryData.sirName}`;
    const htmlContent = this.getEmailTemplate('candle_lit', {
      obituaryName: obituaryData.name,
      obituarySirName: obituaryData.sirName,
      totalCandles,
      obituaryUrl: `${process.env.FRONTEND_URL}/memory/${obituaryData.slugKey}`
    });

    return await this.sendEmail(userEmail, subject, htmlContent);
  }

  // Send gift notification
  async sendGiftEmail(userEmail, giftData) {
    const subject = `You received a gift from ${giftData.senderName}`;
    const htmlContent = this.getEmailTemplate('gift_received', giftData);

    return await this.sendEmail(userEmail, subject, htmlContent);
  }

  // Send welcome email
  async sendWelcomeEmail(userEmail, userData) {
    const subject = 'Welcome to Memorial Platform';
    const htmlContent = this.getEmailTemplate('welcome', {
      userName: userData.name,
      platformUrl: process.env.FRONTEND_URL
    });

    return await this.sendEmail(userEmail, subject, htmlContent);
  }

  // Send password reset email
  async sendPasswordResetEmail(userEmail, resetToken) {
    const subject = 'Password Reset Request';
    const htmlContent = this.getEmailTemplate('password_reset', {
      resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
    });

    return await this.sendEmail(userEmail, subject, htmlContent);
  }

  // Send bulk emails
  async sendBulkEmails(recipients, subject, htmlContent) {
    const results = [];
    
    for (const recipient of recipients) {
      try {
        const result = await this.sendEmail(recipient, subject, htmlContent);
        results.push({ email: recipient, ...result });
      } catch (error) {
        results.push({ email: recipient, success: false, error: error.message });
      }
    }

    return results;
  }
}

module.exports = new EmailService();
