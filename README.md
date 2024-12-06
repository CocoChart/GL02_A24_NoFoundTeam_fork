# Projet GL02 de la NoFoundTeam

Ce projet est réalisé par la NoFoundTeam suite à la demande des Algos Sapiens.
## Présentation du projet
Ce projet consiste en la création d'un outil de gestion des salles et d'organisation des usagers d'une université.\
Le cahier des charges du projet (réalisé par les Algos Sapiens) est disponible [ici](https://drive.google.com/file/d/1L5uby8bw0sJ85M3nuYX020e3dtGXyWy8/view?usp=sharing).

## Installation des dépendances
Le projet fonctionnant sous NodeJS, il peut être nécessaire d'installer des dépendances. En cas d'erreur, tentez d'installer les dépendances avec la commande suivante :

```bash
npm install chalk@4
```

## Fonctionnement 
### Lancement du programme 
```bash
node main.js
```
Une fois le programme lancé, celui-ci va vous demander le chemin d'accès aux données des cours.\
Un exemple de dossier data est disponible en téléchargement [ici](https://drive.google.com/file/d/1fT2q1QvIYl6LuxS_g-cqWjmS5bBKgYzL/view?usp=drive_link).\
\
Ensuite, le programme va analyser les données pour vous générer un rapport avec les potentiels conflits d'emplois du temps.
\
\
Une fois cette étape passée, vous serez dans le menu principal.
### Fonctionnalités
Une fois dans le menu principal, vous avez accès à differentes fonctionnalitées :
1) Afficher les créneaux disponibles d'une salle donnée
2) Afficher si une salle est occupée à un créneau donné
3) Afficher les salles et créneaux horaires d'un cours donné
4) Afficher les salles disponibles à un créneau et une capacité donnés
5) Afficher les salles triées par capacité
6) Visualiser le taux d'occupation des salles
7) Générer un fichier iCalendar
8) Afficher la capacité maximale d'une salle donnée
9) Quitter le programme

Une fois la fonctionnalité indiqué, il vous sera demandé les potentielles informations supplémentaires avant de vous indiquer les résultats de votre requête.
### Démonstration 
Une vidéo de démonstration de l'utilisation du programme est disponible [ici](https://drive.google.com/file/d/1Wbp_kOUl3d-fjzd4SITAmiQv6SQKoJNh/view?usp=sharing).
## Contibuteurs
Les Algos Sapiens :
- Bermudez Lucas
- Boyer Jeanne
- Chartier Corentin
- Paris Arthur
## Auteurs
NoFoundTeam :
- Abran Maé
- Mortier Lila
- Musset Aurélien