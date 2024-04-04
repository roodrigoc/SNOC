
![snoc](https://github.com/roodrigoc/SNOC/assets/52783418/a6d50334-e521-4b06-8a64-5bb7e3bc716c)

# Simple Network Operation Center (SNOC)

## Project Description

SNOC is a Node.js application designed for basic network monitoring and management tasks. It provides functionalities for monitoring device status via ping or HTTP GET requests, as well as monitoring shared network folders and retrieving information about the latest WAV or MP3 file in a specified directory. The project includes both server-side and client-side components for real-time monitoring and alerting.

## Server-Side Components

The server-side of the application, implemented in Node.js with Express.js and WebSocket, serves as the backbone for data processing and communication with clients. Key components include:

### SNOC Server (snocsrv.js):
- Utilizes Express.js for serving static files and handling API endpoints.
- Implements WebSocket for establishing a real-time connection with clients.
- Monitors device status by periodically sending ping or GET requests to specified devices.
- Sends email alerts when device status changes (online to offline or vice versa).
- Logs connection information to a file with adjusted GMT-3 timezone.
- Provides functionality for monitoring shared network folders and retrieving information about the latest WAV or MP3 file.

### Configuration File (snoc.conf):
- Contains SMTP and email configuration for sending email alerts. The password must be encrypted with the BASE64 algorithm (https://www.base64encode.org/).

## Client-Side Components

The client-side of the application, presented through a web interface served by Express.js, offers real-time monitoring capabilities and user interaction. Key components include:

### HTML Interface (index.html):
- Displays a header with the SNOC logo and title.
- Shows a grid layout of monitored devices with their status and active/inactive time.
- Includes functionality to display the latest audio file from a shared folder.
- Updates device status and audio information in real-time using WebSocket communication.

### Styling (main.css):
- Provides styling for the HTML interface, distinguishing between online and offline devices.

## Additional Files

In addition to the previously mentioned files, the project also includes the following additional files:

### devices.conf

The `devices.conf` file is used to configure the devices that will be monitored by SNOC. Each line represents a device and follows the syntax:

`<Device Name>|<IP Address or URL>|<Protocol>|<Permission>|<Visibility>`

- `<Device Name>`: Identifying name of the device.
- `<IP Address or URL>`: IP address or URL of the device.
- `<Protocol>`: Protocol to be used to check the device status (icmp for ping or web for HTTP GET).
- `<Permission>`: Permission to receive email alerts (E to send email alerts, NE to not send).
- `<Visibility>`: Show or hide the device on the home page.

#### Email Groups: SNOC supports email groups. Use the permission field to specify which group a device belongs to.
#### For example, devices with permission E1 will send email alerts to the recipients listed in the E1 group in `snoc.conf`.

Example:

ping-test|192.168.100.20|icmp|E1|show

cam01|192.168.100.21|icmp|E3|hide

Google|https://www.google.com/|web|NE|show

WEB Server|http://192.168.100.12/|web|E2|show



### access.log

The `access.log` file records information about connections made to the SNOC server. It follows the standard log format and contains entries like:

[Date and Time] Connection from "IP Address" (User: "username")

Example:

[2024-02-22T17:28:09.797] Connection from 192.168.100.5 (User: user01)

[2024-03-25T23:01:56.613] Connection from 192.168.100.10 (User: user02)



### users.conf

The `users.conf` file is used to allow access via basic authentication. The file must contain passwords encrypted with the BASE64 algorithm (https://www.base64encode.org/). Each line represents a user and
follows the syntax:


username:password

Example:

user01:MTIzYWJjNDU2



## Getting Started

To run the application locally, follow these steps:

1. Ensure Node.js is installed on your system.
2. Install dependencies using `npm install`.

- npm install axios child_process express fs nodemailer path ping ws basic-auth express-rate-limit base64-arraybuffer

3. Configure the SMTP and email settings in `snoc.conf`.
4. Enter the server IP address in the `devices.js` file.
5. Start the server using `node snocsrv.js`.
6. Access the web interface via `http://localhost:3000` in your browser.



## Reporting Bugs
If you encounter problems with SNOC, please file a github issue.

## License
SNOC is licensed under the GPLv3+.
