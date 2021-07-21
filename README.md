# Express authentication api service with jwt and totp

## Usage
### Development
Clone git repository:

    git clone https://github.com/GTDiablo/express-jwt-totp-auth.git

Change working directory:

    cd express-jwt-totp-auth

Install node dependencies:

    npm instsall

Start mongodb server:

    docker-compose up database

> If you already have a running mongodb server, then you can modify the `.env` file accordingly.

Start application:

    npm run dev

If you did not modify the port number or the hostname in the `.env` file, then you can access to the
api through `http://localhost:5000/api/v1`.
