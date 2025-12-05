Voici un **README** complet (en français) pour installer les prérequis et lancer ton site web qui :

*   déclenche le **script Python** à chaque visite (endpoint `/run`),
*   lit `data.txt`,
*   et affiche les valeurs sur la page HTML.

Tu peux copier-coller ce fichier dans `README.md` à la racine du projet.  
J’ai prévu les instructions pour **Windows**, **macOS** et **Linux**.

***

# 📘 README — Capteurs Air/Eau (Node + Python)

## 🎯 Objectif

Ce projet expose une page web qui affiche les valeurs de capteurs (Air/Eau) en lisant un fichier texte `data.txt`.  
La page **déclenche** côté serveur l’exécution d’un **script Python** (`script.py`) qui va récupérer les valeurs (via tes endpoints), les écrire dans `data.txt`, puis les renvoyer à la page.

***

## 🗂️ Structure du projet

    projet/
      server.js          # Serveur Node (Express) : routes /run et /data.txt
      script.py          # Script Python : écrit data.txt
      data.txt           # Généré automatiquement (ne pas versionner idéalement)
      public/
        index.html       # Page Web : déclenche /run et affiche les valeurs
      README.md          # Ce fichier
      package.json       # Généré par npm init

***

## ✅ Prérequis

1.  **Node.js** (incluant `npm`)
    *   **Windows** : télécharger depuis <https://nodejs.org> → installer LTS
    *   **macOS** : via Homebrew `brew install node` ou installeur officiel
    *   **Linux (Debian/Ubuntu)** :
        ```bash
        sudo apt update
        sudo apt install -y nodejs npm
        ```
    > Vérifie l’installation :
    ```bash
    node -v
    npm -v
    ```

2.  **Python 3** (3.9+ recommandé)
    *   **Windows** : <https://python.org> → cocher “Add Python to PATH”
    *   **macOS** : `brew install python` ou via installeur officiel
    *   **Linux** :
        ```bash
        python3 --version
        ```
    > Si tu utilises un **virtualenv**, note le chemin du binaire (ex. `./venv/bin/python`).

3.  **Accès réseau** aux endpoints Air/Eau (URL + token si nécessaire).

***

## 🔧 Configuration

Ouvre `script.py` et **personnalise** :

```python
# === À personnaliser ===
url_air = "https://exemple.local/api/air"  # URL réelle
url_eau = "https://exemple.local/api/eau"  # URL réelle

headers = {
    "Authorization": "Bearer TON_TOKEN_ICI",  # Remplace par ton token si nécessaire
    "Accept": "application/json",
    "User-Agent": "python-fetcher/1.0",
}
```

> Format attendu du `data.txt` (par `script.py`) : **une ligne par capteur**  
> `Nom lisible = valeur [unité]`  
> Exemple :
>
>     Température Air Salon = 21.7 °C
>     Température Eau Piscine = 18.3 °C

***

## 📦 Installation des dépendances

Dans le dossier du projet :

```bash
npm init -y
npm install express
```

*(tu n’as pas besoin de `node-cron` si tu déclenches le script à la visite via `/run`)*

***

## 🚀 Lancement du serveur

### Méthode simple (développement)

```bash
# Si tu utilises un virtualenv Python :
# export PYTHON="./venv/bin/python"   # macOS/Linux
# set PYTHON=.\venv\Scripts\python.exe  # Windows PowerShell/CMD

node server.js
```

Le serveur démarre sur :

    http://localhost:3000

Ouvre cette URL dans ton navigateur.  
La page `index.html` va appeler `/run`, lancer `script.py`, attendre la fin, **lire `data.txt`** puis afficher les données.

***

## ⚙️ Scripts utiles (package.json)

Tu peux ajouter ces scripts pour simplifier :

```json
{
  "name": "projet-capteurs",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "start:venv": "PYTHON=./venv/bin/python node server.js",         // macOS/Linux
    "start:win": "set PYTHON=.\venv\\Scripts\\python.exe && node server.js"
  }
}
```

