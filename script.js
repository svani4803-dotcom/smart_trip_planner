let map;
let routeLayer;
let stops = [];

// Load map
window.onload = function () {

  map = L.map('map').setView([15.3173, 75.7139], 7);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);

  map.on("click", function(e) {
    let lat = e.latlng.lat;
    let lon = e.latlng.lng;

    stops.push([lat, lon]);
    L.marker([lat, lon]).addTo(map).bindPopup("Stop");
  });
};

// Get coordinates
async function getCoords(place) {
  let res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${place}`);
  let data = await res.json();

  if (!data.length) throw new Error("Location not found");

  return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
}

// Distance formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  let R = 6371;
  let dLat = (lat2 - lat1) * Math.PI/180;
  let dLon = (lon2 - lon1) * Math.PI/180;

  let a =
    Math.sin(dLat/2)**2 +
    Math.cos(lat1*Math.PI/180) *
    Math.cos(lat2*Math.PI/180) *
    Math.sin(dLon/2)**2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Tourist places (dynamic + static)
async function showTouristPlaces(lat, lon, routeCoords) {

  const staticPlaces = [
    { name: "Jog Falls", lat: 14.2294, lon: 74.8080 },
    { name: "Chitradurga Fort", lat: 14.2266, lon: 76.4000 },
    { name: "Nandi Hills", lat: 13.3702, lon: 77.6835 },
    { name: "Shivagange Hill", lat: 13.1060, lon: 77.2270 },
    { name: "Bannerghatta Park", lat: 12.8000, lon: 77.5770 }
  ];

  let results = [];

  staticPlaces.forEach(place => {

    let minDist = Infinity;

    routeCoords.forEach(rc => {
      let d = calculateDistance(place.lat, place.lon, rc[0], rc[1]);
      if (d < minDist) minDist = d;
    });

    if (minDist < 120) {
      results.push({...place, distance: minDist});
    }
  });

  results.sort((a, b) => a.distance - b.distance);

  let html = "<h4>⭐ Best Stops Near Your Route</h4>";

  results.forEach(p => {

    html += `📍 ${p.name}<br>🚗 ${p.distance.toFixed(1)} km away<br><br>`;

    L.marker([p.lat, p.lon]).addTo(map)
      .bindPopup(`⭐ ${p.name}`);
  });

  document.getElementById("tourist").innerHTML =
    results.length ? html : "No tourist places found";
}

// Plan trip
async function planTrip() {

  let start = document.getElementById("start").value;
  let end = document.getElementById("end").value;
  let mileage = document.getElementById("mileage").value;
  let fuel = document.getElementById("fuel").value;

  let stopsCount = document.getElementById("stopsCount").value || 0;
  let hotel = document.getElementById("hotel").value || 0;
  let food = document.getElementById("food").value || 0;

  let startC = await getCoords(start);
  let endC = await getCoords(end);

  let url = `https://router.project-osrm.org/route/v1/driving/${startC[1]},${startC[0]};${endC[1]},${endC[0]}?overview=full&geometries=geojson`;

  let res = await fetch(url);
  let data = await res.json();

  let route = data.routes[0];
  let distance = route.distance / 1000;

  let fuelCost = (distance / mileage) * fuel;
  let stayCost = stopsCount * hotel;
  let foodCost = stopsCount * food;

  let total = fuelCost + stayCost + foodCost;

  document.getElementById("distance").innerText = distance.toFixed(2) + " km";
  document.getElementById("cost").innerText = "₹" + fuelCost.toFixed(2);
  document.getElementById("total").innerText = "₹" + total.toFixed(2);

  document.getElementById("breakdown").innerHTML =
    `⛽ Fuel: ₹${fuelCost.toFixed(0)} <br>
     🏨 Stay: ₹${stayCost} <br>
     🍽️ Food: ₹${foodCost}`;

  if (routeLayer) map.removeLayer(routeLayer);

  let coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
  routeLayer = L.polyline(coords, { color: 'blue' }).addTo(map);

  map.fitBounds(routeLayer.getBounds());

  showTouristPlaces(startC[0], startC[1], coords);
}

// Map stops
function addStopFromMap() {
  alert("Click on map to add stops");
}

// Dark mode
function toggleMode() {
  document.body.classList.toggle("light");

  if (document.body.classList.contains("light")) {
    document.body.style.background = "#f5f5f5";
    document.body.style.color = "black";
  } else {
    document.body.style.background = "";
    document.body.style.color = "white";
  }
}