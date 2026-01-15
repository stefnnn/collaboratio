# CH - Collaboratio Helvetica - Interactive Demo App

A real-time collaborative demo where audience members control a visual animation via their phones. One screen displays the animation (`/show`), while multiple users interact via a touch interface on their phones (`/interact`). A lobby page (`/start`) displays a QR code for easy mobile access.

Each user sees a coordinate system on their mobile phone once connected on the `/interact` and steers two parameters of the animation, not knowning which. The coordinates are sent over a websocket, collected, stored in an inmemory store and pushed to the `/show` page.
