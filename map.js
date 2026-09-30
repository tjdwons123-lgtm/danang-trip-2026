(function () {
  let activeMap;

  const searchUrl = query => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  const stop = id => window.TRIP.mapStops[id];
  const placeAnchors = {
    '첫날 늦은 쌀국수':'hotel',
    '미꽝 또는 반쎄오':'cathedral',
    '호이안 저녁 식당':'hoian',
    '목식당 · MỘC Quán Seafood':'beach',
    '헬리오 먹거리':'helio',
    'SAILS AND SKEWERS':'beach',
    '여울 한식당':'han',
    '골목에서 쉬는 카페':'hoian',
    '바다를 보는 카페':'beach',
    '마사지 후 커피':'hotel',
    '콩카페 · Bạch Đằng':'han',
    'D 카페':'beach',
    '드래곤 마켓':'beach',
    '한시장 쇼핑 메모':'han',
    'Ohio Spa & Massage':'han'
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
      icon:L.divIcon({className:'', html:`<span class="map-marker ${variant}">${index}</span>`, iconSize:[36,36], iconAnchor:[18,18]})
    }).addTo(map);
    const safeName = location.name.replaceAll('&','&amp;').replaceAll('<','&lt;');
    marker.bindPopup(`<strong>${safeName}</strong><br>${detail}<br><a href="${searchUrl(location.query)}" target="_blank" rel="noopener noreferrer">Google 지도에서 확인 ↗</a>`);
    return marker;
  }

  function fit(map, ids) {
    const points = ids.map(id => stop(id)?.coordinates).filter(Boolean);
    if (!points.length) return;
    if (points.length === 1) map.setView(points[0], 14);
    else map.fitBounds(L.latLngBounds(points), {padding:[28,28], maxZoom:14});
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
      numberedMarker(map,stop(id),order,'route','오늘의 경유지');
    });
    (day.mapOptional || []).forEach(id => numberedMarker(map,stop(id),'☆','optional','체력이 남으면 들르는 선택 장소'));
    fit(map,[...new Set(ids),...(day.mapOptional || [])]);
    return true;
  }

  function focusRoute(area, dayIndex) {
    if (!activeMap) return;
    const ids = window.TRIP.days[dayIndex].mapRoute;
    if (area === 'danang') fit(activeMap,ids.filter(id => id !== 'hoian'));
    else if (area === 'hoian') fit(activeMap,['hoian']);
    else fit(activeMap,[...new Set(ids),...(window.TRIP.days[dayIndex].mapOptional || [])]);
  }

  function mountPlaces(type, dayFilter) {
    const map = create(document.getElementById('place-map'),[16.05,108.225],11);
    if (!map) return false;
    const places = window.TRIP.places.filter(place => place.type === type && (dayFilter === 'all' || place.day === Number(dayFilter)));
    const ids = [];
    places.forEach(place => {
      const id = placeAnchors[place.name];
      if (!id) return;
      ids.push(id);
    });
    [...new Set(ids)].forEach((id,index) => {
      const matches = places.filter(place => placeAnchors[place.name] === id);
      const place = matches[0];
      const location = {...stop(id),name:place.name,query:place.query};
      numberedMarker(map,location,index+1,'area',`${matches.map(match=>match.name).join(' · ')}<br>주변 지역만 표시 · 정확한 가게 핀 아님`);
    });
    fit(map,[...new Set(ids)]);
    return true;
  }

  window.tripMap = {dispose,mountRoute,mountPlaces,focusRoute};
}());
