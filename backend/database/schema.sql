-- Base de données pour le système de gestion des inscriptions
CREATE DATABASE IF NOT EXISTS blessing_school CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE blessing_school;

-- Table des utilisateurs (étudiants, enseignants, secrétaires, admin)
CREATE TABLE IF NOT EXISTS utilisateurs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telephone VARCHAR(20),
    password VARCHAR(255),
    role ENUM('admin', 'secretaire', 'enseignant', 'etudiant') NOT NULL DEFAULT 'etudiant',
    photo_url VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    actif BOOLEAN DEFAULT TRUE,
    refresh_token TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_actif (actif)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des écoles/centres de formation
CREATE TABLE IF NOT EXISTS ecoles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(255) NOT NULL,
    adresse TEXT,
    telephone VARCHAR(20),
    email VARCHAR(255),
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des niveaux (A1, A2, B1, B2, etc.)
CREATE TABLE IF NOT EXISTS niveaux (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(10) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    frais_inscription DECIMAL(10, 2) NOT NULL DEFAULT 0,
    frais_ecolage DECIMAL(10, 2) NOT NULL DEFAULT 0,
    frais_livre DECIMAL(10, 2) NOT NULL DEFAULT 0,
    duree_mois INT NOT NULL DEFAULT 2,
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des salles
CREATE TABLE IF NOT EXISTS salles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    ecole_id INT,
    capacite INT NOT NULL DEFAULT 20,
    equipements TEXT,
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ecole_id) REFERENCES ecoles(id) ON DELETE SET NULL,
    INDEX idx_actif (actif)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des horaires
