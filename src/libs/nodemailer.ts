// libs
import nodemailer from "nodemailer";
// types
import type { ISendEmail } from "../types/nodemailer";
// others
import config from "../constants/env";

const SERVICE = "gmail";

const sendEmail = ({ email, subject, message }: ISendEmail) => {
  const transporter = nodemailer.createTransport({
    service: SERVICE,
    auth: {
      user: config.USERNAME_EMAIL,
      pass: config.PASSWORD_EMAIL
    }
  });

  const mailOptions = {
    from: config.USERNAME_EMAIL,
    to: email,
    subject,
    html: message
  };

  transporter.sendMail(mailOptions, (error) => {
    if (error) {
      throw new Error(error);
    }
  });
};

export default sendEmail;
