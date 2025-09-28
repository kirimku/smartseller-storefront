# UserDTO


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **string** | User unique identifier | [optional] [default to undefined]
**email** | **string** | User\&#39;s email address | [optional] [default to undefined]
**firstName** | **string** | User\&#39;s first name | [optional] [default to undefined]
**lastName** | **string** | User\&#39;s last name | [optional] [default to undefined]
**phone** | **string** | User\&#39;s phone number | [optional] [default to undefined]
**avatar** | **string** | URL to user\&#39;s avatar image | [optional] [default to undefined]
**emailVerified** | **boolean** | Whether user\&#39;s email is verified | [optional] [default to undefined]
**phoneVerified** | **boolean** | Whether user\&#39;s phone is verified | [optional] [default to undefined]
**createdAt** | **string** | Account creation timestamp | [optional] [default to undefined]
**updatedAt** | **string** | Last update timestamp | [optional] [default to undefined]

## Example

```typescript
import { UserDTO } from 'smartseller-api-client';

const instance: UserDTO = {
    id,
    email,
    firstName,
    lastName,
    phone,
    avatar,
    emailVerified,
    phoneVerified,
    createdAt,
    updatedAt,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
