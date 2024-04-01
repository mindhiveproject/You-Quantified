-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "password" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "content" JSONB,
    "author" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "code_filesize" INTEGER,
    "code_filename" TEXT,
    "parameters" JSONB DEFAULT '[{"name":"Untitled","suggested":["Alpha"]}]',
    "visual" TEXT,
    "unit" TEXT,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLesson" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "content" JSONB,
    "author" TEXT,
    "startedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "code_filesize" INTEGER,
    "code_filename" TEXT,
    "parameters" JSONB DEFAULT '[{"name":"Untitled","suggested":["Alpha"]}]',
    "lesson" TEXT,

    CONSTRAINT "UserLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "duration" INTEGER,
    "description" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visual" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "cover_filesize" INTEGER,
    "cover_extension" TEXT,
    "cover_width" INTEGER,
    "cover_height" INTEGER,
    "cover_id" TEXT,
    "code_filesize" INTEGER,
    "code_filename" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "author" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "parameters" JSONB DEFAULT '[{"name":"Sample","suggested":["Alpha"]}]',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "editable" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Visual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_Tag_visuals" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_Visual_tags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Lesson_author_idx" ON "Lesson"("author");

-- CreateIndex
CREATE INDEX "Lesson_visual_idx" ON "Lesson"("visual");

-- CreateIndex
CREATE INDEX "Lesson_unit_idx" ON "Lesson"("unit");

-- CreateIndex
CREATE INDEX "UserLesson_author_idx" ON "UserLesson"("author");

-- CreateIndex
CREATE INDEX "UserLesson_lesson_idx" ON "UserLesson"("lesson");

-- CreateIndex
CREATE INDEX "Visual_author_idx" ON "Visual"("author");

-- CreateIndex
CREATE UNIQUE INDEX "_Tag_visuals_AB_unique" ON "_Tag_visuals"("A", "B");

-- CreateIndex
CREATE INDEX "_Tag_visuals_B_index" ON "_Tag_visuals"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_Visual_tags_AB_unique" ON "_Visual_tags"("A", "B");

-- CreateIndex
CREATE INDEX "_Visual_tags_B_index" ON "_Visual_tags"("B");

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_author_fkey" FOREIGN KEY ("author") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_visual_fkey" FOREIGN KEY ("visual") REFERENCES "Visual"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_unit_fkey" FOREIGN KEY ("unit") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLesson" ADD CONSTRAINT "UserLesson_author_fkey" FOREIGN KEY ("author") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLesson" ADD CONSTRAINT "UserLesson_lesson_fkey" FOREIGN KEY ("lesson") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visual" ADD CONSTRAINT "Visual_author_fkey" FOREIGN KEY ("author") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Tag_visuals" ADD CONSTRAINT "_Tag_visuals_A_fkey" FOREIGN KEY ("A") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Tag_visuals" ADD CONSTRAINT "_Tag_visuals_B_fkey" FOREIGN KEY ("B") REFERENCES "Visual"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Visual_tags" ADD CONSTRAINT "_Visual_tags_A_fkey" FOREIGN KEY ("A") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Visual_tags" ADD CONSTRAINT "_Visual_tags_B_fkey" FOREIGN KEY ("B") REFERENCES "Visual"("id") ON DELETE CASCADE ON UPDATE CASCADE;
