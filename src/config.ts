export const config = {
    DB_USER: "havells",
    DB_PASSWORD: 123,
    DB_NAME: "havellsintern",
    PUBLIC_END_POINT:"redis-12986.c321.us-east-1-2.ec2.cloud.redislabs.com:12986",
    REDIS_USERNAME:"default",
    REDIS_PASSWORD:"jI0XJ6ujFrDWPVH6cjIrqB6uQ2xDpb0H",
    REDIS_URL:"default:jI0XJ6ujFrDWPVH6cjIrqB6uQ2xDpb0H@redis-12986.c321.us-east-1-2.ec2.cloud.redislabs.com:12986",
    TTL:86400,
    METADATA:{
        CreateUserDto:["email","password","age","country","shopDetails","shopName","phoneNo","address"],
        UpdateUserDto:["age","country","shopName","phoneNo","newPhoneNo","address"]
    },
    ChangeEmailDto:["oldEmail","newEmail"],
    ChangePasswordDto:["oldPassword","newPassword","confirmPassword"],
    CreateUserDto:["email","password","age","country","shopDetails"],
    LoginDto:["email","password"],
    UpdateUserDto:["age","country","shopDetails"],
    FindShopsDto:["phoneNo","minDistance","maxDistance"]
}

