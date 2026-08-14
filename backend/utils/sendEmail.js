const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.BREVO_SMTP_USER || process.env.BREVO_SENDER_EMAIL,
        pass: process.env.BREVO_SMTP_KEY || process.env.BREVO_API_KEY,
    },
    tls: {
        rejectUnauthorized: false,
    },
    connectionTimeout: 10000,
});

const sendEmail = async ({ to, subject, text, html }) => {
    try {
        const mailOptions = {
            from: `"${process.env.BREVO_SENDER_NAME || 'EBI Services'}" <${process.env.BREVO_SENDER_EMAIL || 'minyar1820@gmail.com'}>`,
            to,
            subject,
        };
        if (html) {
            mailOptions.html = html;
        } else {
            mailOptions.text = text || subject;
        }
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`Error sending email to ${to}: ${error.message}`);
        return false;
    }
};

module.exports = sendEmail;
