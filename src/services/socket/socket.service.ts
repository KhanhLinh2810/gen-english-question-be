import { CorsOptions } from 'cors';
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import env from '../../../env';
import { Logger } from '../../utility/logger.util';

export interface ISocketEvent {
  type: string;
  data: any;
  timestamp: Date;
}

export class SocketService {
  private static instance: SocketService;
  private io: SocketIOServer | null = null;
  private readonly logger = new Logger({ scope: SocketService.name });

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  initialize(server: HTTPServer): void {
    let corsOptions: CorsOptions;
    if (env.app.cors === '*') {
      corsOptions = {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
      };
    } else {
      corsOptions = {
        origin: env.app.cors,
        methods: ['GET', 'POST'],
        credentials: true,
      };
    }
    this.io = new SocketIOServer(server, {
      cors: corsOptions,
    });

    this.io.on('connection', (socket) => {
      this.logger.info('Client connected', { socketId: socket.id });

      // Join room for specific customer
      socket.on('join_customer_room', (customerId: number) => {
        socket.join(`customer_${customerId}`);
        this.logger.info('Client joined customer room', {
          socketId: socket.id,
          customerId,
        });
      });

      socket.on('disconnect', () => {
        this.logger.info('Client disconnected', { socketId: socket.id });
      });
    });

    this.logger.info('Socket.IO server initialized');
  }

  notify(eventType: string, data: any): void {
    if (!this.io) {
      this.logger.warn('Socket.IO not initialized');
      return;
    }

    const event: ISocketEvent = {
      type: eventType,
      data,
      timestamp: new Date(),
    };

    this.io.emit(eventType, event);
  }
}
