import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Camera, 
  Save, 
  X, 
  Edit,
  AlertCircle,
  CheckCircle,
  Lock
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface PersonalInfoFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
}

const PersonalInfo: React.FC = () => {
  const { 
    user, 
    updateProfile, 
    isLoading, 
    error, 
    clearError,
    getUserDisplayName,
    getUserInitials,
    isEmailVerified,
    isPhoneVerified
  } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<PersonalInfoFormData>({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dateOfBirth: user?.date_of_birth || '',
    gender: user?.gender || '',
  });
  const [validationErrors, setValidationErrors] = useState<Partial<PersonalInfoFormData>>({});

  const validateForm = (): boolean => {
    const errors: Partial<PersonalInfoFormData> = {};

    // Only validate editable fields
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 13) {
        errors.dateOfBirth = 'You must be at least 13 years old';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    clearError();

    try {
      await updateProfile({
        // Only update editable fields; snake_case per API
        date_of_birth: formData.dateOfBirth || undefined,
        gender: (formData.gender as 'male' | 'female' | 'other' | 'prefer_not_to_say') || undefined,
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof PersonalInfoFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.first_name || '',
      lastName: user?.last_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      dateOfBirth: user?.date_of_birth || '',
      gender: user?.gender || '',
    });
    setValidationErrors({});
    setIsEditing(false);
    clearError();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Picture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Camera className="h-5 w-5" />
            <span>Profile Picture</span>
          </CardTitle>
          <CardDescription>
            Update your profile picture to personalize your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src="" alt={`${(user.first_name || '')} ${(user.last_name || '')}`.trim() || user.email} />
              <AvatarFallback className="text-xl font-semibold">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-2">
              <Button variant="outline" size="sm">
                <Camera className="h-4 w-4 mr-2" />
                Change Picture
              </Button>
              <p className="text-sm text-muted-foreground">
                JPG, PNG or GIF. Max size 2MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Personal Information</span>
              </CardTitle>
              <CardDescription>
                Manage your personal details and contact information
              </CardDescription>
            </div>
            
            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <p className="text-sm text-muted-foreground" id="firstName">
                {user.first_name || '-'}
              </p>
            </div>

            {/* Last Name (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <p className="text-sm text-muted-foreground" id="lastName">
                {user.last_name || '-'}
              </p>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>Email Address *</span>
                {isEmailVerified() ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                )}
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled={true}
                  className="pr-10"
                />
                <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Contact support to change your email address
              </p>
            </div>

            {/* Phone (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>Phone Number</span>
                {isPhoneVerified() ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                )}
              </Label>
              <p className="text-sm text-muted-foreground" id="phone">
                {user.phone || '-'}
              </p>
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Date of Birth</span>
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                disabled={!isEditing}
                className={validationErrors.dateOfBirth ? 'border-destructive' : ''}
              />
              {validationErrors.dateOfBirth && (
                <p className="text-sm text-destructive">{validationErrors.dateOfBirth}</p>
              )}
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => handleInputChange('gender', value)}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <>
              <Separator />
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            View your account details and membership information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium">Member Since</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Customer ID</Label>
              <p className="text-sm text-muted-foreground font-mono">
                {user.id}
              </p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Total Orders</Label>
              <p className="text-sm text-muted-foreground">
                {user.totalOrders || 0} orders
              </p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Total Spent</Label>
              <p className="text-sm text-muted-foreground">
                ${user.totalSpent?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonalInfo;