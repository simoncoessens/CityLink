import os
import pandas as pd
import requests
from pathlib import Path
from openai import OpenAI
from tqdm import tqdm

# =======================================
#            CONFIGURATION
# =======================================
# Set your OpenAI API key
client = OpenAI(
    api_key="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"  # Replace with your actual key
)

# Pixabay API key
pixabay_api_key = "48341946-7f8ff43596cf2384ad9e1d67a"

# Paths
INPUT_CSV = "FrenchCities_with_h3.csv"
OUTPUT_CSV = "enriched_cities_dev.csv"
IMAGES_DIR = Path("./city_images")
IMAGES_DIR.mkdir(exist_ok=True)

# We need to add these columns on top of whatever columns the input CSV has
ADDITIONAL_COLUMNS = ["image_1", "image_2", "image_3", "description", "hyperlinks"]

# =======================================
#            HELPER FUNCTIONS
# =======================================
def fetch_pixabay_images(city, country, count=3):
    """
    Fetch image URLs from Pixabay for a given city and country.
    """
    url = "https://pixabay.com/api/"
    params = {
        "key": pixabay_api_key,
        "q": f"{city} {country}",
        "image_type": "photo",
        "per_page": count,
        "safesearch": "true"
    }
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        image_urls = [hit['webformatURL'] for hit in data.get('hits', [])]
        return image_urls
    except Exception as e:
        print(f"Error fetching images from Pixabay for {city}: {e}")
        return [""] * count

def save_images(image_urls, city):
    """
    Save images to the local directory IMAGES_DIR.
    Returns a list of file paths of the saved images.
    """
    saved_paths = []
    for idx, url in enumerate(image_urls):
        if not url:
            saved_paths.append("")
            continue
        try:
            response = requests.get(url)
            response.raise_for_status()
            file_path = IMAGES_DIR / f"{city}_{idx + 1}.jpg"
            with open(file_path, "wb") as file:
                file.write(response.content)
            saved_paths.append(str(file_path))
        except Exception as e:
            print(f"Error saving image {idx + 1} for {city}: {e}")
            saved_paths.append("")
    return saved_paths

def fetch_city_description(city, country):
    """
    Fetch a city description and hyperlinks using OpenAI.
    """
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a travel guide."},
                {"role": "user", "content": f"Write a short tourist guide for {city}, {country} with 2-3 hyperlinks to related websites."}
            ]
        )
        # Extract the assistant's reply
        description = response.choices[0].message.content.strip()
        # Extract hyperlinks from the description
        hyperlinks = ', '.join([word for word in description.split() if word.startswith("http")])
        return description, hyperlinks
    except Exception as e:
        print(f"Error fetching description for {city}: {e}")
        return "No description available.", ""

# =======================================
#                MAIN
# =======================================
def main():
    """
    1) Read all rows from INPUT_CSV (the original data).
    2) For each row, check if (city, country) is already in OUTPUT_CSV.
       - If found, skip it (already processed).
       - If not found, fetch images & description, then append that row
         (including ALL original columns) + new columns to OUTPUT_CSV.
    3) Progress bar from tqdm over the rows of INPUT_CSV.
    """

    # 1. Read the input CSV
    if not Path(INPUT_CSV).exists():
        print(f"Input CSV '{INPUT_CSV}' not found.")
        return
    input_df = pd.read_csv(INPUT_CSV)

    # 2. Check if OUTPUT_CSV exists; if not, create an empty one
    if Path(OUTPUT_CSV).exists():
        output_df = pd.read_csv(OUTPUT_CSV)
        print(f"Found existing output CSV: {OUTPUT_CSV}")
    else:
        # We want to keep ALL columns from input plus the additional columns.
        all_columns = list(input_df.columns)
        for col in ADDITIONAL_COLUMNS:
            if col not in all_columns:
                all_columns.append(col)
        # Create a new output DataFrame with all columns
        output_df = pd.DataFrame(columns=all_columns)
        output_df.to_csv(OUTPUT_CSV, index=False)
        print(f"Created new output CSV: {OUTPUT_CSV}")

    # 3. Ensure our additional columns exist in output_df
    for col in ADDITIONAL_COLUMNS:
        if col not in output_df.columns:
            output_df[col] = ""

    # 4. Create a set for quick lookup of (city, country) pairs already processed
    existing_pairs = set(zip(output_df["city"], output_df["country"]))

    # 5. Loop over the input_df with a progress bar
    for idx, row in tqdm(input_df.iterrows(), total=len(input_df), desc="Processing rows"):
        city = str(row["city"])
        country = str(row["country"])

        # If (city, country) already in output, skip
        if (city, country) in existing_pairs:
            continue  # Already processed

        # Otherwise, fetch images & description
        print(f"\nProcessing new row {idx}: {city}, {country}")
        image_urls = fetch_pixabay_images(city, country, count=3)
        saved_image_paths = save_images(image_urls, city)
        description, hyperlinks = fetch_city_description(city, country)

        # Convert the entire row to a dict so we keep ALL original columns
        new_row_data = row.to_dict()

        # Overwrite / add the new columns
        new_row_data["image_1"] = saved_image_paths[0] if len(saved_image_paths) > 0 else ""
        new_row_data["image_2"] = saved_image_paths[1] if len(saved_image_paths) > 1 else ""
        new_row_data["image_3"] = saved_image_paths[2] if len(saved_image_paths) > 2 else ""
        new_row_data["description"] = description
        new_row_data["hyperlinks"] = hyperlinks

        # Append new row to output_df
        output_df = output_df._append(new_row_data, ignore_index=True)

        # Mark this pair as processed
        existing_pairs.add((city, country))

        # Save progress after each new row
        output_df.to_csv(OUTPUT_CSV, index=False)

    print(f"\nAll rows from '{INPUT_CSV}' have been processed.")
    print(f"Final output is saved to '{OUTPUT_CSV}'.")

if __name__ == "__main__":
    main()
