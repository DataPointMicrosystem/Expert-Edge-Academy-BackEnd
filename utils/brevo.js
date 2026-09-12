const BrevoClient = require("@getbrevo/brevo");

const brevoClient = new BrevoClient.TransactionalEmailsApi();
brevoClient.setApiKey(
  BrevoClient.TransactionalEmailsApiApiKeys.apiKey,
  process.env.brevo_api_key,
);

const brevo = async (userEmail, userName, html) => {
  if (
    !process.env.brevo_api_key ||
    process.env.brevo_api_key.startsWith("your_")
  ) {
    console.warn("Brevo is not configured; email notification skipped");
    return;
  }

  const sendSmtpEmail = new BrevoClient.SendSmtpEmail();
  const data = {
    htmlContent: `<html><head></head><body><p>Hello ${userName} ,</p>Welcome to backend!.</p></body></html>`,
    sender: {
      email: process.env.BREVO_SENDER_EMAIL || "noreply@expertedgeacademy.com",
      name: process.env.BREVO_SENDER_NAME || "ExpertEdge Academy",
    },
    subject: "Hello from Expert-Edge-Academy",
  };
  sendSmtpEmail.to = [
    {
      email: userEmail,
    },
  ];
  sendSmtpEmail.subject = data.subject;
  sendSmtpEmail.htmlContent = html;
  sendSmtpEmail.sender = data.sender;

  await brevoClient.sendTransacEmail(sendSmtpEmail);
};

module.exports = { brevo };
