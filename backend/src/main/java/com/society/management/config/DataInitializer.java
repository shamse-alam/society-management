package com.society.management.config;

import com.society.management.entity.*;
import com.society.management.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final IncomeTypeRepository incomeTypeRepository;
    private final ExpenseTypeRepository expenseTypeRepository;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder,
                           IncomeTypeRepository incomeTypeRepository, ExpenseTypeRepository expenseTypeRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.incomeTypeRepository = incomeTypeRepository;
        this.expenseTypeRepository = expenseTypeRepository;
    }

    @Override
    public void run(String... args) {
        seedUsers();
        seedIncomeTypes();
        seedExpenseTypes();
    }

    private void seedUsers() {
        if (userRepository.count() > 0) return;

        String pwd = passwordEncoder.encode("welcome");

        userRepository.save(User.builder()
                .username("admin").password(pwd).firstName("System").lastName("Administrator")
                .email("admin@courtyard.com").phone("+91-9000000000").address("Society Office")
                .unitNumber("ADMIN").roles("ADMIN").build());
        log.info("Admin created - username: admin, password: welcome");

        userRepository.save(User.builder()
                .username("guard").password(pwd).firstName("Security").lastName("Guard")
                .email("guard@courtyard.com").phone("+91-9000000001").address("Main Gate")
                .unitNumber("GATE").roles("GUARD").build());
        log.info("Guard created - username: guard, password: welcome");
    }

    private void seedIncomeTypes() {
        if (incomeTypeRepository.count() > 0) return;

        incomeTypeRepository.save(IncomeType.builder()
                .code("MAINTENANCE").displayName("Maintenance")
                .gstApplicable(true).reserveFund(false).oneTime(false).systemManaged(false)
                .displayOrder(1).active(true).build());
        incomeTypeRepository.save(IncomeType.builder()
                .code("CORPUS").displayName("Corpus Fund")
                .gstApplicable(true).reserveFund(true).oneTime(true).systemManaged(false)
                .displayOrder(2).active(true).build());
        incomeTypeRepository.save(IncomeType.builder()
                .code("MEMBERSHIP").displayName("Membership")
                .gstApplicable(false).reserveFund(true).oneTime(true).systemManaged(false)
                .displayOrder(3).active(true).build());
        incomeTypeRepository.save(IncomeType.builder()
                .code("AMENITY_BOOKING").displayName("Amenity Booking")
                .gstApplicable(true).reserveFund(false).oneTime(false).systemManaged(true)
                .displayOrder(4).active(true).build());

        log.info("Default income types seeded");
    }

    private void seedExpenseTypes() {
        if (expenseTypeRepository.count() > 0) return;

        String[][] defaults = {
                {"ELECTRICITY", "Electricity", "true"},
                {"WATER", "Water", "true"},
                {"SECURITY", "Security", "true"},
                {"MAINTENANCE", "Maintenance", "true"},
                {"SALARY", "Salary", "false"},
                {"CLEANING", "Cleaning", "true"},
                {"GARDENING", "Gardening", "true"},
                {"REPAIRS", "Repairs", "true"},
                {"OTHER", "Other", "true"},
        };
        for (int i = 0; i < defaults.length; i++) {
            expenseTypeRepository.save(ExpenseType.builder()
                    .code(defaults[i][0]).displayName(defaults[i][1])
                    .gstIncluded(Boolean.parseBoolean(defaults[i][2]))
                    .displayOrder(i + 1).active(true).build());
        }

        log.info("Default expense types seeded");
    }
}
