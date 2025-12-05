(function(global){
	const grid = document.getElementById('dashboard');

	function normalizeSize(size){
		if(!size || typeof size !== 'string') return '1x1';
		const m = size.trim().match(/^(\d)x(\d)$/);
		return m ? m[0] : '1x1';
	}

	function registerTile({id, title='Tile', icon='▣', size='1x1', mount}){
		if(!id) throw new Error('registerTile requires an id');
		if(document.getElementById(id)) return document.getElementById(id);

		const normalized = normalizeSize(size);
		const tile = document.createElement('section');
		tile.id = id;
		// add both new and legacy classnames for compatibility
		tile.className = 'tile size-' + normalized + ' s-' + normalized;
		tile.setAttribute('role','gridcell');
		tile.setAttribute('tabindex','0');
		tile.setAttribute('aria-label', title);

		// header
		const header = document.createElement('div');
		header.className = 'header';
		header.innerHTML = '<span class="icon" aria-hidden="true">' + icon + '</span>'
			+ '<span class="title">' + title + '</span>';

		const body = document.createElement('div');
		body.className = 'body';
		body.innerHTML = '<div class="placeholder muted">placeholder</div>';

		tile.appendChild(header);
		tile.appendChild(body);
		grid.appendChild(tile);

		try{
			if(typeof mount === 'function'){
				const api = {
					el: body,
					set(content){
						if(typeof content === 'string'){ body.innerHTML = content; }
						else if(content instanceof Node){ body.innerHTML = ''; body.appendChild(content); }
					},
					setValue(text){
						body.innerHTML = '<div class="value">'+String(text)+'</div>';
					}
				};
				mount(api);
			}
		}catch(e){
			console.error('mount failed for', id, e);
		}
		return tile;
	}

	global.registerTile = registerTile;

	/* ---------------- Demo tiles (10) ---------------- */



	// ---------------- Sensor tiles loader ----------------
	// Parse le contenu de data.txt au format "Nom = valeur [unité]"
	function parseTextToReadings(content){
		const lines = String(content || '').split('\n').map(l => l.trim()).filter(Boolean);
		return lines.map(line => {
			const [left, right] = line.split('=');
			const name = (left || '').trim() || 'Capteur';
			const rhs = (right || '').trim();
			let value = null, unit = '', raw = rhs;
			const m = rhs.match(/^(-?\d+(?:[.,]\d+)?)(?:\s*(.*))?$/);
			if(m){
				const num = m[1].replace(',', '.');
				value = Number(num);
				unit = (m[2] || '').trim();
			}
			return { name, value: isNaN(value) ? null : value, unit, raw };
		});
	}

	// Crée un id sûr à partir du nom (letters/numbers/dashes)
	function sanitizeId(name){
		if(!name) return 'sensor';
		let id = String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
		if(/^\d/.test(id)) id = 's-' + id;
		return 'sensor-' + (id || Date.now().toString(36));
	}

	// Met à jour / crée la tuile d'alerte pour la température d'eau des truites
	function updateWarningTile(tempValue, unit){
		const id = 'warning-water-temp';
		const title = 'ALERTE température eau (truites)';
		const icon = '⚠';
		// plage visuelle pour l'eau (ajuste si nécessaire)
		const MIN = -10;
		const MAX = 35;
		// seuils prédéfinis (modifiable) : <=COLD = froid, >=HOT = chaud
		const COLD_TH = 8;   // ≤8°C => trop froid
		const HOT_TH = 22;   // ≥22°C => trop chaud

		const makeHtml = (state, color, extra='') => {
			const val = (tempValue === null || tempValue === undefined) ? MIN : tempValue;
			const display = extra || (tempValue !== null && tempValue !== undefined ? `${tempValue} ${unit ?? ''}` : '—');
			const bg = zonesGradientForValue(val, MIN, MAX, COLD_TH, HOT_TH);
			return `<div class="muted">${title}</div>
				<div style="display:flex;align-items:center;gap:8px;">
				  <div style="flex:1;">
				    <input type="range" min="${MIN}" max="${MAX}" value="${val}" disabled
				      style="width:100%;height:10px;border-radius:6px;border:0;appearance:none;background:${bg};">
				  </div>
				  <div style="min-width:6rem;text-align:right;font-weight:700;color:${color};">${display}</div>
				</div>
				<div style="margin-top:.4rem;"><span style="color:${color};font-weight:700;">${state}</span></div>`;
		};

		const existing = document.getElementById(id);
		const zoneLabel = zoneLabelForValue(tempValue, COLD_TH, HOT_TH);
		const colorMap = { 'Trop froid': '#007bff', 'Normal': '#28a745', 'Trop chaud': '#c00', 'No data':'#666' };
		const color = colorMap[zoneLabel] || '#666';
		// message d'alerte explicite : préfixe "Eau" + zone
		const sensorLabel = 'Eau';
		const stateMsg = `${sensorLabel} — ${zoneLabel}`;

		if(existing){
			const body = existing.querySelector('.body');
			if(body){
				body.innerHTML = makeHtml(stateMsg, color, `${tempValue !== null && tempValue !== undefined ? `${tempValue} ${unit ?? ''}` : ''}`);
			}
			return;
		}

		// création via registerTile
		registerTile({
			id,
			title,
			icon,
			size: '1x1',
			mount(api){
				api.set(makeHtml(stateMsg, color, `${tempValue !== null && tempValue !== undefined ? `${tempValue} ${unit ?? ''}` : ''}`));
			}
		});
	}

	// Met à jour / crée la tuile d'alerte pour la température d'air (hommes)
	function updateAirWarningTile(tempValue, unit){
		const id = 'warning-air-temp';
		const title = 'ALERTE température air';
		const icon = '🔥';
		// plage visuelle pour l'air (ajuste si nécessaire)
		const MIN = -10;
		const MAX = 35;
		// seuils prédéfinis (modifiable)
		const COLD_TH = 10;  // ≤10°C => trop froid
		const HOT_TH = 30;   // ≥30°C => trop chaud

		const makeHtml = (state, color, extra='') => {
			const val = (tempValue === null || tempValue === undefined) ? MIN : tempValue;
			const display = extra || (tempValue !== null && tempValue !== undefined ? `${tempValue} ${unit ?? ''}` : '—');
			const bg = zonesGradientForValue(val, MIN, MAX, COLD_TH, HOT_TH);
			return `<div class="muted">${title}</div>
				<div style="display:flex;align-items:center;gap:8px;">
				  <div style="flex:1;">
				    <input type="range" min="${MIN}" max="${MAX}" value="${val}" disabled
				      style="width:100%;height:10px;border-radius:6px;border:0;appearance:none;background:${bg};">
				  </div>
				  <div style="min-width:6rem;text-align:right;font-weight:700;color:${color};">${display}</div>
				</div>
				<div style="margin-top:.4rem;"><span style="color:${color};font-weight:700;">${state}</span></div>`;
		};

		const existing = document.getElementById(id);
		const zoneLabel = zoneLabelForValue(tempValue, COLD_TH, HOT_TH);
		const colorMap = { 'Trop froid': '#007bff', 'Normal': '#28a745', 'Trop chaud': '#c00', 'No data':'#666' };
		const color = colorMap[zoneLabel] || '#666';
		// message d'alerte explicite : préfixe "Air" + zone
		const sensorLabel = 'Air';
		const stateMsg = `${sensorLabel} — ${zoneLabel}`;

		if(existing){
			const body = existing.querySelector('.body');
			if(body){
				body.innerHTML = makeHtml(stateMsg, color, `${tempValue !== null && tempValue !== undefined ? `${tempValue} ${unit ?? ''}` : ''}`);
			}
			return;
		}

		// création via registerTile
		registerTile({
			id,
			title,
			icon,
			size: '1x1',
			mount(api){
				api.set(makeHtml(stateMsg, color, `${tempValue !== null && tempValue !== undefined ? `${tempValue} ${unit ?? ''}` : ''}`));
			}
		});
	}

	// Charge /data.txt et crée/actualise des tuiles pour chaque relevé
	async function loadSensorTiles(){
		try{
			const res = await fetch('/data.txt', { cache: 'no-store' });
			if(!res.ok) throw new Error('Impossible de charger /data.txt');
			const text = await res.text();
			const readings = parseTextToReadings(text);

			let troutWaterTemp = null;
			let troutUnit = '';
			let airTemp = null;
			let airUnit = '';

			for(const r of readings){
				const id = sanitizeId(r.name);
				const bodyHtml = r.value !== null
					? `<div class="muted"></div><div class="value">${r.value} ${r.unit ?? ''}</div>`
					: `<div class="muted"></div><div class="raw">${r.raw}</div>`;

				const existing = document.getElementById(id);
				if(existing){
					// Met à jour le contenu de la tuile existante
					const body = existing.querySelector('.body');
					if(body) body.innerHTML = bodyHtml;
				} else {
					// Sinon crée la tuile via registerTile
					registerTile({
						id,
						title: r.name,
						icon: '🌡',
						size: '1x1',
						mount(api){
							api.set(bodyHtml);
						}
					});
				}

				// Détection flexible du capteur "Température eau truites"
				const n = (r.name || '').toLowerCase();
				if(n.includes('eau') && (n.includes('truit') || n.includes('truite') || n.includes('truites'))){
					troutWaterTemp = r.value;
					troutUnit = r.unit || '';
				}
				// Détection flexible du capteur "Température air"
				if(n.includes('air') && (n.includes('temp') || n.includes('température') || n.includes('temperature'))){
					airTemp = r.value;
					airUnit = r.unit || '';
				}
			}

			// Met à jour la tuile d'alerte en fonction de la valeur trouvée
			updateWarningTile(troutWaterTemp === undefined ? null : troutWaterTemp, troutUnit);
			// Met à jour la tuile d'alerte air (seuil 30°C)
			updateAirWarningTile(airTemp === undefined ? null : airTemp, airUnit);

		}catch(err){
			console.warn('loadSensorTiles error:', err);
			// En cas d'erreur de lecture, indiquer absence de données sur la tuile d'alerte
			updateWarningTile(null, '');
			updateAirWarningTile(null, '');
		}
	}

	// Chargement initial et rafraîchissement périodique (30s)
	setTimeout(loadSensorTiles, 200); // petit délai pour laisser l'UI se monter
	setInterval(() => {
		if(document.visibilityState === 'visible') loadSensorTiles();
	}, 30000);

})(window);

