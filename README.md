# API Blessing_School

## 🚀 Fonctionnalités

### ✅ Authentification

- Connexion locale (email/password)
- Inscription
- JWT avec refresh token
- Gestion des sessions
- Google OAuth (configuration requise)

### ✅ Gestion des Utilisateurs

- CRUD complet
- Rôles: Admin, Secrétaire, Enseignant, Étudiant
- Filtres et recherche
- Activation/Désactivation
- Statistiques

### ✅ Gestion des Vagues (Rentrées)

- CRUD complet
- Gestion des inscriptions étudiants
- Vérification disponibilité professeur
- Vérification capacité salle
- Planning hebdomadaire
- Statuts: planifié, en cours, terminé, annulé

### ✅ Gestion des Niveaux

- CRUD complet (A1, A2, B1, B2, etc.)
- Configuration des frais (inscription, écolage, livre)
- Durée des cours
- Statistiques

### ✅ Gestion Financière

- Tableau des écolages
- Enregistrement des paiements
- Méthodes multiples: espèces, carte, virement, chèque, mobile money
- Statistiques financières
- Rapports par période
- Suivi des restes à payer

### ✅ Planning

- Vue hebdomadaire
- Grille jours/horaires
- Disponibilité salles et enseignants
- Gestion des remplacements

### ✅ Sécurité

- Rate limiting (100 req/15min)
- Helmet (headers sécurisés)
- CORS configuré
- Validation des données
- Protection par rôles

## 📋 Prérequis

- Node.js 16.x ou supérieur
- MySQL 8.0 ou supérieur
- npm ou yarn

## 🔧 Installation

1. **Cloner le projet**

```bash
cd blessing_school
```

2. **Installer les dépendances**

```bash
npm install
```

3. **Configurer les variables d'environnement**

```bash
cp .env.example .env
```

Éditer le fichier `.env` avec vos configurations:

```env
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=blessing_school

JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d

FRONTEND_URL=http://localhost:5173
```

4. **Créer la base de données**

DB_NAME=blessing_school

5. **Démarrer le serveur**

```bash
# Mode développement
npm run dev

# Mode production
npm start
```

Le serveur sera accessible sur `http://localhost:5000`

## 📚 Documentation API

### Base URL

```
http://localhost:5000/api
```

### Authentification

#### Inscription

```http
POST /api/auth/register
Content-Type: application/json

{
  "nom": "Doe",
  "prenom": "John",
  "email": "john@gmail.com",
  "password": "password123",
  "telephone": "+261 34 12 345 67",
  "role": "etudiant"
}
```

#### Connexion

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@gmail.com",
  "password": "password123"
}
```

Réponse:

```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": {
      "id": 1,
      "nom": "Doe",
      "prenom": "John",
      "email": "john@gmail.com",
      "role": "etudiant"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Rafraîchir le token

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Déconnexion

```http
POST /api/auth/logout
Authorization: Bearer <access_token>
```

#### Mon profil

