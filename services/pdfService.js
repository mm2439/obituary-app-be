const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { uploadToSupabase } = require('../config/upload-supabase');

class PDFService {
  constructor() {
    this.browser = null;
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // Generate PDF from HTML template
  async generatePDF(htmlContent, options = {}) {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const pdfOptions = {
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        },
        ...options
      };

      const pdfBuffer = await page.pdf(pdfOptions);
      await page.close();

      return pdfBuffer;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  // Generate digital card PDF
  async generateDigitalCard(cardData) {
    try {
      const {
        obituaryName,
        obituarySirName,
        senderName,
        recipientName,
        message,
        cardType,
        cardTemplate,
        obituaryImage,
        backgroundImage
      } = cardData;

      const htmlTemplate = this.getCardTemplate(cardType, {
        obituaryName,
        obituarySirName,
        senderName,
        recipientName,
        message,
        obituaryImage,
        backgroundImage,
        cardTemplate
      });

      const pdfBuffer = await this.generatePDF(htmlTemplate, {
        format: 'A5',
        landscape: cardType === 'landscape'
      });

      return pdfBuffer;
    } catch (error) {
      console.error('Error generating digital card:', error);
      throw error;
    }
  }

  // Get card HTML template
  getCardTemplate(cardType, data) {
    const baseStyles = `
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 20px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }
        .card {
          background: white;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          padding: 40px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 5px;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        }
        .obituary-image {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          object-fit: cover;
          margin: 0 auto 20px;
          border: 4px solid #f0f0f0;
        }
        .obituary-name {
          font-size: 28px;
          font-weight: bold;
          color: #333;
          margin-bottom: 10px;
        }
        .dates {
          font-size: 16px;
          color: #666;
          margin-bottom: 30px;
        }
        .message {
          font-size: 18px;
          line-height: 1.6;
          color: #555;
          margin-bottom: 30px;
          font-style: italic;
          padding: 20px;
          background: #f9f9f9;
          border-radius: 10px;
          border-left: 4px solid #667eea;
        }
        .sender {
          font-size: 16px;
          color: #333;
          font-weight: 500;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          font-size: 14px;
          color: #888;
        }
        .decorative-element {
          position: absolute;
          opacity: 0.1;
          font-size: 200px;
          color: #667eea;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 0;
        }
        .content {
          position: relative;
          z-index: 1;
        }
      </style>
    `;

    const cardContent = `
      <div class="card">
        <div class="decorative-element">❤</div>
        <div class="content">
          ${data.obituaryImage ? `<img src="${data.obituaryImage}" alt="Memorial Photo" class="obituary-image">` : ''}
          <div class="obituary-name">${data.obituaryName} ${data.obituarySirName}</div>
          <div class="dates">In Loving Memory</div>
          
          ${data.message ? `<div class="message">"${data.message}"</div>` : ''}
          
          <div class="sender">
            With deepest sympathy,<br>
            <strong>${data.senderName}</strong>
            ${data.recipientName ? `<br>To: ${data.recipientName}` : ''}
          </div>
          
          <div class="footer">
            Generated with love from our Memorial Platform
          </div>
        </div>
      </div>
    `;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Memorial Card</title>
        ${baseStyles}
      </head>
      <body>
        ${cardContent}
      </body>
      </html>
    `;
  }

  // Generate and upload PDF to Supabase
  async generateAndUploadCard(cardData, userId) {
    try {
      const pdfBuffer = await this.generateDigitalCard(cardData);
      
      const fileName = `cards/${userId}/${Date.now()}-memorial-card.pdf`;
      
      // Create a file-like object for upload
      const file = {
        buffer: pdfBuffer,
        mimetype: 'application/pdf',
        originalname: 'memorial-card.pdf'
      };

      const uploadResult = await uploadToSupabase(file, 'obituary-photos', userId);
      
      if (uploadResult.success) {
        return {
          success: true,
          pdfUrl: uploadResult.publicUrl,
          fileName: uploadResult.fileName
        };
      } else {
        throw new Error(uploadResult.error);
      }
    } catch (error) {
      console.error('Error generating and uploading card:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate obituary report PDF
  async generateObituaryReport(obituaryData) {
    try {
      const {
        obituary,
        condolences,
        photos,
        candles,
        visits,
        dedications
      } = obituaryData;

      const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Memorial Report - ${obituary.name} ${obituary.sirName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .section { margin-bottom: 30px; }
            .section h2 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat-item { text-align: center; }
            .stat-number { font-size: 24px; font-weight: bold; color: #667eea; }
            .condolence { margin: 15px 0; padding: 15px; background: #f9f9f9; border-radius: 5px; }
            .photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 20px 0; }
            .photo-item { text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Memorial Report</h1>
            <h2>${obituary.name} ${obituary.sirName}</h2>
            <p>${new Date(obituary.birthDate).toLocaleDateString()} - ${new Date(obituary.deathDate).toLocaleDateString()}</p>
          </div>

          <div class="section">
            <h2>Memorial Statistics</h2>
            <div class="stats">
              <div class="stat-item">
                <div class="stat-number">${visits?.length || 0}</div>
                <div>Total Visits</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">${candles?.length || 0}</div>
                <div>Candles Lit</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">${condolences?.length || 0}</div>
                <div>Condolences</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">${photos?.length || 0}</div>
                <div>Photos Shared</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>Obituary</h2>
            <p>${obituary.obituary}</p>
          </div>

          ${condolences && condolences.length > 0 ? `
          <div class="section">
            <h2>Condolences (${condolences.length})</h2>
            ${condolences.map(condolence => `
              <div class="condolence">
                <strong>${condolence.name}</strong>
                ${condolence.relation ? `<em>(${condolence.relation})</em>` : ''}
                <p>${condolence.message}</p>
                <small>${new Date(condolence.createdTimestamp).toLocaleDateString()}</small>
              </div>
            `).join('')}
          </div>
          ` : ''}

          <div class="section">
            <p style="text-align: center; color: #666; margin-top: 40px;">
              Generated on ${new Date().toLocaleDateString()} from our Memorial Platform
            </p>
          </div>
        </body>
        </html>
      `;

      const pdfBuffer = await this.generatePDF(htmlTemplate);
      return pdfBuffer;
    } catch (error) {
      console.error('Error generating obituary report:', error);
      throw error;
    }
  }
}

module.exports = new PDFService();
