# Guide d'Installation - Blessing School

## 🚀 Installation pas à pas

### Étape 1: Télécharger le projet

git clone <url-du-repo>
cd blessing_school

# Ou décompresser l'archive ZIP téléchargée

````

### Étape 2: Installer les dépendances

npm install

### Étape 3: Configurer MySQL


1. **Créer la base de données** (depuis MySQL)

```sql
CREATE DATABASE blessing_school CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;
````

2. **Run migrate**

npm run migrate

### Étape 4: Configurer les variables d'environnement

1. **Copier le fichier d'exemple**

cp .env.example .env

2. **Éditer le fichier .env**

Ouvrir le fichier `.env` avec un éditeur de texte et modifier les valeurs:

```env
# Configuration du serveur
NODE_ENV=development
PORT=5000

# Configuration de la base de données
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=blessing_school

# Configuration JWT (générer des clés aléatoires)
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d

# URL du frontend (pour CORS)
FRONTEND_URL=http://localhost:5173

# Configuration des uploads
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Configuration du rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Étape 5: Démarrer le serveur

#### Mode développement (avec rechargement automatique)

```bash
npm run dev
```

#### Mode production

```bash
npm start
```

### Étape 6: Vérifier l'installation

1. **Ouvrir un navigateur** et aller sur: `http://localhost:5000`

Vous devriez voir:

```json
{
  "success": true,
  "message": "API Gestion Vagues - Bienvenue",
  "version": "1.0.0"
}
```

2. **Tester l'endpoint health**

```bash
curl http://localhost:5000/api/health
```

## 🧪 Tester l'API

### Utiliser le compte admin par défaut

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@blessing.mg",
    "password": "Admin123!"
  }'
```

Vous recevrez un `accessToken` à utiliser pour les autres requêtes.

### Importer la collection Postman

1. Ouvrir Postman
2. Cliquer sur "Import"
3. Sélectionner le fichier `postman-collection.json`
4. Utiliser la collection pour tester tous les endpoints

## 🔧 Problèmes courants

### Erreur: "Cannot connect to MySQL"

**Solution:**

- Vérifier que MySQL est démarré
- Vérifier les credentials dans le fichier `.env`
- Vérifier que la base de données existe

### Erreur: "Port 5000 already in use"

**Solution:**

- Changer le port dans le fichier `.env`
- Ou arrêter le processus utilisant le port 5000

### Erreur: "Module not found"

**Solution:**

- Supprimer `node_modules` et réinstaller

```bash
rm -rf node_modules package-lock.json
npm install
```

### Erreur: "ER_NOT_SUPPORTED_AUTH_MODE"

**Solution MySQL 8:**

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

## 📊 Structure de la base de données

La base de données comprend les tables suivantes:

- **utilisateurs** - Comptes (admin, secrétaire, enseignant, étudiant)
- **ecoles** - Centres de formation
- **niveaux** - Niveaux de cours (A1, A2, B1, B2)
- **salles** - Salles de cours
- **horaires** - Créneaux horaires
- **jours** - Jours de la semaine
- **vagues** - Sessions/rentrées de formation
- **inscriptions** - Inscriptions des étudiants aux vagues
- **ecolages** - Frais de scolarité
- **paiements** - Historique des paiements
- **remplacements_enseignants** - Gestion des remplacements

## 🔐 Compte par défaut

Après l'installation, utilisez ces identifiants pour vous connecter:

```
Email: admin@blessing.mg
Password: Admin123!
```

2. Créer des utilisateurs (secrétaires, enseignants, étudiants)
3. Ajouter des niveaux de formation
4. Configurer les salles et horaires
5. Créer des vagues de formation
6. Commencer les inscriptions

## 🆘 Support

Si vous rencontrez des problèmes:

1. Consultez la documentation dans `README.md`
2. Vérifiez les logs du serveur
3. Ouvrez une issue sur GitHub

## 🎉 Installation réussie!

Vous êtes maintenant prêt à utiliser l'API Blessing
