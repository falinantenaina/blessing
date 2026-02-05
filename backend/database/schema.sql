-- Base de données pour le système de gestion des inscriptions
CREATE DATABASE IF NOT EXISTS blessing_school CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE blessing_school;

-- Table des utilisateurs (enseignants, secrétaires, admin - PAS les étudiants)
CREATE TABLE IF NOT EXISTS utilisateurs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    password VARCHAR(255),
    role ENUM('admin', 'secretaire', 'enseignant') NOT NULL,
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

-- Table des étudiants (séparée des utilisateurs)
CREATE TABLE IF NOT EXISTS etudiants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    photo_url VARCHAR(255),
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_telephone (telephone),
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
    prix_livre DECIMAL(10, 2) NOT NULL DEFAULT 0,
    duree_mois INT NOT NULL DEFAULT 2,
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des salles (avec capacité)
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
    capacite_max INT DEFAULT 20,
    statut ENUM('planifie', 'en_cours', 'termine', 'annule') DEFAULT 'planifie',
    remarques TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (niveau_id) REFERENCES niveaux(id) ON DELETE CASCADE,
    FOREIGN KEY (enseignant_id) REFERENCES utilisateurs(id) ON DELETE SET NULL,
    FOREIGN KEY (salle_id) REFERENCES salles(id) ON DELETE SET NULL,
    INDEX idx_statut (statut),
    INDEX idx_date_debut (date_debut),
    INDEX idx_enseignant (enseignant_id),
    INDEX idx_salle (salle_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des horaires de vagues (plusieurs jours/horaires par vague)
CREATE TABLE IF NOT EXISTS vague_horaires (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vague_id INT NOT NULL,
    jour_id INT NOT NULL,
    horaire_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vague_id) REFERENCES vagues(id) ON DELETE CASCADE,
    FOREIGN KEY (jour_id) REFERENCES jours(id) ON DELETE CASCADE,
    FOREIGN KEY (horaire_id) REFERENCES horaires(id) ON DELETE CASCADE,
    UNIQUE KEY unique_vague_jour_horaire (vague_id, jour_id, horaire_id),
    INDEX idx_vague (vague_id)
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
    FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE,
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
    statut_ecolage ENUM('non_paye', 'partiel', 'paye') DEFAULT 'non_paye',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (inscription_id) REFERENCES inscriptions(id) ON DELETE CASCADE,
    INDEX idx_inscription (inscription_id),
    INDEX idx_statut (statut_ecolage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des livres (2 livres par étudiant)
CREATE TABLE IF NOT EXISTS livres (
    id INT PRIMARY KEY AUTO_INCREMENT,
    inscription_id INT NOT NULL,
    numero_livre ENUM('1', '2') NOT NULL,
    prix DECIMAL(10, 2) NOT NULL,
    statut_paiement ENUM('non_paye', 'paye') DEFAULT 'non_paye',
    statut_livraison ENUM('non_livre', 'livre') DEFAULT 'non_livre',
    date_paiement DATE,
    date_livraison DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (inscription_id) REFERENCES inscriptions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_livre_inscription (inscription_id, numero_livre),
    INDEX idx_inscription (inscription_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des paiements
CREATE TABLE IF NOT EXISTS paiements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    inscription_id INT NOT NULL,
    type_paiement ENUM('inscription', 'ecolage', 'livre') NOT NULL,
    montant DECIMAL(10, 2) NOT NULL,
    date_paiement DATE NOT NULL,
    methode_paiement ENUM('especes', 'carte', 'virement', 'cheque', 'mobile_money') NOT NULL,
    reference VARCHAR(100),
    remarques TEXT,
    utilisateur_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inscription_id) REFERENCES inscriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL,
    INDEX idx_inscription (inscription_id),
    INDEX idx_date (date_paiement),
    INDEX idx_type (type_paiement)
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
('08:00:00', '10:00:00', 'Matin 1 (08h-10h)'),
('10:00:00', '12:00:00', 'Matin 2 (10h-12h)'),
('12:00:00', '14:00:00', 'Midi (12h-14h)'),
('14:00:00', '16:00:00', 'Après-midi 1 (14h-16h)'),
('16:00:00', '18:00:00', 'Après-midi 2 (16h-18h)'),
('18:00:00', '20:00:00', 'Soir (18h-20h)');

-- Insertion des niveaux par défaut
INSERT INTO niveaux (code, nom, description, frais_inscription, frais_ecolage, prix_livre) VALUES
('A1', 'Débutant A1', 'Niveau débutant selon le CECRL', 50000, 200000, 15000),
('A2', 'Élémentaire A2', 'Niveau élémentaire selon le CECRL', 50000, 220000, 17500),
('B1', 'Intermédiaire B1', 'Niveau intermédiaire selon le CECRL', 50000, 250000, 20000),
('B2', 'Intermédiaire avancé B2', 'Niveau intermédiaire avancé selon le CECRL', 50000, 280000, 22500);

-- Insertion d'une école par défaut
INSERT INTO ecoles (nom, adresse, telephone, email) VALUES
('Centre de Formation Principal', '123 Rue de l\'Éducation, Antananarivo', '+261 20 00 000 00', 'contact@centre-formation.mg');

-- Insertion de salles par défaut avec capacités
INSERT INTO salles (nom, ecole_id, capacite, equipements) VALUES
('Salle A', 1, 20, 'Tableau blanc, Projecteur, Climatisation'),
('Salle B', 1, 25, 'Tableau blanc, Projecteur'),
('Salle C', 1, 15, 'Tableau blanc, Climatisation'),
('Salle D', 1, 30, 'Tableau blanc, Projecteur, Climatisation, Ordinateurs');

('Salle A', 1, 20, 'Tableau blanc, Projecteur, Climatisation'),
('Salle B', 1, 25, 'Tableau blanc, Projecteur'),
('Salle C', 1, 15, 'Tableau blanc, Climatisation');

-- Insertion d'un utilisateur admin par défaut (password: Admin123!)
INSERT INTO utilisateurs (nom, prenom, email, password, role, telephone) VALUES
('Admin', '', 'admin@blessing.mg', '$2b$10$G3WhXaY/bcYXj66CIYGqautSe9WkgcKIkHVgFYWNiZbkQCd8fLW2G', 'admin', '+261 32 12 345 67');

-- Insertion d'un secrétaire par défaut (password: Secret123!)
INSERT INTO utilisateurs (nom, prenom, email, telephone, password, role) VALUES
('Rakoto', 'Marie', 'secretaire@example.com', '+261 34 00 000 01', '$2b$10$G3WhXaY/bcYXj66CIYGqautSe9WkgcKIkHVgFYWNiZbkQCd8fLW2G', 'secretaire');
