# ApiV1AuthResetPasswordPostRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**token** | **string** | Password reset token received via email | [default to undefined]
**newPassword** | **string** | New password (minimum 8 characters) | [default to undefined]
**confirmPassword** | **string** | Confirm new password (must match new_password) | [default to undefined]

## Example

```typescript
import { ApiV1AuthResetPasswordPostRequest } from 'smartseller-api-client';

const instance: ApiV1AuthResetPasswordPostRequest = {
    token,
    newPassword,
    confirmPassword,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
