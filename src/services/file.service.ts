import { Op, Transaction } from 'sequelize';
import { BAD_REQUEST } from '../constants/constants';
import { File } from '../models';
import { AppError } from '../utility/appError.util';
import { saveFileFromBuffer } from '../utility/media.util';

export interface ICreateFile {
  entityType: string;
  entityId: number;
  fileType: string;
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  displayOrder: number;
}

export class FileService {
  private static instance: FileService;

  public static getInstance() {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }

  async createFiles(
    files: Omit<ICreateFile, 'displayOrder'>[],
    transaction?: Transaction,
  ): Promise<File[]> {
    if (files.length === 0) return [];

    const filesWithOrder = files.map((file, index) => ({
      ...file,
      displayOrder: index,
    }));

    return File.bulkCreate(filesWithOrder, { transaction });
  }

  async findOrFail(id: number) {
    const file = await File.findByPk(id);
    if (!file) {
      throw new AppError(BAD_REQUEST, 'file_not_found');
    }
    return file;
  }

  async getFilesByEntity(
    entityType: string,
    entityId: number | number[],
    fileType?: string,
  ): Promise<File[]> {
    if (Array.isArray(entityId) && entityId.length === 0) return [];

    const where: any = {
      entityType,
      entityId,
    };

    if (fileType) {
      where.fileType = fileType;
    }

    return File.findAll({
      where,
      order: [
        ['displayOrder', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    });
  }

  async getFilesByMultipleEntities(
    entities: Array<{ entityType: string; entityId: number | number[] }>,
    fileType?: string,
  ): Promise<File[]> {
    if (entities.length === 0) return [];

    const where: any = {
      [Op.or]: entities.map((entity) => ({
        entityType: entity.entityType,
        entityId: entity.entityId,
      })),
    };

    if (fileType) {
      where.fileType = fileType;
    }

    return File.findAll({
      where,
      order: [
        ['displayOrder', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    });
  }

  async deleteFilesByEntity(
    entityType: string,
    entityId: number | number[],
    transaction?: Transaction,
  ): Promise<number> {
    return File.destroy({
      where: {
        entityType,
        entityId,
      },
      transaction,
    });
  }

  async saveFilesToDisk(files: Express.Multer.File[]) {
    const savePromises = files.map((file) =>
      saveFileFromBuffer(file.buffer, file.path),
    );
    await Promise.all(savePromises);
  }
}