Usage :

```bash
npm run start
# ou avec venv :
npm run start:venv
# sous Windows (PowerShell/CMD) :
npm run start:win
```

***

## 🔌 Déploiement (optionnel)

### Avec **PM2** (garde le serveur en ligne):

```bash
npm install -g pm2
# macOS/Linux avec venv :
PYTHON=./venv/bin/python pm2 start server.js --name "capteurs"
# Windows :
pm2 start server.js --name capteurs --env PYTHON=".\venv\Scripts\python.exe"
pm2 save
pm2 status
```

### Avec **systemd** (Linux):

Crée `/etc/systemd/system/capteurs.service` :

```ini
[Unit]
Description=Serveur Capteurs Node+Python
After=network.target

[Service]
Type=simple
WorkingDirectory=/chemin/vers/projet
Environment=PYTHON=/chemin/vers/projet/venv/bin/python
ExecStart=/usr/bin/node /chemin/vers/projet/server.js
Restart=always
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
```

Puis :

```bash
sudo systemctl daemon-reload
sudo systemctl enable capteurs
sudo systemctl start capteurs
sudo systemctl status capteurs
```

***

## 🔍 Tests rapides

1.  **Test Python seul** :
    ```bash
    # Lance le script manuellement
    python3 script.py
    # Vérifie que data.txt est créé et contient bien les lignes
    cat data.txt
    ```

2.  **Test API** :
    *   Démarre `node server.js`
    *   Appelle `http://localhost:3000/run` dans le navigateur ou via:
        ```bash
        curl http://localhost:3000/run
        ```
    *   Vérifie que la réponse JSON contient `readings` et `raw`.

3.  **Page Web** :
    *   Ouvre `http://localhost:3000`
    *   Clique sur **“Rafraîchir maintenant”** si nécessaire.

***

## 🛠️ Dépannage (FAQ)

*   **`python` introuvable / mauvais binaire**  
    → Défini la variable `PYTHON` :
    *   macOS/Linux : `export PYTHON=./venv/bin/python`
    *   Windows : `set PYTHON=.\venv\Scripts\python.exe`

*   **Erreur `401/403` (auth) depuis `script.py`**  
    → Vérifie `Authorization: Bearer TON_TOKEN_ICI` et l’URL.

*   **`data.txt introuvable`** dans `/run`  
    → Le script Python a peut-être échoué. Regarde la console Node (stdout/stderr) pour diagnostiquer.

*   **Conflits de ports**  
    → Change le port (ex. `PORT=8080`) :
    ```bash
    PORT=8080 node server.js          # macOS/Linux
    set PORT=8080 && node server.js   # Windows
    ```

*   **CORS** (si ta page est servie depuis un domaine/port différent)  
    → Installe et active CORS :
    ```bash
    npm i cors
    ```
    ```js
    const cors = require('cors');
    app.use(cors({ origin: 'http://ton-front.example', methods: ['GET'] }));
    ```

*   **Timeout** si le script Python est long  
    → Dans `server.js`, j’ai mis un timeout de **15s**. Augmente ou adapte selon ta durée.

***

## 🔒 Conseils de sécurité

*   Ne logue pas des **tokens** en clair dans la console/README.
*   Évite de versionner `data.txt` (ajoute-le à `.gitignore`).
*   Si tu exposes le serveur public, mets un **reverse proxy** (Nginx), du **HTTPS**, et contrôle les origines (CORS).

***

## 📄 Licence

MIT

***

## 🧩 Besoin d’aide ?

Tu veux que j’ajoute :

*   une **file d’attente** pour `/run`,
*   un **rafraîchissement auto** à intervalle,
*   des **tests** (Jest) ou un **Dockerfile**,
*   ou une version **Flask**/**FastAPI** (100% Python) ?

Dis-moi ta cible (Windows/Linux/macOS, serveur ou local), et je te prépare les fichiers correspondants. 🙌
