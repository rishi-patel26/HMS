package com.example.HMS_backend.notification.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromEmail;

    @Async
    public void sendWelcomeEmail(String toEmail, String username, String password, String role) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Welcome to Hospital Management System");
            helper.setText(buildWelcomeEmailHtml(username, password, role), true);
            
            mailSender.send(message);
            log.info("Welcome email sent successfully to: {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send welcome email to: {}", toEmail, e);
        }
    }

    private String buildWelcomeEmailHtml(String username, String password, String role) {
        return String.format("""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to HMS</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
                <table role="presentation" style="width: 100%%; border-collapse: collapse; background-color: #f4f7fa;">
                    <tr>
                        <td align="center" style="padding: 40px 20px;">
                            <table role="presentation" style="max-width: 600px; width: 100%%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                                <!-- Header -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                                            🏥 Hospital Management System
                                        </h1>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <h2 style="margin: 0 0 20px 0; color: #1a202c; font-size: 24px; font-weight: 600;">
                                            Welcome, %s!
                                        </h2>
                                        
                                        <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                                            Your account has been successfully created. You can now access the Hospital Management System with the credentials below.
                                        </p>
                                        
                                        <!-- Credentials Box -->
                                        <table role="presentation" style="width: 100%%; border-collapse: collapse; background-color: #f7fafc; border-radius: 8px; margin: 30px 0;">
                                            <tr>
                                                <td style="padding: 25px;">
                                                    <table role="presentation" style="width: 100%%; border-collapse: collapse;">
                                                        <tr>
                                                            <td style="padding: 8px 0;">
                                                                <span style="color: #718096; font-size: 14px; font-weight: 500;">Username</span>
                                                            </td>
                                                            <td style="padding: 8px 0; text-align: right;">
                                                                <span style="color: #2d3748; font-size: 15px; font-weight: 600; font-family: 'Courier New', monospace;">%s</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 8px 0; border-top: 1px solid #e2e8f0;">
                                                                <span style="color: #718096; font-size: 14px; font-weight: 500;">Password</span>
                                                            </td>
                                                            <td style="padding: 8px 0; text-align: right; border-top: 1px solid #e2e8f0;">
                                                                <span style="color: #2d3748; font-size: 15px; font-weight: 600; font-family: 'Courier New', monospace;">%s</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 8px 0; border-top: 1px solid #e2e8f0;">
                                                                <span style="color: #718096; font-size: 14px; font-weight: 500;">Role</span>
                                                            </td>
                                                            <td style="padding: 8px 0; text-align: right; border-top: 1px solid #e2e8f0;">
                                                                <span style="display: inline-block; background-color: #667eea; color: #ffffff; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600;">%s</span>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Login Button -->
                                        <table role="presentation" style="width: 100%%; border-collapse: collapse; margin: 30px 0;">
                                            <tr>
                                                <td align="center">
                                                    <a href="http://localhost:4200/login" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                                                        Login to Your Account
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Security Notice -->
                                        <table role="presentation" style="width: 100%%; border-collapse: collapse; background-color: #fff5f5; border-left: 4px solid #fc8181; border-radius: 6px; margin: 25px 0;">
                                            <tr>
                                                <td style="padding: 16px 20px;">
                                                    <p style="margin: 0; color: #742a2a; font-size: 14px; line-height: 1.5;">
                                                        <strong>🔒 Security Reminder:</strong> For your security, please change your password after your first login.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="margin: 25px 0 0 0; color: #4a5568; font-size: 15px; line-height: 1.6;">
                                            If you have any questions or need assistance, please don't hesitate to contact the system administrator.
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f7fafc; padding: 30px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
                                        <p style="margin: 0 0 10px 0; color: #718096; font-size: 14px;">
                                            Best regards,<br>
                                            <strong style="color: #4a5568;">Hospital Management System Team</strong>
                                        </p>
                                        <p style="margin: 15px 0 0 0; color: #a0aec0; font-size: 12px;">
                                            This is an automated message. Please do not reply to this email.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """, username, username, password, role);
    }

    @Async
    public void sendNotificationEmail(String toEmail, String subject, String message) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(buildNotificationEmailHtml(subject, message), true);
            
            mailSender.send(mimeMessage);
            log.info("Notification email sent successfully to: {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send notification email to: {}", toEmail, e);
        }
    }

    private String buildNotificationEmailHtml(String subject, String message) {
        return String.format("""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Notification</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
                <table role="presentation" style="width: 100%%; border-collapse: collapse; background-color: #f4f7fa;">
                    <tr>
                        <td align="center" style="padding: 40px 20px;">
                            <table role="presentation" style="max-width: 600px; width: 100%%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                                <tr>
                                    <td style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                                            🔔 %s
                                        </h1>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <p style="margin: 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                                            %s
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="background-color: #f7fafc; padding: 20px 30px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
                                        <p style="margin: 0; color: #718096; font-size: 13px;">
                                            Hospital Management System
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """, subject, message);
    }
}