/* Basic tests (unchanged logic) */
function runBasicTests(){
	const out = [];
	const grid = document.getElementById('dashboard');
	const style = getComputedStyle(grid);
	const cols = style.gridTemplateColumns ? style.gridTemplateColumns.split(' ').length : 1;
	const w = window.innerWidth;
	let expected;
	if(w >= 1200) expected = 4;
	else if(w >= 992) expected = 3;
	else if(w >= 768) expected = 2;
	else expected = 1;

	out.push('viewport='+w+'px → columns detected='+cols+' expected='+expected+' → '+(cols===expected?'PASS':'FAIL'));

	const tileCount = document.querySelectorAll('.tile').length;
	out.push('tiles present: ' + tileCount + ' (expect >= 8) → ' + (tileCount >= 8 ? 'PASS' : 'FAIL'));

	const hasGridRole = grid.getAttribute('role') === 'grid';
	out.push('grid role attribute → ' + (hasGridRole ? 'PASS' : 'FAIL'));

	const gridcells = document.querySelectorAll('.tile[role="gridcell"]').length;
	out.push('gridcell roles on tiles: ' + gridcells + ' → ' + (gridcells === tileCount ? 'PASS' : 'FAIL'));

	document.getElementById('test-output').textContent = out.join('\n');
	return out;
}

