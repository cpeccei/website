var request = new XMLHttpRequest();
request.open('GET', 'stats.json', false);  // `false` makes the request synchronous
request.send(null);
data = JSON.parse(request.responseText)

var fr = document.getElementById("filter-region");
var regions = {};
for (i = 0; i < data.length; i++) {
  regions[data[i].region] = true;
}
regions = Object.keys(regions);
regions.sort();
regions.forEach(function (item, index) {
  var option = document.createElement("option");
  option.text = item;
  fr.add(option);
});
fr.value = "us-west-2";

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

var seriesData;
function getSeriesData() {
  memory = document.getElementById("filter-memory").value
  vcpus = document.getElementById("filter-vcpus").value
  mpv = document.getElementById("filter-mpv").value
  insttype = document.getElementById("filter-type").value
  architecture = document.getElementById("filter-architecture").value
  region = document.getElementById("filter-region").value
  currentgen = document.getElementById("filter-currentgen").checked
  seriesData = {categories: [], price: [], power: []};
  power = [];
  const regex = RegExp(insttype);
  for (i = 0; i < data.length; i++) {
    if (seriesData.categories.length == 20) {
      break;
    }
    if (data[i].memory_gib < memory) {
      continue;
    };
    if (data[i].vcpus < vcpus) {
      continue;
    };
    if (data[i].memory_gib_per_vcpu < mpv) {
      continue;
    };
    if (!regex.test(data[i].instance_type)) {
      continue;
    };
    if (currentgen && !data[i].current_generation) {
      continue;
    };
    if (region != data[i].region) {
      continue;
    };
    if (architecture != "any" && architecture != data[i].architecture) {
      continue;
    };
    label = '<b>' + data[i].instance_type + '</b><br>' +
      data[i].availability_zone + '<br>' +
      data[i].memory_gib + ' GiB, ' + data[i].vcpus + ' vCPUs<br>' +
      '$' + data[i].dollars_per_hour + ' / hour<br>' +
      '$' + (data[i].dollars_per_hour  * 24).toFixed(4) + ' / day<br>';
    seriesData.categories.push(data[i].instance_type);
    seriesData.price.push({name: label, y: data[i].dollars_per_hour,
      color: null, className: null});
    // seriesData.price.push(data[i].dollars_per_hour);
    seriesData.power.push(data[i].power);
  }
  minPower = Math.min(...seriesData.power);
  maxPower = Math.max(...seriesData.power);
  for (i = 0; i < seriesData.power.length; i++) {
    let ci = 2;
    if (minPower < maxPower) {
      ci = (seriesData.power[i] - minPower) / (maxPower - minPower);
      ci = Math.min(Math.floor(ci * 5), 4);
    }
    seriesData.price[i].className = "power-" + ci;
  }
}

function interp(i, ib, ie, ob, oe) {
  if (ib == ie) {return 0.5 * (oe - ob) + ob};
  return Math.round((i - ib) / (ie - ib) * (oe - ob) + ob)
}

function updateChart() {
  getSeriesData();
  myChart.series[0].setData(seriesData.price);
  myChart.xAxis[0].setCategories(seriesData.categories);
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

getSeriesData();

var myChart = Highcharts.chart({
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
    categories: seriesData.categories
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
      data: seriesData.price
    }]
});
