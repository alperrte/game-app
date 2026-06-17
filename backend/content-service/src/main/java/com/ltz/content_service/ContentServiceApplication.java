package com.ltz.content_service;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ContentServiceApplication {

	public static void main(String[] args) {
		try {
			// Proje alt klasöründeyken (backend/content-service) üst dizindeki .env'yi
			// yükler
			Dotenv dotenv = Dotenv.configure()
					.directory("../../")
					.ignoreIfMissing()
					.load();
			dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));
		} catch (Exception e) {
			try {
				// Kök dizindeyken .env'yi yükler
				Dotenv dotenv = Dotenv.configure()
						.directory("./")
						.ignoreIfMissing()
						.load();
				dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));
			} catch (Exception ex) {
				System.err.println("Notice: .env file could not be loaded: " + ex.getMessage());
			}
		}

		SpringApplication.run(ContentServiceApplication.class, args);
	}

}
