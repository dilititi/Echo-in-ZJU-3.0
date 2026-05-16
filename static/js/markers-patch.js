/* ============================================================
   markers-patch.js — Field Journal marker overhaul
   Load AFTER markers.js. Re-decorates App with replacements for
   createBuildingMarker() and loadMarkers().

   Visual notes:
   - User-placed markers become hand-drawn ink teardrops on parchment,
     keeping the 5 type-colour cues (sport / club / memory / love / study)
     as an inked seal inside the pin. Emoji sits on top.
   - Building photos: sepia-tinted + 1.5px ink frame + italic name plate.
   ============================================================ */

(function () {
  if (typeof App === 'undefined') return;

  // Field Journal palette — matches --c-* CSS vars in main.css.
  // Read from computed style so dark/light mode is respected at pin creation time.
  function getTypeColor(type) {
    const varName = { study: '--c-study', love: '--c-love', sport: '--c-sport',
                      club: '--c-club',  memory: '--c-memory', sound: '--c-sound' }[type];
    if (!varName) return '#7a5230';
    const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return v || '#7a5230';
  }

  // English subtitles for building name plates (Field Journal "specimen label").
  // Falls back to Title Case of the buildingId key for any building not listed
  // (works because keys are snake_case English / pinyin already).
  const BUILDING_EN_OVERRIDES = {
    old_management_building:        'Library Bldg. C',
    qiushi_plaque:                  'Qiushi Plaque',
    qiushi_auditorium:              'Qiushi Hall',
    old_zju_gate:                   'ZJU West Gate',
    zju_gymnasium:                  'Gymnasium',
    zju_library:                    'Main Library',
    zju_crescent_building:          'Crescent Bldg.',
    south_gate:                     'South Gate',
    medical_college:                'Medical School',
    architectural_college:          'Architecture School',
    qizhen_hotel:                   'Qizhen Hotel',
    nanhua_garden:                  'Nanhua Garden',
    pharmacy_college:               'School of Pharmacy',
    life_science_college:           'Life Sciences',
    agricultural_college:           'Agriculture',
    environmental_resource_college: 'Env. & Resources',
    animal_science_college:         'Animal Science',
    bioengineering_food_college:    'Bioeng. & Food',
    nano_building:                  'Nano Bldg.',
    foreign_language_college:       'Foreign Languages',
    mengmingwei_building:           'Mengmingwei Bldg.',
    public_administration_college:  'Public Admin.',
    zhu_kezhen_college:             'Zhu Kezhen College',
    humanities_college:             'Humanities',
    education_college:              'Education School',
    art_archaeology_museum:         'Art & Archaeology'
  };
  const ACRONYM_UP = { zju: 'ZJU', cs: 'CS', it: 'IT' };
  function getBuildingEn(buildingId, building) {
    if (building && building.nameEn) return building.nameEn;
    if (BUILDING_EN_OVERRIDES[buildingId]) return BUILDING_EN_OVERRIDES[buildingId];
    if (!buildingId) return '';
    return buildingId.split('_').map(w =>
      ACRONYM_UP[w] || (w[0] ? w[0].toUpperCase() + w.slice(1) : w)
    ).join(' ');
  }

  function fjPinSVG({ color = '#b5573b', emoji = '📌', size = 44 } = {}) {
    const h = Math.round(size * 1.32);
    return `
      <div class="fj-pin" style="width:${size}px;height:${h}px;position:relative;">
        <svg viewBox="0 0 44 58" width="${size}" height="${h}"
             xmlns="http://www.w3.org/2000/svg" style="display:block;
             filter: drop-shadow(0 2px 3px rgba(42,35,23,.25));">
          <ellipse cx="22" cy="55" rx="7" ry="1.8" fill="rgba(42,35,23,.18)"/>
          <path d="M 22 3
                   C 32.5 3.2 40 11 40 21
                   C 40 30 32 39 22 52
                   C 12 39 4 30 4 21
                   C 4 11 11.5 2.8 22 3 Z"
                fill="#f5ead0"
                stroke="#2a2317"
                stroke-width="1.4"
                stroke-linejoin="round"/>
          <path d="M 22 6.5
                   C 30.5 6.7 37 13 37 21
                   C 37 29 29.5 37 22 48
                   C 14.5 37 7 29 7 21
                   C 7 13 13.5 6.3 22 6.5 Z"
                fill="none"
                stroke="#2a2317"
                stroke-width=".4"
                stroke-opacity=".4"/>
          <circle cx="22" cy="21" r="11.5" fill="${color}" opacity=".85"/>
          <circle cx="22" cy="21" r="11.5" fill="none"
                  stroke="#2a2317" stroke-width="1"/>
          <ellipse cx="18" cy="17" rx="3" ry="2" fill="#fff" opacity=".22"/>
        </svg>
        <span class="fj-pin-glyph" style="
              position:absolute; top:8px; left:0; right:0;
              text-align:center; font-size:${Math.round(size * 0.34)}px;
              line-height:${Math.round(size * 0.6)}px;
              pointer-events:none;
              filter: drop-shadow(0 1px 0 rgba(42,35,23,.4));
        ">${emoji}</span>
      </div>`;
  }

  App.createBuildingMarker = function (buildingId, building) {
    const SIZE = 110;
    const icon = L.divIcon({
      className: 'building-marker fj-building-marker',
      html: `
        <div class="fj-bm" style="
            width:${SIZE}px; height:${SIZE}px;
            position:relative; cursor:pointer;
            transition: transform .25s ease;
        ">
          <div style="
              position:absolute; inset:0;
              background:url('${building.image}') center/cover no-repeat;
              filter: sepia(.45) saturate(.7) contrast(.95);
              border:1.5px solid #2a2317;
              box-shadow:
                inset 0 0 0 3px #f5ead0,
                inset 0 0 0 4px #c4a878,
                0 3px 12px rgba(42,35,23,.18);
          "></div>
          <div style="
              position:absolute; left:-2px; bottom:-22px; right:-2px;
              text-align:center;
              background:#f5ead0;
              border:1px solid #2a2317;
              padding:2px 6px 3px;
              box-shadow:0 1px 4px rgba(42,35,23,.18);
          ">
            <div style="
                font-family:'Cormorant Garamond', serif;
                font-style:italic;
                font-size:12px;
                line-height:1.15;
                color:#2a2317;
                white-space:nowrap;
                overflow:hidden;
                text-overflow:ellipsis;
            ">${building.name || ''}</div>
            <div style="
                font-family:'Work Sans', system-ui, sans-serif;
                font-size:8.5px;
                font-weight:600;
                letter-spacing:1.3px;
                text-transform:uppercase;
                color:var(--gold,#b5573b);
                margin-top:1px;
                white-space:nowrap;
                overflow:hidden;
                text-overflow:ellipsis;
            ">${getBuildingEn(buildingId, building)}</div>
          </div>
        </div>`,
      iconSize: [SIZE, SIZE],
      iconAnchor: [SIZE / 2, SIZE / 2]
    });

    const marker = L.marker(building.position, { icon }).addTo(this.state.map);
    marker.buildingId = buildingId;
    marker.buildingData = building;

    marker.on('click', () => { this.showBuildingInfo(buildingId, building); });
    marker.on('mouseover', function () {
      const el = this.getElement().querySelector('.fj-bm');
      if (el) el.style.transform = 'scale(1.06) rotate(-1deg)';
    });
    marker.on('mouseout', function () {
      const el = this.getElement().querySelector('.fj-bm');
      if (el) el.style.transform = 'scale(1) rotate(0deg)';
    });

    this.state.buildingMarkers[buildingId] = marker;
  };

  App.loadMarkers = function () {
    try {
      const saved = localStorage.getItem('mapMarkers');
      if (!saved) return;
      const data = JSON.parse(saved);

      data.forEach(d => {
        const t = Data.markerTypes[d.type] || Data.markerTypes.memory;
        const SIZE = 44;
        const icon = L.divIcon({
          className: 'user-marker fj-user-marker',
          html: fjPinSVG({ color: getTypeColor(d.type || 'memory'), emoji: t.icon, size: SIZE }),
          iconSize: [SIZE, Math.round(SIZE * 1.32)],
          iconAnchor: [SIZE / 2, Math.round(SIZE * 1.32) - 2]
        });

        const marker = L.marker([d.lat, d.lng], {
          icon, draggable: true
        }).addTo(this.state.map);

        marker.markerData = {
          id: d.id || Date.now(),
          type: d.type || 'memory',
          audioData: d.audioData || null
        };

        marker.on('click', () => {
          const audioFile = this.state.markers.get(marker);
          if (audioFile && audioFile.url) {
            const tempButton = { textContent: '播放', dataset: { playing: 'false', url: audioFile.url }, style: {} };
            this.playAudio(audioFile.url, tempButton);
          }
          this.state.markers.forEach((_, m) => { if (m._icon) m._icon.style.filter = ''; });
          if (marker._icon) marker._icon.style.filter = 'drop-shadow(0 0 8px rgba(181,87,59,.85))';
          this.state.selectedMarker = marker;
        });

        marker.on('dragend', e => {
          marker.position = e.target.getLatLng();
          this.saveMarkers();
        });

        this.state.markers.set(marker, d.audioData || null);
        this.state.markerCount++;
      });
    } catch (err) {
      console.error('Failed to load markers:', err);
    }
  };

  App.fjPinSVG = fjPinSVG;
})();
