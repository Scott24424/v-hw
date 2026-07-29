-- CreateTable
CREATE TABLE "Book" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "totalChapters" INTEGER,
    "totalPages" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RoutineBlock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'STUDY',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "completedAt" DATETIME,
    "bookId" INTEGER,
    "progressUnit" TEXT,
    "progressStart" INTEGER,
    "progressEnd" INTEGER,
    "routineBlockId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Assignment_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Assignment_routineBlockId_fkey" FOREIGN KEY ("routineBlockId") REFERENCES "RoutineBlock" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Book_title_language_key" ON "Book"("title", "language");

-- CreateIndex
CREATE INDEX "RoutineBlock_isActive_startMinute_idx" ON "RoutineBlock"("isActive", "startMinute");

-- CreateIndex
CREATE INDEX "Assignment_date_idx" ON "Assignment"("date");

-- CreateIndex
CREATE INDEX "Assignment_status_date_idx" ON "Assignment"("status", "date");
