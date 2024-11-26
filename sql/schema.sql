CREATE DATABASE verifi_chain;

USE verifi_chain;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('Applicant', 'University', 'Company', 'Admin') NOT NULL
);

CREATE TABLE certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    applicant_id INT,
    certificate_number VARCHAR(255) NOT NULL UNIQUE,
    encrypted_hash TEXT NOT NULL,
    ipfs_hash TEXT NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (applicant_id) REFERENCES users(id)
);

CREATE TABLE verification_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    certificate_id INT,
    university_id INT,
    status ENUM('Pending', 'Approved', 'Rejected') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (certificate_id) REFERENCES certificates(id),
    FOREIGN KEY (university_id) REFERENCES users(id)
);
