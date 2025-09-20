import { Module, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
        dbName: configService.get<string>('MONGO_DB_NAME'),
        connectionFactory: (connection: Connection) => {
          const logger = new Logger('MongoDB');

          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          // connection.plugin(autopopulate as any);

          connection.on('error', (error) => {
            logger.error('MongoDB Error', error);
          });

          return connection;
        },
        retryAttempts: 5,
        retryDelay: 3000,
      }),
    }),
  ],
})
export class DatabaseModule {}
