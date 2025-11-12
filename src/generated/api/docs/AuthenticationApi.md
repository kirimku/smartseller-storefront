# AuthenticationApi

All URIs are relative to *http://localhost:8080*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiV1AuthForgotPasswordPost**](#apiv1authforgotpasswordpost) | **POST** /api/v1/auth/forgot-password | Initiate Password Reset|
|[**apiV1AuthLoginPost**](#apiv1authloginpost) | **POST** /api/v1/auth/login | Login with email/phone and password|
|[**apiV1AuthResetPasswordPost**](#apiv1authresetpasswordpost) | **POST** /api/v1/auth/reset-password | Reset Password|
|[**apiV1CsrfTokenGet**](#apiv1csrftokenget) | **GET** /api/v1/csrf-token | Get CSRF token and set CSRF cookie|

# **apiV1AuthForgotPasswordPost**
> ApiV1AuthForgotPasswordPost200Response apiV1AuthForgotPasswordPost(apiV1AuthForgotPasswordPostRequest)

Initiates the password reset process by sending a reset email to the user\'s registered email address. For security reasons, this endpoint always returns success regardless of whether the email exists in the system. 

### Example

```typescript
import {
    AuthenticationApi,
    Configuration,
    ApiV1AuthForgotPasswordPostRequest
} from 'smartseller-api-client';

const configuration = new Configuration();
const apiInstance = new AuthenticationApi(configuration);

let apiV1AuthForgotPasswordPostRequest: ApiV1AuthForgotPasswordPostRequest; //

const { status, data } = await apiInstance.apiV1AuthForgotPasswordPost(
    apiV1AuthForgotPasswordPostRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiV1AuthForgotPasswordPostRequest** | **ApiV1AuthForgotPasswordPostRequest**|  | |


### Return type

**ApiV1AuthForgotPasswordPost200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Request processed successfully |  -  |
|**400** | Bad request, invalid input |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiV1AuthLoginPost**
> ApiV1AuthLoginPost200Response apiV1AuthLoginPost(apiV1AuthLoginPostRequest)

Authenticates a user with email/phone and password

### Example

```typescript
import {
    AuthenticationApi,
    Configuration,
    ApiV1AuthLoginPostRequest
} from 'smartseller-api-client';

const configuration = new Configuration();
const apiInstance = new AuthenticationApi(configuration);

let apiV1AuthLoginPostRequest: ApiV1AuthLoginPostRequest; //

const { status, data } = await apiInstance.apiV1AuthLoginPost(
    apiV1AuthLoginPostRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiV1AuthLoginPostRequest** | **ApiV1AuthLoginPostRequest**|  | |


### Return type

**ApiV1AuthLoginPost200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successfully authenticated |  -  |
|**400** | Bad request, invalid input |  -  |
|**401** | Unauthorized, invalid credentials |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiV1AuthResetPasswordPost**
> ApiV1AuthResetPasswordPost200Response apiV1AuthResetPasswordPost(apiV1AuthResetPasswordPostRequest)

Resets the user\'s password using a valid reset token received via email. The token expires after 1 hour for security purposes. 

### Example

```typescript
import {
    AuthenticationApi,
    Configuration,
    ApiV1AuthResetPasswordPostRequest
} from 'smartseller-api-client';

const configuration = new Configuration();
const apiInstance = new AuthenticationApi(configuration);

let apiV1AuthResetPasswordPostRequest: ApiV1AuthResetPasswordPostRequest; //

const { status, data } = await apiInstance.apiV1AuthResetPasswordPost(
    apiV1AuthResetPasswordPostRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiV1AuthResetPasswordPostRequest** | **ApiV1AuthResetPasswordPostRequest**|  | |


### Return type

**ApiV1AuthResetPasswordPost200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Password successfully reset |  -  |
|**400** | Bad request - invalid token or password |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiV1CsrfTokenGet**
> ApiV1CsrfTokenGet200Response apiV1CsrfTokenGet()

Issues a CSRF token and sets a secure cookie for subsequent unsafe requests. 

### Example

```typescript
import {
    AuthenticationApi,
    Configuration
} from 'smartseller-api-client';

const configuration = new Configuration();
const apiInstance = new AuthenticationApi(configuration);

const { status, data } = await apiInstance.apiV1CsrfTokenGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**ApiV1CsrfTokenGet200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | CSRF token issued |  * Set-Cookie - Sets &#x60;XSRF-TOKEN&#x60; cookie scoped to API domain <br>  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

