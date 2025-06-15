
document.getElementById("upload").addEventListener("change", handleFile, false);
document.getElementById("search").addEventListener("input", applyFilters);
document.getElementById("statusFilter").addEventListener("change", applyFilters);
document.getElementById("tipoClienteFilter").addEventListener("change", applyFilters);

let rawData = [];
let headers = [];

function handleFile(e) {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    headers = jsonData[0];
    rawData = jsonData.slice(1);
    fillFilters();
    renderTable(rawData);
    renderCharts(rawData);
  };

  reader.readAsArrayBuffer(file);
}

function fillFilters() {
  const statusIndex = headers.findIndex(h => h.toLowerCase().includes("status"));
  const tipoIndex = headers.findIndex(h => h.toLowerCase().includes("tipo"));

  const statusSet = new Set();
  const tipoSet = new Set();

  rawData.forEach(row => {
    if (row[statusIndex]) statusSet.add(row[statusIndex]);
    if (row[tipoIndex]) tipoSet.add(row[tipoIndex]);
  });

  const statusFilter = document.getElementById("statusFilter");
  const tipoFilter = document.getElementById("tipoClienteFilter");
  statusFilter.innerHTML = '<option value="">📌 Filtrar por Status</option>';
  tipoFilter.innerHTML = '<option value="">👤 Filtrar por Tipo de Cliente</option>';

  Array.from(statusSet).forEach(v => {
    statusFilter.innerHTML += `<option value="${v}">${v}</option>`;
  });
  Array.from(tipoSet).forEach(v => {
    tipoFilter.innerHTML += `<option value="${v}">${v}</option>`;
  });
}

function applyFilters() {
  const search = document.getElementById("search").value.toLowerCase();
  const status = document.getElementById("statusFilter").value;
  const tipo = document.getElementById("tipoClienteFilter").value;

  const statusIndex = headers.findIndex(h => h.toLowerCase().includes("status"));
  const tipoIndex = headers.findIndex(h => h.toLowerCase().includes("tipo"));

  const filtered = rawData.filter(row => {
    const rowStr = row.join(" ").toLowerCase();
    return (!search || rowStr.includes(search)) &&
           (!status || row[statusIndex] === status) &&
           (!tipo || row[tipoIndex] === tipo);
  });

  renderTable(filtered);
  renderCharts(filtered);
}

function renderTable(data) {
  let html = "<table><thead><tr>";
  headers.forEach(h => html += `<th>${h}</th>`);
  html += "</tr></thead><tbody>";

  const statusIndex = headers.findIndex(h => h.toLowerCase().includes("status"));

  data.forEach(row => {
    const isErro = row[statusIndex] && row[statusIndex].toLowerCase().includes("erro");
    html += `<tr${isErro ? ' class="highlight"' : ""}>`;
    headers.forEach((_, i) => html += `<td>${row[i] || ""}</td>`);
    html += "</tr>";
  });

  html += "</tbody></table>";
  document.getElementById("output").innerHTML = html;
}

function renderCharts(data) {
  const statusIndex = headers.findIndex(h => h.toLowerCase().includes("status"));
  const tipoIndex = headers.findIndex(h => h.toLowerCase().includes("tipo"));

  const statusMap = {};
  const tipoMap = {};

  data.forEach(row => {
    const s = row[statusIndex] || "Desconhecido";
    const t = row[tipoIndex] || "Desconhecido";
    statusMap[s] = (statusMap[s] || 0) + 1;
    tipoMap[t] = (tipoMap[t] || 0) + 1;
  });

  const statusCtx = document.getElementById("statusChart").getContext("2d");
  const tipoCtx = document.getElementById("tipoClienteChart").getContext("2d");

  if (window.statusChartObj) window.statusChartObj.destroy();
  if (window.tipoChartObj) window.tipoChartObj.destroy();

  window.statusChartObj = new Chart(statusCtx, {
    type: "pie",
    data: {
      labels: Object.keys(statusMap),
      datasets: [{ data: Object.values(statusMap), backgroundColor: ["#2ecc71", "#3498db", "#e74c3c", "#f1c40f", "#9b59b6"] }]
    }
  });

  window.tipoChartObj = new Chart(tipoCtx, {
    type: "bar",
    data: {
      labels: Object.keys(tipoMap),
      datasets: [{
        label: "Contas por Tipo",
        data: Object.values(tipoMap),
        backgroundColor: "#2980b9"
      }]
    }
  });
}
