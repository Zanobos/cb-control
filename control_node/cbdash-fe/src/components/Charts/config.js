
export const basicOptions = {
  maintainAspectRatio: false,
  legend: {
    display: false
  },
  responsive: true,
};
export let blueChartOptions = {
  ...basicOptions,
  tooltips: {
    backgroundColor: '#f5f5f5',
    titleFontColor: '#333',
    bodyFontColor: '#666',
    bodySpacing: 4,
    xPadding: 12,
    mode: "nearest",
    intersect: 0,
    position: "nearest"
  },
  scales: {
    yAxes: [{
      barPercentage: 1.6,
      gridLines: {
        drawBorder: false,
        color: 'rgba(29,140,248,0.0)',
        zeroLineColor: "transparent",
      },
      ticks: {
        suggestedMin: 60,
        suggestedMax: 125,
        padding: 20,
        fontColor: "#2380f7"
      }
    }],

    xAxes: [{
      barPercentage: 1.6,
      gridLines: {
        drawBorder: false,
        color: 'rgba(29,140,248,0.1)',
        zeroLineColor: "transparent",
      },
      ticks: {
        padding: 20,
        fontColor: "#2380f7"
      }
    }]
  }
}

export let purpleChartOptions = {
  ...basicOptions,
  tooltips: {
    backgroundColor: '#f5f5f5',
    titleFontColor: '#333',
    bodyFontColor: '#666',
    bodySpacing: 4,
    xPadding: 12,
    mode: "nearest",
    intersect: 0,
    position: "nearest"
  },
  scales: {
    yAxes: [{
      barPercentage: 1.6,
      gridLines: {
        drawBorder: false,
        color: 'rgba(29,140,248,0.0)',
        zeroLineColor: "transparent",
      },
      ticks: {
        suggestedMin: 60,
        suggestedMax: 125,
        padding: 20,
        fontColor: "#9a9a9a"
      }
    }],

    xAxes: [{
      barPercentage: 1.6,
      gridLines: {
        drawBorder: false,
        color: 'rgba(225,78,202,0.1)',
        zeroLineColor: "transparent",
      },
      ticks: {
        padding: 20,
        fontColor: "#9a9a9a"
      }
    }]
  },
  plugins: {
    zoom: {
      // Container for pan options
      pan: {
          // Boolean to enable panning
          enabled: true,

          // Panning directions. Remove the appropriate direction to disable
          // Eg. 'y' would only allow panning in the y direction
          // A function that is called as the user is panning and returns the
          // available directions can also be used:
          //   mode: function({ chart }) {
          //     return 'xy';
          //   },
          mode: 'xy',

      },

      // Container for zoom options
      zoom: {
          // Boolean to enable zooming
          enabled: true,

          // Enable drag-to-zoom behavior
          drag: false,

          // Drag-to-zoom effect can be customized
          // drag: {
          // 	 borderColor: 'rgba(225,225,225,0.3)'
          // 	 borderWidth: 5,
          // 	 backgroundColor: 'rgb(225,225,225)',
          // 	 animationDuration: 0
          // },

          // Zooming directions. Remove the appropriate direction to disable
          // Eg. 'y' would only allow zooming in the y direction
          // A function that is called as the user is zooming and returns the
          // available directions can also be used:
          //   mode: function({ chart }) {
          //     return 'xy';
          //   },
          mode: 'xy',

          rangeMin: {
              // Format of min zoom range depends on scale type
              x: null,
              y: null
          },
          rangeMax: {
              // Format of max zoom range depends on scale type
              x: null,
              y: null
          },

          // Speed of zoom via mouse wheel
          // (percentage of zoom on a wheel event)
          speed: 0.1,

          // Minimal zoom distance required before actually applying zoom
          threshold: 2,

          // On category scale, minimal zoom level before actually applying zoom
          sensitivity: 3,

          // Function called while the user is zooming
          //onZoom: function({chart}) { console.log(`I'm zooming!!!`); },
          // Function called once zooming is completed
          //onZoomComplete: function({chart}) { console.log(`I was zoomed!!!`); }
      }
    }
  }
}

export let orangeChartOptions = {
  ...basicOptions,
  tooltips: {
    backgroundColor: '#f5f5f5',
    titleFontColor: '#333',
    bodyFontColor: '#666',
    bodySpacing: 4,
    xPadding: 12,
    mode: "nearest",
    intersect: 0,
    position: "nearest"
  },
  scales: {
    yAxes: [{
      barPercentage: 1.6,
      gridLines: {
        drawBorder: false,
        color: 'rgba(29,140,248,0.0)',
        zeroLineColor: "transparent",
      },
      ticks: {
        suggestedMin: 50,
        suggestedMax: 110,
        padding: 20,
        fontColor: "#ff8a76"
      }
    }],

    xAxes: [{
      barPercentage: 1.6,
      gridLines: {
        drawBorder: false,
        color: 'rgba(220,53,69,0.1)',
        zeroLineColor: "transparent",
      },
      ticks: {
        padding: 20,
        fontColor: "#ff8a76"
      }
    }]
  }

}
export let greenChartOptions = {
  ...basicOptions,
  tooltips: {
    backgroundColor: '#f5f5f5',
    titleFontColor: '#333',
    bodyFontColor: '#666',
    bodySpacing: 4,
    xPadding: 12,
    mode: "nearest",
    intersect: 0,
    position: "nearest"
  },
  scales: {
    yAxes: [{
      barPercentage: 1.6,
      gridLines: {
        drawBorder: false,
        color: 'rgba(29,140,248,0.0)',
        zeroLineColor: "transparent",
      },
      ticks: {
        suggestedMin: 50,
        suggestedMax: 125,
        padding: 20,
        fontColor: "#9e9e9e"
      }
    }],

    xAxes: [{
      barPercentage: 1.6,
      gridLines: {
        drawBorder: false,
        color: 'rgba(0,242,195,0.1)',
        zeroLineColor: "transparent",
      },
      ticks: {
        padding: 20,
        fontColor: "#9e9e9e"
      }
    }]
  }
}

export let barChartOptions = {
  ...basicOptions,
  tooltips: {
    backgroundColor: '#f5f5f5',
    titleFontColor: '#333',
    bodyFontColor: '#666',
    bodySpacing: 4,
    xPadding: 12,
    mode: "nearest",
    intersect: 0,
    position: "nearest"
  },
  scales: {
    yAxes: [{

      gridLines: {
        drawBorder: false,
        color: 'rgba(29,140,248,0.1)',
        zeroLineColor: "transparent",
      },
      ticks: {
        suggestedMin: 60,
        suggestedMax: 120,
        padding: 20,
        fontColor: "#9e9e9e"
      }
    }],
    xAxes: [{

      gridLines: {
        drawBorder: false,
        color: 'rgba(29,140,248,0.1)',
        zeroLineColor: "transparent",
      },
      ticks: {
        padding: 20,
        fontColor: "#9e9e9e"
      }
    }]
  }

}
