# Product Manufacturer Mapping

## Overview

This project is designed to process and analyze product data from multiple sources, map related manufacturers, and provide insights into manufacturer relationships.

## Table of Contents

1. [Setup](#setup)
2. [Usage](#usage)
3. [Main Components](#main-components)
4. [Data Flow](#data-flow)
5. [Output](#output)
6. [Performance Improvements](#performance-improvements)
7. [Validation Enhancements](#validation-enhancements)
8. [Logging](#logging)

## Setup

### Prerequisites

- Node.js (v14 or later recommended)
- npm (usually comes with Node.js)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/zahidhasann88/product-manufacturer-mapping.git
   cd product-manufacturer-mapping
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Place your CSV data files in the `./data` directory.

## Usage

1. To compile the TypeScript code and run the application, use:
   ```bash
   npm run build-and-start
   ```

## Main Components

### 1. CSV Reader (`csvReader.ts`)

Reads and parses CSV files containing product data and matches. Utilizes parallel processing for improved performance when handling multiple CSV files.

### 2. Manufacturer Mapper (`manufacturerMapper.ts`)

Maps related manufacturers based on product data and matches. It also determines the relationship type (parent/child/sibling) between manufacturers.

### 3. Brand Assigner (`brandAssigner.ts`)

Assigns a brand to a given product title based on the manufacturer relations. The brand is determined using a case-insensitive match against the product title.

### 4. Database Manager (`databaseManager.ts`)

Handles all database operations, including initializing the database, saving manufacturer relations, and retrieving data. The database operations ensure transactional integrity during complex operations.

### 5. Logger (`logger.ts`)

Configures and manages application logging. Logs are written to both console and file, with configurable log levels and directory paths.

### 6. Validation Algorithm (`validationAlgorithm.ts`)

Implements heuristics to flag potentially faulty manufacturer matches, improving data quality by detecting anomalies.

## Data Flow

1. **CSV Reading**: CSV files are read in parallel from the `data/` directory using the CSV Reader.
2. **Manufacturer Mapping**: Product data and matches are processed by the Manufacturer Mapper, leveraging enhanced relationship detection algorithms.
3. **Brand Assignment**: Product titles are assigned a brand using the Brand Assigner.
4. **Database Operations**: Manufacturer relations are generated and saved to the SQLite database via the Database Manager.
5. **Validation**: The Validation Algorithm flags potentially problematic manufacturer matches.
6. **Logging**: All operations and results are logged to both the console and log files.

## Output

The program produces the following outputs:

1. **Console Logs**: Detailed process steps and results are output to the console.
2. **Log Files**: Logs are stored in the `logs/` directory for comprehensive debugging and auditing.
3. **SQLite Database**: A database file (`manufacturer_relations.db`) containing the manufacturer relations.
4. **Flagged Manufacturers**: A list of manufacturers that may require manual review, based on the enhanced validation algorithm.

## Performance Improvements

The implementation includes parallel processing for CSV file reading, which significantly improves performance when dealing with multiple data files.

## Validation Enhancements

The validation algorithm includes additional heuristics such as string similarity checks and detection of number-only manufacturers, reducing the likelihood of false matches.

## Logging

### Configuration

Logging is configured via environment variables:

- **`LOG_DIR`**: Specifies the directory where log files are stored (default: `./logs`).
- **`LOG_LEVEL`**: Specifies the log level (`info`, `error`, etc.), allowing fine-grained control over logging verbosity.

### Log Outputs

- **Error Logs**: Stored in `logs/error.log` for capturing error-level messages.
- **Combined Logs**: Stored in `logs/combined.log`, containing all log messages above the configured log level.