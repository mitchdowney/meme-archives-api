
CREATE TABLE TelegramUser (
    privateId TYPE INTEGER,
    publicId VARCHAR(255) NOT NULL PRIMARY KEY,
    name VARCHAR(255),
    slug VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE CardCollection (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE CardCollectionSet (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    cardCollectionId INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cardCollectionId) REFERENCES CardCollection(id) ON DELETE CASCADE
);

CREATE TYPE edition_type AS ENUM ('normal', 'foil', 'gold');

CREATE TABLE CardCollectible (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    number INTEGER CHECK (number >= 1),
    rarity INTEGER CHECK (rarity >= 1),
    edition edition_type NOT NULL,
    about TEXT,
    artistId INTEGER,
    cardCollectionSetId INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artistId) REFERENCES Artist(id) ON DELETE SET NULL,
    FOREIGN KEY (cardCollectionSetId) REFERENCES CardCollectionSet(id) ON DELETE CASCADE,
    CONSTRAINT unique_number_edition_per_set UNIQUE (edition, number, cardCollectionSetId)
);

ALTER TABLE CardCollectible ADD CONSTRAINT unique_edition_per_set UNIQUE (edition, cardCollectionSetId);

CREATE TABLE telegramUserCardCollectible (
    telegramUserId VARCHAR(255),
    cardCollectibleId INTEGER,
    PRIMARY KEY (telegramUserId, cardCollectibleId),
    FOREIGN KEY (telegramUserId) REFERENCES TelegramUser(publicId) ON DELETE CASCADE,
    FOREIGN KEY (cardCollectibleId) REFERENCES CardCollectible(id) ON DELETE CASCADE
);
