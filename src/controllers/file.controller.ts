import { NextFunction, Request, Response } from 'express';
import { existsSync } from 'fs';
import _ from 'lodash';
import path from 'path';
import { BAD_REQUEST } from '../constants/constants';
import { FileService } from '../services/file.service';
import { AppError } from '../utility/appError.util';

class FileController {
  private readonly fileService: FileService;

  constructor() {
    this.fileService = FileService.getInstance();
  }

  download = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = await this.fileService.findOrFail(
        _.toSafeInteger(req.params.id),
      );

      const fileNameSaveOnDisk = file.fileUrl.substring(
        file.fileUrl.lastIndexOf('/') + 1,
      );
      const filePath = path.join(
        process.cwd(),
        './uploads',
        fileNameSaveOnDisk,
      );
      if (!existsSync(filePath)) {
        throw new AppError(BAD_REQUEST, 'file_not_found');
      }

      return res.download(filePath, file.fileName || 'download.pdf');
    } catch (error) {
      next(error);
    }
  };
}

export const fileController = new FileController();
