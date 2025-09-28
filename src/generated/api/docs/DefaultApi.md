# DefaultApi

All URIs are relative to *http://localhost:8080*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiV1AuthGoogleCallbackPost**](#apiv1authgooglecallbackpost) | **POST** /api/v1/auth/google/callback | Google Login Callback|
|[**apiV1AuthGoogleLoginGet**](#apiv1authgoogleloginget) | **GET** /api/v1/auth/google/login | Get Google Login URL|
|[**apiV1AuthLogoutPost**](#apiv1authlogoutpost) | **POST** /api/v1/auth/logout | Logout|
|[**apiV1AuthRefreshPost**](#apiv1authrefreshpost) | **POST** /api/v1/auth/refresh | Refresh Token|

# **apiV1AuthGoogleCallbackPost**
> ApiV1AuthGoogleCallbackPost200Response apiV1AuthGoogleCallbackPost(apiV1AuthGoogleCallbackPostRequest)

Handles the callback from Google OAuth. Frontend should call this endpoint after receiving the authorization code from Google.

### Example

```typescript
import {
    DefaultApi,
    Configuration,
    ApiV1AuthGoogleCallbackPostRequest
} from 'smartseller-api-client';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let apiV1AuthGoogleCallbackPostRequest: ApiV1AuthGoogleCallbackPostRequest; //

const { status, data } = await apiInstance.apiV1AuthGoogleCallbackPost(
    apiV1AuthGoogleCallbackPostRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiV1AuthGoogleCallbackPostRequest** | **ApiV1AuthGoogleCallbackPostRequest**|  | |


### Return type

**ApiV1AuthGoogleCallbackPost200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successfully authenticated |  -  |
|**400** | Bad Request |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiV1AuthGoogleLoginGet**
> ApiV1AuthGoogleLoginGet200Response apiV1AuthGoogleLoginGet()

Returns the Google OAuth login URL for client-side redirection.

### Example

```typescript
import {
    DefaultApi,
    Configuration
} from 'smartseller-api-client';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

const { status, data } = await apiInstance.apiV1AuthGoogleLoginGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**ApiV1AuthGoogleLoginGet200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successfully generated Google login URL |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiV1AuthLogoutPost**
> SuccessResponse apiV1AuthLogoutPost()

Logs out the user and invalidates the session.

### Example

```typescript
import {
    DefaultApi,
    Configuration
} from 'smartseller-api-client';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

const { status, data } = await apiInstance.apiV1AuthLogoutPost();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**SuccessResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successfully logged out |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiV1AuthRefreshPost**
> ApiV1AuthRefreshPost200Response apiV1AuthRefreshPost()

Refresh the current access token using a refresh token

### Example

```typescript
import {
    DefaultApi,
    Configuration
} from 'smartseller-api-client';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

const { status, data } = await apiInstance.apiV1AuthRefreshPost();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**ApiV1AuthRefreshPost200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successfully refreshed token |  -  |
|**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