document.getElementById('run-tests').addEventListener('click', runBasicTests);

// helper: gradient bleu -> rouge selon position de la valeur entre min/max
function gradientForValue(val, min, max){
	if(val === null || val === undefined || isNaN(val)) return 'linear-gradient(90deg,#ddd 0%,#ddd 100%)';
	const pct = Math.round(100 * (Math.max(min, Math.min(max, val)) - min) / Math.max(1, (max - min)));
	// left = cold (blue), right = hot (red)
	return `linear-gradient(90deg,#007bff 0%,#007bff ${pct}%,#ff3b3b ${pct}%,#ff3b3b 100%)`;
}

// helper: gradient avec 3 zones (froid / normal / chaud) selon seuils coldThreshold / hotThreshold
function zonesGradientForValue(val, min, max, coldThreshold, hotThreshold){
	// sécuriser bornes
	const mmMin = Number(min), mmMax = Number(max);
	const ct = Math.max(mmMin, Math.min(mmMax, Number(coldThreshold)));
	const ht = Math.max(mmMin, Math.min(mmMax, Number(hotThreshold)));
	const v = (val === null || val === undefined || isNaN(val)) ? mmMin : Number(val);
	// convertir en pourcentages
	const pct = x => Math.round(100 * (Math.max(mmMin, Math.min(mmMax, x)) - mmMin) / Math.max(1, (mmMax - mmMin)));
	const pCt = pct(ct);
	const pHt = pct(ht);
	// garantir ordre
	const left = Math.min(pCt, pHt), right = Math.max(pCt, pHt);
	// couleurs : bleu (froid), vert (normal), rouge (chaud)
	return `linear-gradient(90deg,#007bff 0%,#007bff ${left}%,#28a745 ${left}%,#28a745 ${right}%,#ff3b3b ${right}%,#ff3b3b 100%)`;
}

