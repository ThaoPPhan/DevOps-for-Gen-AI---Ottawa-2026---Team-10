const fallbackState = {
  status: "healthy",
  systemLabel: "PROTECTED",
  metrics: {
    accuracy: 97.8,
    precision: 95.2,
    recall: 96.1,
    drift: 2.1,
    falsePositiveRate: 1.3,
    healthScore: 98,
  },
  models: {
    v1: { accuracy: 97.8, traffic: 95 },
    v2: { accuracy: 96.4, traffic: 5 },
  },
  events: [
    { icon: "OK", text: "V2 tests passed", level: "healthy", time: "09:12 UTC" },
    { icon: "OK", text: "Canary started", level: "healthy", time: "09:14 UTC" },
    { icon: "WARN", text: "Monitoring drift, thresholds normal", level: "warning", time: "09:17 UTC" },
  ],
};

const state = structuredClone(fallbackState);

const refs = {
  systemPill: document.getElementById("systemPill"),
  v1Accuracy: document.getElementById("v1Accuracy"),
  v2Accuracy: document.getElementById("v2Accuracy"),
  v1Traffic: document.getElementById("v1Traffic"),
  v2Traffic: document.getElementById("v2Traffic"),
  accuracyMetric: document.getElementById("accuracyMetric"),
  precisionMetric: document.getElementById("precisionMetric"),
  recallMetric: document.getElementById("recallMetric"),
  driftMetric: document.getElementById("driftMetric"),
  fprMetric: document.getElementById("fprMetric"),
  healthMetric: document.getElementById("healthMetric"),
  healthLabel: document.getElementById("healthLabel"),
  trafficMode: document.getElementById("trafficMode"),
  v1Bar: document.getElementById("v1Bar"),
  v2Bar: document.getElementById("v2Bar"),
  v1TrafficBarLabel: document.getElementById("v1TrafficBarLabel"),
  v2TrafficBarLabel: document.getElementById("v2TrafficBarLabel"),
  eventList: document.getElementById("eventList"),
  eventClock: document.getElementById("eventClock"),
  deployButton: document.getElementById("deployButton"),
  failureButton: document.getElementById("failureButton"),
};

function formatPercent(value) {
  return `${value.toFixed(1)}%`;
}

function pushEvent(entry) {
  state.events.unshift(entry);
  state.events = state.events.slice(0, 6);
}

function statusLabel(status) {
  if (status === "critical") return "CRITICAL";
  if (status === "warning") return "WARNING";
  return "PROTECTED";
}

function render() {
  refs.systemPill.className = `system-pill ${state.status}`;
  refs.systemPill.innerHTML = `<span class="status-dot"></span><span>System: ${state.systemLabel}</span>`;

  refs.v1Accuracy.textContent = formatPercent(state.models.v1.accuracy);
  refs.v2Accuracy.textContent = formatPercent(state.models.v2.accuracy);
  refs.v1Traffic.textContent = `${state.models.v1.traffic}%`;
  refs.v2Traffic.textContent = `${state.models.v2.traffic}%`;

  refs.accuracyMetric.textContent = formatPercent(state.metrics.accuracy);
  refs.precisionMetric.textContent = formatPercent(state.metrics.precision);
  refs.recallMetric.textContent = formatPercent(state.metrics.recall);
  refs.driftMetric.textContent = formatPercent(state.metrics.drift);
  refs.fprMetric.textContent = formatPercent(state.metrics.falsePositiveRate);
  refs.healthMetric.textContent = `${state.metrics.healthScore} / 100`;
  refs.healthLabel.textContent = `Status: ${statusLabel(state.status)}`;

  refs.trafficMode.textContent = `V1 ${state.models.v1.traffic}% / V2 ${state.models.v2.traffic}%`;
  refs.v1Bar.style.width = `${state.models.v1.traffic}%`;
  refs.v2Bar.style.width = `${state.models.v2.traffic}%`;
  refs.v1TrafficBarLabel.textContent = `${state.models.v1.traffic}%`;
  refs.v2TrafficBarLabel.textContent = `${state.models.v2.traffic}%`;

  refs.eventClock.textContent = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  refs.eventList.innerHTML = state.events
    .map(
      (event) => `
        <li class="event-item">
          <span class="event-icon ${event.level}">${event.icon}</span>
          <span>${event.text}</span>
          <span class="event-time">${event.time}</span>
        </li>
      `,
    )
    .join("");
}

async function postAction(path) {
  try {
    const response = await fetch(path, { method: "POST" });
    return response.ok;
  } catch {
    return false;
  }
}

async function deployCanary() {
  await postAction("/deploy");
  state.status = "healthy";
  state.systemLabel = "PROTECTED";
  state.models.v1.traffic = 95;
  state.models.v2.traffic = 5;
  state.models.v2.accuracy = 96.4;
  state.metrics.healthScore = 98;
  state.metrics.drift = 2.1;
  pushEvent({ icon: "OK", text: "V2 tests passed", level: "healthy", time: "Now" });
  pushEvent({ icon: "OK", text: "Canary started at 5% traffic", level: "healthy", time: "Now" });
  render();
}

async function simulateFailure() {
  await postAction("/simulate-failure");
  state.status = "critical";
  state.systemLabel = "ROLLBACK ACTIVE";
  state.models.v1.traffic = 100;
  state.models.v2.traffic = 0;
  state.models.v2.accuracy = 82.7;
  state.metrics.accuracy = 94.1;
  state.metrics.precision = 87.3;
  state.metrics.recall = 89.5;
  state.metrics.drift = 8.9;
  state.metrics.falsePositiveRate = 6.8;
  state.metrics.healthScore = 38;
  pushEvent({ icon: "WARN", text: "Performance degrading", level: "warning", time: "Now" });
  pushEvent({ icon: "RB", text: "Rollback triggered", level: "critical", time: "Now" });
  pushEvent({ icon: "OK", text: "V1 restored to 100% traffic", level: "healthy", time: "Now" });
  render();
}

refs.deployButton.addEventListener("click", deployCanary);
refs.failureButton.addEventListener("click", simulateFailure);

render();
