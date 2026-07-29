#!/usr/bin/env node
import { existsSync, mkdirSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const SOURCE = join(process.cwd(), "prisma", "dev.db");
const BACKUP_DIR = join(process.cwd(), "backups");

if (!existsSync(SOURCE)) {
  console.error(`백업할 DB 파일이 없습니다: ${SOURCE}`);
  process.exit(1);
}

mkdirSync(BACKUP_DIR, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const dest = join(BACKUP_DIR, `dev-${timestamp}.db`);

copyFileSync(SOURCE, dest);
console.log(`백업 완료: ${dest}`);