// helper: retourne la zone textuelle selon thresholds
function zoneLabelForValue(val, coldThreshold, hotThreshold){
	if(val === null || val === undefined || isNaN(val)) return 'No data';
	const v = Number(val);
	if(v <= coldThreshold) return 'Trop froid';
	if(v >= hotThreshold) return 'Trop chaud';
	return 'Normal';
}

// --- new: ergo iframe tile + notes tile + message listener ---

// 1) iframe tile that loads index_ergo.html
registerTile({
	id: 'ergo-iframe',
	title: 'Ergo UI',
	icon: '⌨',
	size: '4x5',
	mount(api){
		const iframe = document.createElement('iframe');
		iframe.src = '/index_ergo.html';
		iframe.style.border = '0';
		iframe.style.width = '100%';
		iframe.style.height = '100%';
		// ensure iframe is focusable inside tile
		iframe.setAttribute('aria-label','Ergo embedded UI');
		api.set(iframe);
	}
});

// 2) notes tile that will receive messages from the iframe
registerTile({
	id: 'section-notes',
	title: 'Notes',
	icon: '📝',
	size: '2x3',
	mount(api){
		const container = document.createElement('div');
		container.id = 'notes-list';
		container.style.display = 'flex';
		container.style.flexDirection = 'column';
		container.style.gap = '6px';
		container.innerHTML = '<div class="muted">Aucune note</div>';
		api.set(container);
	}
});

// 3) global listener for postMessage from embedded pages
window.addEventListener('message', (ev) => {
	try {
		const d = ev.data;
		if(!d || d.type !== 'note') return;
		const notesBody = document.querySelector('#section-notes .body #notes-list');
		if(!notesBody) return;
		// remove placeholder if present
		if(notesBody.children.length === 1 && notesBody.children[0].classList.contains('muted')) {
			notesBody.innerHTML = '';
		}
		const item = document.createElement('div');
		item.className = 'note-item';
		item.style.fontFamily = 'monospace';
		item.style.fontSize = '12px';
		item.style.color = 'var(--neon-cyan)';
		item.textContent = `[${new Date().toLocaleTimeString()}] ${String(d.text)}`;
		notesBody.insertBefore(item, notesBody.firstChild);
	} catch (e) {
		// silent
	}
});
