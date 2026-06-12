#!/bin/sh
# Download ONS 2024-based national population projections (dataset Z1, UK).
set -e
cd "$(dirname "$0")/../data/raw"
curl -sL -o uk1.zip "https://www.ons.gov.uk/file?uri=/peoplepopulationandcommunity/populationandmigration/populationprojections/datasets/z1zippedpopulationprojectionsdatafilesuk/2024based/uk1.zip"
unzip -o -q uk1.zip
echo "downloaded and extracted to data/raw/"
