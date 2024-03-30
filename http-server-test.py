import http.server
import socketserver

handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", 80), handler) as server:
    print("Web server started (Port 80)")
    try:

        server.serve_forever()
    except KeyboardInterrupt:
        print("\nWeb server closed...")