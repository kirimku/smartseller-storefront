# ApiV1AuthLoginPost200ResponseData


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**accessToken** | **string** | JWT token for API authentication | [optional] [default to undefined]
**refreshToken** | **string** | Token used to refresh the access token | [optional] [default to undefined]
**tokenExpiry** | **string** | Expiration time of the access token | [optional] [default to undefined]
**user** | [**UserDTO**](UserDTO.md) |  | [optional] [default to undefined]

## Example

```typescript
import { ApiV1AuthLoginPost200ResponseData } from 'smartseller-api-client';

const instance: ApiV1AuthLoginPost200ResponseData = {
    accessToken,
    refreshToken,
    tokenExpiry,
    user,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
