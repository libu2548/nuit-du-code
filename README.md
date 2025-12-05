

***

# 🚀 README — Tableau de bord connecté

## ✅ Prérequis

*   **Installer Node.js** : <https://nodejs.org>
    Vérifier (obtionell):
    ```bash
    node -v
    npm -v
    ```
*   **Installer Python 3** : <https://python.org>  
    Vérifier :
    ```bash
    python3 --version
    ```

***

## 📦 Installation

1.  **Cloner le projet** ou le telecharger en zip
2.  le dezipper
3.  se placer dans le dossier extrait.
4.  lancer un powershell en mode administrateur
5.  autoriser les commandes
   ```bash
Set-ExecutionPolicy Unrestricted
```
6. accepter 
7.  Installer les dépendances Node :
    ```bash
    npm init -y
    npm install express
    ```

***


## 🚀 Lancer le site

1.  Se placer dans le dosier nuit du code precedement dezipé
2.  Démarrer le serveur :
    ```bash
    node server.js
    ```
    *(Si vous utilisez un venv Python : `export PYTHON=./venv/bin/python` ou `set PYTHON=.\venv\Scripts\python.exe`)*

3.  Ouvrir dans le navigateur :
        http://localhost:3000

La page déclenche le script Python, lit `data.txt` et affiche les valeurs.

***

## resolution de problème 

1. installer un vpn pour accerder aux données du serveur de la ferme

   
