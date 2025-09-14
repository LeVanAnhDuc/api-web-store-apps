const TEMPLATE_EMAIL_SIGNUP = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Template</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }
            .email-container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                padding: 10px 0;
            }
            .header img {
                max-width: 150px;
                min-width: 80px;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
                color: #333333;
            }
            .content {
                padding: 20px 0;
            }
            .content h2 {
                font-size: 20px;
                color: #333333;
            }
            .content p {
                font-size: 16px;
                color: #666666;
                line-height: 1.5;
            }
            .otp {
                font-size: 24px;
                color: #333333;
                font-weight: bold;
                text-align: center;
                padding: 10px 0;
                background-color: #f9f9f9;
                border-radius: 4px;
                margin: 20px 0;
            }
            .footer {
                text-align: center;
                padding: 10px 0;
                color: #999999;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <img src="https://avatars.githubusercontent.com/u/138034754?s=400&u=c8b517fabf46c78da22fc0e38fffc00a04f74e35&v=4" alt="LEDUC Logo">
                <h1>Welcome to DucApp!</h1>
            </div>
            <div class="content">
                <h2>Hello, [fullName]!</h2>
                <p>Thank you for registering with us. To complete your registration, please use the following One-Time Password (OTP) within the next 2 minutes:</p>
                <div class="otp">[otpCode]</div>
                <p>If you did not request this code, please ignore this email.</p>
            </div>
            <div class="footer">
                <p>&copy; 2025 DucApp. All rights reserved.</p>
                <p>1234 Street, Ho Chi Minh City, Viet Nam</p>
            </div>
        </div>
    </body>
    </html>
    `;

const TEMPLATE_EMAIL_RESET_PASS = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset OTP</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }
            .email-container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                padding: 10px 0;
            }
            .header img {
                max-width: 150px;
                min-width: 80px;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
                color: #333333;
            }
            .content {
                padding: 20px 0;
            }
            .content h2 {
                font-size: 20px;
                color: #333333;
            }
            .content p {
                font-size: 16px;
                color: #666666;
                line-height: 1.5;
            }
            .otp {
                font-size: 24px;
                color: #333333;
                font-weight: bold;
                text-align: center;
                padding: 10px 0;
                background-color: #f9f9f9;
                border-radius: 4px;
                margin: 20px 0;
            }
            .footer {
                text-align: center;
                padding: 10px 0;
                color: #999999;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <img src="https://avatars.githubusercontent.com/u/138034754?s=400&u=c8b517fabf46c78da22fc0e38fffc00a04f74e35&v=4" alt="LEDUC Logo">
                <h1>Reset Your Password</h1>
            </div>
            <div class="content">
                <h2>Hello, [fullName]!</h2>
                <p>We received a request to reset your password for your DucApp account. Please use the following One-Time Password (OTP) within the next 2 minutes to proceed:</p>
                <div class="otp">[otpCode]</div>
                <p>If you did not request a password reset, please ignore this email or contact our support team.</p>
            </div>
            <div class="footer">
                <p>© 2025 DucApp. All rights reserved.</p>
                <p>1234 Street, Ho Chi Minh City, Viet Nam</p>
            </div>
        </div>
    </body>
    </html>
    `;

const SUBJECT_EMAIL_SIGNUP = 'Account Registration Confirmation - DucApp';

const SUBJECT_EMAIL_RESET_PASS = 'Reset Password - DucApp';

const TEMPLATE_EMAIL = {
  TEMPLATE_EMAIL_SIGNUP,
  TEMPLATE_EMAIL_RESET_PASS,
  SUBJECT_EMAIL_SIGNUP,
  SUBJECT_EMAIL_RESET_PASS
};

export default TEMPLATE_EMAIL;
