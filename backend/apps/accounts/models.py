from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserRole(models.TextChoices):
    PATIENT = "PATIENT", "Patient"
    CAREGIVER = "CAREGIVER", "Caregiver"
    ADMIN = "ADMIN", "Admin"


class UserManager(BaseUserManager):
    def create_user(
        self,
        email,
        full_name,
        password=None,
        role=UserRole.PATIENT,
        **extra_fields,
    ):
        if not email:
            raise ValueError("Email is required")

        email = self.normalize_email(email)

        user = self.model(
            email=email,
            full_name=full_name,
            role=role,
            **extra_fields,
        )

        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_superuser(
        self,
        email,
        full_name,
        password=None,
        **extra_fields,
    ):
        user = self.create_user(
            email=email,
            full_name=full_name,
            password=password,
            role=UserRole.ADMIN,
            **extra_fields,
        )

        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)

        return user


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=100)
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.PATIENT,
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    def __str__(self):
        return self.email
