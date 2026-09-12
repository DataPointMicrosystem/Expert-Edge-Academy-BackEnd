exports.emailVerificationTemplate = (data) => `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: Arial, sans-serif; color: #1a1a1a;">
    <h2>Verify your ExpertEdge Academy account</h2>
    <p>Hello ${data.name}, use this code to verify your email address:</p>
    <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px;">${data.otp}</p>
    <p>This code expires in 10 minutes.</p>
</body>
</html>
`;

exports.resetPasswordTemplate = (data) => {
  return `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your EXPERT EDGE ACADEMY Password</title>
    <style>
        /* Mobile Styles */
        @media screen and (max-width: 600px) {
            .container { width: 100% !important; border-radius: 0px !important; }
            .otp-code { font-size: 32px !important; letter-spacing: 6px !important; }
            .content { padding: 30px 20px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7f6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <center>
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f7f6;">
            <tr>
                <td align="center" style="padding: 40px 10px;">
                    <!-- Main Card -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="container" style="width: 100%; max-width: 500px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">
                        
                        <!-- Brand Header -->
                        <tr>
                            <td align="center" style="padding: 30px 20px; background-color: #ffffff; border-bottom: 1px solid #eeeeee;">
                                <h1 style="margin: 0; color: #00d2ff; font-size: 24px; font-weight: 800; letter-spacing: 1px;">EXPERT EDGE ACADEMY</h1>
                            </td>
                        </tr>

                        <!-- Content -->
                        <tr>
                            <td class="content" style="padding: 40px; text-align: center; color: #333333;">
                                <h2 style="margin: 0 0 15px; font-size: 22px; font-weight: 700; color: #1a1a1a;">Password Reset</h2>
                                <p style="font-size: 16px; line-height: 1.5; margin: 0 0 25px; color: #666666;">
                                    Hi ${data.name}, we received a request to reset your password. Use the code below to proceed:
                                </p>
                                
                                <!-- OTP Box -->
                                <div style="background-color: #f8fafc; border: 2px dashed #00d2ff; border-radius: 12px; padding: 25px; margin: 20px 0;">
                                    <span class="otp-code" style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: bold; letter-spacing: 10px; color: #1a1a1a; display: block;">
                                        ${data.otp}
                                    </span>
                                </div>

                                <p style="font-size: 14px; color: #999999; margin-top: 25px; line-height: 1.4;">
                                    This code is valid for <strong>15 minutes</strong>. <br>
                                    If you didn't request this, please ignore this email or contact support if you're concerned about your account security.
                                </p>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td align="center" style="padding: 25px; background-color: #fafafa; font-size: 12px; color: #aaaaaa;">
                                <p style="margin: 0;">&copy; 2026 EXPERT EDGE ACADEMY App. All rights reserved.</p>
                                <p style="margin: 8px 0 0;">
                                    <a href="#" style="color: #00d2ff; text-decoration: none;">Help Center</a> • 
                                    <a href="#" style="color: #00d2ff; text-decoration: none;">Security Tips</a>
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </center>
</body>
</html>

    `;
};

exports.resetPasswordSuccessfulTemplate = (name) => {
  return `
        <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Successful</title>
    <style>
        @media screen and (max-width: 600px) {
            .container { width: 100% !important; border-radius: 0px !important; }
            .content { padding: 30px 20px !important; }
            .cta-button { width: 100% !important; box-sizing: border-box; text-align: center; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7f6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <center>
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f7f6;">
            <tr>
                <td align="center" style="padding: 40px 10px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="container" style="width: 100%; max-width: 500px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">
                        
                        <!-- Header -->
                        <tr>
                            <td align="center" style="padding: 30px 20px; background-color: #ffffff; border-bottom: 1px solid #eeeeee;">
                                <h1 style="margin: 0; color: #00d2ff; font-size: 24px; font-weight: 800; letter-spacing: 1px;">EXPERT EDGE ACADEMY</h1>
                            </td>
                        </tr>

                        <!-- Success Content -->
                        <tr>
                            <td class="content" style="padding: 40px; text-align: center; color: #333333;">
                                <!-- Success Icon (Simple Circle Check) -->
                                <div style="margin-bottom: 20px; font-size: 50px; color: #10b981;">✓</div>
                                
                                <h2 style="margin: 0 0 15px; font-size: 22px; font-weight: 700; color: #1a1a1a;">Password Reset Successful</h2>
                                <p style="font-size: 16px; line-height: 1.5; margin: 0 0 30px; color: #666666;">
                                    Hi ${name}, your password for <strong>EXPERT EDGE ACADEMY</strong> has been successfully updated. You can now log back into your account using your new credentials.
                                </p>
                                
                                <!-- CTA Button -->
                                <a href="https://expertedgeacademy.com" class="cta-button" style="display: inline-block; background-color: #00d2ff; color: #ffffff; padding: 16px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                                    Log In to EXPERT EDGE ACADEMY
                                </a>

                                <!-- Security Warning -->
                                <p style="font-size: 13px; color: #999999; margin-top: 40px; line-height: 1.4; border-top: 1px solid #f3f4f6; padding-top: 20px;">
                                    <strong>Didn't do this?</strong> If you did not reset your password, please secure your account immediately by contacting our support team.
                                </p>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td align="center" style="padding: 25px; background-color: #fafafa; font-size: 12px; color: #aaaaaa;">
                                <p style="margin: 0;">&copy; 2026 EXPERT EDGE ACADEMY App. All rights reserved.</p>
                                <p style="margin: 8px 0 0;">
                                    <a href="#" style="color: #00d2ff; text-decoration: none;">Security Settings</a> • 
                                    <a href="#" style="color: #00d2ff; text-decoration: none;">Contact Support</a>
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </center>
</body>
</html>

    `;
};
