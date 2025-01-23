# CityLink

## Project Structure

The project is organized as follows:

- **app/**: Contains Next.js application routes.
  - `intro/page.tsx`: Code for the introduction page.
  - `visualization/page.tsx`: Code for the visualization page.
- **components/**: Reusable React components.
  - `animata/`: Components related to animations.
  - `core/`: Core functionality components.
  - `ui/`: UI elements and utility components.
  - `D3map.js`: Visualization using D3.js.
  - `LoadingDots.tsx`: Component for showing loading indicators.
  - `RouteMap.tsx`: Component for managing route visualizations.
- **lib/**: Shared libraries or utilities for the application.
- **public/**: Publicly accessible assets and data files.
  - `city_images/`: Folder containing city images.
  - `data/`: Data files in CSV format and data processing scripts.
    - `h3_info.csv`: Data about H3 grid cells.
    - `polygons.csv`: Data for polygons.
    - `FrenchCities_with_h3.csv`: Data for French cities with H3 references.
    - `fetch_data.py`: Script for fetching or processing data.
- **types/**: TypeScript type definitions.
- **utils/**: Utility functions for the project.

## Prerequisites

Before running the application, ensure you have the following installed:

- **Node.js**: Version 16 or higher.
- **npm** or **yarn**: For dependency management.
- **Python**: For running data preprocessing scripts (optional, if needed).

## Getting Started

Follow these steps to set up and run the project:

### 1. Clone the Repository

Clone the repository to your local machine:

```bash
git clone <repository_url>
cd <repository_folder>
```

### 2. Install Dependencies

Install the required dependencies using npm or yarn:

```bash
npm install
```

or, if you use Yarn:

```bash
yarn install
```

Ensure Python is installed on your machine.

### 3. Run the Development Server

Start the development server to view the application locally:

```bash
npm run dev
```

or, using Yarn:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to access the app.

### 4. Build for Production

To create a production-ready build of the application, run:

```bash
npm run build
```

After building, you can start the production server using:

```bash
npm start
```

## Key Scripts

Here are some commonly used scripts:

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm start`: Starts the production server.

## Folder Details

### Data Folder (`public/data/`)

- **Data Files**:
  - `h3_info.csv`, `polygons.csv`, `FrenchCities_with_h3.csv`: Provide essential data for visualizations.
- **Script**:
  - `fetch_data.py`: A Python script to process or fetch new data.

### Components Folder (`components/`)

Reusable components used throughout the project:

- `D3map.js`: Handles visualization with D3.js.
- `RouteMap.tsx`: Component for rendering route-based maps.
