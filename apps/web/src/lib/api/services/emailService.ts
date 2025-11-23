// Email service for sending invitations
// Uses Resend (resend.com) - modern email API with great DX

export interface SendInvitationEmailParams {
  toEmail: string;
  toName: string;
  inviterName: string;
  projectName: string;
  role: string;
  inviteLink: string;
}

export interface SendRoleRequestNotificationParams {
  toEmail: string;
  toName: string;
  projectName: string;
  action: 'approved' | 'denied';
  role: string;
  department: string;
  reviewerName: string;
  reviewNote?: string;
}

export class EmailService {
  private apiKey: string;
  private fromEmail: string;

  constructor() {
    // Get from environment variables
    this.apiKey = process.env.RESEND_API_KEY || '';
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@doublecheck.app';
  }

  /**
   * Send project invitation email
   */
  async sendInvitation(params: SendInvitationEmailParams): Promise<void> {
    const { toEmail, toName, inviterName, projectName, role, inviteLink } = params;

    // If no API key, log to console (development mode)
    if (!this.apiKey) {
      console.log('📧 [Email] Project Invitation');
      console.log(`   To: ${toEmail} (${toName})`);
      console.log(`   Project: ${projectName}`);
      console.log(`   Role: ${role}`);
      console.log(`   Invited by: ${inviterName}`);
      console.log(`   Link: ${inviteLink}`);
      console.log('   ⚠️  Set RESEND_API_KEY to send real emails');
      return;
    }

    // Send with Resend
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: toEmail,
          subject: `${inviterName} invited you to ${projectName} on DoubleCheck`,
          html: this.getInvitationEmailHTML(params),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send email: ${response.statusText}`);
      }

      console.log(`✅ Invitation email sent to ${toEmail}`);
    } catch (error) {
      console.error('Failed to send invitation email:', error);
      throw error;
    }
  }

  /**
   * Send role request notification email
   */
  async sendRoleRequestNotification(params: SendRoleRequestNotificationParams): Promise<void> {
    const { toEmail, toName, projectName, action, role, department, reviewerName, reviewNote } = params;

    if (!this.apiKey) {
      console.log('📧 [Email] Role Request Notification');
      console.log(`   To: ${toEmail} (${toName})`);
      console.log(`   Project: ${projectName}`);
      console.log(`   Action: ${action}`);
      console.log(`   Role: ${role} (${department})`);
      console.log(`   Reviewer: ${reviewerName}`);
      if (reviewNote) console.log(`   Note: ${reviewNote}`);
      return;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: toEmail,
          subject: `Role Request ${action === 'approved' ? 'Approved' : 'Denied'} - ${projectName}`,
          html: this.getRoleRequestEmailHTML(params),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send email: ${response.statusText}`);
      }

      console.log(`✅ Role request email sent to ${toEmail}`);
    } catch (error) {
      console.error('Failed to send role request email:', error);
      throw error;
    }
  }

  /**
   * Generate HTML email template
   */
  private getInvitationEmailHTML(params: SendInvitationEmailParams): string {
    const { toName, inviterName, projectName, role, inviteLink } = params;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0b0b0f; color: #ffffff;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #16161a; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #00bfa6 0%, #00a18c 100%);">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #ffffff;">DoubleCheck</h1>
              <p style="margin: 10px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">Film Production Management</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #ffffff;">You've been invited!</h2>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #a1a1a1;">
                Hi ${toName},
              </p>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #a1a1a1;">
                <strong style="color: #ffffff;">${inviterName}</strong> has invited you to collaborate on the project 
                <strong style="color: #ffffff;">"${projectName}"</strong> on DoubleCheck.
              </p>
              
              <div style="margin: 30px 0; padding: 20px; background-color: #1f1f23; border-radius: 6px; border-left: 4px solid #00bfa6;">
                <p style="margin: 0; font-size: 14px; color: #a1a1a1;">Your role:</p>
                <p style="margin: 8px 0 0; font-size: 18px; font-weight: 600; color: #00bfa6; text-transform: capitalize;">${role}</p>
              </div>
              
              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #a1a1a1;">
                Click the button below to accept the invitation and start collaborating:
              </p>
              
              <!-- Button -->
              <table role="presentation" style="margin: 0 0 30px;">
                <tr>
                  <td style="border-radius: 6px; background: linear-gradient(135deg, #00bfa6 0%, #00d4b8 100%);">
                    <a href="${inviteLink}" style="display: inline-block; padding: 16px 40px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; font-size: 14px; color: #6b6b6b;">
                Or copy and paste this link into your browser:<br>
                <a href="${inviteLink}" style="color: #00bfa6; text-decoration: none; word-break: break-all;">${inviteLink}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #0b0b0f; border-top: 1px solid #1f1f23;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #6b6b6b;">
                This invitation was sent by ${inviterName} via DoubleCheck
              </p>
              <p style="margin: 0; font-size: 12px; color: #6b6b6b;">
                If you weren't expecting this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private getRoleRequestEmailHTML(params: SendRoleRequestNotificationParams): string {
    const { toName, projectName, action, role, department, reviewerName, reviewNote } = params;
    const isApproved = action === 'approved';
    const color = isApproved ? '#00bfa6' : '#ef4444';
    const statusText = isApproved ? 'Approved' : 'Denied';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Role Request Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0b0b0f; color: #ffffff;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #16161a; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, ${isApproved ? '#00bfa6 0%, #00a18c' : '#ef4444 0%, #dc2626'} 100%);">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #ffffff;">DoubleCheck</h1>
              <p style="margin: 10px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">Role Request Update</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #ffffff;">Your request has been ${statusText.toLowerCase()}</h2>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #a1a1a1;">
                Hi ${toName},
              </p>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #a1a1a1;">
                <strong style="color: #ffffff;">${reviewerName}</strong> has ${statusText.toLowerCase()} your request to change your role in
                <strong style="color: #ffffff;">"${projectName}"</strong>.
              </p>
              
              <div style="margin: 30px 0; padding: 20px; background-color: #1f1f23; border-radius: 6px; border-left: 4px solid ${color};">
                <p style="margin: 0; font-size: 14px; color: #a1a1a1;">Requested Role:</p>
                <p style="margin: 8px 0 0; font-size: 18px; font-weight: 600; color: #ffffff;">${role}</p>
                <p style="margin: 4px 0 0; font-size: 14px; color: #a1a1a1;">${department}</p>
              </div>

              ${reviewNote ? `
              <div style="margin: 0 0 30px;">
                <p style="margin: 0 0 8px; font-size: 14px; color: #a1a1a1;">Reviewer Note:</p>
                <p style="margin: 0; font-size: 16px; color: #ffffff; font-style: italic;">"${reviewNote}"</p>
              </div>
              ` : ''}
              
              <p style="margin: 0; font-size: 14px; color: #6b6b6b;">
                Log in to DoubleCheck to see the changes.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #0b0b0f; border-top: 1px solid #1f1f23;">
              <p style="margin: 0; font-size: 12px; color: #6b6b6b;">
                DoubleCheck Notification
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }
}

export const emailService = new EmailService();

