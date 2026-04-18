package com.society.management.service;

import com.society.management.entity.Expense;
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
    private final SocietyConfigService societyConfigService;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender, SocietyConfigService societyConfigService) {
        this.mailSender = mailSender;
        this.societyConfigService = societyConfigService;
    }

    private String getFromAddress() {
        String societyName = societyConfigService.getOrCreate().getSocietyName();
        return "No Reply - " + societyName + " Admin <" + fromEmail + ">";
    }

    public void sendPasswordResetEmail(String toEmail, String token) {
        String resetLink = frontendUrl + "/reset-password?token=" + token;
        String societyName = societyConfigService.getOrCreate().getSocietyName();

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(getFromAddress());
            message.setTo(toEmail);
            message.setSubject(societyName + " - Password Reset");
            message.setText("Hello,\n\nYou have been registered or requested a password reset.\n\n"
                    + "Click the link below to set your password:\n"
                    + resetLink + "\n\n"
                    + "This link will expire in 1 hour.\n\n"
                    + "If you did not request this, please ignore this email.\n\n"
                    + "Regards,\n" + societyName + " Admin");
            mailSender.send(message);
            log.info("Password reset email sent to {}", toEmail);
        } catch (Exception e) {
            log.warn("Failed to send email to {}. Reset link: {}", toEmail, resetLink);
            log.warn("Email error: {}", e.getMessage());
        }
    }

    public boolean sendWelcomeEmail(String toEmail, String fullName, String username, String resetToken) {
        String resetLink = frontendUrl + "/reset-password?token=" + resetToken;
        String societyName = societyConfigService.getOrCreate().getSocietyName();

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(getFromAddress());
            message.setTo(toEmail);
            message.setSubject("Welcome to " + societyName);
            message.setText("Hello " + fullName + ",\n\n"
                    + "Your account has been created at " + societyName + ".\n"
                    + "Username: " + username + "\n\n"
                    + "Please set your password by clicking the link below:\n"
                    + resetLink + "\n\n"
                    + "This link will expire in 1 hour.\n\n"
                    + "Regards,\n" + societyName + " Admin");
            mailSender.send(message);
            log.info("Welcome email sent to {}", toEmail);
            return true;
        } catch (Exception e) {
            log.warn("Failed to send welcome email to {}. Reset link: {}", toEmail, resetLink);
            log.warn("Email error: {}", e.getMessage());
            return false;
        }
    }

    public void sendPaymentConfirmationToVendor(Expense expense) {
        if (expense.getVendor() == null || expense.getVendor().getEmail() == null) return;
        String societyName = societyConfigService.getOrCreate().getSocietyName();

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(getFromAddress());
            message.setTo(expense.getVendor().getEmail());
            message.setSubject(societyName + " — Payment Confirmation — " + expense.getVoucherNumber());

            StringBuilder body = new StringBuilder();
            body.append("Dear ").append(expense.getVendor().getName()).append(",\n\n");
            body.append("Payment has been processed against voucher ").append(expense.getVoucherNumber()).append(".\n\n");
            body.append("Amount: Rs. ").append(expense.getAmount()).append("\n");
            body.append("Date: ").append(expense.getExpenseDate()).append("\n");
            if (expense.getDescription() != null) body.append("Description: ").append(expense.getDescription()).append("\n");
            if (expense.getPaymentMode() != null) body.append("Payment Mode: ").append(expense.getPaymentMode().name()).append("\n");
            if (expense.getChequeNumber() != null) body.append("Cheque No: ").append(expense.getChequeNumber()).append("\n");
            if (expense.getTransactionReference() != null) body.append("Transaction Ref: ").append(expense.getTransactionReference()).append("\n");
            body.append("\nRegards,\n").append(societyName).append(" Admin");

            message.setText(body.toString());
            mailSender.send(message);
            log.info("Payment confirmation email sent to vendor {} at {}", expense.getVendor().getName(), expense.getVendor().getEmail());
        } catch (Exception e) {
            log.warn("Failed to send payment confirmation to vendor {}: {}", expense.getVendor().getEmail(), e.getMessage());
        }
    }
}
