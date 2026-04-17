package com.society.management.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordResetEmail(String toEmail, String token) {
        String resetLink = frontendUrl + "/reset-password?token=" + token;

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Society Management - Password Reset");
            message.setText("Hello,\n\nYou have been registered or requested a password reset.\n\n"
                    + "Click the link below to set your password:\n"
                    + resetLink + "\n\n"
                    + "This link will expire in 1 hour.\n\n"
                    + "If you did not request this, please ignore this email.");
            mailSender.send(message);
            log.info("Password reset email sent to {}", toEmail);
        } catch (Exception e) {
            log.warn("Failed to send email to {}. Reset link: {}", toEmail, resetLink);
            log.warn("Email error: {}", e.getMessage());
        }
    }

    public void sendWelcomeEmail(String toEmail, String fullName, String username, String resetToken) {
        String resetLink = frontendUrl + "/reset-password?token=" + resetToken;

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Welcome to Society Management");
            message.setText("Hello " + fullName + ",\n\n"
                    + "Your account has been created.\n"
                    + "Username: " + username + "\n\n"
                    + "Please set your password by clicking the link below:\n"
                    + resetLink + "\n\n"
                    + "This link will expire in 1 hour.");
            mailSender.send(message);
            log.info("Welcome email sent to {}", toEmail);
        } catch (Exception e) {
            log.warn("Failed to send welcome email to {}. Reset link: {}", toEmail, resetLink);
            log.warn("Email error: {}", e.getMessage());
        }
    }
}
