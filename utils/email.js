const nodemailer = require('nodemailer');
const pug = require('pug');
// const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, resetCode, subject, isContactUs = false) {
    this.to = isContactUs
      ? 'support@smart-weather-forcasting.info'
      : user.email;
    this.from = isContactUs
      ? user.email
      : `MR. Hossam Ajlan <${process.env.EMAIL_FROM}>`;
    if (isContactUs) {
      this.name = user.name.split(' ')[0];
    } else {
      this.firstName = user.name.split(' ')[0];
    }
    this.subject = subject;
    this.message = user.message;
    // this.url = url;
    this.resetCode = resetCode; // Store the reset code if provided
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        auth: {
          user: process.env.BREVOSMTP_USERNAME,
          pass: process.env.BREVOPASSWORD_PASSWORD
        }
      });
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async send(template, subject, message) {
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      name: this.name,
      firstName: this.firstName,
      email: this.from,
      // url: this.url,
      subject,
      message,
      resetCode: this.resetCode // Pass the reset code to the template if available
    });

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html
      // text: htmlToText.fromString(html),
    };

    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Email Confirmation!');
  }

  // Updated method to send a password reset code
  async sendPasswordResetCode() {
    await this.send(
      'passwordReset', // Assuming you have a template named passwordReset
      'Your password reset code (valid for 10 minutes)',
      null // No message is needed in this case
    );
  }

  async sendContactUs(message) {
    await this.send('contact', this.subject, message);
  }
};
