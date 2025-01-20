"use client";
import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet/dist/leaflet.css";

const ParisToBordeauxMap = () => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) {
      // Initialize the map
      const map = L.map("map", {
        zoomControl: false, // Simplify UI by removing zoom controls
      }).setView([47.08, 2.4], 6); // Center map between Paris and Bordeaux

      // Add minimalist map tiles
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution: "",
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      // Add routing control
      const routingControl = L.Routing.control({
        waypoints: [
          L.latLng(48.8566, 2.3522), // Paris coordinates
          L.latLng(44.8378, -0.5792), // Bordeaux coordinates
        ],
        createMarker: () => null, // Remove markers
        routeWhileDragging: false,
        show: false, // Disable the default directions panel
        addWaypoints: false, // Disable manual waypoint addition
        lineOptions: {
          styles: [{ color: "#3388ff", weight: 4 }], // Customize route line
        },
        formatter: new L.Routing.Formatter({
          itineraryBuilder: null, // Disable itinerary building
        }),
      }).addTo(map);

      // Explicitly remove textual route information
      routingControl.on("routesfound", function () {
        const container = routingControl.getContainer();
        if (container && container.parentNode) {
          container.parentNode.removeChild(container);
        }
      });

      mapRef.current = map;
    }
  }, []);

  return (
    <div
      id="map"
      style={{
        height: "400px", // Fixed height
        width: "600px", // Fixed width
        border: "1px solid #ccc", // Optional styling
      }}
    ></div>
  );
};

export default ParisToBordeauxMap;
