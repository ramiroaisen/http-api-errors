# Http Api Errors
This is a simple package that provides strongly typed http errors that extends the Error class with a status code

### Install
```sh
npm i http-api-errors
```

### Usage
```typescript
import { BadRequest, expressJsonCatchHandler } from "http-status-errors";
import express from "express";

const app = express();

app.get("/", () => {
  if(inputIsInvalid) throw new BadRequest("Input is invalid")
})

app.use(expressJsonCatchHandler());

// You can also use a logger
const logger = { warn: console.warn }; // you only need warn

app.use(expressJsonCatchHandler({ logger }))
```

### Aysnc usage
```typescript
import handler from "express-async-handler";
import { NotFound, expressJsonCatchHandler } from "http-api-errors";

app.get("/user/:id", handler(async (req, res) => {
  const user = await getUser(req.params.id);
  if(user == null) throw new NotFound(`User with id ${req.params.id} not found`);
}))
```

### JSON Catch Handler
The `expressJsonCatchHandler` will catch an error in the request chain and respond with a json formatted error in this form (example)
```json
// 404 Not Found
{
  "error": {
    "status": 404, // number
    "message": "User not found" // string
  }
}
```
The status code will default to `err.status` or `500`

If the error has a `Symbol.for("http-api-errors.error.toHttpError")` the conversion will be made

And if the error has a `Symbol.for("http-api-errors.error.isDisplayable")` the message will be sent to the user, otherwide `Internal error` will be sent as the message

### Extending
Errors such as `NotFound`, `BadRequest`, etc. extends the `HttpError` class and are displayable by default

Other errors can be converted to an `HttpError` with the property `[Symbol.for("http-api-errors.error.toHttpError")]` that must be a function that returns an `HttpError`:

Errors can be marked as displayable by setting to true the property `[Symbol.for("http-api-errors.error.isDisplayable)]`
Displayable errors will sent to the user with their message, not displayable errors will default to the message `Internal error`

If your error has the `status` property, it will be used as the status code of the response

```typescript
import { HttpError, Internal, kToHttpError, kIsDisplayable } from 
import assert from "assert";

assert.equal(kToHttpError, Symbol.for("http-api-errors.error.toHttpError"));
assert.equal(kIsDisplayable, Symbol.for("http-api-errors.error.isDisplayable"));

// custom errors
export class MyAwesomeError extends HttpError {
  
  // you can add any props you want with any names and types
  metadata: Metadata;

  constructor(status: number, message: string, metadata: Metadata) {
    super(status, message);
    this.metadata = metadata;
  }


  // If you wanna to expose extra data to the client of your api
  // you should override the toJSON() method
  toJSON() {
    return {
      status: this.status,
      messsage: this.message,
      metadata: this.metadata,
    }
  }
}

// covertible errors
export class ConvertibleError extends Error {
  [kToHttpError]() {
    return new Internal("Some user-facing message here");
  }
}

// displayable errors
export class DisplayableError extends Error {
  
  stauts: number;
  [kIsDisplayable]: boolean;

  constructor(status, message) {
    super(message);
    this.status = status;
    this[kIsDisplayable]: true;
  }
}
```

### Convert
You can convert any catched type to an `HttpError`

`status` will default to `err?.status` or `500`

`message` will default to `err?.[kIsDisplayable] ? String(err?.message) : "Internal error"` 

```typescript
import { toHttpError } from "http-api-errors";

try {
  someFunctionThatMayFail()
} catch(err) {
  httpError = toHttpError(e);
}
```