# Mocklet CLI

Mocklet is a command-line tool that lets you mock any API call offline.

It's a simple, lightweight server that can return pre-configured responses to simulate API endpoints, making it ideal for testing and development environments without real API connectivity.

## Features

- Mock local HTTP endpoints with ease, with one command

- Supports any HTTP method (GET, POST, PUT, DELETE, etc.)

- Define responses as plain text, JSON, or HTML

- Serve mock responses from a file or inline content

- Supports custom HTTP status codes and ports

- Cross-origin resource sharing (CORS) enabled

## Installation

Ensure that you have Node.js installed, and then install Mocklet globally:

```bash
npm install -g mocklet
```

## Usage

You can start mocking an endpoint with a simple command:

```bash
mocklet
```

This will start a mock server at the default `/api` endpoint, returning the default response.

### Options

`--url <endpoint>`: The API endpoint to mock (default: /api). Must start with /.

`--response <fileOrText>`: The response to return. This can be a text, JSON, or a path to a response file (default: `{"response": "success"}`).

`--port <number>`: The port to run the server on (default: `8080`).

`--status <number>`: The HTTP status code to return (default: `200`).

### Examples

1. Custom endpoint

```bash
mocklet --url /api/data
```

This will start a mock server on port `8080` at the `/api/data` endpoint, returning the default response.

2. Custom endpoint and response file

```bash
mocklet --url /api/data --response ./data.json
```

This will return the contents of `data.json` when accessing `/api/data`.

3. Custom text response and status code

```bash
mocklet --response "Error: Can't connect to the API" --status 500
```

This will return an error message and the status code `500` when accessing `/api`.

## Troubleshooting

- Make sure the `--url` starts with `/`.

- If you provide a file as a response, ensure it exists and the path is correct.

- If the specified port is in use, try another port with the `--port` option.

## License

Mocklet is licensed under the MIT License.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to improve Mocklet.
