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

```bash
npm install prompt-sync
```

## Fonctionnement 
### Tests unitaires
De nombreux tests unitaires sont disponibles afin de vérifier le bon fonctionnement du programme.
Pour les lancer, utilisez la commande suivante dans votre terminal :
```bash
npx jasmine
```
Lors du premier test, il peut être demandé d'installer les packages nécessaires.

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
Une fois dans le menu principal, vous avez accès à différentes fonctionnalités :
1) Afficher les créneaux disponibles d'une salle donnée
2) Afficher si une salle est occupée à un créneau donné
3) Afficher les salles et créneaux horaires d'un cours donné
4) Afficher les salles disponibles à un créneau et une capacité donnés
5) Afficher les salles triées par capacité
6) Visualiser le taux d'occupation des salles
7) Générer un fichier iCalendar
8) Afficher la capacité maximale d'une salle donnée
9) Afficher le rapport de conflits
0) Quitter le programme

Une fois la fonctionnalité indiquée, il vous sera demandé les potentielles informations supplémentaires avant de vous indiquer les résultats de votre requête.
### Démonstration 
Une vidéo de démonstration de l'utilisation du programme est disponible [ici](https://drive.google.com/file/d/1Wbp_kOUl3d-fjzd4SITAmiQv6SQKoJNh/view?usp=sharing).
## Contributeurs
Les Algos Sapiens :
- Boyer Jeanne
- Chartier Corentin
- Paris Arthur
## Auteurs
NoFoundTeam :
- Abran Maé
- Mortier Lila
- Musset Aurélien

## Licence
Copyright © (c) 2024 NoFoundTeam & Algos Sapiens

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

