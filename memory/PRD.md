# Fluxy Logistique - PRD

## Project Overview
Plateforme de livraison B2B au Congo/Afrique pour articles lourds (meubles, électroménager, matériaux de construction).

## Tech Stack
- **Backend**: FastAPI (Python)
- **Frontend**: React + Tailwind CSS
- **Database**: MongoDB (Emergent integrated)
- **Authentication**: Session-based tokens

## URLs Configurées
| Domaine | Usage | Statut |
|---------|-------|--------|
| api.fluxy-logistique.com | API Backend | ✅ Actif |
| www.fluxy-logistique.com | Landing Page | ⏳ En attente SSL |
| fluxy-mongo-api.preview.emergentagent.com | Preview URL | ✅ Actif |

## Features Implementées

### Backend API (100% fonctionnel)
- ✅ Authentification (Admin, Business, Driver)
- ✅ Gestion des livraisons
- ✅ Validation des chauffeurs
- ✅ Système de tarification
- ✅ Notifications push (Expo)
- ✅ Panel admin HTML

### Landing Page (www.fluxy-logistique.com)
- ✅ Hero Section avec stats et preview app
- ✅ Section Fonctionnalités (Bento Grid)
- ✅ Section "Comment ça marche" (3 étapes)
- ✅ Section Pour Entreprises / Chauffeurs
- ✅ Section Téléchargement (App Store/Google Play)
- ✅ Section Contact avec formulaire
- ✅ Footer avec navigation
- ✅ Design responsive mobile
- ✅ Navigation fixe avec scroll

### Panel Admin (/api/admin)
- ✅ Connexion email/password
- ✅ Connexion Google OAuth
- ✅ Dashboard statistiques
- ✅ Gestion des livraisons
- ✅ Gestion des chauffeurs
- ✅ Gestion des entreprises
- ✅ Configuration tarification

## Configuration Admin
- Email: admin@fluxylogistique.com
- Password: admin123

## DNS Configuration (OVH)
```
api.fluxy-logistique.com → CNAME → fluxy-mongo-api.emergent.host ✅
www.fluxy-logistique.com → CNAME → fluxy-mongo-api.emergent.host ⏳
```

## Next Action Items
1. Configurer le custom domain www.fluxy-logistique.com dans l'interface Emergent
2. Attendre le provisionnement du certificat SSL
3. Ajouter les vrais liens App Store / Google Play
4. Configurer le vrai numéro de téléphone de contact

## Date: Février 2026
