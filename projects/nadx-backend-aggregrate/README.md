## Support

- [Docker](https://www.docker.com/) version 27 or higher
- [Docker compose](https://docs.docker.com/compose/) version 2.3.3 or higher

### Usage

1. Clone the repository

2. Create a `.env` file and set the environment variables

```
BCRYPT_SALT_ROUNDS = 10
JWT_SECRET =
OPENAI_API_KEY =

MONGO_INITDB_ROOT_USERNAME=
MONGO_INITDB_ROOT_PASSWORD=
MONGO_INITDB_DATABASE=api-chat
MONGO_INITDB_USERNAME=
MONGO_INITDB_PASSWORD=
```

3. Run the following command to start the application dev database

```
docker compose -f docker-compose-db.yml up -d --build
```

