import { Resend } from 'resend';
import { config } from '../config/env.js';
import { emailQueue } from '../config/queue.js';

const resend = new Resend(config.RESEND_API_KEY);

export async function sendEmailDirect({ to, subject, html }) {
  const result = await resend.emails.send({
    from: config.EMAIL_FROM,
    to,
    subject,
    html,
  });
  return result;
}

export async function queueEmail(type, payload) {
  await emailQueue.add(type, payload, { priority: 1 });
}


export async function sendVerificationEmail(email, token) {
  const verifyUrl = `${config.APP_URL}/api/v1/auth/verify-email?token=${token}`;
  await queueEmail('verify-email', {
    to: email,
    subject: 'Verify your LeanStock account',
    html: `
      <h2>Welcome to LeanStock!</h2>
      <p>Click the link below to verify your email address:</p>
      <a href="${verifyUrl}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">
        Verify Email
      </a>
      <p>This link expires in 24 hours.</p>
      <p>If you didn't create this account, ignore this email.</p>
    `,
  });
}

export async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${config.APP_URL}/api/v1/auth/reset-password?token=${token}`;
  await queueEmail('password-reset', {
    to: email,
    subject: 'Reset your LeanStock password',
    html: `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="background:#dc2626;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">
        Reset Password
      </a>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, ignore this email.</p>
    `,
  });
}

export async function sendWelcomeEmail(email, role) {
  await queueEmail('welcome', {
    to: email,
    subject: 'Welcome to LeanStock!',
    html: `
      <h2>Your account is ready!</h2>
      <p>You have been added to LeanStock as <strong>${role}</strong>.</p>
      <p>You can now log in and start managing inventory.</p>
      <p>Visit: <a href="${config.APP_URL}">${config.APP_URL}</a></p>
    `,
  });
}

export async function sendLowStockAlert(email, productName, quantity, locationName) {
  await queueEmail('low-stock-alert', {
    to: email,
    subject: ` Low Stock Alert: ${productName}`,
    html: `
      <h2>Low Stock Alert</h2>
      <p>The following product is running low:</p>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;border:1px solid #e5e7eb"><strong>Product</strong></td><td style="padding:8px;border:1px solid #e5e7eb">${productName}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb"><strong>Location</strong></td><td style="padding:8px;border:1px solid #e5e7eb">${locationName}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb"><strong>Remaining</strong></td><td style="padding:8px;border:1px solid #e5e7eb;color:#dc2626"><strong>${quantity} units</strong></td></tr>
      </table>
      <p>Please reorder soon to avoid stockouts.</p>
    `,
  });
}

export async function sendDecayNotification(email, productName, oldPrice, newPrice, discountPercent) {
  await queueEmail('decay-notification', {
    to: email,
    subject: ` Auto-markdown applied: ${productName}`,
    html: `
      <h2>Dead Stock Auto-Markdown</h2>
      <p>An automatic price reduction has been applied to a slow-moving product:</p>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;border:1px solid #e5e7eb"><strong>Product</strong></td><td style="padding:8px;border:1px solid #e5e7eb">${productName}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb"><strong>Previous Price</strong></td><td style="padding:8px;border:1px solid #e5e7eb">${oldPrice.toLocaleString()} KZT</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb"><strong>New Price</strong></td><td style="padding:8px;border:1px solid #e5e7eb;color:#16a34a"><strong>${newPrice.toLocaleString()} KZT</strong></td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb"><strong>Discount</strong></td><td style="padding:8px;border:1px solid #e5e7eb">${discountPercent}% off</td></tr>
      </table>
    `,
  });
}
