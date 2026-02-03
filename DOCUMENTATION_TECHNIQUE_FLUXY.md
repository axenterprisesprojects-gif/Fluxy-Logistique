# 📦 FLUXY LOGISTIQUE - Documentation Technique Complète

## 📋 Vue d'Ensemble

**Fluxy Logistique** est une application mobile de gestion de livraisons B2B permettant aux commerces de commander des livraisons et aux chauffeurs de les accepter et les effectuer.

### Statistiques du Code
- **Frontend** : ~11,000 lignes (TypeScript/React Native)
- **Backend** : ~1,200 lignes (Python/FastAPI)
- **Base de données** : MongoDB

---

## 🛠 Stack Technique

### Frontend (Mobile + Web)
| Technologie | Version | Description |
|-------------|---------|-------------|
| **React Native** | 0.81.5 | Framework mobile cross-platform |
| **Expo** | 54.0.33 | Toolchain et services pour React Native |
| **Expo Router** | 5.1.4 | Navigation basée sur fichiers |
| **TypeScript** | 5.8.3 | Typage statique |
| **React** | 19.1.0 | Bibliothèque UI |
| **Zustand** | 5.0.10 | Gestion d'état |
| **Axios** | 1.13.4 | Client HTTP |
| **AsyncStorage** | 2.2.0 | Stockage persistant local |

### Backend
| Technologie | Version | Description |
|-------------|---------|-------------|
| **Python** | 3.11+ | Langage serveur |
| **FastAPI** | 0.110.1 | Framework API REST |
| **Motor** | 3.3.1 | Driver MongoDB asynchrone |
| **Pydantic** | 2.12.5 | Validation des données |
| **Passlib + Bcrypt** | 1.7.4 | Hashage des mots de passe |
| **Uvicorn** | 0.25.0 | Serveur ASGI |

### Base de Données
| Technologie | Description |
|-------------|-------------|
| **MongoDB** | Base de données NoSQL |
| **Collections** | `users`, `user_sessions`, `delivery_requests`, `pricing_rules`, `platform_settings` |

---

## 📁 Structure du Projet

```
/app
├── backend/
│   ├── server.py           # API FastAPI (1216 lignes)
│   ├── .env                 # Variables d'environnement
│   └── requirements.txt     # Dépendances Python
│
├── frontend/
│   ├── app/                 # Pages (Expo Router - file-based routing)
│   │   ├── _layout.tsx      # Layout racine
│   │   ├── index.tsx        # Page d'accueil (choix du rôle)
│   │   ├── login-business.tsx
│   │   ├── login-driver.tsx
│   │   ├── admin-panel.tsx  # Panneau admin web
│   │   ├── fluxy-logistique.tsx  # Alias admin
│   │   ├── auth-callback.tsx
│   │   │
│   │   ├── (business)/      # Routes Business (Tab Navigator)
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx    # Dashboard
│   │   │   ├── new-delivery.tsx
│   │   │   ├── deliveries.tsx
│   │   │   ├── delivery/[id].tsx
│   │   │   └── profile.tsx
│   │   │
│   │   └── (driver)/        # Routes Chauffeur (Tab Navigator)
│   │       ├── _layout.tsx
│   │       ├── index.tsx    # Dashboard
│   │       ├── jobs.tsx     # Jobs disponibles
│   │       ├── my-jobs.tsx  # Mes livraisons
│   │       └── profile.tsx
│   │
│   ├── src/
│   │   ├── components/      # Composants réutilisables
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── LoadingScreen.tsx
│   │   │   ├── PhotoCapture.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   └── SwipeToAccept.tsx
│   │   │
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx  # Contexte d'authentification global
│   │   │
│   │   ├── hooks/
│   │   │   └── useApi.ts    # Hook API avec authentification
│   │   │
│   │   ├── constants/
│   │   │   └── theme.ts     # Couleurs et styles
│   │   │
│   │   └── utils/
│   │       └── alert.ts     # Utilitaire alertes cross-platform
│   │
│   ├── assets/images/       # Icônes et images
│   ├── app.json             # Configuration Expo
│   ├── package.json
│   └── tsconfig.json
```

---

## 🗄 Schéma Base de Données

