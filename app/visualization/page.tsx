"use client";
import dynamic from "next/dynamic";
import React, { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import {
  IconClipboardCopy,
  IconFileBroken,
  IconSignature,
} from "@tabler/icons-react";
import { BentoGridItem } from "@/components/ui/bento-grid";
const D3Map = dynamic(() => import("@/components/D3map"), { ssr: true });
import { TransitionPanel } from "@/components/core/transition-panel";
import {
  Carousel,
  CarouselContent,
  CarouselNavigation,
  CarouselItem,
} from "@/components/core/carousel";
import ReactMarkdown from "react-markdown";
import Typewriter from "typewriter-effect";

const RouteMap = dynamic(() => import("@/components/RouteMap"), { ssr: false });

export default function BentoGridDemo() {
  // -----------------------------
  // 1) STATE FOR TIMES, HOURS, ETC.
  // -----------------------------
  const [maxHours, setMaxHours] = useState(4);
  interface DetailInformation {
    co2EmissionsKg: number;
    moneyEuros: number;
    euclideanDistanceKm: number;
    distanceKm:{
      TRAIN: number;
      BUS: number;
      REGIONAL: number;
    }
    timeTaken: number;
    // Add other properties if needed
  }
  
  const [detailInformation, setDetailInformation] = useState<DetailInformation | null>(null);
  const [startHour, setStartHour] = useState(9);
  const [money, setMoney] = useState(12);
  const [co2, setCo2] = useState(0);
  const [activeInputTab, setActiveInputTab] = useState(0);
  const [activeInfoTab, setActiveInfoTab] = useState(0);
  const [startingLocation, setStartingLocation] = useState("");
  const [startingH3Cell, setStartingH3Cell] = useState<string | null>(null); // Starting location H3 cell
  const [filteredSuggestions, setFilteredSuggestions] = useState<CsvRow[]>([]); // To hold filtered suggestions

  // The selected H3 cell from the D3 Map
  const [selectedH3Cell, setSelectedH3Cell] = useState<string | null>(null);

  // For routing map (Paris -> Bordeaux in this example)
  const [startLocation, setStartLocation] = useState({
    lat: 48.8566, // Paris
    lng: 2.3522,
  });
  const [destinationLocation, setDestinationLocation] = useState({
    lat: 44.8378, // Bordeaux
    lng: -0.5792,
  });

  // -----------------------------
  // 2) CSV DATA & CITY LOOKUP
  // -----------------------------
  interface CsvRow {
    h3_cell: string;
    lat: string;
    lng: string;
    city?: string;
    image_1?: string;
    image_2?: string;
    image_3?: string;
    description?: string;
  }

  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [cityData, setCityData] = useState<CsvRow | null>(null);

  // <-- ADDED: We'll keep a separate lookup for h3 -> lat/lng from h3_info.csv
  interface H3InfoRow {
    h3: string;
    lat: string;
    lng: string;
  }
  const [h3LookupData, setH3LookupData] = useState<{
    [h3: string]: { lat: number; lng: number };
  }>({});

  useEffect(() => {
    Papa.parse("data/h3_info.csv", {
      download: true,
      header: true,
      complete: (results) => {
        const data = results.data as H3InfoRow[];
        const lookup: {
          [h3: string]: { lat: number; lng: number };
        } = {};
        data.forEach((row) => {
          lookup[row.h3] = {
            lat: parseFloat(row.lat),
            lng: parseFloat(row.lng),
          };
        });
        setH3LookupData(lookup);
      },
      error: (err) => {
        console.error("Error parsing h3_info.csv:", err);
      },
    });
  }, []);

  useEffect(() => {
    // Load CSV data once
    Papa.parse("/enriched_cities_dev.csv", {
      download: true,
      header: true,
      complete: (results) => {
        setCsvData(results.data as CsvRow[]);
      },
      error: (err) => {
        console.error("Error parsing CSV:", err);
      },
    });
  }, []);

  // Update the start/destination coordinates if we have matching H3s in CSV
  useEffect(() => {
    // If user typed in a starting city that corresponds to an H3 cell:
    if (startingH3Cell && csvData.length > 0) {
      const startRow = csvData.find((row) => row.h3_cell === startingH3Cell);
      if (startRow) {
        setStartLocation({
          lat: parseFloat(startRow.lat),
          lng: parseFloat(startRow.lng),
        });
      }
    }

    // If user clicked a destination cell
    if (selectedH3Cell && csvData.length > 0) {
      const destinationRow = csvData.find(
        (row) => row.h3_cell === selectedH3Cell
      );
      if (destinationRow) {
        setDestinationLocation({
          lat: parseFloat(destinationRow.lat),
          lng: parseFloat(destinationRow.lng),
        });
      }
    }
  }, [startingH3Cell, selectedH3Cell, csvData]);

  // When selectedH3Cell changes (user clicks on map):
  //  1) Try direct match in CSV
  //  2) If no match, find the closest row in CSV by lat/lon using h3ToGeo + distance calc
  useEffect(() => {
    if (selectedH3Cell && csvData.length > 0) {
      // 1) Try direct match in city CSV
      let row = csvData.find((item) => item.h3_cell === selectedH3Cell);

      if (!row) {
        // 2) If no direct match in city CSV, try fallback with h3_info.csv
        const h3Entry = h3LookupData[selectedH3Cell];
        if (!h3Entry) {
          // If it's also not in h3_info.csv, we give up
          setCityData(null);
          console.log("not in csv");
          return;
        }

        // We have lat/lng from h3_info.csv for this H3
        const cellLat = h3Entry.lat;
        const cellLng = h3Entry.lng;

        // For “closest” matching, we can do a simple Euclidean distance
        function euclideanDistance(
          lat1: number,
          lon1: number,
          lat2: number,
          lon2: number
        ): number {
          return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2));
        }

        let minDist = Infinity;
        let closestRow: CsvRow | null = null;

        for (const r of csvData) {
          const lat = parseFloat(r.lat);
          const lng = parseFloat(r.lng);
          const dist = euclideanDistance(cellLat, cellLng, lat, lng);
          if (dist < minDist) {
            minDist = dist;
            closestRow = r;
          }
        }
        row = closestRow || undefined;
        console.log(row);
      }

      setCityData(row || null);
      if (row) {
        setDestinationLocation({
          lat: parseFloat(row.lat),
          lng: parseFloat(row.lng),
        });
      }
    } else {
      setCityData(null);
    }
  }, [selectedH3Cell, csvData, h3LookupData]);

  // Handler that D3Map calls when user clicks on an H3 cell
  const handleH3CellSelect = (h3Cell: string) => {
    setSelectedH3Cell(h3Cell);
    console.log("Selected H3 Cell:", h3Cell);
  };
  const handleDetailInformation = (info: any) => {
    setDetailInformation(info);
  }

  // Suggestion select (from input box suggestions)
  const handleSuggestionSelect = (suggestion: CsvRow) => {
    if (suggestion.city) {
      setStartingLocation(suggestion.city); // Update the city name in text
      setStartingH3Cell(suggestion.h3_cell); // Update the starting H3 cell
      setFilteredSuggestions([]); // Clear suggestions
    }
  };

  // -----------------------------
  // 3) ROUTE MAP COMPONENT
  // -----------------------------
  // (No change needed here; uses startLocation/destinationLocation)
  // ...

  // -----------------------------
  // 4) INPUT TABS
  // -----------------------------
  const INPUT_TABS = [
    { title: "Time", state: maxHours, setState: setMaxHours, min: 1, max: 9 },
    {
      title: "Starting Time",
      state: startHour,
      setState: setStartHour,
      min: 1,
      max: 9,
    },
    {
      title: "Budget",
      state: money,
      setState: setMoney,
      min: 0,
      max: 200,
    },
    { title: "CO2", state: co2, setState: setCo2, min: 0, max: 500 },
  ];

  const userInputPanel = (
    <div>
      <div className="mb-4 flex space-x-2">
        {INPUT_TABS.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveInputTab(index)}
            className={`rounded-md px-3 py-1 text-sm font-medium ${
              activeInputTab === index
                ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
            }`}
          >
            {tab.title}
          </button>
        ))}
      </div>
      <div className="overflow-hidden border-t border-zinc-200 dark:border-zinc-700">
        <TransitionPanel
          activeIndex={activeInputTab}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          variants={{
            enter: { opacity: 0, y: -50, filter: "blur(4px)" },
            center: { opacity: 1, y: 0, filter: "blur(0px)" },
            exit: { opacity: 0, y: 50, filter: "blur(4px)" },
          }}
        >
          {INPUT_TABS.map((tab, index) => (
            <div key={index} className="py-2">
              <label className="block text-sm font-medium">
                {tab.title}: {tab.state.toFixed(2)}
              </label>
              <input
                type="range"
                min={tab.min}
                max={tab.max}
                step="0.05"
                value={tab.state}
                onChange={(e) => tab.setState(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          ))}
        </TransitionPanel>
      </div>
      <div className="mt-4">
        <label
          className="block text-sm font-medium mb-1"
          htmlFor="Starting Location"
        >
          Starting Location:
        </label>
        <input
          id="Starting Location"
          type="text"
          value={startingLocation}
          onChange={(e) => {
            const input = e.target.value;
            setStartingLocation(input);

            // Filter valid rows where `city` is a string that includes the input
            const matches = csvData.filter(
              (row) =>
                row.city &&
                typeof row.city === "string" &&
                row.city.toLowerCase().includes(input.toLowerCase())
            );

            setFilteredSuggestions(matches);
          }}
          placeholder="Enter your starting location"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />

        {/* Suggestions Dropdown */}
        {filteredSuggestions.length > 0 && (
          <div className="relative">
            <ul className="absolute z-10 bg-white border border-zinc-300 w-full rounded-md max-h-60 overflow-auto shadow-lg">
              {filteredSuggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  {suggestion.city}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );

  // -----------------------------
  // 5) DYNAMIC DESTINATION TAB
  // -----------------------------
  const DynamicDestinationContent = () => {
    if (!cityData) {
      return (
        <div className="p-4 text-center text-sm text-neutral-500">
          No city selected yet, or no data found.
        </div>
      );
    }

    const images = [];
    if (cityData.image_1) images.push(cityData.image_1);
    if (cityData.image_2) images.push(cityData.image_2);
    if (cityData.image_3) images.push(cityData.image_3);

    return (
      <div className="flex flex-col items-center justify-center space-y-6">
        {/* City Title */}
        {cityData.city && (
          <h2 className="text-lg font-bold text-neutral-700 dark:text-neutral-300">
            {cityData.city}
          </h2>
        )}
        {/* Carousel */}
        <div className="relative w-full max-w-lg">
          <Carousel>
            <CarouselContent className="basis-1/3">
              {images.length > 0 ? (
                images.map((imgUrl, idx) => (
                  <CarouselItem
                    key={idx}
                    className="basis-1/3 flex justify-center"
                  >
                    <div className="w-[150px] h-[150px]">
                      <img
                        src={imgUrl}
                        alt={cityData.city}
                        className="w-full h-full object-cover rounded-md"
                      />
                    </div>
                  </CarouselItem>
                ))
              ) : (
                <CarouselItem className="basis-1/3 flex justify-center">
                  <div className="w-[150px] h-[150px] bg-gray-200 text-gray-400 flex items-center justify-center rounded-md">
                    No Images
                  </div>
                </CarouselItem>
              )}
            </CarouselContent>
            <CarouselNavigation />
          </Carousel>
        </div>

        {/* Information */}
        <div className="overflow-y-auto max-h-48 px-4 text-center">
          <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 whitespace-pre-line">
            <ReactMarkdown
              components={{
                a: ({ href, children }) => (
                  <a
                    href={href!}
                    className="text-blue-600 underline hover:text-blue-800"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {cityData.description || ""}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    );
  };

  // -----------------------------
  // 6) INFO TABS (INCL. DESTINATION)
  // -----------------------------
  const INFO_TABS = [
    {
      title: "Destination",
      content: <DynamicDestinationContent />,
    },
    {
      title: "Route",
      content: (
        <RouteMap
          startLocation={startLocation}
          destinationLocation={destinationLocation}
        />
      ),
    },
    {
      title: "Info",
      content: (
        <div className="p-4 text-center">
          <h3 className="text-lg font-semibold">Additional Trip Information</h3>
          {detailInformation && (
            <div className="text-left">
                <p>CO2 Emissions using public Transport: {detailInformation.co2EmissionsKg.toFixed(0)} kg</p>
                <p>Money: {detailInformation.moneyEuros.toFixed(0)} Euros</p>
                <p>Time: {Math.floor(detailInformation.timeTaken / 60)} hours {detailInformation.timeTaken % 60} minutes</p>
                <br/>
                <strong>Distance traveled in different public transport methods:</strong>
                {detailInformation.distanceKm.TRAIN > 0 && (
                  <p>Distance traveled in HighSpeed Train: {detailInformation.distanceKm.TRAIN.toFixed(0)} km</p>
                )}
                {detailInformation.distanceKm.BUS > 0 && (
                  <p>Distance traveled in Bus: {detailInformation.distanceKm.BUS.toFixed(0)} km</p>
                )}
                {detailInformation.distanceKm.REGIONAL > 0 && (
                  <p>Distance traveled in Regional Transport: {detailInformation.distanceKm.REGIONAL.toFixed(0)} km</p>
                )}
                <br/>
                <p>If you were to catch a flight it would be around: {(
                  (detailInformation.distanceKm.TRAIN+detailInformation.distanceKm.REGIONAL)*0.164).toFixed(0) } kg 
                  of CO2 emissions.
                </p>

                <p className="mt-4 text-sm text-neutral-500">
                  Disclaimer: Prices, CO2 emissions, and time spent are approximations and may vary based on various factors.
                </p>
            </div>
          )}
        </div>
      ),
    },
  ];

  const infoCardsPanel = (
    <div>
      <div className="mb-4 flex space-x-2">
        {INFO_TABS.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveInfoTab(index)}
            className={`rounded-md px-3 py-1 text-sm font-medium ${
              activeInfoTab === index
                ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
            }`}
          >
            {tab.title}
          </button>
        ))}
      </div>
      <div className="overflow-hidden border-t border-zinc-200 dark:border-zinc-700">
        <TransitionPanel
          activeIndex={activeInfoTab}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          variants={{
            enter: { opacity: 0, y: -50, filter: "blur(4px)" },
            center: { opacity: 1, y: 0, filter: "blur(0px)" },
            exit: { opacity: 0, y: 50, filter: "blur(4px)" },
          }}
        >
          {INFO_TABS.map((tab, index) => (
            <div key={index} className="py-2">
              {tab.content}
            </div>
          ))}
        </TransitionPanel>
      </div>
    </div>
  );

  // -----------------------------
  // 7) BUILD THE MAIN GRID
  // -----------------------------
  const items = [
    {
      title: "Map",
      description:
        "Explore the map. Click on a destination to see its information.",
      header: (
        <div className="relative h-full w-full">
          <h2 className="absolute top-4 left-1/2 transform -translate-x-1/2 text-black font-bold z-10">
            <Typewriter
              key={startingLocation}
              options={{
                delay: 20, // Sets typing delay to 30ms per character
              }}
              onInit={(typewriter) => {
                typewriter
                  .typeString(
                    startingLocation
                      ? "Now you can select a destination to go to <br> The map shows how long it takes to travel to certain destinations."
                      : "Begin by typing your starting location."
                  )
                  .pauseFor(1000000) // Pauses indefinitely after typing
                  .start();
              }}
            />
          </h2>
          <div className="absolute top-[60%] left-[40%] transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-[700px] h-[700px]">
              <D3Map
                maxHours={maxHours}
                startHour={startHour}
                money={money}
                co2={co2}
                onH3CellSelect={handleH3CellSelect}
                startingH3Cell={startingH3Cell}
                setDetailInformation={setDetailInformation}
              />
            </div>
          </div>
        </div>
      ),
      icon: <IconClipboardCopy className="h-4 w-4 text-neutral-500" />,
    },
    {
      title: "",
      description: "",
      header: userInputPanel,
      icon: <></>,
    },
    {
      title: "",
      description: "",
      header: infoCardsPanel,
      icon: <></>,
    },
  ];

  // -----------------------------
  // 8) RENDER
  // -----------------------------
  return (
    <div className="max-w-[1600px] mx-auto px-4 mt-8 h-[calc(100vh-50px)]">
      <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-6 flex-grow h-full">
        <div className="flex flex-col h-full">
          <BentoGridItem
            title={items[0].title}
            description={items[0].description}
            header={items[0].header}
            icon={items[0].icon}
            className="h-full"
          />
        </div>

        <div className="grid grid-rows-3 gap-6 h-full">
          <div className="row-span-1 flex flex-col">
            <BentoGridItem
              title={items[1].title}
              description={items[1].description}
              header={items[1].header}
              icon={items[1].icon}
              className="h-full"
            />
          </div>
          <div className="row-span-2 flex flex-col">
            <BentoGridItem
              title={items[2].title}
              description={items[2].description}
              header={items[2].header}
              icon={items[2].icon}
              className="h-full"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 mb-2">
        <p className="text-center text-sm text-neutral-500">CityLink</p>
      </div>
    </div>
  );
}
