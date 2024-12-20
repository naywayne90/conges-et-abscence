# Application de Gestion des Congés et Absences

Cette application permet de gérer les congés et absences des employés avec une interface simple et intuitive.

## Prérequis

- Node.js (version 14 ou supérieure)
- NPM (gestionnaire de paquets Node.js)
- Un compte Supabase (base de données)

## Installation

1. Cloner le projet :
```bash
git clone https://github.com/naywayne90/conges-et-abscence.git
cd conges-et-abscence
```

2. Installer les dépendances :
```bash
npm install
```

3. Configuration de la base de données :
- Aller sur [Supabase](https://app.supabase.co)
- Exécuter le script SQL suivant dans l'éditeur SQL :
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR NOT NULL UNIQUE,
  name VARCHAR NOT NULL,
  age INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

4. Démarrer l'application :
```bash
npm start
```

5. Ouvrir l'application :
Aller sur http://localhost:3000 dans votre navigateur

## Fonctionnalités

- Ajout d'utilisateurs
- Liste des utilisateurs
- Suppression d'utilisateurs
- Interface en français
- Sauvegarde automatique dans Supabase

## Structure du Projet

- `public/index.html` : Interface utilisateur
- `public/js/app.js` : Code JavaScript pour l'interface
- `server.js` : Serveur Node.js
- `schema.sql` : Structure de la base de données

## Support

Pour toute question ou problème, ouvrir une issue sur GitHub.