import { readFileSync } from 'fs';
import { resolve } from 'path';

const CSV_FILE = resolve(import.meta.dirname!, '..', '241d0c92-a6d7-4692-84b3-e8de031212b1.csv');
const API_URL = process.env.API_URL || 'http://localhost:51731/api/import';
const BATCH_SIZE = 100;

// ── CSV Parser ──────────────────────────────────────────────────────────────

interface CsvRecord {
	[key: string]: string;
}

/**
 * Parse a CSV string into an array of records.
 * Handles:
 *  - Quoted fields (double-quote delimited)
 *  - Commas within quoted fields
 *  - Newlines within quoted fields
 *  - Escaped double quotes ("" inside quoted fields)
 */
function parseCsv(text: string): CsvRecord[] {
	const records: CsvRecord[] = [];
	let pos = 0;
	const len = text.length;

	// Parse a single field starting at `pos`
	function parseField(): string {
		if (pos >= len) return '';

		// Quoted field
		if (text[pos] === '"') {
			pos++; // skip opening quote
			let value = '';
			while (pos < len) {
				if (text[pos] === '"') {
					// Check for escaped quote ""
					if (pos + 1 < len && text[pos + 1] === '"') {
						value += '"';
						pos += 2;
					} else {
						// End of quoted field
						pos++; // skip closing quote
						break;
					}
				} else {
					value += text[pos];
					pos++;
				}
			}
			return value;
		}

		// Unquoted field - read until comma or newline
		let value = '';
		while (pos < len && text[pos] !== ',' && text[pos] !== '\n' && text[pos] !== '\r') {
			value += text[pos];
			pos++;
		}
		return value;
	}

	function parseRow(): string[] {
		const fields: string[] = [];
		while (true) {
			fields.push(parseField());

			if (pos >= len) break;

			if (text[pos] === ',') {
				pos++; // skip comma
				continue;
			}

			// End of row: skip \r\n or \n
			if (text[pos] === '\r') pos++;
			if (pos < len && text[pos] === '\n') pos++;
			break;
		}
		return fields;
	}

	// Parse header row
	const headers = parseRow();

	// Parse data rows
	while (pos < len) {
		// Skip blank lines
		if (text[pos] === '\n') {
			pos++;
			continue;
		}
		if (text[pos] === '\r') {
			pos++;
			if (pos < len && text[pos] === '\n') pos++;
			continue;
		}

		const fields = parseRow();

		// Skip empty rows
		if (fields.length === 0 || (fields.length === 1 && fields[0] === '')) continue;

		const record: CsvRecord = {};
		for (let i = 0; i < headers.length; i++) {
			record[headers[i]] = fields[i] ?? '';
		}
		records.push(record);
	}

	return records;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
	console.log(`Reading CSV from: ${CSV_FILE}`);
	const csvText = readFileSync(CSV_FILE, 'utf-8');
	const records = parseCsv(csvText);
	console.log(`Parsed ${records.length} records from CSV`);

	if (records.length === 0) {
		console.error('No records found in CSV');
		process.exit(1);
	}

	// Show a sample record
	console.log('\nSample record:');
	console.log(JSON.stringify(records[0], null, 2));

	// Show folder distribution
	const folderCounts = new Map<string, number>();
	let emptyFolderCount = 0;
	for (const r of records) {
		const folder = r.folder?.trim() || '';
		if (!folder) {
			emptyFolderCount++;
		} else {
			folderCounts.set(folder, (folderCounts.get(folder) ?? 0) + 1);
		}
	}
	console.log(`\nUnique folders: ${folderCounts.size}`);
	console.log(`Records with empty folder: ${emptyFolderCount} (will be assigned to "Unsorted")`);

	// Count records with tags
	const withTags = records.filter((r) => r.tags?.trim()).length;
	console.log(`Records with tags: ${withTags}`);

	// Send in batches
	const totalBatches = Math.ceil(records.length / BATCH_SIZE);
	console.log(`\nImporting in ${totalBatches} batch(es) of up to ${BATCH_SIZE}...`);

	let totalBookmarks = 0;
	let totalFolders = 0;
	let totalTags = 0;
	const allErrors: string[] = [];

	for (let i = 0; i < records.length; i += BATCH_SIZE) {
		const batch = records.slice(i, i + BATCH_SIZE);
		const batchNum = Math.floor(i / BATCH_SIZE) + 1;

		console.log(`\nBatch ${batchNum}/${totalBatches} (${batch.length} records)...`);

		const response = await fetch(API_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(batch)
		});

		if (!response.ok) {
			const text = await response.text();
			console.error(`  FAILED: HTTP ${response.status} - ${text}`);
			allErrors.push(`Batch ${batchNum}: HTTP ${response.status} - ${text}`);
			continue;
		}

		const result = await response.json();
		console.log(`  Bookmarks created: ${result.bookmarksCreated}`);
		console.log(`  Folders created: ${result.foldersCreated}`);
		console.log(`  Tags created: ${result.tagsCreated}`);

		if (result.errors?.length > 0) {
			console.log(`  Errors: ${result.errors.length}`);
			for (const err of result.errors) {
				console.log(`    - ${err}`);
			}
			allErrors.push(...result.errors);
		}

		totalBookmarks += result.bookmarksCreated;
		totalFolders += result.foldersCreated;
		totalTags += result.tagsCreated;
	}

	console.log('\n════════════════════════════════════');
	console.log('Import Complete');
	console.log('════════════════════════════════════');
	console.log(`Total bookmarks created: ${totalBookmarks}`);
	console.log(`Total folders created:   ${totalFolders}`);
	console.log(`Total tags created:      ${totalTags}`);
	if (allErrors.length > 0) {
		console.log(`Total errors:            ${allErrors.length}`);
	}
}

main().catch((err) => {
	console.error('Fatal error:', err);
	process.exit(1);
});
