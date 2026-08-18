const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("Error connecting to email server:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Bank Backend" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

async function sendRegistrationEmail(userEmail, name) {
  const subject = "Welcome to Bank Backend";
  const text = ` Hello ${name}, \n\n Thank you for registering at Bank Backend.
    We're excited to have you on board!\n\nBest Regards,\nBank Backend Team`;
  const html = `<p>Hello ${name}, </p><p>Thank you for registering at Bank Backend.
    We're excited to have you on board!</p><p>Best Regards,<br>Bank Backend Team</p>`;

  await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionEmail(userEmail, name, amount, toAccount) {
  const subject = "Transaction Successful!";
  const text = `Hello ${name}, \n\n Your transaction of $${amount} to account ${toAccount} was successful.\n\n Best regards,\nThe Bank Backend Team`;
  const html = `<p>Hello ${name},</p><p>Your transaction of $${amount} to account ${toAccount} was successful. </p><p>Best regards,<br> The Bank Backend Team</br></p>`;

  await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionFailureEmail(userEmail, name, amount, toAccount) {
  const subject = "Transaction Failed!";
  const text = `Hello ${name}, \n\n Your transaction of $${amount} to account ${toAccount} failed.\n\n Best regards,\nThe Bank Backend Team`;
  const html = `<p>Hello ${name},</p><p>Your transaction of $${amount} to account ${toAccount} failed. </p><p>Best regards,<br> The Bank Backend Team</br></p>`;

  await sendEmail(userEmail, subject, text, html);
}
module.exports = {
  sendRegistrationEmail,
  sendTransactionEmail,
  sendTransactionFailureEmail,
};
