const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SENDER_NAME || "Osmrtnica.si"}" <${process.env.SENDER_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

const emailService = {
  sendAdminNewGuardianRequest: async (guardianData) => {
    const subject = "Nov zahtevek za skrbništvo";
    const html = `
      <h1>Nov zahtevek za skrbništvo</h1>
      <p>Prejet je bil nov zahtevek za skrbništvo.</p>
      <ul>
        <li><strong>Ime:</strong> ${guardianData.name}</li>
        <li><strong>Sorodstvo:</strong> ${guardianData.relationship}</li>
        <li><strong>ID zahtevka:</strong> ${guardianData.id}</li>
      </ul>
      <p>Prosimo, preglejte zahtevek v nadzorni plošči.</p>
    `;
    return sendEmail(process.env.ADMIN_EMAIL, subject, html);
  },

  sendUserGuardianRequestConfirmation: async (userEmail, guardianData) => {
    const subject = "Potrdilo o prejemu zahtevka za skrbništvo";
    const html = `
      <h1>Pozdravljeni,</h1>
      <p>Vaš zahtevek za skrbništvo za <strong>${guardianData.name}</strong> je bil uspešno prejet.</p>
      <p>Naša ekipa bo pregledala vaš zahtevek v najkrajšem možnem času. O statusu zahtevka boste obveščeni po e-pošti.</p>
      <p>Hvala za zaupanje.</p>
    `;
    return sendEmail(userEmail, subject, html);
  },

  sendUserGuardianStatusUpdate: async (userEmail, guardianData) => {
    const statusSlovenian = {
      approved: "odobren",
      rejected: "zavrnjen",
      pending: "v čakanju",
    };

    const subject = `Posodobitev statusa zahtevka za skrbništvo: ${statusSlovenian[guardianData.status] || guardianData.status}`;
    const html = `
      <h1>Pozdravljeni,</h1>
      <p>Status vašega zahtevka za skrbništvo za <strong>${guardianData.name}</strong> je bil posodobljen.</p>
      <p>Trenutni status: <strong>${statusSlovenian[guardianData.status] || guardianData.status}</strong></p>
      ${guardianData.status === "approved" ? "<p>Zdaj lahko urejate osmrtnico.</p>" : ""}
      <p>Hvala za zaupanje.</p>
    `;
    return sendEmail(userEmail, subject, html);
  },
};

module.exports = emailService;
