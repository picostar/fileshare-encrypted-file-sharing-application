# FileShare   Encrypted File Sharing Application

## Overview
FileShare is a web application that allows users to securely upload files with client-side encryption and share them via unique download links with QR codes.

## Core Features

### File Upload
- Users can select and upload files through a web interface
- Files are encrypted using AES-256 encryption in the browser before upload
- The encrypted file data is sent to the backend for storage
- Display upload progress and success confirmation

### File Storage
- Backend stores encrypted files with unique identifiers
- Backend generates and returns unique download links for each uploaded file
- Files remain encrypted in storage

### File Listing
- Display a list of previously uploaded files
- Show file metadata including original filename, file size, and upload timestamp
- Provide access to download links and QR codes for each file

### File Deletion
- Users can delete their uploaded files from the file list interface
- Backend removes both the encrypted file data and file metadata when deletion is requested
- After successful deletion, the file is no longer accessible via download link or QR code
- Display clear confirmation messages for successful deletion
- Provide error handling and user feedback for failed deletion attempts
- Update the file list interface immediately after successful deletion

### File Sharing
- Generate unique download links that include both file identifier and encryption key as URL parameters
- Create QR codes in the ShareDialog component that always encode the complete, actual download URL with the full file ID and encryption key parameters
- The QR code generator utility in frontend/src/lib/qrcode.ts must reliably encode the complete, actual download link without any truncation, placeholders, or unrelated URLs
- QR codes must be generated as version 15-20 QR codes (larger grid) with error correction level H (30% error correction) for maximum reliability and scannability
- QR codes must be pure black on white with no gray edges or gradients, and generated at a minimum image size of 800×800 pixels for optimal scanning quality
- QR codes must contain the complete, properly formatted download URL including protocol, domain, file ID, and encryption key with full URI integrity
- Generated QR codes must be scannable and recognized by all standard QR code readers with guaranteed compatibility
- Include a verification step in the ShareDialog to display the exact URL being encoded in the QR code, allowing users to confirm the QR code matches the intended download link
- Display both the download link and QR code to the user after successful upload, with clear verification that they match
- Implement robust error handling and fallback mechanisms when QR code generation fails
- Show clear fallback UI when QR code generation is unavailable, including manual retry buttons and alternative sharing methods
- Include troubleshooting guidance and help text when QR code generation encounters issues
- Use established QR code generation libraries with proven reliability and proper error correction levels
- Ensure QR codes are properly sized, have adequate contrast, and include sufficient error correction for reliable scanning
- Include loading states, success indicators, and detailed error messages during QR code generation process
- Implement graceful degradation when QR code resources are unavailable with clear user communication in English
- Test QR code display to confirm it matches the download link shown with automated validation
- Provide clear confirmation messages when QR codes are successfully generated and validated
- Include comprehensive testing to ensure QR code compatibility across different scanning devices and applications
- Provide clear user feedback if QR code generation fails, with specific error messages and retry options

### File Download
- Users can access files via the unique download links from both direct links and QR codes
- Download page must reliably extract file identifier and encryption key from URL parameters with robust parsing
- Backend must properly serve encrypted files when valid download links are accessed with correct HTTP headers and CORS configuration
- Files are decrypted in the browser after download using the encryption key from the URL with proper error handling
- Original filename and content are restored for the user
- Download process must work seamlessly from QR code scans and direct button clicks with comprehensive end-to-end testing
- Ensure proper error handling for invalid or expired download links, missing encryption keys, corrupted files, and decryption failures
- Verify that the decryption process correctly handles the encryption keys and file restoration with validation checks
- Provide clear user feedback during download and decryption process with detailed progress indicators and error messages in English
- Handle cases where QR code scanning fails or produces invalid URLs with graceful fallback options
- Implement robust testing of the complete download flow to ensure reliability from QR scan to file save
- Test the full end-to-end flow: upload → encrypt → generate QR → scan QR → download → decrypt → save file
- Add comprehensive validation of URL parameters and encryption key format before attempting decryption
- Include retry mechanisms for failed download attempts and network issues

