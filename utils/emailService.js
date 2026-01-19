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
  }
};

const emailService = {
  sendAdminNewGuardianRequest: async (guardianData) => {
    const subject = "Nova prošnje za skrbništvo";
    const isImage =
      guardianData.document &&
      (guardianData.document.toLowerCase().endsWith(".jpg") ||
        guardianData.document.toLowerCase().endsWith(".jpeg") ||
        guardianData.document.toLowerCase().endsWith(".png") ||
        guardianData.document.toLowerCase().endsWith(".webp"));

    const deceasedFullName =
      `${guardianData.deceasedName || ""} ${guardianData.deceasedSirName || ""}`.trim();

    const html = `
      <h1>Nova prošnje za skrbništvo</h1>
      <p>Nova prošnja za Skrbnika: <strong>${deceasedFullName}</strong>.</p>
      <ul>
        <li><strong>Ime:</strong> ${guardianData.name}</li>
        <li><strong>Sorodstvo:</strong> ${guardianData.relationship}</li>
        <li><strong>ID zahtevka: </strong> ${guardianData.id}</li>
      </ul>
      <p><strong>Dokument:</strong> <a href="${guardianData.document}" target="_blank">Poglej dokument</a></p>
      ${
        isImage ?
          `
        <p><strong>Predogled:</strong></p>
        <img src="${guardianData.document}" alt="Dokument" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; padding: 5px;" />
      `
        : ""
      }
      <p>Prošnja je shranjena v adminu.</p>
    `;
    return sendEmail(process.env.ADMIN_EMAIL, subject, html);
  },

  sendUserGuardianRequestConfirmation: async (userEmail, guardianData) => {
    const subject = "Potrdilo o prejemu zahtevka za skrbništvo";
    const deceasedFullName =
      `${guardianData.deceasedName || ""} ${guardianData.deceasedSirName || ""}`.trim();
    const html = `
      <h1>Pozdravljeni,</h1>
      <p>Najprej iskreno sožalje ob vaši boleči izgubi. </p>
      <p></p>
      <p>Prejeli smo vašo prošnjo za skrbništvo spominske strani <strong>${deceasedFullName}</strong>.</p>
      <p>Podatke bomo preverili in vas o statusu zahtevka obvestili po e-pošti; predvidoma še danes. </p>
      <p>Hvala za zaupanje.</p>
      <p></p>
      <p></p>
      <p>Saša Dolinšek</p>
      <p>osmrtnica.com</p>
    `;
    return sendEmail(userEmail, subject, html);
  },

  sendUserGuardianStatusUpdate: async (userEmail, guardianData) => {
    const statusSlovenian = {
      approved: "odobren",
      rejected: "zavrnjen",
      pending: "v čakanju",
    };

    const deceasedFullName =
      `${guardianData.deceasedName || ""} ${guardianData.deceasedSirName || ""}`.trim();

    if (guardianData.status === "approved") {
      const subject = `Dobrodošli kot Skrbnik spominske strani ${deceasedFullName}`;
      const html = `
        <p>Pozdravljeni,</p>
        <p>Postali ste skrbnik/ica spominske strani <strong>${deceasedFullName}</strong></p>
        <p>Z dodajanjem vsebin lahko začnete takoj.</p>
        <br/>
        <p>Saša Dolinšek</p>
        <p>Osmrtnica.com</p>
        <br/>
        <p><strong>Nekaj toplih napotkov za ustvarjanje spominske strani</strong></p>
        <p>Kot Skrbnik imate možnost, da spominsko stran oblikujete v topel in oseben prostor spominov. Na desni strani strani najdete možnosti za dodajanje vsebin in povabila bližnjih k sodelovanju.</p>
        <p>S sodelovanjem mnogih se spomini povežejo, stran zaživi in postane prostor, kamor se boste pogosto vračali. Vsi lahko sodelujejo, vi pa v svojem uporabniškem računu odločate, kaj bo objavljeno (zato se občasno vračajte).</p>
        <p>Bližnjim lahko pošljete vabila za sodelovanje v obliki digitalnih kartic, ki so že izdelane v merah telefona – prijazen način, da druge povabite k sodelovanju in za mnoge bodo kartice še leta tudi dragocen spomin; in vedno pri roki.</p>
        <p>S spominske strani si lahko brezplačno prenesete tudi QR kodo za nagrobnik. Z njo bo lahko vsak obiskovalec pokopališča enostavno dostopal do spominske strani, prižgal virtualno svečko in obujal spomine. Četudi bi kasneje vaš status Skrbnika ugasnil, bodo vsi objavljeni spomini, zapisi in fotografije ostali shranjeni in enako bo dostopna tudi QR koda na nagrobniku; le novih vsebin ne bo več mogoče dodajati.</p>
        <p>Vzemite si čas. Povabite bližnje.</p>
        <p>Naj stran živi in ostane polna topline.</p>
        <p></p>
        <p></p>
        <p>Saša Dolinšek</p>
        <p>Osmrtnica.com</p>
      `;
      return sendEmail(userEmail, subject, html);
    }

    const subject = `Posodobitev statusa zahtevka za skrbništvo: ${statusSlovenian[guardianData.status] || guardianData.status}`;
    const html = `
      <h1>Pozdravljeni,</h1>
      <p>Status vašega zahtevka za skrbništvo za <strong>${deceasedFullName}</strong> je bil posodobljen.</p>
      <p>Trenutni status: <strong>${statusSlovenian[guardianData.status] || guardianData.status}</strong></p>
      ${guardianData.status === "approved" ? "<p>Zdaj lahko urejate osmrtnico.</p>" : ""}
      <p>Hvala za zaupanje.</p>
      <p></p>
      <p></p>
      <p>Saša Dolinšek</p>
      <p>Osmrtnica.com</p>
    `;
    return sendEmail(userEmail, subject, html);
  },
};

module.exports = emailService;
