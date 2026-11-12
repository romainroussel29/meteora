# 🌤️ Meteora - Tableau de bord météorologique

**Meteora** est une application web moderne et réactive permettant de consulter la météo en temps réel ainsi que les prévisions sur 7 jours pour n'importe quelle ville dans le monde. Ce projet a été conçu dans le cadre de mon portfolio de développeur web pour démontrer ma maîtrise de React, de l'intégration d'API REST et d'une architecture logicielle propre.

🔗 **[Voir la démo en ligne sur Vercel]https://meteora-ten-sooty.vercel.app

---

## 📸 Aperçu de l'application

![Aperçu de Meteora](./screenshot.png)


---

## ✨ Fonctionnalités clés

* **Recherche intelligente avec autocomplétion :** Suggestions de villes en temps réel dès la saisie des premières lettres, optimisées avec un système de **Debounce (300ms)** pour limiter les appels réseau.
* **Géolocalisation instantanée :** Détection automatique de la position de l'utilisateur via l'API native du navigateur (`navigator.geolocation`) pour afficher la météo locale en un clic.
* **Météo actuelle détaillée :** Affichage de la température, des conditions climatiques avec icônes dynamiques (codes WMO), de la vitesse du vent et du taux d'humidité.
* **Prévisions sur 7 jours :** Vue d'ensemble de la semaine à venir avec températures minimales et maximales.
* **Interface moderne et responsive :** Design épuré (Glassmorphism) s'adaptant aussi bien aux ordinateurs qu'aux smartphones.

---

## 🛠️ Technologies utilisées

* **Front-end :** [React](https://react.dev/) 
* **Build Tool :** [Vite](https://vitejs.dev/)
* **Styling :** [Tailwind CSS](https://tailwindcss.com/)
* **Icônes :** [Lucide React](https://lucide.dev/)
* **Données & API :** [Open-Meteo API](https://open-meteo.com/) (Prévisions météo & Géocodage)
* **Déploiement :** [Vercel](https://vercel.com/) (Intégration continue avec GitHub)

---

## 📂 Architecture du projet

Le code est structuré de manière modulaire pour faciliter la maintenance et la lisibilité :

```text
meteora/
├── public/
├── src/
│   ├── components/
│   │   ├── CurrentWeather.jsx  # Carte principale de la météo actuelle
│   │   ├── ForecastList.jsx    # Liste des prévisions sur 7 jours
│   │   └── SearchBar.jsx       # Barre de recherche, autocomplétion et géolocalisation
│   ├── utils/
│   │   └── weatherIcons.jsx    # Traduction des codes météo WMO en icônes et labels
│   ├── App.jsx                 # Composant racine et gestion des appels API
│   └── main.jsx                # Point d'entrée de l'application
└── package.json
```

---

## 🚀 Lancer le projet en local

Pour tester ou modifier ce projet sur une machine :

1. **Cloner le dépôt :**
   ```bash
   git clone https://github.com/romainroussel29/meteora.git
   cd meteora
   ```

2. **Installer les dépendances :**
   ```bash
   npm install
   ```

3. **Lancer le serveur de développement :**
   ```bash
   npm run dev
   ```

4. Ouvrir `http://localhost:5173` dans le navigateur.

---

## 👨‍💻 Auteur

**Romain Roussel** – Développeur Web  
* GitHub : [@romainroussel29](https://github.com/romainroussel29)