## smartseller-api-client@1.0.0

This generator creates TypeScript/JavaScript client that utilizes [axios](https://github.com/axios/axios). The generated Node module can be used in the following environments:

Environment
* Node.js
* Webpack
* Browserify

Language level
* ES5 - you must have a Promises/A+ library installed
* ES6

Module system
* CommonJS
* ES6 module system

It can be used in both TypeScript and JavaScript. In TypeScript, the definition will be automatically resolved via `package.json`. ([Reference](https://www.typescriptlang.org/docs/handbook/declaration-files/consumption.html))

### Building

To build and compile the typescript sources to javascript use:
```
npm install
npm run build
```

### Publishing

First build the package then run `npm publish`

### Consuming

navigate to the folder of your consuming project and run one of the following commands.

_published:_

```
npm install smartseller-api-client@1.0.0 --save
```

_unPublished (not recommended):_

```
npm install PATH_TO_GENERATED_PACKAGE --save
```

### Documentation for API Endpoints

All URIs are relative to *http://localhost:8080*

Class | Method | HTTP request | Description
------------ | ------------- | ------------- | -------------
*AuthenticationApi* | [**apiV1AuthForgotPasswordPost**](docs/AuthenticationApi.md#apiv1authforgotpasswordpost) | **POST** /api/v1/auth/forgot-password | Initiate Password Reset
*AuthenticationApi* | [**apiV1AuthLoginPost**](docs/AuthenticationApi.md#apiv1authloginpost) | **POST** /api/v1/auth/login | Login with email/phone and password
*AuthenticationApi* | [**apiV1AuthResetPasswordPost**](docs/AuthenticationApi.md#apiv1authresetpasswordpost) | **POST** /api/v1/auth/reset-password | Reset Password
*DefaultApi* | [**apiV1AuthGoogleCallbackPost**](docs/DefaultApi.md#apiv1authgooglecallbackpost) | **POST** /api/v1/auth/google/callback | Google Login Callback
*DefaultApi* | [**apiV1AuthGoogleLoginGet**](docs/DefaultApi.md#apiv1authgoogleloginget) | **GET** /api/v1/auth/google/login | Get Google Login URL
*DefaultApi* | [**apiV1AuthLogoutPost**](docs/DefaultApi.md#apiv1authlogoutpost) | **POST** /api/v1/auth/logout | Logout
*DefaultApi* | [**apiV1AuthRefreshPost**](docs/DefaultApi.md#apiv1authrefreshpost) | **POST** /api/v1/auth/refresh | Refresh Token


### Documentation For Models

 - [ApiV1AuthForgotPasswordPost200Response](docs/ApiV1AuthForgotPasswordPost200Response.md)
 - [ApiV1AuthForgotPasswordPostRequest](docs/ApiV1AuthForgotPasswordPostRequest.md)
 - [ApiV1AuthGoogleCallbackPost200Response](docs/ApiV1AuthGoogleCallbackPost200Response.md)
 - [ApiV1AuthGoogleCallbackPost200ResponseData](docs/ApiV1AuthGoogleCallbackPost200ResponseData.md)
 - [ApiV1AuthGoogleCallbackPost200ResponseDataUser](docs/ApiV1AuthGoogleCallbackPost200ResponseDataUser.md)
 - [ApiV1AuthGoogleCallbackPostRequest](docs/ApiV1AuthGoogleCallbackPostRequest.md)
 - [ApiV1AuthGoogleLoginGet200Response](docs/ApiV1AuthGoogleLoginGet200Response.md)
 - [ApiV1AuthGoogleLoginGet200ResponseData](docs/ApiV1AuthGoogleLoginGet200ResponseData.md)
 - [ApiV1AuthLoginPost200Response](docs/ApiV1AuthLoginPost200Response.md)
 - [ApiV1AuthLoginPost200ResponseData](docs/ApiV1AuthLoginPost200ResponseData.md)
 - [ApiV1AuthLoginPost200ResponseMeta](docs/ApiV1AuthLoginPost200ResponseMeta.md)
 - [ApiV1AuthLoginPostRequest](docs/ApiV1AuthLoginPostRequest.md)
 - [ApiV1AuthRefreshPost200Response](docs/ApiV1AuthRefreshPost200Response.md)
 - [ApiV1AuthRefreshPost200ResponseData](docs/ApiV1AuthRefreshPost200ResponseData.md)
 - [ApiV1AuthResetPasswordPost200Response](docs/ApiV1AuthResetPasswordPost200Response.md)
 - [ApiV1AuthResetPasswordPostRequest](docs/ApiV1AuthResetPasswordPostRequest.md)
 - [ErrorResponse](docs/ErrorResponse.md)
 - [ErrorResponseMeta](docs/ErrorResponseMeta.md)
 - [SuccessResponse](docs/SuccessResponse.md)
 - [UserDTO](docs/UserDTO.md)


<a id="documentation-for-authorization"></a>
## Documentation For Authorization

Endpoints do not require authorization.

