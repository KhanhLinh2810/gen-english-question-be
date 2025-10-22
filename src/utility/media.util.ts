import multer from 'multer';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import env from '../../env';
import { BAD_REQUEST } from '../constants/constants';
import { validateFieldInFormData } from '../middleware/body-parser.middleware';
import { AppError } from './appError.util';

const storage = multer.diskStorage({
  destination: function (request, file, callback) {
    callback(null, './uploads');
  },
  filename: function (request, file, callback) {
    const filename = file.originalname.split('.');
    const fileExtension = filename.pop();

    const hash = crypto.createHash('sha256');
    hash.update(
      file.originalname + file.size + file.mimetype + Date.now().toString(),
    );
    const fileHash = hash.digest('hex');

    callback(
      null,
      [
        Date.now(),
        Math.floor(Math.random() * 1000),
        fileHash,
        '.' + fileExtension,
      ].join('-'),
    );
  },
});

export const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const errCode = validateFieldInFormData(req);
    if (errCode) {
      return cb(new AppError(BAD_REQUEST, errCode));
    }
    cb(null, true);
  },
});

export const uploadImage = multer({
  storage: storage,
  limits: { fileSize: Number(env.file.limit_image_size), files: 10 },
  fileFilter: (req, file, cb) => {
    const errCode = validateFieldInFormData(req);
    if (errCode) {
      return cb(new AppError(BAD_REQUEST, errCode));
    }
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/heic',
      'image/heif',
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new AppError(BAD_REQUEST, 'files.only_image_allowed'));
    }
    cb(null, true);
  },
});

export const uploadPDF = multer({
  storage: storage,
  limits: { fileSize: Number(env.file.limit_image_size) },
  fileFilter: (req, file, cb) => {
    const errCode = validateFieldInFormData(req);
    if (errCode) {
      return cb(new AppError(BAD_REQUEST, errCode));
    }
    const allowedTypes = ['application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new AppError(BAD_REQUEST, 'files.only_pdf_allowed'));
    }
    cb(null, true);
  },
});

export const uploadAnyExceptVideo = multer({
  storage: storage,
  limits: { fileSize: Number(env.file.limit_image_size) },
  fileFilter: (req, file, cb) => {
    const errCode = validateFieldInFormData(req);
    if (errCode) {
      return cb(new AppError(BAD_REQUEST, errCode));
    }
    if (file.mimetype && file.mimetype.startsWith('video/')) {
      return cb(new AppError(BAD_REQUEST, 'files.video_not_allowed'));
    }
    cb(null, true);
  },
});

export const uploadImageMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(env.file.limit_image_size) },
  fileFilter: (req, file, cb) => {
    const errCode = validateFieldInFormData(req);
    if (errCode) {
      return cb(new AppError(BAD_REQUEST, errCode));
    }
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/heic',
      'image/heif',
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new AppError(BAD_REQUEST, 'files.only_image_allowed'));
    }
    cb(null, true);
  },
});

export const uploadPDFMemory = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: Number(env.file.limit_image_size) },
	fileFilter: (req, file, cb) => {
		const allowedTypes = ['application/pdf'];
		if (!allowedTypes.includes(file.mimetype)) {
			return cb(new AppError(BAD_REQUEST, 'files.only_pdf_allowed'));
		}
		cb(null, true);
	},
});

export const setFilePath = (file: Express.Multer.File): void => {
  const filename = file.originalname.split('.');
  const fileExtension = filename.pop();

  const hash = crypto.createHash('sha256');
  hash.update(
    file.originalname + file.size + file.mimetype + Date.now().toString(),
  );
  const fileHash = hash.digest('hex');

  const generatedFilename = [
    Date.now(),
    Math.floor(Math.random() * 1000),
    fileHash,
    '.' + fileExtension,
  ].join('-');

  file.path = `./uploads/${generatedFilename}`;
};

export const setFilePathAndGetUrl = (file: Express.Multer.File): string => {
  setFilePath(file);
  return resolveUploadURL(file.path);
};

export const saveFileFromBuffer = async (
  buffer: Buffer,
  filePath: string,
): Promise<string> => {
  try {
    // Ensure uploads directory exists
    const uploadsDir = './uploads';
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    console.log('filePath', filePath);
    // Write buffer to file
    await fs.promises.writeFile(filePath, buffer);

    return filePath;
  } catch (error) {
    throw new AppError(BAD_REQUEST, 'Failed to save file');
  }
};

// Helper function to resolve upload URL
function resolveUploadURL(path: string): string {
  return new URL(path, env.app.base_url).href;
}