CREATE TABLE IF NOT EXISTS horaires (
    id INT PRIMARY KEY AUTO_INCREMENT,
    heure_debut TIME NOT NULL,
    heure_fin TIME NOT NULL,
    libelle VARCHAR(50),
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des jours de la semaine
CREATE TABLE IF NOT EXISTS jours (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(20) NOT NULL,
    ordre INT NOT NULL,
    actif BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des vagues (rentrées/groupes de cours)
CREATE TABLE IF NOT EXISTS vagues (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(255) NOT NULL,
    niveau_id INT NOT NULL,
    enseignant_id INT,
    salle_id INT,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    horaire_id INT,
    jour_id INT,
    capacite_max INT DEFAULT 20,
    statut ENUM('planifie', 'en_cours', 'termine', 'annule') DEFAULT 'planifie',
    remarques TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (niveau_id) REFERENCES niveaux(id) ON DELETE CASCADE,
    FOREIGN KEY (enseignant_id) REFERENCES utilisateurs(id) ON DELETE SET NULL,
    FOREIGN KEY (salle_id) REFERENCES salles(id) ON DELETE SET NULL,
    FOREIGN KEY (horaire_id) REFERENCES horaires(id) ON DELETE SET NULL,
    FOREIGN KEY (jour_id) REFERENCES jours(id) ON DELETE SET NULL,
    INDEX idx_statut (statut),
    INDEX idx_date_debut (date_debut),
    INDEX idx_enseignant (enseignant_id),
    INDEX idx_salle (salle_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des inscriptions (relation étudiants-vagues)
CREATE TABLE IF NOT EXISTS inscriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    etudiant_id INT NOT NULL,
    vague_id INT NOT NULL,
    date_inscription DATE NOT NULL,
    statut ENUM('actif', 'abandonne', 'termine', 'suspendu') DEFAULT 'actif',
    remarques TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (etudiant_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (vague_id) REFERENCES vagues(id) ON DELETE CASCADE,
    UNIQUE KEY unique_inscription (etudiant_id, vague_id),
    INDEX idx_etudiant (etudiant_id),
    INDEX idx_vague (vague_id),
    INDEX idx_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des écolages (frais de scolarité par étudiant)
CREATE TABLE IF NOT EXISTS ecolages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    inscription_id INT NOT NULL,
    montant_total DECIMAL(10, 2) NOT NULL,
    montant_paye DECIMAL(10, 2) DEFAULT 0,
    montant_restant DECIMAL(10, 2) NOT NULL,
    frais_inscription_paye BOOLEAN DEFAULT FALSE,
    frais_livre_paye BOOLEAN DEFAULT FALSE,
    statut ENUM('non_paye', 'partiel', 'paye') DEFAULT 'non_paye',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (inscription_id) REFERENCES inscriptions(id) ON DELETE CASCADE,
    INDEX idx_inscription (inscription_id),
    INDEX idx_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des paiements
CREATE TABLE IF NOT EXISTS paiements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ecolage_id INT NOT NULL,
    montant DECIMAL(10, 2) NOT NULL,
    date_paiement DATE NOT NULL,
    methode_paiement ENUM('especes', 'carte', 'virement', 'cheque', 'mobile_money') NOT NULL,
    reference VARCHAR(100),
    type_frais ENUM('inscription', 'ecolage', 'livre', 'autre') DEFAULT 'ecolage',
    remarques TEXT,
    utilisateur_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ecolage_id) REFERENCES ecolages(id) ON DELETE CASCADE,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL,
    INDEX idx_ecolage (ecolage_id),
    INDEX idx_date (date_paiement)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table de remplacement des enseignants
CREATE TABLE IF NOT EXISTS remplacements_enseignants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vague_id INT NOT NULL,
    enseignant_original_id INT NOT NULL,
    enseignant_remplacant_id INT NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE,
    motif VARCHAR(255),
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vague_id) REFERENCES vagues(id) ON DELETE CASCADE,
    FOREIGN KEY (enseignant_original_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (enseignant_remplacant_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    INDEX idx_vague (vague_id),
    INDEX idx_actif (actif)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertion des jours de la semaine
INSERT INTO jours (nom, ordre) VALUES
('Lundi', 1),
('Mardi', 2),
('Mercredi', 3),
('Jeudi', 4),
('Vendredi', 5),
('Samedi', 6),
('Dimanche', 7);

-- Insertion des horaires par défaut
INSERT INTO horaires (heure_debut, heure_fin, libelle) VALUES
('08:00:00', '10:00:00', 'Matin 1'),
('10:00:00', '12:00:00', 'Matin 2'),
('14:00:00', '16:00:00', 'Après-midi 1'),
('16:00:00', '18:00:00', 'Après-midi 2'),
('18:00:00', '20:00:00', 'Soir');

-- Insertion des niveaux par défaut
INSERT INTO niveaux (code, nom, description, frais_inscription, frais_ecolage, frais_livre) VALUES
('A1', 'Débutant A1', 'Niveau débutant selon le CECRL', 50.00, 200.00, 30.00),
('A2', 'Élémentaire A2', 'Niveau élémentaire selon le CECRL', 50.00, 220.00, 35.00),
('B1', 'Intermédiaire B1', 'Niveau intermédiaire selon le CECRL', 50.00, 250.00, 40.00),
('B2', 'Intermédiaire avancé B2', 'Niveau intermédiaire avancé selon le CECRL', 50.00, 280.00, 45.00);

-- Insertion d'une école par défaut
INSERT INTO ecoles (nom, adresse, telephone, email) VALUES
('Centre de Formation Principal', '123 Rue de l\'Éducation', '+261 20 00 000 00', 'contact@centre-formation.mg');

-- Insertion de salles par défaut
INSERT INTO salles (nom, ecole_id, capacite, equipements) VALUES
('Salle A', 1, 20, 'Tableau blanc, Projecteur, Climatisation'),
('Salle B', 1, 25, 'Tableau blanc, Projecteur'),
('Salle C', 1, 15, 'Tableau blanc, Climatisation');

-- Insertion d'un utilisateur admin par défaut (password: Admin123!)
INSERT INTO utilisateurs (nom, prenom, email, password, role, telephone) VALUES
('Admin', '', 'admin@blessing.mg', '$2a$10$X7jCZ8qK4yYHYj0u6K5qF.vZE4dKGH3sBzM4pZLvYhZqH3sZE4dKG', 'admin', '+261 32 12 345 67');
