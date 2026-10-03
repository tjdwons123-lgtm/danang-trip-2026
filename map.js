(function () {
  let activeMap;

  const searchUrl = query => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  const stop = id => window.TRIP.mapStops[id];
  const placeAnchors = {
    '퍼꾸 하노이 · Phở Cù Hà Nội':'phoCu',
    '미꽝 또는 반쎄오':'cathedral',
    '미스리 카페 22 · Miss Ly':'missLy',
    '목식당 · MỘC Quán Seafood':'moc',
    '헬리오 먹거리':'helio',
    'SAILS AND SKEWERS':'sails',
    '여울 한식당':'yeoul',
    '우베베 호이안 · Ubebe':'ubebe',
    '바다를 보는 카페':'beach',
    '마사지 후 커피':'hotel',
    '콩카페 · Bạch Đằng':'congCafe',
    'D 카페':'dCafe',
    '드래곤 마켓':'dragonMarket',
    '한시장 쇼핑 메모':'han',
    '화이트 오키드 스파 · White Orchids Spa':'whiteOrchid',
    'Cong Spa':'congSpa'
  };

  function dispose() {
    if (activeMap) {
      activeMap.remove();
      activeMap = undefined;
    }
  }

  function create(target, center, zoom) {
    if (!window.L || !target) return null;
    dispose();
    target.replaceChildren();
    activeMap = L.map(target, {scrollWheelZoom:false, zoomControl:false, tap:false}).setView(center, zoom);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom:18,
      attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
    }).addTo(activeMap);
    L.control.zoom({position:'topright'}).addTo(activeMap);
    requestAnimationFrame(() => activeMap?.invalidateSize());
    return activeMap;
  }

  function numberedMarker(map, location, index, variant, detail) {
    const marker = L.marker(location.coordinates, {
      icon:L.divIcon({className:'', html:`<span class="map-marker ${variant}">${index}</span>`, iconSize:[36,36], iconAnchor:[18,18]}),
      zIndexOffset:location.priority || 0
    }).addTo(map);
    const safeName = location.name.replaceAll('&','&amp;').replaceAll('<','&lt;');
    marker.bindPopup(`<strong>${safeName}</strong><br>${detail}<br><a href="${searchUrl(location.query)}" target="_blank" rel="noopener noreferrer">Google 지도에서 확인 ↗</a>`);
    return marker;
  }

  function fit(map, ids, maxZoom = 14) {
    const points = ids.map(id => stop(id)?.coordinates).filter(Boolean);
    if (!points.length) return;
    if (points.length === 1) map.setView(points[0], Math.min(maxZoom,17));
    else map.fitBounds(L.latLngBounds(points), {padding:[28,28], maxZoom});
  }

  function mountRoute(dayIndex) {
    const day = window.TRIP.days[dayIndex];
    const map = create(document.getElementById('route-map'), [16.05,108.225], 12);
    if (!map) return false;
    const ids = day.mapRoute;
    const line = ids.map(id => stop(id).coordinates);
    L.polyline(line, {color:'#ffffff',weight:7,opacity:.9,interactive:false}).addTo(map);
    L.polyline(line, {color:dayIndex === 1 ? '#c96485' : '#a93f70',weight:3,opacity:.95,className:'map-route-line',interactive:false}).addTo(map);
    [...new Set(ids)].forEach(id => {
      const order = ids.flatMap((routeId,index) => routeId === id ? [index+1] : []).join('·');
      const location = stop(id);
      numberedMarker(map,location,order,location.candidate?'candidate':location.approximate?'area':'route',location.candidate?'후보 지점 · 예약한 위치 확인 필요':location.approximate?'가게 미정 · 주변 지역만 표시':'오늘의 경유지');
    });
    (day.mapOptional || []).forEach(id => numberedMarker(map,stop(id),'☆','optional','체력이 남으면 들르는 선택 장소'));
    fit(map,[...new Set(ids),...(day.mapOptional || [])]);
    return true;
  }

  function focusRoute(area, dayIndex) {
    if (!activeMap) return;
    const ids = window.TRIP.days[dayIndex].mapRoute;
    if (area === 'danang') fit(activeMap,ids.filter(id => !id.startsWith('hoian')));
    else if (area === 'pho') activeMap.setView(stop('phoCu').coordinates,17);
    else if (area === 'hoian') fit(activeMap,['hoian','ubebe','hoianBridge','missLy','hoianNight','whiteOrchid'],16);
    else if (area === 'spa') activeMap.setView(stop(dayIndex === 1 ? 'whiteOrchid' : 'congSpa').coordinates,17);
    else fit(activeMap,[...new Set(ids),...(window.TRIP.days[dayIndex].mapOptional || [])]);
  }

  function mountPlaces(type, dayFilter) {
    const map = create(document.getElementById('place-map'),[16.05,108.225],11);
    if (!map) return false;
    const places = window.TRIP.places.filter(place => place.type === type && (dayFilter === 'all' || place.day === Number(dayFilter)));
    const ids = places.map(place => {
      const id = placeAnchors[place.name];
      return id;
    }).filter(Boolean);
    places.forEach((place,index) => {
      const id = placeAnchors[place.name];
      if (!id) return;
      const location = {...stop(id),name:place.name,query:place.query};
      const approximate = place.status === '가게 미정' || place.name === '마사지 후 커피';
      const detail = location.candidate ? '후보 지점 · 실제 예약 위치 확인 필요' : approximate ? '장소 미정 · 주변 지역만 표시' : '주소 또는 지도 위치를 확인한 장소';
      numberedMarker(map,location,index+1,location.candidate?'candidate':approximate?'area':'route',detail);
    });
    fit(map,ids,type === 'spa' ? 18 : 14);
    return true;
  }

  window.tripMap = {dispose,mountRoute,mountPlaces,focusRoute};
}());
