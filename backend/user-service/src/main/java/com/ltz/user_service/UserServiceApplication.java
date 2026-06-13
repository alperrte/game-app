package com.ltz.user_service;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class UserServiceApplication {

	public static void main(String[] args) {
		try {
			// Try loading .env from parent directory (if running from backend/user-service)
			Dotenv dotenv = Dotenv.configure()
					.directory("../../")
					.ignoreIfMissing()
					.load();
			dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));
		} catch (Exception e) {
			try {
				// Try loading from current directory
				Dotenv dotenv = Dotenv.configure()
						.directory("./")
						.ignoreIfMissing()
						.load();
				dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));
			} catch (Exception ex) {
				System.err.println("Notice: .env file could not be loaded: " + ex.getMessage());
			}
		}

		SpringApplication.run(UserServiceApplication.class, args);
	}

}
