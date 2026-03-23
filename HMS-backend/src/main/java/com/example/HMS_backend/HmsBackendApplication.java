package com.example.HMS_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class HmsBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(HmsBackendApplication.class, args);
	}

}
