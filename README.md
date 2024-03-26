# Simple Network Operation Center (SNOC)

## Project Description

SNOC is a Node.js application designed for basic network monitoring and management tasks. It provides functionalities for monitoring device status via ping or HTTP GET requests, as well as monitoring shared network folders and retrieving information about the latest WAV file in a specified directory. The project includes both server-side and client-side components for real-time monitoring and alerting.

## Server-Side Components

The server-side of the application, implemented in Node.js with Express.js and WebSocket, serves as the backbone for data processing and communication with clients. Key components include:

### SNOC Server (nocsrv.js):
- Utilizes Express.js for serving static files and handling API endpoints.
- Implements WebSocket for establishing a real-time connection with clients.
- Monitors device status by periodically sending ping or GET requests to specified devices.
- Sends email alerts when device status changes (online to offline or vice versa).
- Logs connection information to a file with adjusted GMT-3 timezone.
- Provides functionality for monitoring shared network folders and retrieving information about the latest WAV file.

### Configuration File (noc.conf):
- Contains SMTP and email configuration for sending email alerts.

## Client-Side Components

The client-side of the application, presented through a web interface served by Express.js, offers real-time monitoring capabilities and user interaction. Key components include:

### HTML Interface (index.html):
- Displays a header with the SNOC logo and title.
- Shows a grid layout of monitored devices with their status and active/inactive time.
- Includes functionality to display and download the latest audio file from a shared folder.
- Updates device status and audio information in real-time using WebSocket communication.

### Styling (CSS):
- Provides styling for the HTML interface, distinguishing between online and offline devices.

## Additional Features

In addition to basic network monitoring functionalities, SNOC includes:

- Email Alerts: Sends email alerts to configured addresses when a device status changes.
- Audio Alerts: Capable of playing an audio alert when one or more devices go offline (commented out in the code).
- Shared Network Folder Monitoring: Allows monitoring of shared network folders and retrieval of the latest WAV file within a specified directory.

## Getting Started

To run the application locally, follow these steps:

1. Ensure Node.js is installed on your system.
2. Install dependencies using `npm install`.
3. Configure the SMTP and email settings in `noc.conf`.
4. Start the server using `node nocsrv.js`.
5. Access the web interface via `http://localhost:3000` in your browser.

Feel free to explore and contribute to this project! If you encounter any issues or have suggestions, please open an issue on GitHub.
