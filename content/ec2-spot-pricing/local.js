"use strict";

let data;
let seriesData;
let myChart;

let lastUpdateEpochTimeMs = 1603560675256;
let updatedMinutesAgo = Math.round((new Date() - lastUpdateEpochTimeMs) / (60 * 1000));
let updated = document.getElementById("last-updated");
updated.innerText = "Prices last updated " + updatedMinutesAgo + " minutes ago."


function getSeriesData() {
  let memory = document.getElementById("filter-memory").value
  let vcpus = document.getElementById("filter-vcpus").value
  let mpv = document.getElementById("filter-mpv").value
  let insttype = document.getElementById("filter-type").value
  let architecture = document.getElementById("filter-architecture").value
  let region = document.getElementById("filter-region").value
  let currentgen = document.getElementById("filter-currentgen").checked
  seriesData = {categories: [], price: [], power: []};
  let power = [];
  const regex = RegExp(insttype, "i");
  for (let row of data) {
    if (seriesData.categories.length == 20) break;
    if (row.memory_gib < memory) continue;
    if (row.vcpus < vcpus) continue;
    if (row.memory_gib_per_vcpu < mpv) continue;
    if (!regex.test(row.instance_type)) continue;
    if (currentgen && !row.current_generation) continue;
    if (region != row.region) continue;
    if (architecture != "any" && architecture != row.architecture) continue;
    let label = '<b>' + row.instance_type + '</b><br>' +
      row.availability_zone + '<br>' +
      row.memory_gib + ' GiB, ' + row.vcpus + ' vCPUs<br>' +
      '$' + row.dollars_per_hour + ' / hour<br>' +
      '$' + (row.dollars_per_hour  * 24).toFixed(4) + ' / day<br>';
    seriesData.categories.push(row.instance_type);
    seriesData.price.push({name: label, y: row.dollars_per_hour,
      color: null, className: null});
    seriesData.power.push(row.power);
  }
  let minPower = Math.min(...seriesData.power);
  let maxPower = Math.max(...seriesData.power);
  for (let i = 0; i < seriesData.power.length; i++) {
    let powerIndex = 2;
    if (minPower < maxPower) {
      powerIndex = (seriesData.power[i] - minPower) / (maxPower - minPower);
      powerIndex = Math.min(Math.floor(powerIndex * 5), 4);
    }
    seriesData.price[i].className = "power-" + powerIndex;
  }
}

function updateChart() {
  getSeriesData();
  myChart.series[0].setData(seriesData.price);
  myChart.xAxis[0].setCategories(seriesData.categories);
}

function reset() {
  document.getElementById("filter-memory").value = 0;
  document.getElementById("filter-vcpus").value = 0;
  document.getElementById("filter-mpv").value = 0;
  document.getElementById("filter-architecture").value = "any";
  document.getElementById("filter-type").value = "";
  document.getElementById("filter-region").value = "us-west-2";
  document.getElementById("filter-currentgen").checked = false;
  updateChart();
}


Highcharts.setOptions({
    chart: {
        style: {
            fontFamily: 'sans-serif'
        }
    }
});

document.getElementById("reset-btn").addEventListener("click", reset);
document.getElementById("filter-memory").addEventListener("keyup", updateChart);
document.getElementById("filter-vcpus").addEventListener("keyup", updateChart);
document.getElementById("filter-mpv").addEventListener("keyup", updateChart);
document.getElementById("filter-type").addEventListener("keyup", updateChart);
document.getElementById("filter-architecture").addEventListener("change", updateChart);
document.getElementById("filter-region").addEventListener("change", updateChart);
document.getElementById("filter-currentgen").addEventListener("change", updateChart);

$.getJSON("stats.json", function(json) {
  data = json;
  let fr = document.getElementById("filter-region");
  let regionSet = new Set();
  for (let row of data) regionSet.add(row.region);
  let regions = Array.from(regionSet).sort();
  for (let region of regions) {
    let option = document.createElement("option");
    option.text = region;
    fr.add(option);
  }
  myChart = Highcharts.chart({
    chart: {
      type: 'bar',
      renderTo: 'container',
      styledMode: true
    },
    plotOptions: {
      series: {
        colorByPoint: true
      }
    },
    legend: {
        enabled: false
    },
    title: {
      text: undefined
    },
    xAxis: {
      title: {
        text: 'Instance Type'
      },
      categories: []
    },
    yAxis: {
      title: {
        text: '$ per hour'
      }
    },
    tooltip: {
      formatter: function() {
        return this.point.name;
      }
    },
    series: [{
        data: []
      }]
  });
  reset();

});