### Collection: `users`
```javascript
{
  user_id: "user_abc123",          // ID unique
  email: "email@example.com",      // Pour business/admin
  phone: "+24177123456",           // Pour drivers
  password_hash: "...",            // Hash bcrypt
  name: "Nom Utilisateur",
  picture: "base64...",            // Photo profil (optionnel)
  role: "business|driver|admin",
  is_validated: true|false,        // Pour drivers (validation admin)
  created_at: "2025-01-01T00:00:00Z",
  
  // Champs Business
  business_name: "Ma Boutique",
  business_address: "123 Rue Example",
  business_lat: 0.4162,
  business_lng: 9.4673,
  
  // Champs Driver
  vehicle_type: "moto|voiture|camionnette",
  vehicle_plate: "AB-123-CD",
  vehicle_brand: "Toyota",
  accepted_item_types: ["documents", "colis"],
  refused_item_types: ["fragile"],
  documents: [
    { document_type: "license", document_image: "base64..." }
  ]
}
```

### Collection: `delivery_requests`
```javascript
{
  delivery_id: "del_abc123",
  delivery_code: "QHABC123",       // Code visible client
  business_id: "user_xyz",
  business_name: "Ma Boutique",
  
  // Adresses
  pickup_address: "123 Rue Pickup",
  pickup_lat: 0.4162,
  pickup_lng: 9.4673,
  destination_area: "456 Rue Destination",
  destination_lat: 0.4200,
  destination_lng: 9.4700,
  
  // Client
  customer_name: "Jean Dupont",
  customer_phone: "+24177000000",
  item_description: "Colis 5kg",
  
  // Tarification
  distance_km: 5.2,
  total_price: 15000,              // Prix total (F CFA)
  commission: 2250,                // Commission plateforme
  driver_earnings: 12750,          // Gains chauffeur
  
  // Statuts
  status: "pending|accepted|pickup_confirmed|delivered|cancelled",
  driver_id: "user_driver123",
  driver_name: "Pierre Livreur",
  
  // Photos de preuve
  pickup_photo: "base64...",
  delivery_photo: "base64...",
  
  // Timestamps
  created_at: "2025-01-01T10:00:00Z",
  accepted_at: "2025-01-01T10:05:00Z",
  pickup_at: "2025-01-01T10:30:00Z",
  delivered_at: "2025-01-01T11:00:00Z"
}
```

### Collection: `user_sessions`
```javascript
{
  session_id: "sess_abc123",
  user_id: "user_xyz",
  session_token: "token_abc...",
  expires_at: "2025-01-08T00:00:00Z",
  created_at: "2025-01-01T00:00:00Z"
}
```

### Collection: `pricing_rules`
```javascript
{
  rule_id: "rule_abc123",
  min_distance: 0,
  max_distance: 5,
  price: 10000,
  created_at: "...",
  updated_at: "..."
}
```

### Collection: `platform_settings`
```javascript
{
  setting_type: "commission",
  commission_percentage: 15.0,
  updated_at: "..."
}
```

---

## 🔌 API Endpoints

### Authentification
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/google/callback` | Callback OAuth Google |
| POST | `/api/auth/driver/login` | Connexion chauffeur (phone + password) |
| POST | `/api/auth/driver/register` | Inscription chauffeur |
| POST | `/api/auth/business/login` | Connexion commerce (email + password) |
| POST | `/api/auth/business/register` | Inscription commerce |
| POST | `/api/auth/admin/login` | Connexion admin |
| GET | `/api/auth/me` | Utilisateur courant |
| POST | `/api/auth/logout` | Déconnexion |

### Business
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| PUT | `/api/business/profile` | Modifier profil |
| POST | `/api/business/delivery` | Créer une livraison |
| GET | `/api/business/deliveries` | Liste des livraisons |

### Driver
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| PUT | `/api/driver/profile` | Modifier profil |
| POST | `/api/driver/document` | Upload document |
| GET | `/api/driver/available-jobs` | Jobs disponibles |
| GET | `/api/driver/my-jobs` | Mes livraisons |
| POST | `/api/driver/accept/{delivery_id}` | Accepter job |
| POST | `/api/driver/confirm-pickup/{delivery_id}` | Confirmer récupération + photo |
| POST | `/api/driver/confirm-delivery/{delivery_id}` | Confirmer livraison + photo |

### Admin
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/admin/dashboard` | Statistiques globales |
| GET | `/api/admin/deliveries` | Toutes les livraisons |
| GET | `/api/admin/drivers` | Tous les chauffeurs |
| POST | `/api/admin/validate-driver/{user_id}` | Valider chauffeur |
| GET | `/api/admin/businesses` | Tous les commerces |
| GET | `/api/admin/businesses/{business_id}` | Détail commerce |
| GET | `/api/admin/pricing` | Règles de tarification |
| POST | `/api/admin/pricing` | Créer règle |
| PUT | `/api/admin/pricing/{rule_id}` | Modifier règle |
| DELETE | `/api/admin/pricing/{rule_id}` | Supprimer règle |
| PUT | `/api/admin/commission` | Modifier commission |

