
// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

const PYTHON = process.env.PYTHON || 'py'; // 'python' sur Windows, 'python3' sur Linux/macOS
const SCRIPT = path.join(__dirname, 'getdat.py');
const DATA_FILE = path.join(__dirname, 'data.txt');

app.use(express.static(path.join(__dirname, 'public')));

// --- Parsing du fichier texte "Nom = valeur [unité]" ---
function parseTxt(content) {
  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const readings = lines.map((line) => {
    const [left, right] = line.split('=');
    const name = (left || '').trim() || 'Capteur';
    const rhs = (right || '').trim();

    // Essaie d'extraire un nombre + unité : ex "21.7 °C"
    let value = null;
    let unit = '';
    let raw = rhs;
    const m = rhs.match(/^(-?\d+(?:[.,]\d+)?)(?:\s*(.*))?$/);
    if (m) {
      const num = m[1].replace(',', '.');
      value = Number(num);
      unit = (m[2] || '').trim();
    }
    return { name, value: isNaN(value) ? null : value, unit, raw };
  });

  return readings;
}

// --- Mutex pour éviter de lancer deux scripts simultanément ---
let running = false;

// GET /run : lance Python, attend la fin, lit data.txt et renvoie JSON
app.get('/run', (req, res) => {
  if (running) {
    return res.status(409).json({ status: 'RUNNING', message: 'Le script est déjà en cours.' });
  }
  running = true;

  const proc = spawn(PYTHON, [SCRIPT], { cwd: __dirname });

  let pyOut = '';
  let pyErr = '';

  // (optionnel) logs en console + capture
  proc.stdout.on('data', (d) => {
    pyOut += d.toString();
    process.stdout.write(`PYTHON > ${d}`);
  });
  proc.stderr.on('data', (d) => {
    pyErr += d.toString();
    process.stderr.write(`PYTHON ERR > ${d}`);
  });

  // Timeout de sécurité (par ex. 15s)
  const timeoutMs = 15000;
  const killer = setTimeout(() => {
    try { proc.kill(); } catch {}
  }, timeoutMs);

  proc.on('close', (code) => {
    clearTimeout(killer);
    running = false;

    if (code !== 0) {
      return res.status(500).json({
        status: 'ERROR',
        message: `Python terminé avec code ${code}`,
        stderr: pyErr,
        stdout: pyOut,
      });
    }

    // Lire le fichier texte et le parser
    fs.readFile(DATA_FILE, 'utf-8', (err, content) => {
      if (err) {
        return res.status(500).json({
          status: 'ERROR',
          message: 'Impossible de lire data.txt',
          stderr: pyErr,
        });
      }
      const readings = parseTxt(content);
      res.json({
        status: 'OK',
        readings,
        raw: content,   // pour afficher le contenu brut si tu veux
      });
    });
  });

  proc.on('error', (err) => {
    running = false;
    res.status(500).json({ status: 'ERROR', message: 'Échec de lancement de Python', error: String(err) });
  });
});

// (optionnel) juste lire le txt tel quel
app.get('/data.txt', (req, res) => {
  fs.readFile(DATA_FILE, 'utf-8', (err, content) => {
    if (err) return res.status(404).type('text/plain').send('data.txt introuvable');
    res.type('text/plain').send(content);
  });
});

app.listen(PORT, () => {
  console.log(`Serveur prêt: http://localhost:${PORT}`);
});
