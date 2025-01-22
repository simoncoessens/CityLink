"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import PriorityQueue from "ts-priority-queue";
import PropTypes from "prop-types";

// Time parsing function
const parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S");

const D3Map = ({ maxHours = 2, startHour = 8, money = 12, co2 = 10, onH3CellSelect, startingH3Cell, setDetailInformation}) => {
  const containerRef = useRef(null);

  // ------ State variables ------
  const [userSelectedCell, setUserSelectedCell] = useState(null);
  const [maxDistance, setMaxDistance] = useState(maxHours * 60); // Convert hours to minutes

  // ------ Refs to hold data dictionaries, since we don't necessarily want them to trigger re-renders ------
  const tripDictionaryRef = useRef({});
  const h3CellDictionaryRef = useRef({});
  const h3LtLnRef = useRef({});
  const frenchCitiesByH3Ref = useRef({});
  const routesRef = useRef({});   // Will hold BFS route info
  const finalDistances = useRef({});
  const limits = useRef({ money: money, co2: co2 });
  // ------ Constants ------
  const MAP_WIDTH = 900;
  const MAP_HEIGHT = 800;
  const filterTransportModes = {
    TRAIN: true,
    BUS: true,
    REGIONAL: true,
  };

  // ---------------------- 1. INITIALIZE MAP ONCE ON MOUNT ----------------------
  useEffect(() => {
    // Remove anything that might have been left from a previous effect
    d3.select(containerRef.current).selectAll("*").remove();
    
    // Now run your main initialization
    initializeMap();
  
    // Cleanup on unmount
    return () => {
      d3.select(containerRef.current).selectAll("*").remove();
    };
  }, []);
  

  // ---------------------- 2. UPDATE WHEN maxHours CHANGES ----------------------
  useEffect(() => {
    // Update maxDistance in our state
    setMaxDistance(maxHours * 60);
    // If we already have a user-selected H3 cell, re-run the BFS logic to recolor
    if (startingH3Cell) {
      // We need to update the map coloring with the new maxHours-based BFS
      const svg = d3.select(containerRef.current).select("svg");
      finalDistances.current = updateMap(svg, startingH3Cell);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    limits.current = { money: money, co2: co2 };
  }, [maxHours, startingH3Cell, money, co2, startHour]);

  /**
   * Called only once when the component mounts. This function:
   *   1) Loads dictionaries/CSV data
   *   2) Creates the base SVG & map projection
   *   3) Draws the regions and H3 polygons
   *   4) Sets up event listeners
   */
  const initializeMap = async () => {
    // 1. Load data for tripDictionaryRef, h3CellDictionaryRef, h3LtLnRef, frenchCitiesByH3Ref
    await loadAllData();

    // 2. Create the SVG container
    const svg = d3
      .select(containerRef.current)
      .append("svg")
      .attr("viewBox", `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("width", "100%")
      .style("height", "auto")
      .style("pointer-events", "all")
      .style("position", "relative")
      .style("z-index", 10);

    // 3. Create map projection
    const projection = d3
      .geoMercator()
      .center([2.2137, 46.2276]) // Center on France
      .scale(3000)
      .translate([MAP_WIDTH / 2 + 100, MAP_HEIGHT / 2]);

    const path = d3.geoPath().projection(projection);

    // 4. Load and draw GeoJSON base map (France regions)
    const geoData = await d3.json(
      "https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions-version-simplifiee.geojson"
    );
    svg
      .selectAll("path")
      .data(geoData.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", "#cccccc")
      .attr("stroke", "#333333");

    // 5. Draw the H3 polygons from local CSV
    loadPolygons(svg, path);

    // Create the tooltip element
    const tooltip = d3.select(containerRef.current)
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "#333")
      .style("color", "#fff")
      .style("padding", "10px")
      .style("border-radius", "5px")
      .style("box-shadow", "0 0 10px rgba(0, 0, 0, 0.5)")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", 1000); // Ensure the tooltip is in front

    // Create an SVG container for the legend
    const domainMin = maxDistance;
    const domainMax = 0;
    const legendWidth = 50;
    const legendHeight = 500; 
    const numSteps = 200; // Number of steps for sampling the color scale
    const margin = 50; // Margin for the top and bottom

    const legendsvg = svg // Change "body" to your specific container
      .append("svg")
      .attr("x", MAP_WIDTH - 800) // Move the legend to the right
      .attr("y", MAP_HEIGHT - legendHeight - 200) // Move the legend lower on the 'y'
      .attr("width", legendWidth + 30) // Extra space for labels
      .attr("height", legendHeight + 30 + margin * 2) // Extra space for margin and labels

    // Define the color scale
    const colorScale2 = d3.scaleSequential(d3.interpolateRdYlGn)
      .domain([domainMin, domainMax]);

    // Generate the color steps
    const stepHeight = legendHeight / numSteps;
    const steps = d3.range(numSteps).map(i => i / (numSteps - 1)); // [0, 1]

    // Draw the legend as a series of rectangles
    legendsvg.selectAll("rect")
      .data(steps)
      .enter()
      .append("rect")
      .attr("x", 0)
      .attr("y", d => margin + stepHeight * d * (numSteps - 1))
      .attr("width", legendWidth)
      .attr("height", stepHeight)
      .style("fill", d => colorScale2(domainMin + d * (domainMax - domainMin)));

    // Add labels for min and max values
    legendsvg.append("text")
      .attr("x", 0)
      .attr("y", legendHeight + margin + 20)
      .attr("text-anchor", "start")
      .style("font-size", "16px")
      .text(`0 Hours`);

    legendsvg.append("text")
      .attr("id", "max-label")
      .attr("x", 0)
      .attr("y", margin - 5)
      .attr("text-anchor", "start")
      .style("font-size", "16px")
      .text(`${maxDistance / 60.0} Hours`);
    
    // Create a tooltip element
    d3.select("body").append("div")
      .attr("id", "tooltip")
      .style("position", "absolute")
      .style("display", "none")
      .style("background", "white")
      .style("border", "1px solid black")
      .style("padding", "5px");
  };

  /**
   * Loads the polygons from CSV, draws them, and sets up event listeners for them.
   */
  const loadPolygons = async (svg, path) => {
    const csvData = await d3.csv("/data/polygons.csv");
    // Some data processing
    const reducedData = csvData.reduce((acc, row) => {
      if (!acc[row.h3_cell]) {
        acc[row.h3_cell] = {
          h3_polygon: row.h3_polygon,
          h3_cell: row.h3_cell,
        };
      }
      return acc;
    }, {});

    svg
      .append("g")
      .selectAll("path")
      .data(Object.values(reducedData))
      .join("path")
      .attr("d", (d) => {
        const polygon = parsePolygonCoordinates(d.h3_polygon);
        return path({ type: "Polygon", coordinates: [polygon] });
      })
      .attr("fill", "rgba(255,255,255, 0.3)")
      .attr("stroke", "rgba(0, 0, 0, 0.8)")
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .on("mouseover", function (e, d) {
        const { h3_cell } = d;
        if (routesRef.current[h3_cell]) {
          const cities = frenchCitiesByH3Ref.current[d.h3_cell] || [];
          const tooltipContent = cities.slice(0, 2).map(cityObj => cityObj.city).join(", ");
          const info = getExtraInformation(routesRef.current[h3_cell]);
          if (cities.length > 0) {
            d3.select(".tooltip")
              .style("opacity", 1)
              .html(tooltipContent)
          }
        }
      })
      .on("mousemove", function (e) {
        const containerRect = containerRef.current.getBoundingClientRect();
        d3.select(".tooltip")
          .style("left", `${e.clientX - containerRect.left + 10}px`)
          .style("top", `${e.clientY - containerRect.top - 28}px`);
      })
      .on("mouseout", function () {
        d3.select(".tooltip").style("opacity", 0);
      })
      .on("click", (e, d) => {
        if (onH3CellSelect) {
          onH3CellSelect(d.h3_cell); // callback to parent
          const detailInformation = {
            ...getExtraInformation(routesRef.current[d.h3_cell]),
            euclideanDistanceKm: getDistanceKmH3Cells(startingH3Cell, d.h3_cell),
            timeTaken: finalDistances.current[d.h3_cell],
          }
          setDetailInformation(detailInformation)
        }
      });

    // Just in case you need the CSV data for further reference:
    // e.g., building your dictionary state
    const parsedData = csvData.map((row) => ({
      h3_cell: row.h3_cell,
      departure_date: parseDate(row.departure_date),
      trip_id: row.trip_id,
      transport_mode: row.transport_mode,
    }));

    // Build the dictionaries for BFS
    const tripDict = createTripDictionary(parsedData);
    const h3Dict = createH3CellDictionary(parsedData);

    tripDictionaryRef.current = tripDict;
    h3CellDictionaryRef.current = h3Dict;
  };

  /**
   * Loads all additional data (trip dictionary, H3 lat/lon, French cities) that we need
   */
  const loadAllData = async () => {
    // 1. Pre-load polygons CSV to build dictionaries (some of it is also done in loadPolygons)
    //    If you really want to parse that CSV here, you can do so, or rely solely on loadPolygons.
    //    Example:
    //    const polygonsData = await parseCSVData("/data/polygons.csv");
    //    // do something if needed

    // 2. h3 info
    const h3Data = await getH3LtLn();
    h3LtLnRef.current = h3Data;

    // 3. French cities
    const frenchCitiesData = await getFrenchCities();
    frenchCitiesByH3Ref.current = frenchCitiesData;
  };

  /**
   * When the user selects an H3 cell (or when maxHours changes),
   * we run BFS from that cell and color the polygons accordingly.
   */
  const updateMap = (svg, selectedCell) => {
    // Update the legend max distance label
    d3.select("#max-label").text(`${maxHours} Hours`);
    // For BFS, define a start date/time
    const hours = Math.floor(startHour).toString().padStart(2, '0');
    const minutes = Math.floor((startHour*60) % 60).toString().padStart(2, '0');
    const startDate = parseDate(`2024-11-03 ${hours}:${minutes}:00`);

    // BFS returns a dictionary of travel times from source
    const distances = getShortestDistanceFromH3CellSource(selectedCell, startDate);
    // colorScale
    const colorScale = d3.scaleSequential(d3.interpolateRdYlGn).domain([maxDistance, 0]);

    // Recolor polygons based on BFS-distances
    svg.selectAll("path").attr("fill", (d) => {
      // Make sure we only color the polygons that have an h3_cell property
      const distance = distances[d.h3_cell];
      if (distance === undefined || distance === 10000000) {
        return "rgba(255,255,255, 0.3)";
      }
      return colorScale(distance);
    });
    return distances;
  };

  // ---------------------- BFS FUNCTION ----------------------
  function getShortestDistanceFromH3CellSource(h3CellSource, startDate) {
    routesRef.current = {}; // Reset route info
    const times = {};

    const queue = new PriorityQueue({
      comparator: (a, b) => b.time - a.time, // small -> large if you want ascending by time
    });

    // Initialize times
    const h3CellDictionary = h3CellDictionaryRef.current;
    const tripDictionary = tripDictionaryRef.current;

    for (const h3CellKey in h3CellDictionary) {
      times[h3CellKey] = 10000000;
    }
    queue.queue({
      h3Cell: h3CellSource,
      time: 0,
      detailDistance: {
        TRAIN: 0,
        BUS: 0,
        REGIONAL: 0,
      },
    });

    while (queue.length > 0) {
      const { h3Cell: currentH3Cell, time: currentElapsedTime, detailDistance } =
        queue.dequeue();

      if (times[currentH3Cell] !== undefined && times[currentH3Cell] > currentElapsedTime) {
        times[currentH3Cell] = currentElapsedTime;
        routesRef.current[currentH3Cell] = detailDistance;
      }

      const trips = h3CellDictionary[currentH3Cell] || [];
      for (const trip of trips) {
        const { trip_id, departure_date: departure_date_trip } = trip;

        // If the trip departure date minus the current distance is < 30 minutes, skip
        if (getDateDiffInMinutes(startDate, departure_date_trip) < currentElapsedTime + 30) {
          continue;
        }

        // Otherwise, examine the new H3 cells connected by trip_id
        const newH3Cells = tripDictionary[trip_id] || [];
        for (const newH3Cell of newH3Cells) {
          const { h3_cell: newH3CellId, departure_date: newDepartureDate, transport_mode } =
            newH3Cell;

          // Filter by transport mode
          if (!filterTransportModes[transport_mode]) {
            continue;
          }

          // Evaluate CO2 / money constraints
          const distKm = getDistanceKmH3Cells(currentH3Cell, newH3CellId);
          const updatedDetailDistance = {
            ...detailDistance,
            [transport_mode]: detailDistance[transport_mode] + distKm,
          };
          const { co2EmissionsKg, moneyEuros } = getExtraInformation(updatedDetailDistance);
          if (co2EmissionsKg > limits.current.co2 || moneyEuros > limits.current.money) {
            continue;
          }

          let newElapsedTime = getDateDiffInMinutes(startDate, newDepartureDate);
          // If the new departure time is not strictly after the current time, skip
          if (newElapsedTime <= currentElapsedTime) {
            continue;
          }

          // If we can improve the shortest time to newH3CellId and it's < maxDistance, queue it
          if (
            newDepartureDate > departure_date_trip &&
            times[newH3CellId] > newElapsedTime &&
            newElapsedTime < maxDistance
          ) {
            queue.queue({
              h3Cell: newH3CellId,
              time: newElapsedTime,
              detailDistance: updatedDetailDistance,
            });
          }
        }
      }
    }

    return times;
  }

  // ---------------------- HELPERS ----------------------

  // Helper: parse polygon from WKT-like string
  function parsePolygonCoordinates(polygonString) {
    return polygonString
      .replace("POLYGON ((", "")
      .replace("))", "")
      .split(", ")
      .map((coord) => {
        const [lon, lat] = coord.split(" ");
        return [parseFloat(lon), parseFloat(lat)];
      })
      .reverse();
  }

  // Trip dictionary creation
  function createTripDictionary(data) {
    return data.reduce((acc, row) => {
      if (!acc[row.trip_id]) {
        acc[row.trip_id] = [];
      }
      acc[row.trip_id].push({
        h3_cell: row.h3_cell,
        departure_date: row.departure_date,
        transport_mode: row.transport_mode,
      });
      return acc;
    }, {});
  }

  // H3 cell dictionary creation
  function createH3CellDictionary(data) {
    return data.reduce((acc, row) => {
      if (!acc[row.h3_cell]) acc[row.h3_cell] = [];
      acc[row.h3_cell].push({
        trip_id: row.trip_id,
        departure_date: row.departure_date,
      });
      return acc;
    }, {});
  }

  // Reads French cities data
  function getFrenchCities() {
    return d3.csv("FrenchCities_with_h3.csv").then((data) => {
      return data.reduce((acc, row) => {
        if (!acc[row.h3_cell]) {
          acc[row.h3_cell] = [];
        }
        acc[row.h3_cell].push({
          city: row.city_ascii,
          population: row.population,
        });
        return acc;
      }, {});
    });
  }

  // Reads h3 lat-lon data
  function getH3LtLn() {
    return d3.csv("data/h3_info.csv").then((data) => {
      return data.reduce((acc, row) => {
        if (!acc[row.h3]) {
          acc[row.h3] = [];
        }
        acc[row.h3].push({
          x: parseFloat(row.x),
          y: parseFloat(row.y),
        });
        return acc;
      }, {});
    });
  }

  // Generic CSV parse (optional usage)
  function parseCSVData(csvPath) {
    return d3.csv(csvPath).then((csvData) => {
      return csvData.map((row) => ({
        route_id: row.route_id,
        route_long_name: row.route_long_name,
        company: row.company,
        transport_mode: row.transport_mode,
        stop_sequence: row.stop_sequence,
        arrival_time: parseDate(row.arrival_time),
        departure_time: parseDate(row.departure_time),
        stop_name: row.stop_name,
        stop_lon: parseFloat(row.stop_lon),
        stop_lat: parseFloat(row.stop_lat),
        arrival_date: parseDate(row.arrival_date),
        departure_date: parseDate(row.departure_date),
        trip_id: row.trip_id,
        h3_cell: row.h3_cell,
      }));
    });
  }

  function getDistanceKmH3Cells(h3Cell1, h3Cell2) {
    const x1 = h3LtLnRef.current[h3Cell1]?.[0].x || 0;
    const y1 = h3LtLnRef.current[h3Cell1]?.[0].y || 0;
    const x2 = h3LtLnRef.current[h3Cell2]?.[0].x || 0;
    const y2 = h3LtLnRef.current[h3Cell2]?.[0].y || 0;
    return (Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2) / 1000) * 1.2;
  }

  function getDateDiffInMinutes(startDate, endDate) {
    return (endDate - startDate) / (1000 * 60);
  }

  /**
   * Calculates a linear combination of transport-mode distances.
   */
  function linearCombinationTransportModes(detailDistance, values) {
    return (
      detailDistance.TRAIN * values[0] +
      detailDistance.BUS * values[1] +
      detailDistance.REGIONAL * values[2]
    );
  }

  function getExtraInformation(detailDistance) {
    return {
      distanceKm: { ...detailDistance },
      co2EmissionsKg: linearCombinationTransportModes(detailDistance, [0.011, 0.042, 0.03]),
      moneyEuros: linearCombinationTransportModes(detailDistance, [0.12, 0.04, 0.093]),
    };
  }

  // ---------------------- RENDER ----------------------
  return <div ref={containerRef} className="w-full h-auto" />;
};

D3Map.propTypes = {
  maxHours: PropTypes.number,
  startHour: PropTypes.number,
  onH3CellSelect: PropTypes.func,
  setDetailInformation: PropTypes.func,
};

export default D3Map;
