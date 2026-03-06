import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
});

export async function sendMealNotification({
  to,
  senderName,
  dishes,
  householdName,
  appUrl,
}: {
  to: string[];
  senderName: string;
  dishes: string[];
  householdName: string;
  appUrl?: string;
}) {
  if (!process.env.SMTP_HOST || to.length === 0) return;

  const url = appUrl ?? process.env.APP_URL ?? 'http://localhost:5174';
  const dishList = dishes.map((d) => `• ${d}`).join('\n');
  const dishListHtml = dishes.map((d) => `<li>${d}</li>`).join('');

  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? process.env.SMTP_USER,
    to: to.join(', '),
    subject: `Tonight's menu is set — ${householdName}`,
    text: [
      `${senderName} has confirmed tonight's menu for ${householdName}:`,
      '',
      dishList,
      '',
      `See the full menu: ${url}/tonight`,
    ].join('\n'),
    html: `
      <p><strong>${senderName}</strong> has confirmed tonight's menu for <em>${householdName}</em>:</p>
      <ul>${dishListHtml}</ul>
      <p><a href="${url}/tonight">See tonight's full menu →</a></p>
    `,
  });
}
