import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { config } from 'src/config';
import { UserModel, UserSchema } from 'src/schema/user.schema';
@Module({
    imports: [
        ConfigModule,
        MongooseModule.forRoot("mongodb://localhost:27012/demo"),
        MongooseModule.forFeature([{ name: UserModel, schema: UserSchema, collection: 'HUser' }])
    ],
    exports: [MongooseModule],

})
export class DBModule {}