```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

### Utilisateurs

#### Liste des utilisateurs

```http
GET /api/users?role=etudiant&actif=true&page=1&limit=10&search=john
Authorization: Bearer <access_token>
```

#### Créer un utilisateur

```http
POST /api/users
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "nom": "Rakotonirina",
  "prenom": "Safidy",
  "email": "safidy@gmail.com",
  "password": "password123",
  "telephone": "+261 34 12 345 67",
  "role": "enseignant"
}
```

#### Modifier un utilisateur

```http
PUT /api/users/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "nom": "Nouveau Nom",
  "telephone": "+261 34 12 345 68"
}
```

#### Activer/Désactiver un utilisateur

```http
PATCH /api/users/:id/toggle
Authorization: Bearer <access_token>
```

### Vagues

#### Liste des vagues

```http
GET /api/vagues?statut=en_cours&niveau_id=1&page=1&limit=10
Authorization: Bearer <access_token>
```

#### Créer une vague

```http
POST /api/vagues
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "nom": "Vague Mars 2026 - A1",
  "niveau_id": 1,
  "enseignant_id": 5,
  "salle_id": 2,
  "date_debut": "2026-03-01",
  "date_fin": "2026-05-01",
  "horaire_id": 1,
  "jour_id": 1,
  "capacite_max": 20,
  "statut": "planifie"
}
```

#### Obtenir le planning

```http
GET /api/vagues/planning
Authorization: Bearer <access_token>
```

#### Étudiants d'une vague

```http
GET /api/vagues/:id/etudiants
Authorization: Bearer <access_token>
```

### Inscriptions

#### Inscrire un étudiant

```http
POST /api/inscriptions
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "etudiant_id": 10,
  "vague_id": 5,
  "date_inscription": "2026-02-15"
}
```

#### Retirer un étudiant

```http
DELETE /api/inscriptions/:vagueId/:etudiantId
Authorization: Bearer <access_token>
```

#### Inscriptions d'un étudiant

```http
GET /api/inscriptions/student/:id
Authorization: Bearer <access_token>
```

### Niveaux

#### Liste des niveaux

```http
GET /api/niveaux
Authorization: Bearer <access_token>
```

#### Créer un niveau

```http
POST /api/niveaux
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "code": "A1",
  "nom": "Débutant A1",
  "description": "Niveau débutant",
  "frais_inscription": 50.00,
  "frais_ecolage": 200.00,
  "frais_livre": 30.00,
  "duree_mois": 2
}
```

### Finances

#### Liste des écolages

```http
GET /api/finances/ecolages?statut=partiel&page=1&limit=10
Authorization: Bearer <access_token>
```

#### Enregistrer un paiement

```http
POST /api/finances/paiements
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "ecolage_id": 15,
  "montant": 100.00,
  "date_paiement": "2026-02-20",
  "methode_paiement": "especes",
  "type_frais": "ecolage",
  "reference": "PAIEMENT-2026-001"
}
```

#### Statistiques financières

```http
GET /api/finances/stats?date_debut=2026-01-01&date_fin=2026-12-31
Authorization: Bearer <access_token>
```

#### Rapport financier

```http
GET /api/finances/rapport?date_debut=2026-01-01&date_fin=2026-12-31
Authorization: Bearer <access_token>
```

### Référence

#### Salles

```http
GET /api/reference/salles
POST /api/reference/salles
PUT /api/reference/salles/:id
DELETE /api/reference/salles/:id
Authorization: Bearer <access_token>
```

#### Horaires

```http
GET /api/reference/horaires
POST /api/reference/horaires
Authorization: Bearer <access_token>
```

#### Jours

```http
GET /api/reference/jours
Authorization: Bearer <access_token>
```

#### Écoles

```http
GET /api/reference/ecoles
POST /api/reference/ecoles
Authorization: Bearer <access_token>
```

## 🔐 Rôles et Permissions

### Admin

- Accès complet à toutes les fonctionnalités
- Gestion des utilisateurs
- Accès à l'historique des paiements
- Statistiques globales

### Secrétaire

- Gestion des étudiants
- Gestion des inscriptions
- Gestion des vagues
- Enregistrement des paiements
- Affectation des enseignants

### Enseignant

- Consultation de ses vagues
- Consultation des étudiants de ses vagues
- Modification de son profil

### Étudiant

- Consultation de ses cours
- Consultation de ses paiements
- Modification de son profil

## 🏗️ Structure du Projet

```
gestion-vagues-api/
├── database/
│   └── schema.sql              # Schéma de la base de données
├── src/
│   ├── config/
│   │   └── database.js         # Configuration MySQL
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── vague.controller.js
│   │   ├── inscription.controller.js
│   │   ├── niveau.controller.js
│   │   ├── finance.controller.js
│   │   └── reference.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── error.middleware.js
│   ├── models/
│   │   ├── user.model.js
│   │   ├── vague.model.js
│   │   ├── inscription.model.js
│   │   ├── niveau.model.js
│   │   ├── finance.model.js
│   │   └── reference.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── vague.routes.js
│   │   ├── inscription.routes.js
│   │   ├── niveau.routes.js
│   │   ├── finance.routes.js
│   │   ├── reference.routes.js
│   │   └── index.js
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── validation.js
│   │   └── response.js
│   ├── validators/
│   │   ├── auth.validator.js
│   │   └── vague.validator.js
│   ├── app.js                  # Configuration Express
│   └── server.js               # Point d'entrée
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 🧪 Tests

Pour tester l'API, vous pouvez utiliser:

- **Postman** - Collection disponible
- **curl**
- **Thunder Client** (VS Code)
- **Insomnia**

## 🔄 Scripts disponibles

```bash
# Démarrer en mode développement (avec nodemon)
npm run dev

# Démarrer en mode production
npm start
```

## 📝 Notes importantes

1. **Mot de passe par défaut de l'admin**: `Admin123!`
2. **Email admin**: `admin@blessing.mg`
3. Les tokens JWT expirent après 1 heure
4. Les refresh tokens expirent après 7 jours
5. Rate limit: 100 requêtes par 15 minutes

## 🤝 Contribution

Pour contribuer au projet:

1. Fork le projet
2. Créer une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence ISC.

## 👨‍💻 Support

Pour toute question ou problème, veuillez ouvrir une issue sur le dépôt GitHub.
