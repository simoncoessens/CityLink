"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import PriorityQueue from "ts-priority-queue";
import PropTypes from "prop-types";


// Time parsing function
const parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S");


const D3Map = ({ maxHours = 4, startHour = 9 }) => {
  const containerRef = useRef(null);
  const MAP_WIDTH = 900;
  const MAP_HEIGHT = 800;

  let [tripDictionary, setTripDictionary] = useState({});
  let [h3CellDictionary, setH3CellDictionary] = useState({});
  let [userSelectedCell, setUserSelectedCell] = useState(null);
  let [maxDistance, setMaxDistance] = useState(maxHours * 60); // Convert hours to minutes
  useEffect(() => {
    setMaxDistance(maxHours * 60);
  }, [maxHours]);
  let frenchCitiesByH3 = {};
  let routes = {}
  let h3LtLn = {}

  parseCSVData('data/polygons.csv').then(data => {
      tripDictionary = createTripDictionary(data);
      h3CellDictionary = createH3CellDictionary(data);
  });

  // Fetch and save the dictionary
  getH3LtLn().then(data => {
      h3LtLn = data;
  });

  // Fetch and save the dictionary
  getFrenchCities().then(data => {
      frenchCitiesByH3 = data;
  });

  useEffect(() => {
    // Create the SVG container
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

    // Create map projection
    const projection = d3
      .geoMercator()
      .center([2.2137, 46.2276]) // Center on France
      .scale(3000)
      .translate([MAP_WIDTH / 2 + 100, MAP_HEIGHT / 2]);

    const path = d3.geoPath().projection(projection);

    // Load and draw GeoJSON base map
    d3.json(
      "https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions-version-simplifiee.geojson"
    ).then((geoData) => {
      svg
        .selectAll("path")
        .data(geoData.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", "#cccccc")
        .attr("stroke", "#333333");

      loadCSV(svg, path); // Load polygons
    });

    async function loadCSV(svg, path) {
      const csvData = await d3.csv("/data/polygons.csv");

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
        .on("mouseover", function (e,d) {
          // d3.select(this).attr("fill", "rgba(0, 123, 255, 0.5)");
          console.log(getExtraInformation(routes[d.h3_cell]));
        })
        .on("mouseout", function () {
          // d3.select(this).attr("fill", "rgba(255,255,255, 0.3)");
        })
        .on("click", function (e, d) {
          console.log(d.h3_cell, maxHours, maxDistance);
          setUserSelectedCell(d.h3_cell);
          updateMap(svg, d.h3_cell);
        });

      const parsedData = csvData.map((row) => ({
        h3_cell: row.h3_cell,
        departure_date: parseDate(row.departure_date),
        trip_id: row.trip_id,
      }));

      setTripDictionary(createTripDictionary(parsedData));
      setH3CellDictionary(createH3CellDictionary(parsedData));
    }

    // Function to update the map dynamically
    function updateMap(svg, selectedCell) {
      const startDate = parseDate(`2024-11-03 ${startHour}:00:00`);

      const distances = getShortestDistanceFromH3CellSource(
        selectedCell,
        startDate
      );

      const colorScale = d3
        .scaleSequential(d3.interpolateRdYlGn)
        .domain([maxDistance, 0]);

      svg.selectAll("path").attr("fill", (d) => {
        const distance = distances[d.h3_cell];
        if (distance === undefined || distance === 10000000) {
          return "rgba(255,255,255, 0.3)";
        }
        return colorScale(distance);
      });
    }

    // Cleanup on unmount
    return () => {
      d3.select(containerRef.current).selectAll("*").remove();
    };
  }, [maxHours, startHour]);

  // Helper function to parse polygon coordinates
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

  // BFS function to calculate shortest distances
  function getShortestDistanceFromH3CellSource(h3CellSource, startDate){
    const visited = new Set();
    routes = {};
    const queue = new PriorityQueue({
        comparator: (a, b) => b.distance - a.distance // Sort by `distance` in ascending order
      });
    // const queue = [{ h3Cell: h3CellSource, distance: 0 }];
    const times = Object.fromEntries(Object.entries(h3CellDictionary).map(([k,v]) => [k,10000000]))
    queue.queue({ h3Cell: h3CellSource, time: 0, detailDistance: {
        TRAIN: 0,
        BUS: 0,
        REGIONAL: 0
    } });
    
    while (queue.length > 0) {
        const { h3Cell: currentH3Cell, time: currentElapsedTime, detailDistance: detailDistance } = queue.dequeue();
        if (times[currentH3Cell] !== undefined && times[currentH3Cell] > currentElapsedTime) {
            times[currentH3Cell] = currentElapsedTime;
            routes [currentH3Cell] = detailDistance;
        }
        
        const trips = h3CellDictionary[currentH3Cell] || [];
        for (const trip of trips) {
            const { trip_id, departure_date: departure_date_trip} = trip;
            
            // If the trip departure date minus the current distance is less than 30 minutes,
            // then add the valid h3 cells to the queue
            if (getDateDiffInMinutes(startDate, departure_date_trip)  >= currentElapsedTime + 30) {
                const newH3Cells = tripDictionary[trip_id] || [];
                for (const newH3Cell of newH3Cells) {
                    const {h3_cell: newH3CellId, departure_date: newDepartureDate, transport_mode} = newH3Cell;
                    let newElapsedTime = getDateDiffInMinutes(startDate, newDepartureDate);
                    if (newElapsedTime <= currentElapsedTime){
                        continue;
                    }
                    if (
                        newDepartureDate > departure_date_trip
                        && times[newH3CellId] > newElapsedTime 
                        && newElapsedTime < maxDistance
                    ) {
                        queue.queue({ h3Cell: newH3CellId, time: newElapsedTime, detailDistance: {
                            ...detailDistance, 
                            [transport_mode]: detailDistance[transport_mode] + getDistanceKmH3Cells(currentH3Cell, newH3CellId)
                        } });
                    }
                }
            }
        }
    }
    
    return times;
}

  // Create dictionaries for H3 cells and trips
  function createTripDictionary(data) {
    return data.reduce((acc, row) => {
        if (!acc[row.trip_id]) {
            acc[row.trip_id] = [];
        }
        acc[row.trip_id].push({
            h3_cell: row.h3_cell,
            departure_date: row.departure_date,
            transport_mode: row.transport_mode
        });
        return acc;
    }, {});
  }

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
  function getFrenchCities() {
    return d3.csv("FrenchCities_with_h3.csv").then(data => {
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
  
  //h3,x,y
  function getH3LtLn() {
    return d3.csv("data/h3_info.csv").then(data => {
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

  function parseCSVData(csvPath) {
    return d3.csv(csvPath).then(csvData => {
        return csvData.map(row => ({
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
            h3_cell: row.h3_cell
        }));
    });
  }
  function getDistanceKmH3Cells(h3Cell1, h3Cell2){
    const x1 = h3LtLn[h3Cell1][0].x;
    const y1 = h3LtLn[h3Cell1][0].y;
    const x2 = h3LtLn[h3Cell2][0].x;
    const y2 = h3LtLn[h3Cell2][0].y;
    return (Math.sqrt((x1-x2)**2 + (y1-y2)**2)/1000)*1.2;
  }

  function getDateDiffInMinutes(startDate, endDate) {
    return (endDate - startDate) / 1000 / 60;
  }

  /**
   * Calculates the linear combination of transport modes based on given distances and values.
   *
   * @param {Object} detailDistance - An object containing distances for different transport modes.
   * @param {number} detailDistance.TRAIN - The distance traveled by train.
   * @param {number} detailDistance.BUS - The distance traveled by bus.
   * @param {number} detailDistance.REGIONAL - The distance traveled by regional transport.
   * @param {number[]} values - An array of coefficients for each transport mode in the order: [train, bus, regional].
   * @returns {number} The calculated linear combination of the transport modes.
   */
  function linearCombinationTransportModes(detailDistance, values){
    return detailDistance.TRAIN * values[0] + detailDistance.BUS * values[1] + detailDistance.REGIONAL * values[2];
  }

  function getExtraInformation(detailDistance){
    return {
        distanceKm: {...detailDistance},
        co2EmissionsKg: linearCombinationTransportModes(detailDistance, [0.011,0.042, 0.030]),
        moneyEuros: linearCombinationTransportModes(detailDistance, [0.120,0.040, 0.093])
    }
  }

  return <div ref={containerRef} className="w-full h-auto" />;
};

export default D3Map;
