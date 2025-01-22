"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet/dist/leaflet.css";
interface RouteMapProps {
  startLocation: { lat: number; lng: number };
  destinationLocation: { lat: number; lng: number };
}

const RouteMap: React.FC<RouteMapProps> = ({
  startLocation,
  destinationLocation,
}) => {
  const mapRef = useRef<InstanceType<typeof L.Map> | null>(null);

  const routingControlRef = useRef<L.Routing.Control | null>(null);

  useEffect(() => {
    // Ensure the map logic only runs on the client-side
    if (typeof window === "undefined") return;

    (async () => {
      await import("leaflet-routing-machine");

      // Initialize the map if it doesn't exist
      if (!mapRef.current) {
        mapRef.current = L.map("route-map", {
          zoomControl: false,
        }).setView([47.08, 2.4], 6); // Default center position

        // Add tile layer
        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
          {
            attribution: "",
            subdomains: "abcd",
            maxZoom: 19,
          }
        ).addTo(mapRef.current);
      }

      // Remove the existing routing control if present
      if (routingControlRef.current) {
        mapRef.current.removeControl(routingControlRef.current);
      }

      // Create new routing control
      routingControlRef.current = L.Routing.control({
        waypoints: [
          L.latLng(startLocation.lat, startLocation.lng),
          L.latLng(destinationLocation.lat, destinationLocation.lng),
        ],
        createMarker: () => null, // Hide markers
        routeWhileDragging: false,
        show: false, // Hide textual instructions
        addWaypoints: false,
        lineOptions: {
          styles: [{ color: "#3388ff", weight: 4 }],
        },
      }).addTo(mapRef.current);

      // When routes are found, remove the built-in UI & fit the map
      routingControlRef.current?.on("routesfound", (e) => {
        // Remove the default routing container
        const container = routingControlRef.current?.getContainer();
        if (container && container.parentNode) {
          container.parentNode.removeChild(container);
        }

        // Optionally, fit the map to the route
        if (!mapRef.current) return;
        const routes = e.routes;
        if (routes && routes.length > 0) {
          const route = routes[0];
          // route.coordinates is an array of LatLng points along the route
          const bounds = L.latLngBounds(route.coordinates);
          mapRef.current.fitBounds(bounds, {
            padding: [50, 50], // Provide some optional padding
          });
        }
      });
    })();
  }, [startLocation, destinationLocation]);

  return (
    <div
      id="route-map"
      style={{
        height: "400px",
        width: "100%",
        border: "1px solid #ccc",
      }}
    ></div>
  );
};

export default RouteMap;
