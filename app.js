const trip = window.TRIP;
const main = document.getElementById('main');
const icons = {
  home:'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',
  calendar:'M5 5h14a2 2 0 0 1 2 2v13H3V7a2 2 0 0 1 2-2ZM7 3v4m10-4v4M3 11h18M7 15h2m6 0h2m-10 3h2',
  pin:'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  wallet:'M3 6h16v15H3V6Zm0 0 14-3v3m-3 6h7v5h-7z',
  info:'M12 8h.01M11 12h1v5m9-5a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  flight:'m3 14 7-3V4c0-2 4-2 4 0v7l7 3v2l-7-1v4l2 2H8l2-2v-4l-7 1z',
  hotel:'M4 21V4h16v17M2 21h20M8 8h2m4 0h2M8 12h2m4 0h2m-6 9v-5h4v5',
  food:'M5 3v6m3-6v6M5 6H2V3m0 3v3a3 3 0 0 0 6 0M5 12v9M19 3c-5 2-5 10 0 10V3Zm0 10v8',
  walk:'M14 4h.01M12 8l4 5h4M12 8l-3 7-5 6m5-6 7 2 2 4M12 8l-5 2-2 4',
  car:'m4 9 2-5h12l2 5M3 9h18v9H3V9Zm2 9v3m14-3v3M6 13h2m8 0h2',
  shop:'M4 7h16l1 14H3L4 7Zm4 0V5a4 4 0 0 1 8 0v2',
  spa:'M12 21C0 18 1 8 1 8s7 0 11 9c4-9 11-9 11-9s1 10-11 13ZM12 15C7 9 9 4 12 1c3 3 5 8 0 14',
  beach:'M2 18q3-3 6 0t6 0 6 0M2 22q3-3 6 0t6 0 6 0M6 14 10 5m-7 0q7-7 14 6L3 5Zm7 0 2-3',
  coffee:'M4 4h12v9a6 6 0 0 1-12 0V4Zm12 1h2a3 3 0 0 1 0 6h-2M2 22h18'
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[name] || icons.pin}"/></svg>`;
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const searchUrl = query => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
const external = (url, label, className = 'button') => `<a class="${className}" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
const storeKey = 'ddip-danang-2026-v1';
let storageAvailable = true;
let saved = {};
try { saved = JSON.parse(localStorage.getItem(storeKey) || '{}') || {}; } catch { storageAvailable = false; }
if (typeof saved !== 'object' || Array.isArray(saved)) saved = {};
let selectedDay = Math.max(0, trip.days.findIndex(day => day.date === new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())));
let placeType = 'food';
let placeDay = 'all';
let installPrompt;
let toastTimer;
const navItems = [['home','home','홈'],['schedule','calendar','일정'],['places','pin','장소'],['budget','wallet','예산'],['info','info','정보']];
function toast(message) {
  const target = document.getElementById('toast');
  target.textContent = message;
  target.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => target.classList.remove('show'), 2800);
}
function persist() {
  try { localStorage.setItem(storeKey, JSON.stringify(saved)); return true; }
  catch { storageAvailable = false; toast('저장할 수 없어요. 브라우저 저장 공간 설정을 확인해주세요.'); return false; }
}
function pageHead(kicker, title, description) {
  return `<div class="page-head"><p class="eyebrow">${kicker}</p><h1>${title}</h1><p>${description}</p></div>`;
}
function routeUrl(stops) {
  const params = new URLSearchParams({api:'1',origin:stops[0][1],destination:stops.at(-1)[1],travelmode:'driving'});
  if(stops.length > 2) params.set('waypoints',stops.slice(1,-1).map(stop=>stop[1]).join('|'));
  return `https://www.google.com/maps/dir/?${params}`;
}
function routeCard(day) {
  const middle = Math.min(3, day.route.length-1);
  const segments = day.route.length > 4 ? [day.route.slice(0,middle+1),day.route.slice(middle)] : [day.route];
  return `<section class="route-card"><h3>오늘의 이동 경로</h3><p class="small">핀을 누르면 장소 정보가 열려요. 선은 방문 순서이며 실제 도로 경로는 아니에요.</p><div id="route-map" class="trip-map" role="region" aria-label="${day.label} 여행 경로 지도"><div class="map-loading">지도를 불러오는 중이에요.</div></div><div class="map-focus"><button class="chip" data-map-focus="all">전체</button><button class="chip" data-map-focus="danang">다낭 확대</button>${day.date === '2026-10-02' ? '<button class="chip" data-map-focus="pho">퍼꾸 하노이 핀</button>' : ''}${day.date === '2026-10-03' ? '<button class="chip" data-map-focus="hoian">호이안 확대</button>' : ''}${day.date !== '2026-10-02' ? `<button class="chip" data-map-focus="spa">${day.date === '2026-10-03' ? '화이트 오키드 핀' : '콩스파 후보 핀'}</button>` : ''}</div><div class="route-diagram">${day.route.map((stop,index)=>`<a class="route-stop" href="${searchUrl(stop[1])}" target="_blank" rel="noopener noreferrer"><span>${index+1}</span>${stop[0]}</a>`).join('')}</div><div class="route-actions">${segments.map((segment,index)=>external(routeUrl(segment),segments.length === 1 ? 'Google 지도 길찾기' : `${index === 0 ? '전반' : '후반'} 길찾기`,'button soft')).join('')}</div><p class="small map-footnote">${day.date === '2026-10-02' ? '퍼꾸 하노이 05 Trần Quốc Toản에 개별 핀을 표시했어요. 용다리는 체력이 남을 때만 들르는 선택 장소예요.' : day.date === '2026-10-03' ? '우베베·미스리 카페 22·일본교·야시장을 각각 표시했어요. 야시장 핀은 픽업 기준점이며 정확한 만남 장소는 예약 메시지로 확인하세요.' : '목식당은 26 Tô Hiến Thành에 개별 핀, 콩스파는 80 Trần Phú 후보 지점으로 표시했어요. 실제 마사지 지점을 확인해주세요.'}</p></section>`;
}
function homeView() {
  const day = trip.days[selectedDay];
  const daysLeft = Math.ceil((Date.UTC(2026,9,2) - Date.parse(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())+'T00:00:00Z'))/86400000);
  const countLabel = daysLeft > 0 ? `D−${daysLeft}` : daysLeft >= -2 ? '여행 중' : '여행 기록';
  return `<details class="install"><summary>홈 화면에 추가하고, 앱처럼 열어보세요</summary><p>아이폰: Safari 공유 → 홈 화면에 추가<br>안드로이드: Chrome 메뉴 → 홈 화면에 추가 또는 앱 설치</p><p>설치한 아이콘으로 열면 주소창 없이 사용할 수 있어요. 설치는 HTTPS로 배포된 주소에서 지원됩니다. 로그인은 필요 없어요.</p>${installPrompt ? '<button class="button primary" id="install-button">앱 설치</button>' : ''}</details>
  <div class="home-grid"><section class="hero"><img src="${trip.photo}" alt="호이안의 여행 풍경" fetchpriority="high" onerror="this.hidden=true"><a class="hero-credit" href="${trip.photoSource}" target="_blank" rel="noopener noreferrer">사진 · Vietnam Tourism</a><p class="eyebrow">Da Nang & Hoi An · ${countLabel}</p><h1>우리 둘의<br>다낭 일지.</h1><p>서두르지 말고, 좋아하는 것들로.</p><div class="hero-meta"><span>10.02 — 10.04</span><span>2박 3일</span><span>커플 2명</span></div></section>
  <div class="stack"><section class="panel"><div class="next-header"><span class="eyebrow" style="margin:0;color:var(--green)">여행의 한 장면</span><span class="tag">DAY ${selectedDay+1}</span></div><h2 class="next-title">${day.short}</h2><p class="small">${day.label} ${day.weekday} · ${day.description}</p><a class="button primary full" href="#schedule/${selectedDay}">하루 일정 펼쳐보기</a></section><section class="panel hotel"><div class="hotel-icon">${icon('hotel')}</div><div><h3>Val Soleil Hotel</h3><p>186 Trần Phú, 다낭<br>우리 여행의 시작과 끝</p>${external(searchUrl(trip.hotel),'숙소 지도','text-link')}</div></section></div></div>
  <div class="section-heading"><h2>세 날의 여행</h2><span class="small">모든 시간은 베트남 현지 기준</span></div><div class="day-cards">${trip.days.map((item,index)=>`<a class="day-card" href="#schedule/${index}"><span class="tag">DAY 0${index+1}</span><div class="date">${item.label}<span>${item.weekday}</span></div><h3>${item.short}</h3><p>${item.tags.join(' · ')}</p><span class="tiny">일정 보기 ↗</span></a>`).join('')}</div>
  <div class="section-heading"><h2>시간을 비워둔 두 번의 쉼</h2><a class="text-link" href="#places/spa">마사지 정보</a></div><div class="places-grid">${trip.places.filter(place=>place.type==='spa').map(placeCard).join('')}</div><p class="source-note">사용자가 정리한 계획 기반 · 예약 완료와 운영 여부는 별도 확인<br>오행산 · 코코넛배 제외 / 무리한 관광보다 먹거리와 휴식</p>`;
}
function scheduleView() {
  const day = trip.days[selectedDay];
  return `${pageHead('Our itinerary','하루에 하나씩, 충분히','확정한 시간은 지키고, 나머지는 느긋하게.')}
  <div class="date-tabs" role="group" aria-label="여행 날짜">${trip.days.map((item,index)=>`<button class="date-tab ${selectedDay===index?'active':''}" data-day="${index}" aria-pressed="${selectedDay===index}"><strong>${item.label} <span>${item.weekday.slice(0,1)}</span></strong><span>${item.short}</span></button>`).join('')}</div>
  <div class="schedule-title"><h2>${day.title}</h2><div class="tags">${day.tags.map(tag=>`<span class="tag">${tag}</span>`).join('')}</div></div>
  <div class="schedule-grid"><section class="timeline" aria-label="${day.label} 상세 일정">${day.events.map(event=>`<article class="event"><div class="event-icon">${icon(event[3])}</div><div><span class="event-time">${event[0]}</span><h3>${event[1]}</h3><p>${event[2]}</p><div class="event-links">${event[4]?`<span class="tag ${/미확인|미정|주의/.test(event[4])?'orange':''}">${event[4]}</span>`:''}${event[5]?external(searchUrl(event[5]),'지도 열기 ↗','text-link'):''}</div></div></article>`).join('')}</section>
  <aside class="stack sticky">${routeCard(day)}<div class="notice"><strong>이 시간만 기억해요</strong>${day.warning}</div><details class="notice rain"><summary>비가 오면 이렇게</summary><p style="margin:12px 0 0">${day.rain}</p><p class="small" style="margin:10px 0 0">실시간 예보가 아닌 대체 계획입니다.</p></details><a href="#places/day-${selectedDay}" class="button">이날의 식사 · 카페 보기</a></aside></div>`;
}
function placeCard(place) {
  return `<article class="panel place-card"><div class="next-header"><span class="tag">10.${String(place.day+2).padStart(2,'0')}</span>${icon(place.type==='cafe'?'coffee':place.type)}</div><h3>${place.name}</h3><span class="area">${place.area}</span><span class="small">${place.status}</span><p>${place.description}</p><div class="button-row">${external(place.mapUrl||searchUrl(place.query),place.status==='가게 미정'?'주변 후보 지도 검색':'위치 검색','button soft')}${place.website?external(place.website,'공식 사이트','button'):''}${place.bookingUrl?external(place.bookingUrl,'공식 예약','button'):''}${place.kakaoUrl?external(place.kakaoUrl,'카카오 문의','button soft'):''}</div></article>`;
}
function placesView() {
  const places = trip.places.filter(place=>place.type===placeType&&(placeDay==='all'||place.day===Number(placeDay)));
  return `${pageHead('Places to remember','먹고, 쉬고, 머무는 곳','저장한 게시물에서 고른 가게와 방문 후보를 날짜별로 모았어요.')}
  <div class="tabs" role="group" aria-label="장소 종류">${[['food','음식점'],['cafe','카페'],['shop','쇼핑'],['spa','마사지']].map(([key,label])=>`<button class="chip ${key===placeType?'active':''}" data-type="${key}" aria-pressed="${key===placeType}">${label}</button>`).join('')}</div>
  <div class="tabs" role="group" aria-label="장소 날짜">${[['all','전체'],['0','10/2 금'],['1','10/3 토'],['2','10/4 일']].map(([key,label])=>`<button class="chip ${key===placeDay?'active':''}" data-place-day="${key}" aria-pressed="${key===placeDay}">${label}</button>`).join('')}</div>
  <div class="notice" style="margin-bottom:20px">${placeType==='spa'?'화이트 오키드는 호이안 15 Mạc Đĩnh Chi에, Cong Spa는 다낭 80 Trần Phú 후보 지점에 핀을 표시했어요. 야시장 픽업 위치와 콩스파 실제 지점은 예약 메시지로 확인하세요.':'주소가 확인된 가게는 개별 핀, 가게가 미정인 후보는 주변 지역 핀으로 표시했어요. 영업시간은 방문 전에 다시 확인하세요.'}</div>
  <div class="places-grid">${places.length?places.map(placeCard).join(''):'<div class="panel empty">이날은 등록된 장소가 없어요.<br>전체 날짜에서 다른 후보를 살펴보세요.</div>'}</div>
  <section class="panel map-box"><h3>${placeType==='food'?'식사':placeType==='cafe'?'카페':placeType==='shop'?'쇼핑':'마사지'} 위치 보기</h3><p class="small">번호는 위 카드 순서예요. 연한 핀은 지역 후보, 테두리 핀은 지점 미확정입니다.</p><div id="place-map" class="trip-map" role="region" aria-label="방문 후보 지역 지도"><div class="map-loading">지도를 불러오는 중이에요.</div></div><p class="small map-footnote">정확한 출입구와 예약 지점은 카드의 위치 검색에서 다시 확인하세요.</p></section>`;
}
const budgetCategories = [['food','식사 · 간식'],['cafe','카페'],['spa','마사지 2회'],['transport','Grab · 교통'],['activities','입장 · 체험'],['shopping','쇼핑 · 기타']];
function safeAmount(value) { const number = Number(value); return Number.isFinite(number)&&number>=0&&number<=1e12?number:0; }
function budgetView() {
  const amounts = saved.amounts && typeof saved.amounts==='object' ? saved.amounts : {};
  return `${pageHead('Personal budget','나는 얼마나 쓸까?','공금 정산 없이, 두 사람의 현지 예상 지출만 가볍게.')}
  <div class="budget-grid"><section class="panel"><h2>2명 합계로 입력하세요</h2><p class="small">베트남 동(VND) 기준 · 미입력은 0으로 계산<br>항공권·숙박비 제외 / 아직 업체 견적은 반영하지 않았어요.</p><form id="budget-form">${budgetCategories.map(([key,label])=>`<div class="amount-row"><label for="amount-${key}">${label}</label><input id="amount-${key}" name="${key}" type="number" inputmode="numeric" min="0" max="1000000000000" step="1000" placeholder="미입력" value="${amounts[key]===undefined?'':safeAmount(amounts[key])}" aria-label="${label} 두 명 합계 VND"></div>`).join('')}<label class="field">1,000 VND당 원화 환율<input id="exchange-rate" type="number" inputmode="decimal" min="0.01" max="100000" step="0.01" placeholder="직접 입력 · 실시간 환율 아님" value="${safeAmount(saved.rate)||''}"></label><p class="small">환전 영수증이나 카드 적용 환율을 입력하세요. 입력값은 이 기기에만 저장됩니다.</p></form></section>
  <aside class="stack"><section class="budget-total" aria-live="polite"><span class="eyebrow">1인 예상 지출</span><div id="per-person" class="number"></div><p id="per-person-krw"></p><div class="summary-line"><span>2명 합계</span><strong id="both-total"></strong></div><p id="budget-status" class="small"></p></section><section class="panel"><h3>현금과 카드, 함께</h3><p class="small">현재 계획: 두 사람 합계 현금 약 30–40만원 상당 VND + 트래블카드. 확정 예산이나 충분함을 보장하는 금액은 아니에요.</p><p class="small">시장·노점·소규모 가게는 현금을 준비하고, Grab·카드 가능한 곳은 카드로. 마사지 결제 수단은 예약할 때 확인하세요.</p><button id="reset-budget" class="button">예산 입력 초기화</button></section></aside></div>`;
}
function updateBudget() {
  const amounts = saved.amounts || {};
  const total = budgetCategories.reduce((sum,[key])=>sum+safeAmount(amounts[key]),0);
  const formatter = new Intl.NumberFormat('ko-KR',{maximumFractionDigits:0});
  document.getElementById('per-person').textContent = `${formatter.format(total/2)} ₫`;
  document.getElementById('both-total').textContent = `${formatter.format(total)} ₫`;
  document.getElementById('per-person-krw').textContent = safeAmount(saved.rate) ? `약 ${formatter.format(total/2/1000*safeAmount(saved.rate))}원 · 입력 환율 기준` : '환율을 입력하면 원화로도 보여드려요.';
  document.getElementById('budget-status').textContent = total ? '미입력 항목은 포함하지 않은 예상 금액입니다.' : '금액을 입력하기 전이에요. 무료 여행비를 뜻하지 않아요.';
}
function infoView() {
  return `${pageHead('Travel essentials','필요할 때, 여기서','주소와 예약 메모, 여행 전에 확인할 정보들.')}
  <section class="panel post-digest"><h2>보내준 게시물 5개 정리</h2><p class="small">원문을 열지 않아도 여행에 필요한 내용을 읽을 수 있게 정리했어요.</p><div class="post-grid">${trip.savedPosts.map(post=>`<article class="post-item"><span class="tag">${post.kind}</span><h3>${post.title}</h3><p>${post.summary}</p><ul>${post.details.map(detail=>`<li>${detail}</li>`).join('')}</ul><p class="post-note">${post.note}</p>${post.links.length?`<div class="button-row">${post.links.map(([label,url])=>external(url,label,'text-link')).join('')}</div>`:''}</article>`).join('')}</div></section>
  <div class="info-grid"><section class="panel"><h2>입국 신고 바로가기</h2><p class="small">PAI 작성과 공식 안내를 여기서 열 수 있어요. 위 입국 정보 요약과 함께 확인하세요.</p><div class="button-row">${external('https://prearrival.immigration.gov.vn/','공식 PAI 작성','button primary')}${external('https://vnembassy-singapore.mofa.gov.vn/en/tin-chi-tiet/chi-tiet/notice-on-viet-nam-39-s-pre-arrival-information-declaration-60731-1390.html','대사관 안내','text-link')}${external('https://www.khanhhoa.gov.vn/vi/tin-noi-bat-danh-cho-cong-dan/bo-y-te-thong-tin-quy-dinh-khai-bao-y-te-khi-xuat-nhap-canh-tu-ngay-1-7','보건부 설명','text-link')}</div></section>
  <section class="panel"><h2>우리 숙소</h2><address><strong>Val Soleil Hotel</strong><br>186 Trần Phú, Da Nang<br>2명 · 2026.10.02–10.04</address><p class="small">늦은 체크인 / 마지막 날 짐 보관 / 해변 후 샤워 가능 여부는 호텔에 확인하세요.</p><div class="button-row">${external(searchUrl(trip.hotel),'숙소 지도')}<button class="button" id="copy-hotel">주소 복사</button></div></section>
  <section class="panel"><h2>비행기와 시간</h2><ul class="info-list"><li>10/2 21:30 다낭 도착</li><li>10/4 23:00 다낭 출국</li><li>모든 일정은 베트남 현지 시각<br>한국보다 2시간 느려요.</li><li>항공편명·체크인 마감은 아직 미입력</li><li>귀국일 21:00 공항 도착 목표<br>항공사 권장 도착시간 확인 후 조정</li></ul></section>
  <section class="panel"><h2>마사지 예약 메모</h2><ul class="info-list"><li>10/3 화이트 오키드 · 호이안 19:30 예약<br>19:10 야시장 근처 픽업 · 15 Mạc Đĩnh Chi</li><li>픽업 정확한 지점·코스·종료 시각·다낭 복귀 차량 확인 필요</li><li>10/4 Cong Spa · 15:30–17:00 · 90분<br>정확한 지점·주소와 예약 완료 여부 확인 필요</li><li>2명 같은 룸 확약은 예약 메시지로 확인하세요.</li></ul><div class="button-row">${external('https://whiteorchidspahoian.com/','화이트 오키드 공식 사이트','button soft')}</div><p class="small">문의 문구</p><p class="small" lang="en">We are two guests. Please confirm the exact 19:10 pickup point near Hoi An Night Market, massage duration, same room, and transport back to Da Nang.</p></section>
  <section class="panel"><h2>가볍게 챙길 것</h2><ul class="info-list"><li>여권 · 항공권 · 숙소 예약 내역</li><li>카드 · 엔화가 아닌 베트남 동 현금</li><li>우산/우비 · 보조배터리 · 방수 파우치</li><li>수영복 · 갈아입을 옷 · 자외선차단제</li><li>마사지·차량 예약 확인 화면</li></ul></section>
  <section class="panel"><h2>날씨가 바뀌면</h2><p class="small">우천 대안은 일정 탭에 있어요. 이 앱은 실시간 예보를 표시하지 않습니다. 호이안 침수·바다 안전 안내·현지 기상을 출발 전 확인하세요.</p>${external('https://nchmf.gov.vn/','베트남 기상청 확인','button soft')}<p class="small" style="margin-top:14px">헬리오 B.Fair·게임·먹거리의 해당일 운영과 영업시간은 미확인입니다.</p></section>
  <section class="panel"><h2>우리만의 메모</h2><label class="field" for="trip-note">예약 확인이나 생각나는 것<textarea id="trip-note" maxlength="4000" placeholder="예: 콩스파 지점 확인, 호텔에 짐 보관 문의">${escapeHtml(saved.note||'')}</textarea></label><button class="button primary" id="save-note">이 기기에 저장</button><p class="small" style="margin-top:12px">이 브라우저에만 저장돼요. 다른 사람과 자동 동기화되지 않으므로 여권번호·카드정보는 적지 마세요.</p></section>
  <section class="panel"><h2>앱 사용 안내</h2><p class="small">로그인 없이 이용합니다. HTTPS 주소에서 홈 화면에 추가하면 앱처럼 열 수 있어요. 한 번 온라인으로 연 일정은 오프라인에서도 확인할 수 있지만 사진·외부 지도는 인터넷이 필요합니다.</p><p id="offline-status" class="small">${navigator.serviceWorker?.controller?'오프라인 일정 사용 가능':'오프라인 준비 상태 확인 중'}</p><p class="small">공유 주소로 열어도 메모·예산은 기기별로 따로 저장됩니다.</p><span class="connection">${navigator.onLine?'온라인':'오프라인'}</span></section>
  <section class="panel"><h2>정보의 기준</h2><p class="small">2026.09.30 전달받은 여행 계획과 공유한 게시물을 반영했습니다. 식당·카페 추천 메뉴, 예약 상태, 특정 날짜의 영업은 방문 전 확인하세요. 특히 2024년 한시장 가격표는 현재 가격으로 사용하지 않습니다.</p>${external(trip.photoSource,'사진 출처 · Vietnam Tourism','text-link')}</section></div>`;
}
function render() {
  window.tripMap?.dispose();
  const [rawPage,detail] = location.hash.slice(1).split('/');
  const page = navItems.some(item=>item[0]===rawPage) ? rawPage : 'home';
  if(page==='schedule'&&/^[0-2]$/.test(detail||'')) selectedDay=Number(detail);
  if(page==='places'&&['food','cafe','shop','spa'].includes(detail)) { placeType=detail; placeDay='all'; }
  if(page==='places'&&/^day-[0-2]$/.test(detail||'')) { placeDay=detail.slice(-1); }
  document.querySelector('.bottom-nav').innerHTML=navItems.map(([key,symbol,label])=>`<a class="nav-item ${page===key?'active':''}" href="#${key}" ${page===key?'aria-current="page"':''}>${icon(symbol)}<span>${label}</span></a>`).join('');
  const views={home:homeView,schedule:scheduleView,places:placesView,budget:budgetView,info:infoView};
  main.innerHTML=views[page]();
  main.classList.remove('reveal');
  void main.offsetWidth;
  main.classList.add('reveal');
  document.title=`${navItems.find(item=>item[0]===page)[2]} · ${trip.title}`;
  if(page==='budget') updateBudget();
  if(page==='schedule'&&!window.tripMap?.mountRoute(selectedDay)) showMapFallback('route-map');
  if(page==='places'&&!window.tripMap?.mountPlaces(placeType,placeDay)) showMapFallback('place-map');
  if(!storageAvailable&&['budget','info'].includes(page)) toast('브라우저 저장을 사용할 수 없어 기기에 보관되지 않을 수 있어요.');
  if(page==='info') updateOfflineStatus();
}
function showMapFallback(id) {
  const target=document.getElementById(id);
  if(target)target.innerHTML='<div class="map-loading">지도를 표시할 수 없어요. 아래 장소·길찾기 링크를 이용해주세요.</div>';
}
function updateOfflineStatus() {
  if(!('serviceWorker' in navigator)) { const node=document.getElementById('offline-status'); if(node)node.textContent='이 브라우저에서는 오프라인 준비를 지원하지 않아요.';return; }
  navigator.serviceWorker.getRegistration().then(registration=>{const node=document.getElementById('offline-status');if(node)node.textContent=registration?.active?'오프라인 일정 준비 완료':'오프라인 준비 전 · HTTPS 또는 localhost에서 접속해주세요.';}).catch(()=>{});
}
main.addEventListener('click',async event=>{
  const button=event.target.closest('button');
  if(!button)return;
  if(button.dataset.day!==undefined){location.hash=`schedule/${button.dataset.day}`;return;}
  if(button.dataset.mapFocus){window.tripMap?.focusRoute(button.dataset.mapFocus,selectedDay);return;}
  if(button.dataset.type){placeType=button.dataset.type;history.replaceState(null,'','#places');render();return;}
  if(button.dataset.placeDay){placeDay=button.dataset.placeDay;history.replaceState(null,'','#places');render();return;}
  if(button.id==='save-note'){saved.note=document.getElementById('trip-note').value;if(persist())toast('이 기기에 메모를 저장했어요.');}
  if(button.id==='copy-hotel'){try{await navigator.clipboard.writeText(trip.hotel);toast('숙소 주소를 복사했어요.');}catch{toast('자동 복사가 안 돼요. 화면의 주소를 길게 눌러 복사해주세요.');}}
  if(button.id==='reset-budget'&&confirm('이 기기에 입력한 예산과 환율을 초기화할까요?')){saved.amounts={};saved.rate='';persist();render();}
  if(button.id==='install-button'&&installPrompt){await installPrompt.prompt();installPrompt=null;button.disabled=true;button.textContent='브라우저 설치 안내를 확인해주세요.';}
});
main.addEventListener('input',event=>{
  if(event.target.closest('#budget-form')){
    const target=event.target;
    if(!target.validity.valid){toast('0 이상의 올바른 금액을 입력해주세요.');return;}
    if(target.id==='exchange-rate')saved.rate=target.value;
    else{saved.amounts=saved.amounts||{};if(target.value==='')delete saved.amounts[target.name];else saved.amounts[target.name]=Number(target.value);}
    persist();updateBudget();
  }
});
window.addEventListener('hashchange',()=>{render();window.scrollTo({top:0,behavior:'instant'});main.focus({preventScroll:true});});
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;if(!location.hash||location.hash==='#home')render();});
window.addEventListener('offline',()=>toast('오프라인이에요. 지도와 외부 링크는 연결 후 이용해주세요.'));
window.addEventListener('online',()=>toast('인터넷에 다시 연결됐어요.'));
if('serviceWorker' in navigator&&['https:','http:'].includes(location.protocol)){
  const hadController=Boolean(navigator.serviceWorker.controller);
  if(hadController) navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});
  navigator.serviceWorker.register('./sw.js').then(registration=>{updateOfflineStatus();registration.update().catch(()=>{});}).catch(()=>{});
}
render();
