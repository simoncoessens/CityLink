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
const D3Map = dynamic(() => import("@/components/D3map"), { ssr: false });
import { TransitionPanel } from "@/components/core/transition-panel";
import {
  Carousel,
  CarouselContent,
  CarouselNavigation,
  CarouselItem,
} from "@/components/core/carousel";
import ReactMarkdown from "react-markdown";

const RouteMap = dynamic(() => import("@/components/RouteMap"), { ssr: false });

export default function BentoGridDemo() {
  // -----------------------------
  // 1) STATE FOR TIMES, HOURS, ETC.
  // -----------------------------
  const [maxHours, setMaxHours] = useState(4);
  const [startHour, setStartHour] = useState(9);
  const [activeInputTab, setActiveInputTab] = useState(0);
  const [activeInfoTab, setActiveInfoTab] = useState(0);
  const [startingLocation, setStartingLocation] = useState("");
  const [startingH3Cell, setStartingH3Cell] = useState<string | null>(null); // Starting location H3 cell
  const [filteredSuggestions, setFilteredSuggestions] = useState<CsvRow[]>([]); // To hold filtered suggestions

  // The selected H3 cell from the D3 Map
  const [selectedH3Cell, setSelectedH3Cell] = useState(null);

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

  useEffect(() => {
    // Update startLocation based on startingH3Cell
    if (startingH3Cell && csvData.length > 0) {
      const startRow = csvData.find((row) => row.h3_cell === startingH3Cell);
      if (startRow) {
        setStartLocation({
          lat: parseFloat(startRow.lat),
          lng: parseFloat(startRow.lng),
        });
      }
    }

    // Update destinationLocation based on selectedH3Cell
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

  // Parse the CSV on first render
  useEffect(() => {
    Papa.parse("/enriched_cities_dev.csv", {
      download: true,
      header: true, // treats first row as a header
      complete: (results) => {
        setCsvData(results.data as CsvRow[]);
      },
      error: (err) => {
        console.error("Error parsing CSV:", err);
      },
    });
  }, []);

  // When selectedH3Cell changes, or when csvData is loaded, find the matching row
  useEffect(() => {
    if (selectedH3Cell && csvData.length > 0) {
      console.log("match with csv");
      const row = csvData.find((item) => item.h3_cell === selectedH3Cell);
      setCityData(row || null);
    } else {
      // If no cell selected or no CSV loaded yet
      setCityData(null);
    }
  }, [selectedH3Cell, csvData]);

  // Handler that D3Map calls when user clicks on an H3 cell
  const handleH3CellSelect = (h3Cell: React.SetStateAction<null>) => {
    setSelectedH3Cell(h3Cell);
    console.log("Selected H3 Cell:", h3Cell);
  };

  // Dropdown suggestion click handler
  interface Suggestion {
    city: string;
    h3_cell: string;
  }

  const handleSuggestionSelect = (suggestion: CsvRow) => {
    if (suggestion.city) {
      setStartingLocation(suggestion.city); // Update the city name
      setStartingH3Cell(suggestion.h3_cell); // Update starting H3 cell
      setFilteredSuggestions([]); // Clear suggestions
    }
  };

  // -----------------------------
  // 3) ROUTE MAP COMPONENT
  // -----------------------------

  // -----------------------------
  // 4) INPUT TABS
  // -----------------------------
  const INPUT_TABS = [
    { title: "Time", state: maxHours, setState: setMaxHours, min: 1, max: 9 },
    {
      title: "Money",
      state: startHour,
      setState: setStartHour,
      min: 0,
      max: 24,
    },
    { title: "CO2", state: 50, setState: () => {}, min: 0, max: 500 },
  ];

  // The User Input Panel
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
                {tab.title}: {tab.state}
              </label>
              <input
                type="range"
                min={tab.min}
                max={tab.max}
                value={tab.state}
                onChange={(e) => tab.setState(parseInt(e.target.value))}
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

            // Filter valid rows where `city` exists and matches the input
            const matches = csvData.filter(
              (row) =>
                row.city && // Ensure `city` exists
                typeof row.city === "string" && // Ensure `city` is a string
                row.city.toLowerCase().includes(input.toLowerCase()) // Check for matches
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
  //
  // We pull data from cityData (which is updated from the CSV).
  // We'll replicate the structure you had for the "Paris" example,
  // but show images and text from cityData where possible.

  const DynamicDestinationContent = () => {
    // If no cityData, show a simple placeholder
    if (!cityData) {
      return (
        <div className="p-4 text-center text-sm text-neutral-500">
          No city selected yet, or no data found.
        </div>
      );
    }

    // Prepare images (we check if they exist in CSV)
    const images = [];
    if (cityData.image_1) images.push(cityData.image_1);
    if (cityData.image_2) images.push(cityData.image_2);
    if (cityData.image_3) images.push(cityData.image_3);

    return (
      <div className="flex flex-col items-center justify-center space-y-6">
        {/* Carousel of up to 3 images */}
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
        <div className="overflow-y-auto max-h-72 px-4 text-center">
          {/* City Title */}
          <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 whitespace-pre-line">
            <ReactMarkdown
              components={{
                a: ({ href, children }) => (
                  <a
                    href={href}
                    className="text-blue-600 underline hover:text-blue-800"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {cityData.description}
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
          {/* You can customize a third tab here if desired */}
          Additional city info or random tab.
        </div>
      ),
    },
  ];

  // The Info Cards Panel
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
      description: "Explore the map. Click on a cell to load city info.",
      header: (
        <div className="relative h-full w-full">
          <div className="absolute top-[60%] left-[40%] transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-[700px] h-[700px]">
              <D3Map
                maxHours={maxHours}
                startHour={startHour}
                onH3CellSelect={handleH3CellSelect}
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
    <div className="flex flex-col justify-between max-w-7xl px-4 mx-auto mt-8 h-[calc(100vh-50px)]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
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
