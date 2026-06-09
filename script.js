const slides = Array.from(document.querySelectorAll(".slide"));
const slideNumber = document.getElementById("slideNumber");
let currentSlide = 0;
let siliconMap;

const params = {
  alpha: 0.35,
  labor: 10,
  baseA: 1,
  highA: 1.42,
  minK: 1,
  maxK: 18
};

function production(k, a = params.baseA) {
  return a * Math.pow(k, params.alpha) * Math.pow(params.labor, 1 - params.alpha);
}

function series(a) {
  return Array.from({ length: params.maxK }, (_, i) => {
    const k = i + 1;
    return { x: k, y: Number(production(k, a).toFixed(3)) };
  });
}

function marginal(k, a = params.baseA) {
  if (k <= params.minK) return production(k, a);
  return production(k, a) - production(k - 1, a);
}

function chartOptions(title) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 240 },
    interaction: { mode: "nearest", intersect: false },
    plugins: {
      legend: {
        labels: {
          color: "#dce7ea",
          boxWidth: 12,
          usePointStyle: true,
          font: { weight: "700" }
        }
      },
      tooltip: {
        backgroundColor: "#101821",
        titleColor: "#ffffff",
        bodyColor: "#dce7ea",
        borderColor: "rgba(255,255,255,.14)",
        borderWidth: 1
      },
      title: {
        display: Boolean(title),
        text: title,
        color: "#dce7ea",
        align: "start",
        font: { size: 15, weight: "700" }
      }
    },
    scales: {
      x: {
        type: "linear",
        min: 1,
        max: params.maxK,
        title: { display: true, text: "Machines / Capital (K)", color: "#9fb0b8" },
        ticks: { color: "#9fb0b8", stepSize: 2 },
        grid: { color: "rgba(255,255,255,.08)" }
      },
      y: {
        title: { display: true, text: "Output (Y)", color: "#9fb0b8" },
        ticks: { color: "#9fb0b8" },
        grid: { color: "rgba(255,255,255,.08)" }
      }
    }
  };
}

let techShiftChart;
let diminishingChart;
let techCompareChart;
let machineK = 5;
let compareK = 5;

function buildCharts() {
  techShiftChart = new Chart(document.getElementById("techShiftChart"), {
    type: "line",
    data: {
      datasets: [
        {
          label: "A",
          data: series(params.baseA),
          borderColor: "#2ed3b7",
          backgroundColor: "#2ed3b7",
          borderWidth: 4,
          hoverBorderWidth: 8,
          pointRadius: 0,
          tension: 0.32
        },
        {
          label: "A' (higher technology)",
          data: series(params.highA),
          borderColor: "#f5c04a",
          backgroundColor: "#f5c04a",
          borderWidth: 4,
          hoverBorderWidth: 8,
          pointRadius: 0,
          tension: 0.32
        }
      ]
    },
    options: chartOptions("Higher technology shifts the whole production function upward")
  });

  diminishingChart = new Chart(document.getElementById("diminishingChart"), {
    type: "line",
    data: {
      datasets: [
        {
          label: "Production function",
          data: series(params.baseA),
          borderColor: "#2ed3b7",
          backgroundColor: "#2ed3b7",
          borderWidth: 4,
          pointRadius: 0,
          tension: 0.32
        },
        movingPoint("Current output", "#f5c04a"),
        movingPoint("Previous output", "#ffffff"),
        incrementLine("#f5c04a")
      ]
    },
    options: chartOptions("Diminishing marginal product")
  });

  techCompareChart = new Chart(document.getElementById("techCompareChart"), {
    type: "line",
    data: {
      datasets: [
        curve("A", params.baseA, "#2ed3b7"),
        curve("A'", params.highA, "#f5c04a"),
        movingPoint("A current", "#2ed3b7"),
        movingPoint("A' current", "#f5c04a"),
        incrementLine("#2ed3b7", "A gain"),
        incrementLine("#f5c04a", "A' gain")
      ]
    },
    options: chartOptions("Innovation raises the return from the same extra machine")
  });

  updateDiminishing();
  updateCompare();
}

function curve(label, a, color) {
  return {
    label,
    data: series(a),
    borderColor: color,
    backgroundColor: color,
    borderWidth: 4,
    pointRadius: 0,
    tension: 0.32
  };
}

function movingPoint(label, color) {
  return {
    label,
    data: [],
    borderColor: color,
    backgroundColor: color,
    pointRadius: 7,
    pointHoverRadius: 9,
    showLine: false
  };
}

function incrementLine(color, label = "Output gain") {
  return {
    label,
    data: [],
    borderColor: color,
    backgroundColor: color,
    borderWidth: 5,
    pointRadius: 0,
    borderDash: [4, 4],
    showLine: true
  };
}

