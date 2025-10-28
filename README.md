# Inventory Vision Scanner

A browser-based inventory tool that uses an on-device TensorFlow.js MobileNet
model to classify objects or furniture captured with the device camera. Each
scan can be logged with a location and optional notes to build an inventory of
assets.

## Features

- 📷 **Live camera scanning** – activate your device camera and capture frames
  directly in the browser.
- 🤖 **On-device AI classification** – MobileNet runs locally via TensorFlow.js,
  so no server-side model hosting is required.
- 🏷️ **Automatic item labelling** – the top prediction is surfaced alongside
  alternative matches and confidence scores.
- 📍 **Inventory logging** – store the detected item with a location, notes and
  timestamp in an in-page table.

## Getting started

1. Serve the project with any static HTTP server. For example:

   ```bash
   npx serve .
   ```

   or open `index.html` directly from your file system (camera access may be
   restricted depending on the browser when using the `file://` protocol).

2. Load the app in a modern browser (Chrome, Edge, Safari or Firefox). When
   prompted, grant the page permission to access the camera.

3. Press **Start Camera**, point the device at an object or furniture item and
   click **Scan Item**.

4. Review the detected label and confidence score, add the physical location,
   optionally include notes, then press **Add to Inventory** to log it in the
   table.

## Notes

- Predictions rely on the pre-trained MobileNet model and may not be suitable
  for fine-grained distinctions (e.g. specific artwork titles). You can extend
  the solution by connecting the captured label to a custom knowledge base or
  LLM.
- For production use, consider persisting the inventory table to a backend or
  cloud database instead of keeping it in memory.