## Backend Requirements
- Store encrypted file data with unique identifiers
- Generate unique download URLs for file access that work reliably with QR codes
- Properly serve encrypted files when valid download links are accessed with appropriate HTTP headers, content type, and CORS configuration
- Handle file metadata (original filename, file size, upload timestamp)
- Provide endpoints to retrieve list of uploaded files
- Provide endpoint to delete files by unique identifier
- Remove both encrypted file data and metadata when deletion is requested
- Return appropriate HTTP status codes for successful and failed deletion attempts
- Ensure deleted files are no longer accessible via download links
- Ensure download endpoints return files with correct headers, content type, and proper error responses
- Validate download link format and accessibility with comprehensive error handling
- Return proper HTTP status codes and error responses for invalid file requests, missing files, and server errors
- Implement robust file serving with proper content disposition headers for download

## Frontend Requirements
- File selection and upload interface with proper error handling and validation
- Client-side AES-256 encryption before upload with secure key generation and validation
- QR code generation in ShareDialog component that always encodes the complete, actual download URL with the full file ID and encryption key parameters, never placeholders or unrelated URLs
- QR code generator utility in frontend/src/lib/qrcode.ts that reliably encodes the complete, actual download link without truncation, placeholders, or incorrect URLs
- QR codes must be generated as version 15-20 QR codes (larger grid) with error correction level H (30% error correction) and minimum image size of 800×800 pixels
- QR codes must be pure black on white with no gray edges or gradients for optimal visual clarity and scanning reliability
- Include verification step in ShareDialog to display the exact URL being encoded in the QR code, allowing users to confirm the QR code matches the intended download link
- Ensure generated QR codes are scannable and compatible with all standard QR code readers through comprehensive testing
- Implement comprehensive error handling and fallback strategies for QR code generation failures
- Validate that generated QR codes exactly match the download link shown and provide clear user feedback confirming successful QR generation
- QR codes must contain complete, properly formatted download URLs with all required parameters and full URI integrity
- Test and verify that QR code display matches the download link shown with automated validation
- Display loading states during QR code generation and clear success/failure indicators with progress feedback
- Provide clear confirmation messages when QR codes are successfully generated and validated against the download link
- Include troubleshooting guidance and user help text for QR code generation and scanning issues
- Ensure QR code functionality works reliably across all environments including production
- Provide clear user feedback if QR code generation fails, with specific error messages and retry options
- File deletion interface with delete buttons or actions in the file list
- Confirmation dialogs or prompts before file deletion to prevent accidental removal
- Handle deletion requests to the backend with proper error handling
- Update file list immediately after successful deletion
- Display clear success messages for completed deletions
- Show error messages for failed deletion attempts with actionable guidance
- File download functionality in both FileList and DownloadPage components that reliably handles the complete end-to-end process
- Download page that correctly extracts file ID and encryption key from URL parameters with robust parsing and validation
- Proper fetching of encrypted files from backend with error handling for network issues and server errors
- Reliable decryption using the proper key with validation and error handling for corrupted data
- Trigger file download with original filename and proper file handling
- Comprehensive end-to-end testing and validation of the complete flow from QR code generation through successful file download and decryption
- Display upload status and generated sharing links with clear visual feedback
- File listing interface showing uploaded files with working download functionality and proper state management
- Functional download buttons that properly trigger the download and decryption process with loading indicators
- Proper component rendering and state management for download operations with error boundaries
- Responsive design that works across different screen sizes
- Enhanced error handling for failed downloads, decryption issues, invalid links, missing parameters, corrupted files, and QR code generation failures
- Clear, detailed user feedback messages in English for all error states and processing steps with actionable guidance
- Ensure QR code scanning leads to proper file download page with working functionality and proper URL handling
- Implement retry mechanisms for failed operations where appropriate with exponential backoff
- Use established, working QR code generation patterns and libraries for reliable QR code creation with proven track record
- Add comprehensive logging and debugging capabilities for troubleshooting QR code and download issues
- Include user guidance and help text for QR code scanning and file download processes
- All application content and user interface text must be in English