function updateFactory(containerId, count) {
  const floor = document.getElementById(containerId);
  floor.innerHTML = "";
  for (let i = 0; i < count; i += 1) {
    const machine = document.createElement("div");
    machine.className = "machine";
    floor.appendChild(machine);
  }
}

function updateDiminishing() {
  const y = production(machineK);
  const previousY = machineK > 1 ? production(machineK - 1) : 0;
  diminishingChart.data.datasets[1].data = [{ x: machineK, y }];
  diminishingChart.data.datasets[2].data = machineK > 1 ? [{ x: machineK - 1, y: previousY }] : [];
  diminishingChart.data.datasets[3].data = [{ x: machineK, y: previousY }, { x: machineK, y }];
  diminishingChart.update();

  document.getElementById("machineCount").textContent = machineK;
  document.getElementById("singleDelta").textContent = marginal(machineK).toFixed(2);
  updateFactory("machineFloor", machineK);
}

function updateCompare() {
  const baseY = production(compareK, params.baseA);
  const highY = production(compareK, params.highA);
  const basePrev = compareK > 1 ? production(compareK - 1, params.baseA) : 0;
  const highPrev = compareK > 1 ? production(compareK - 1, params.highA) : 0;

  techCompareChart.data.datasets[2].data = [{ x: compareK, y: baseY }];
  techCompareChart.data.datasets[3].data = [{ x: compareK, y: highY }];
  techCompareChart.data.datasets[4].data = [{ x: compareK, y: basePrev }, { x: compareK, y: baseY }];
  techCompareChart.data.datasets[5].data = [{ x: compareK + 0.35, y: highPrev }, { x: compareK + 0.35, y: highY }];
  techCompareChart.update();

  document.getElementById("machineCountCompare").textContent = compareK;
  document.getElementById("baseDelta").textContent = marginal(compareK, params.baseA).toFixed(2);
  document.getElementById("highDelta").textContent = marginal(compareK, params.highA).toFixed(2);
  updateFactory("machineFloorCompare", compareK);
}

function clampMachine(value) {
  return Math.max(params.minK, Math.min(params.maxK, value));
}

function bindInteractions() {
  document.getElementById("plusMachine").addEventListener("click", () => {
    machineK = clampMachine(machineK + 1);
    updateDiminishing();
  });
  document.getElementById("minusMachine").addEventListener("click", () => {
    machineK = clampMachine(machineK - 1);
    updateDiminishing();
  });
  document.getElementById("plusMachineCompare").addEventListener("click", () => {
    compareK = clampMachine(compareK + 1);
    updateCompare();
  });
  document.getElementById("minusMachineCompare").addEventListener("click", () => {
    compareK = clampMachine(compareK - 1);
    updateCompare();
  });
}

function showSlide(index) {
  currentSlide = (index + slides.length) % slides.length;
  slides.forEach((slide, i) => slide.classList.toggle("active", i === currentSlide));
  slideNumber.textContent = `${currentSlide + 1} / ${slides.length}`;
  if (currentSlide === 9) {
    initMap();
    setTimeout(() => siliconMap && siliconMap.invalidateSize(), 80);
  }
}

function initMap() {
  if (siliconMap || typeof L === "undefined") return;

  siliconMap = L.map("siliconMap", {
    zoomControl: false,
    attributionControl: false
  }).setView([37.3875, -122.0575], 10);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18
  }).addTo(siliconMap);

  L.control.zoom({ position: "bottomright" }).addTo(siliconMap);

  const cluster = [
    [37.4419, -122.1430, "Stanford"],
    [37.3861, -122.0839, "Mountain View"],
    [37.3382, -121.8863, "San Jose"],
    [37.4848, -122.2281, "Redwood City"],
    [37.5485, -121.9886, "Fremont"]
  ];

  cluster.forEach(([lat, lng, label]) => {
    L.circleMarker([lat, lng], {
      radius: 8,
      color: "#2ed3b7",
      fillColor: "#2ed3b7",
      fillOpacity: 0.82,
      weight: 2
    }).addTo(siliconMap).bindTooltip(label);
  });

  L.polygon(cluster.map(([lat, lng]) => [lat, lng]), {
    color: "#f5c04a",
    fillColor: "#f5c04a",
    fillOpacity: 0.12,
    weight: 2
  }).addTo(siliconMap);
}

document.getElementById("prevSlide").addEventListener("click", () => showSlide(currentSlide - 1));
document.getElementById("nextSlide").addEventListener("click", () => showSlide(currentSlide + 1));

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" || event.key === " ") showSlide(currentSlide + 1);
  if (event.key === "ArrowLeft") showSlide(currentSlide - 1);
});

window.addEventListener("resize", () => {
  if (siliconMap) siliconMap.invalidateSize();
});

buildCharts();
bindInteractions();
showSlide(0);
