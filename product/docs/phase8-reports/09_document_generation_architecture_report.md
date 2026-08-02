# Phase 8 – Document Generation Architecture Report

## Overview
This document specifies the architecture of `DocumentGenerationService` for PDFs, Excel workbooks, and CSV files.

---

## Technical Stack
- **PDF Generation**: PDFKit (Vector PDF builder)
- **Excel Generation**: ExcelJS (Native `.xlsx` builder with styling, frozen panes, and auto-filters)
- **CSV Generation**: UTF-8 encoded string builder with standard escaping
