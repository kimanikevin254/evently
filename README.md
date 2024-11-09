# Evently

A comprehensive ticketing system that facilitates the purchase and distribution of event tickets.

## Features

-   **Full Authentication System**: Secure user authentication with JWT-based login for both organizers and customers.
-   **Event Creation**: Event organizers can create and manage events, specifying details like event name, date, venue, and ticket pricing.
-   **Ticket Creation**: Organizers can create tickets for events with different types (e.g., VIP, General Admission).
-   **Ticket Purchase Management**: Customers can browse events and purchase tickets with custom attendee details and quantities.
-   **QR Code Generation**: Every ticket comes with a unique QR code for validation, helping to prevent fraud and ensuring ticket authenticity.
-   **PDF Ticket Generation**: Professional PDF tickets are generated with embedded QR codes, event details, and custom styling.
-   **Email Sending**: Purchased tickets are automatically sent to users via email with attachments and styled content.
-   **File Cleanup**: Temporary files (QR codes and PDFs) are cleaned up after they are processed to maintain clean storage.
-   **Ticket Scanning at Event Entrance**: Organizers can scan attendee tickets using a QR code scanner (mobile or hardware) to validate tickets at the event entrance. This feature ensures that only valid ticket holders can enter the event.

## Running Locally

Make sure you have Docker and Docker compose set up on your local machine and follow these steps:

1. Clone the repo

    ```bash
    git clone https://github.com/kimanikevin254/evently.git
    ```

2. `cd` into the `api` folder:

    ```bash
    cd evently/api
    ```

3. Rename `.env.example` file to `.env` and provide all the values.

4. Run the application:

    ```bash
    docker compose up --build
    ```

5. Navigate to `localhost:3000/api/swagger` on your browser to check out all the available endpoints.
