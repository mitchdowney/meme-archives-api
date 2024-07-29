#!/bin/bash

# Load environment variables from paintsol-db.env
source ../paintsol-ops/config/paintsol-db.env

# Directory containing the migration files
MIGRATIONS_DIR="./migrations"

# Connect to the PostgreSQL database and run each .sql file in sequential order
for file in $(ls $MIGRATIONS_DIR/*.sql | sort -V); do
    echo "Applying migration: $file"
    PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB -p $POSTGRES_PORT -f "$file"
    if [ $? -ne 0 ]; then
        echo "Error applying migration: $file"
        exit 1
    fi
done

echo "All migrations applied successfully."
