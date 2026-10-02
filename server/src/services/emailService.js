import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: parseInt(env.SMTP_PORT, 10),
  secure: env.SMTP_PORT === '465',
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  }
});

export const sendReminderEmail = async ({ to, name, birthDate, turningAge, reminderType }) => {
  const isOneDay = reminderType === '1_day';
  const timeFrameText = isOneDay ? 'Tomorrow' : 'In 1 week';
  const subject = isOneDay 
    ? `🎂 Tomorrow is ${name}'s birthday` 
    : `🎂 ${name}'s birthday is in 1 week`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #6366f1;">Birthday Reminder!</h2>
      <p>Hi there,</p>
      <p><strong>${timeFrameText} (${birthDate})</strong> is <strong>${name}</strong>'s birthday!</p>
      <p>They will be turning <strong>${turningAge}</strong>.</p>
      <hr style="border: 1px solid #eee; margin: 20px 0;" />
      <p>
        <a href="${env.CLIENT_URL}" style="display: inline-block; background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Open the app to draft a message
        </a>
      </p>
      <p style="color: #666; font-size: 0.9em;">
        You are receiving this because you have email reminders enabled.
      </p>
    </div>
  `;

  const text = `
Birthday Reminder!
Hi there,

${timeFrameText} (${birthDate}) is ${name}'s birthday! They will be turning ${turningAge}.

Open the app to draft a message: ${env.CLIENT_URL}
  `.trim();

  await transporter.sendMail({
    from: env.MAIL_FROM,
    to,
    subject,
    text,
    html
  });
};
