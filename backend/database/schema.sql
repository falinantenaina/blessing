-- =============================================================================
-- Base de données : blessing_school
-- =============================================================================
CREATE DATABASE IF NOT EXISTS blessing_school CHARACTER
SET
    utf8mb4 COLLATE utf8mb4_unicode_ci;

USE blessing_school;

-- =============================================================================
-- Tables
-- =============================================================================
CREATE TABLE
    IF NOT EXISTS utilisateurs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        telephone VARCHAR(20) NOT NULL,
        password VARCHAR(255),
        role ENUM ('admin', 'secretaire', 'enseignant') NOT NULL,
        photo_url VARCHAR(255),
        google_id VARCHAR(255) UNIQUE,
        actif BOOLEAN NOT NULL DEFAULT TRUE,
        refresh_token TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (role),
        INDEX idx_actif (actif)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    IF NOT EXISTS etudiants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100) NOT NULL,
        telephone VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        photo_url VARCHAR(255),
        actif BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_telephone (telephone),
        INDEX idx_actif (actif)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    IF NOT EXISTS ecoles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nom VARCHAR(255) NOT NULL,
        adresse TEXT,
        telephone VARCHAR(20),
        email VARCHAR(255),
        actif BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS niveaux (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(10) UNIQUE NOT NULL,
        nom VARCHAR(100) NOT NULL,
        description TEXT,
        frais_inscription DECIMAL(12, 2) NOT NULL DEFAULT 0,
        frais_ecolage DECIMAL(12, 2) NOT NULL DEFAULT 0,
        prix_livre DECIMAL(12, 2) NOT NULL DEFAULT 0,
        duree_mois INT NOT NULL DEFAULT 2,
        actif BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_code (code)
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS salles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nom VARCHAR(100) NOT NULL,
        ecole_id INT,
        capacite INT NOT NULL DEFAULT 20,
        equipements TEXT,
        actif BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (ecole_id) REFERENCES ecoles (id) ON DELETE SET NULL,
        INDEX idx_actif (actif)
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS horaires (
        id INT AUTO_INCREMENT PRIMARY KEY,
        heure_debut TIME NOT NULL,
        heure_fin TIME NOT NULL,
        libelle VARCHAR(50),
        actif BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS jours (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nom VARCHAR(20) NOT NULL,
        ordre INT NOT NULL UNIQUE,
        actif BOOLEAN NOT NULL DEFAULT TRUE
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS vagues (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nom VARCHAR(255) NOT NULL,
        niveau_id INT NOT NULL,
        enseignant_id INT,
        salle_id INT,
        date_debut DATE NOT NULL,
        date_fin DATE NOT NULL,
        capacite_max INT NOT NULL DEFAULT 20,
        statut ENUM ('planifie', 'en_cours', 'termine', 'annule') NOT NULL DEFAULT 'planifie',
        remarques TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (niveau_id) REFERENCES niveaux (id) ON DELETE CASCADE,
        FOREIGN KEY (enseignant_id) REFERENCES utilisateurs (id) ON DELETE SET NULL,
        FOREIGN KEY (salle_id) REFERENCES salles (id) ON DELETE SET NULL,
        INDEX idx_statut (statut),
        INDEX idx_date_debut (date_debut)
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS vague_horaires (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vague_id INT NOT NULL,
        jour_id INT NOT NULL,
        horaire_id INT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vague_id) REFERENCES vagues (id) ON DELETE CASCADE,
        FOREIGN KEY (jour_id) REFERENCES jours (id) ON DELETE CASCADE,
        FOREIGN KEY (horaire_id) REFERENCES horaires (id) ON DELETE CASCADE,
        UNIQUE KEY unique_creneau (vague_id, jour_id, horaire_id)
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS inscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        etudiant_id INT NOT NULL,
        vague_id INT NOT NULL,
        date_inscription DATE NOT NULL,
        statut ENUM ('actif', 'abandonne', 'termine', 'suspendu') NOT NULL DEFAULT 'actif',
        remarques TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (etudiant_id) REFERENCES etudiants (id) ON DELETE CASCADE,
        FOREIGN KEY (vague_id) REFERENCES vagues (id) ON DELETE CASCADE,
        UNIQUE KEY unique_inscription (etudiant_id, vague_id)
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS ecolages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        inscription_id INT NOT NULL,
        montant_total DECIMAL(12, 2) NOT NULL,
        montant_paye DECIMAL(12, 2) NOT NULL DEFAULT 0,
        montant_restant DECIMAL(12, 2) NOT NULL,
        frais_inscription_paye BOOLEAN NOT NULL DEFAULT FALSE,
        statut ENUM ('non_paye', 'partiel', 'paye') NOT NULL DEFAULT 'non_paye',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (inscription_id) REFERENCES inscriptions (id) ON DELETE CASCADE
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS livres (
        id INT AUTO_INCREMENT PRIMARY KEY,
        inscription_id INT NOT NULL,
        numero_livre ENUM ('1', '2') NOT NULL,
        prix DECIMAL(10, 2) NOT NULL,
        statut_paiement ENUM ('non_paye', 'paye') NOT NULL DEFAULT 'non_paye',
        statut_livraison ENUM ('non_livre', 'livre') NOT NULL DEFAULT 'non_livre',
        date_paiement DATE,
        date_livraison DATE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (inscription_id) REFERENCES inscriptions (id) ON DELETE CASCADE,
        UNIQUE KEY uk_livre (inscription_id, numero_livre)
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS paiements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        inscription_id INT NOT NULL,
        type_paiement ENUM ('inscription', 'ecolage', 'livre') NOT NULL,
        montant DECIMAL(12, 2) NOT NULL,
        date_paiement DATE NOT NULL,
        methode_paiement ENUM (
            'especes',
            'carte',
            'virement',
            'cheque',
            'mobile_money'
        ) NOT NULL,
        reference VARCHAR(100),
        remarques TEXT,
        utilisateur_id INT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (inscription_id) REFERENCES inscriptions (id) ON DELETE CASCADE,
        FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs (id) ON DELETE SET NULL
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS remplacements_enseignants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vague_id INT NOT NULL,
        enseignant_original_id INT NOT NULL,
        enseignant_remplacant_id INT NOT NULL,
        date_debut DATE NOT NULL,
        date_fin DATE,
        motif VARCHAR(255),
        actif BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vague_id) REFERENCES vagues (id) ON DELETE CASCADE,
        FOREIGN KEY (enseignant_original_id) REFERENCES utilisateurs (id) ON DELETE CASCADE,
        FOREIGN KEY (enseignant_remplacant_id) REFERENCES utilisateurs (id) ON DELETE CASCADE
    ) ENGINE = InnoDB;


-- table heure creneau @ vague_horaires

CREATE TABLE IF NOT EXISTS vague_horaires (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vague_id INT NOT NULL,
    heure_debut TIME NOT NULL,
    heure_fin TIME NOT NULL,
    FOREIGN KEY (vague_id) REFERENCES vagues(id) ON DELETE CASCADE
);

-- =============================================================================
-- Données initiales (avec IGNORE pour être réexécutable)
-- =============================================================================
INSERT IGNORE INTO jours (nom, ordre)
VALUES
    ('Lundi', 1),
    ('Mardi', 2),
    ('Mercredi', 3),
    ('Jeudi', 4),
    ('Vendredi', 5),
    ('Samedi', 6),
    ('Dimanche', 7);

INSERT IGNORE INTO horaires (heure_debut, heure_fin, libelle)
VALUES
    ('08:00:00', '10:00:00', 'Matin 1 (08h-10h)'),
    ('10:00:00', '12:00:00', 'Matin 2 (10h-12h)'),
    ('12:00:00', '14:00:00', 'Midi (12h-14h)'),
    ('14:00:00', '16:00:00', 'Après-midi 1 (14h-16h)'),
    ('16:00:00', '18:00:00', 'Après-midi 2 (16h-18h)'),
    ('18:00:00', '20:00:00', 'Soir (18h-20h)');

INSERT IGNORE INTO niveaux (
    code,
    nom,
    description,
    frais_inscription,
    frais_ecolage,
    prix_livre,
    duree_mois
)
VALUES
    (
        'A1',
        'Débutant A1',
        'Niveau débutant selon le CECRL',
        50000,
        200000,
        15000,
        2
    ),
    (
        'A2',
        'Élémentaire A2',
        'Niveau élémentaire selon le CECRL',
        50000,
        220000,
        17500,
        2
    ),
    (
        'B1',
        'Intermédiaire B1',
        'Niveau intermédiaire selon le CECRL',
        50000,
        250000,
        20000,
        3
    ),
    (
        'B2',
        'Intermédiaire avancé B2',
        'Niveau intermédiaire avancé selon le CECRL',
        50000,
        280000,
        22500,
        3
    );

INSERT IGNORE INTO ecoles (nom, adresse, telephone, email)
VALUES
VALUES
    (
        'Blessing School',
        '123 Rue de l\'Éducation, Antananarivo',
        '+261 20 00 000 00',
        'contact@blessing-school.mg',
        TRUE,
        NOW ()
    );

INSERT IGNORE INTO salles (nom, ecole_id, capacite, equipements)
VALUES
    (
        'Salle A',
        1,
        20,
        'Tableau blanc, Projecteur, Climatisation'
    ),
    ('Salle B', 1, 25, 'Tableau blanc, Projecteur'),
    ('Salle C', 1, 15, 'Tableau blanc, Climatisation'),
    (
        'Salle D',
        1,
        30,
        'Tableau blanc, Projecteur, Climatisation, Ordinateurs'
    );

-- Admin par défaut (Admin123!)
INSERT IGNORE INTO utilisateurs (nom, prenom, email, telephone, password, role)
VALUES
    (
        'Admin',
        '',
        'admin@blessing.mg',
        '+261 32 12 345 67',
        '$2b$10$G3WhXaY/bcYXj66CIYGqautSe9WkgcKIkHVgFYWNiZbkQCd8fLW2G',
        'admin'
    );

-- Secrétaire par défaut (Secret123!) → CHANGEZ CE HASH EN PRODUCTION !
INSERT IGNORE INTO utilisateurs (nom, prenom, email, telephone, password, role)
VALUES
    (
        'Rakoto',
        'Marie',
        'secretaire@example.com',
        '+261 34 00 000 01',
        '$2b$10$G3WhXaY/bcYXj66CIYGqautSe9WkgcKIkHVgFYWNiZbkQCd8fLW2G',
        'secretaire'
    );