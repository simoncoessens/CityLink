"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import PriorityQueue from "ts-priority-queue";

// Time parsing function
const parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S");

const D3Map = ({ maxHours = 4, startHour = 8 }) => {
  const containerRef = useRef(null);
  const MAP_WIDTH = 900;
  const MAP_HEIGHT = 800;

  const [tripDictionary, setTripDictionary] = useState({});
  const [h3CellDictionary, setH3CellDictionary] = useState({});
  const [userSelectedCell, setUserSelectedCell] = useState(null);
  const [maxDistance, setMaxDistance] = useState(maxHours * 60); // Convert hours to minutes

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
        .on("mouseover", function () {
          d3.select(this).attr("fill", "rgba(0, 123, 255, 0.5)");
        })
        .on("mouseout", function () {
          d3.select(this).attr("fill", "rgba(255,255,255, 0.3)");
        })
        .on("click", function (e, d) {
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
  function getShortestDistanceFromH3CellSource(h3CellSource, startDate) {
    const distances = Object.keys(h3CellDictionary).reduce((acc, key) => {
      acc[key] = 10000000; // Default large distance
      return acc;
    }, {});

    const queue = new PriorityQueue({
      comparator: (a, b) => a.distance - b.distance,
    });

    queue.queue({ h3Cell: h3CellSource, distance: 0 });

    while (queue.length > 0) {
      const { h3Cell: currentH3Cell, distance: currentDistance } =
        queue.dequeue();

      if (distances[currentH3Cell] > currentDistance) {
        distances[currentH3Cell] = currentDistance;
      }

      const trips = h3CellDictionary[currentH3Cell] || [];
      for (const trip of trips) {
        const { trip_id, departure_date } = trip;

        if ((departure_date - startDate) / 1000 / 60 - currentDistance >= 30) {
          const newH3Cells = tripDictionary[trip_id] || [];
          for (const newH3Cell of newH3Cells) {
            const newDistance =
              (newH3Cell.departure_date - startDate) / 1000 / 60;
            if (
              newDistance > currentDistance &&
              distances[newH3Cell.h3_cell] > newDistance &&
              newDistance < maxDistance
            ) {
              queue.queue({ h3Cell: newH3Cell.h3_cell, distance: newDistance });
            }
          }
        }
      }
    }

    return distances;
  }

  // Create dictionaries for H3 cells and trips
  function createTripDictionary(data) {
    return data.reduce((acc, row) => {
      if (!acc[row.trip_id]) acc[row.trip_id] = [];
      acc[row.trip_id].push({
        h3_cell: row.h3_cell,
        departure_date: row.departure_date,
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

  return <div ref={containerRef} className="w-full h-auto" />;
};

export default D3Map;
