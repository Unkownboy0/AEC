import fs from 'node:fs/promises';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';
const input='D:/dont touch/crm/product/server/tmp/finance-qa/finance-report.xlsx';
const workbook=await SpreadsheetFile.importXlsx(await FileBlob.load(input));
console.log((await workbook.inspect({kind:'table',range:'Finance Report!A1:Z10',include:'values,formulas',tableMaxRows:10,tableMaxCols:26,maxChars:5000})).ndjson);
console.log((await workbook.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',options:{useRegex:true,maxResults:50},summary:'finance report formula error scan'})).ndjson);
const preview=await workbook.render({sheetName:'Finance Report',range:'A1:Z10',scale:1.5,format:'png'});
await fs.writeFile('D:/dont touch/crm/product/server/tmp/finance-qa/finance-report-xlsx.png',new Uint8Array(await preview.arrayBuffer()));