### Utilitaires
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/item-types` | Types d'articles |
| GET | `/api/time-slots` | Créneaux horaires |

---

## 🔐 Flux d'Authentification

### Chauffeur (Phone + Password)
```
1. User entre phone + password
2. POST /api/auth/driver/login
3. Backend vérifie password (bcrypt)
4. Crée session (7 jours)
5. Retourne session_token + user
6. Frontend stocke dans AsyncStorage
7. Toutes requêtes avec Header: Authorization: Bearer {token}
```

### Business (Email + Password)
```
1. User entre email + password
2. POST /api/auth/business/login
3. Backend vérifie password (bcrypt)
4. Crée session (7 jours)
5. Retourne session_token + user
```

---

## 📱 Flux Utilisateur

### 1. Business crée une livraison
```
Business Dashboard → Nouvelle Livraison → Remplit formulaire
→ POST /api/business/delivery
→ Calcul automatique du prix basé sur la distance
→ Livraison créée avec status="pending"
```

### 2. Chauffeur accepte et livre
```
Driver voit job dans "Jobs Disponibles" → Swipe pour accepter
→ POST /api/driver/accept/{id}
→ status="accepted"

Driver récupère colis → Prend photo
→ POST /api/driver/confirm-pickup/{id}
→ status="pickup_confirmed"

Driver livre → Prend photo de preuve
→ POST /api/driver/confirm-delivery/{id}
→ status="delivered"
```

---

## ⚙️ Configuration Production

### Variables d'Environnement Backend (.env)
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="fluxy_logistique"
```

### Configuration Expo (app.json)
```json
{
  "expo": {
    "name": "Fluxy Logistique",
    "slug": "fluxy-logistique",
    "version": "1.0.3",
    "extra": {
      "backendUrl": "https://logistics-launch.preview.emergentagent.com"
    },
    "android": {
      "package": "com.fluxylogistique.app"
    },
    "ios": {
      "bundleIdentifier": "com.fluxy.logistique"
    }
  }
}
```

### URL Backend dans le Code
```typescript
// Utilisé partout pour les appels API
import Constants from 'expo-constants';
const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL || '';
```

---

## 🔑 Comptes par Défaut

| Rôle | Identifiant | Mot de passe |
|------|-------------|--------------|
| **Admin** | admin@fluxylogistique.com | admin123 |

---

## 🚀 Commandes de Développement

### Backend
```bash
cd /app/backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend
```bash
cd /app/frontend
yarn install
yarn start        # Démarrer Expo
yarn android      # Android
yarn ios          # iOS
yarn web          # Web
```

### Build Production
```bash
# Via Expo EAS
eas build --platform android
eas build --platform ios
```

---

## 📊 URLs de l'Application

| Environnement | URL |
|---------------|-----|
| **Preview Web** | https://logistics-launch.preview.emergentagent.com |
| **Admin Panel** | https://logistics-launch.preview.emergentagent.com/admin-panel |
| **API Base** | https://logistics-launch.preview.emergentagent.com/api |

---

## 🔧 Points d'Extension Futurs

1. **Notifications Push** - Notifier chauffeurs des nouvelles livraisons
2. **Géolocalisation temps réel** - Tracking GPS du chauffeur
3. **Paiement intégré** - Stripe/Mobile Money
4. **Chat** - Communication Business ↔ Chauffeur
5. **Historique/Analytics** - Rapports détaillés

---

## 📝 Notes Importantes

1. **Les mots de passe sont hashés** avec bcrypt (12 rounds)
2. **Les sessions expirent** après 7 jours
3. **Les chauffeurs doivent être validés** par un admin avant de pouvoir accepter des jobs
4. **Les photos de livraison** sont stockées en base64 dans MongoDB
5. **Le calcul de distance** utilise la formule Haversine
6. **La tarification** est basée sur des tranches de distance configurables

---

*Document généré le 2 Février 2025*
*Version: 1.0.3*
